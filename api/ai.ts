// Vercel serverless function: POST /api/ai
// Reads GEMINI_API_KEY and LLM_MODEL from the server environment (never sent to the browser,
// never committed). Calls the Gemini API with fetch and supports two actions:
//   1. generate_question     -> { format, stem_hi, stem_en, numbers: {a, b, operation}, hint1, hint2 }
//   2. evaluate_explanation  -> { label, confidence, feedback_hi }
// The browser validates everything again and computes correct answers itself.
// This runs on the Edge runtime so it starts fast and uses Web-standard Request/Response.

export const config = { runtime: "edge" };

const MAX_BODY = 2048; // bytes, same limit as the client
const UPSTREAM_DEADLINE_MS = 7000; // whole model cascade, a little under the client's 8 s timeout
const PER_MODEL_MS = 3500; // one slow or hanging model must not eat the whole deadline

const CASCADE = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.8-flash"];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const QUESTION_RULES = `You write ONE practice question for a 12 year old Class 7 learner in Mumbai (Hindi medium) about integers.
Return ONLY JSON with keys: format, stem_hi, stem_en, numbers {a, b, operation}, hint1, hint2, hint1_en, hint2_en.
Rules:
- format must equal the wanted format.
- a and b are integers from -20 to 20. operation is "+" or "-" ("compare" for compare, "place" for numberline).
- skill S0: numberline, place a negative number a. S1: compare, ask which is greater of a and b. S2: addition. S3: subtraction.
- level 1: numbers within -10 to 10. level 2: mixed signs. level 3: subtracting a negative or a story with udhaar (debt), lift floors or temperature.
- Do not repeat any question listed in "avoid".
- stem_hi in simple Hindi (Devanagari) with English maths words like plus, minus, number line. Short sentences. Max 30 words.
- Do NOT include the answer. Hints are short (max 15 words) and never give the final answer.`;

const EVAL_RULES = `You judge a 12 year old learner's short explanation about integers.
Return ONLY JSON: {"label": one of "sound","M1","M2","partial","unclear", "confidence": number 0..1, "feedback_hi": string under 25 words, "feedback_en": string under 25 words}.
M1 = ignores the minus sign / thinks bigger digit means bigger number (e.g. -8 > -3).
M2 = thinks subtraction always makes a number smaller (e.g. 5 - (-3) = 2).
"sound" = correct reasoning matching the rubric. "partial" = right direction, reason incomplete.
Feedback is kind, simple Hindi with English maths words. Never say "incorrect" or "गलत जवाब"; say "दोबारा सोचते हैं".`;

async function callGemini(system: string, user: string): Promise<unknown> {
  // Trim spaces and stray quotes in case the key was pasted with them.
  const key = (process.env.GEMINI_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  if (!key) throw new Error("GEMINI_API_KEY missing");

  // Order comes from GET /api/ai?test=1 on the live key: fastest reliable model first.
  // (3.8-flash often 503s, 3.6-flash hangs, 2.5-flash-lite is 404 for new users.)
  const models = Array.from(new Set([process.env.LLM_MODEL, ...CASCADE].filter(Boolean) as string[]));

  // Newer Flash models "think" before answering, and thinking tokens count against
  // maxOutputTokens. With a small limit the JSON came back cut off or empty, JSON.parse
  // failed on every model and the client always fell back. So: ask for minimal thinking,
  // leave plenty of output room, and if a model rejects the thinking option, retry it plain.
  const thinkingFor = (model: string): Record<string, unknown> | null => {
    if (/^gemini-3/.test(model)) return { thinkingLevel: "low" };
    if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
    return null;
  };

  const deadline = Date.now() + UPSTREAM_DEADLINE_MS;
  let lastError = "No model responded";

  for (const model of models) {
    const thinking = thinkingFor(model);
    for (const useThinking of thinking ? [true, false] : [false]) {
      const left = deadline - Date.now();
      if (left < 500) throw new Error(`deadline reached; last: ${lastError}`);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(left, PER_MODEL_MS));
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": key },
            signal: ctrl.signal,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: "user", parts: [{ text: user }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.6,
                maxOutputTokens: 2048,
                ...(useThinking && thinking ? { thinkingConfig: thinking } : {}),
              },
            }),
          },
        );
        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          lastError = `gemini [${model}] ${res.status}: ${errBody.slice(0, 160)}`;
          console.warn(lastError);
          // 400 with thinkingConfig: the model may not support that option -> retry plain.
          if (res.status === 400 && useThinking) continue;
          // 400/403/404/429/5xx: try the next model in the cascade.
          break;
        }
        const out = (await res.json()) as {
          candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
        };
        const cand = out.candidates?.[0];
        // Join the answer parts, skipping any thought-summary parts.
        const text = (cand?.content?.parts ?? [])
          .filter((p) => !p.thought && typeof p.text === "string")
          .map((p) => p.text)
          .join("")
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");
        try {
          return JSON.parse(text);
        } catch {
          lastError = `gemini [${model}] bad JSON (finish ${cand?.finishReason ?? "?"}): ${text.slice(0, 80)}`;
          console.warn(lastError);
          break;
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") { lastError = `gemini [${model}] timed out`; console.warn(lastError); break; }
        lastError = `gemini [${model}] ${e instanceof Error ? e.message : "fetch failed"}`;
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw new Error(lastError);
}

export default async function handler(req: Request): Promise<Response> {
  // GET /api/ai → diagnostic: is the key set? (never reveals the actual key)
  if (req.method === "GET") {
    const key = (process.env.GEMINI_API_KEY ?? "").trim();
    const primaryModel = process.env.LLM_MODEL || CASCADE[0];

    // GET /api/ai?test=1 → probe every cascade model in parallel with a tiny prompt and list
    // which models this key can actually use. Shows status, time and the error text per model.
    if (new URL(req.url).searchParams.get("test") && key) {
      const base = "https://generativelanguage.googleapis.com/v1beta/models";
      const cascade = CASCADE;
      const timed = async (url: string, init?: RequestInit) => {
        const t0 = Date.now();
        try {
          const r = await fetch(url, { ...init, signal: AbortSignal.timeout(9000) });
          return { status: r.status, ms: Date.now() - t0, body: await r.text() };
        } catch (e) {
          return { status: 0, ms: Date.now() - t0, body: e instanceof Error ? e.message : "fetch failed" };
        }
      };
      const [list, ...probes] = await Promise.all([
        timed(`${base}?pageSize=200`, { headers: { "x-goog-api-key": key } }),
        ...cascade.map((m) =>
          timed(`${base}/${m}:generateContent`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: 'Reply with JSON {"ok":1}' }] }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 },
            }),
          }),
        ),
      ]);
      let available: string[] = [];
      try {
        const parsed = JSON.parse(list.body) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
        available = (parsed.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("flash"))
          .map((m) => m.name.replace("models/", ""));
      } catch {
        /* list failed; status below says why */
      }
      return json(200, {
        listStatus: list.status,
        listError: list.status === 200 ? undefined : list.body.slice(0, 200),
        availableFlashModels: available,
        probes: cascade.map((m, i) => ({
          model: m,
          status: probes[i]!.status,
          ms: probes[i]!.ms,
          detail: probes[i]!.status === 200 ? "works" : probes[i]!.body.slice(0, 160),
        })),
      });
    }

    return json(200, {
      ok: true,
      keySet: key.length > 0,
      keyLength: key.length,
      primaryModel,
      supportedModels: CASCADE,
      env: Object.keys(process.env).filter(k => k.includes("GEMINI") || k.includes("LLM")).sort(),
    });
  }
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: "payload too big" });

  let body: { action?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "bad json" });
  }
  const p = body.payload ?? {};

  try {
    if (body.action === "generate_question") {
      const user = `Learner state: ${JSON.stringify({
        skill: p.skill,
        level: p.level,
        wanted_format: p.format,
        last5: p.last5,
        misconception: p.misconception,
        avoid: p.avoid,
      })}`;
      const data = await callGemini(QUESTION_RULES, user);
      return json(200, { ok: true, data });
    }
    if (body.action === "evaluate_explanation") {
      const text = String(p.text ?? "").slice(0, 200);
      const user = `Question: ${String(p.question ?? "")}\nRubric: ${String(p.rubric ?? "")}\nLearner text: ${text}`;
      const data = await callGemini(EVAL_RULES, user);
      return json(200, { ok: true, data });
    }
    return json(400, { ok: false, error: "unknown action" });
  } catch (e) {
    // The client treats any non-200 as "use the local fallback".
    return json(502, { ok: false, error: e instanceof Error ? e.message : "upstream error" });
  }
}
