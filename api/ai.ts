// Vercel serverless function: POST /api/ai
// Reads GEMINI_API_KEY and LLM_MODEL from the server environment (never sent to the browser,
// never committed). Calls the Gemini API with fetch and supports two actions:
//   1. generate_question     -> { format, stem_hi, stem_en, numbers: {a, b, operation}, hint1, hint2 }
//   2. evaluate_explanation  -> { label, confidence, feedback_hi }
// The browser validates everything again and computes correct answers itself.
// This runs on the Edge runtime so it starts fast and uses Web-standard Request/Response.

export const config = { runtime: "edge" };

const MAX_BODY = 2048; // bytes, same limit as the client
const UPSTREAM_TIMEOUT_MS = 4500; // a little under the client's 5 s timeout

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
  const key = process.env.GEMINI_API_KEY;
  let model = process.env.LLM_MODEL || "gemini-1.5-flash";
  if (model.includes("2.5")) model = "gemini-1.5-flash";
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
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
          generationConfig: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 400 },
        }),
      },
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`gemini ${res.status}: ${errBody.slice(0, 120)}`);
    }
    const out = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = out.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: Request): Promise<Response> {
  // GET /api/ai → diagnostic: is the key set? (never reveals the actual key)
  if (req.method === "GET") {
    const key = process.env.GEMINI_API_KEY ?? "";
    let model = process.env.LLM_MODEL || "gemini-1.5-flash";
  if (model.includes("2.5")) model = "gemini-1.5-flash";
    return json(200, {
      ok: true,
      keySet: key.length > 0,
      keyPrefix: key.slice(0, 8) + "…",
      keyLength: key.length,
      model,
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
