# अंक साथी · Ank Saathi

**23B2230 | ET 617 End Sem | P4 T1 L2 C1**

An adaptive tutor for Class 7 integers (operations with negative numbers). It makes its own
questions, reads the learner's written explanations, spots two misconceptions and changes the next task.

## Learner (L2)
Pooja Jadhav, 12, Class 7, Hindi medium, Mumbai. Shares an NGO tablet for ~20 minutes.
- **M1**: "-8 is greater than -3 because 8 > 3" (ignores the sign)
- **M2**: "5 - (-3) = 2" (thinks subtraction always makes smaller)

## Constraint (C1): low bandwidth
- No images, video, audio or web fonts. Inline SVG, CSS and the system font stack only.
- Offline first: a Workbox service worker (`vite-plugin-pwa`) caches the app after the first load.
  It is never registered in dev or the Lovable preview. Add `?sw=off` to remove it.
- AI is optional. Each call has a 5 s timeout, a body under 2 KB and no retry. Any failure means the app
  silently uses the local bank and shows "नेट धीमा है। ऑफ़लाइन अभ्यास मोड (सेव किए हुए सवाल)।".
- The header chip shows Online / Slow / Offline. The footer shows "Data used this session" (AI calls only).

## Screens (hash routing: `#/who`, `#/check`, `#/learn`, `#/practice`, `#/feedback`, `#/progress`, `#/about`)
Who is learning → Quick check → Learn (3 chunks) → Practice → Feedback & re-teach → My progress → About.

## Decision rule
All thresholds are in `src/engine/config.ts`. The rule is in `src/engine/selector.ts` (`decide`), checked in this order:
PREREQUISITE → ALTERNATIVE EXPLANATION → HARDER → OTHERWISE. Every decision is logged with its reason.

## How to run
```bash
bun install
bun run dev      # http://localhost:8080
bun run test     # checker + decision rule tests
bun run build
```

## Environment variables (server only, for `api/ai.ts` on Vercel)
| Name | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key. Set it in Vercel project settings. Never commit it. |
| `LLM_MODEL` | Model name, e.g. `gemini-2.5-flash` (the default). |

The Lovable preview has no `/api/ai`, so the app runs its labelled fallback there. "Demo mode" in About
uses recorded AI replies (`src/data/demoAi.ts`), labelled "Demo response".

## Folder map
```text
api/ai.ts                  Vercel serverless function (Gemini): generate_question, evaluate_explanation
src/data/i18n.ts           all interface text, Hindi + English
src/data/questions.ts      30 authored items (6 formats, 4 skills, 3 levels) + quick check
src/data/demoAi.ts         recorded sample AI outputs for demo mode
src/engine/config.ts       every threshold, with comments
src/engine/selector.ts     decision rule + question builder (twins, variants)
src/engine/checker.ts      answer checking, M1/M2 detection, keyword explanation checker
src/engine/ai.ts           AI client: timeout, size limit, validation, fallback
src/engine/flow.ts         glue: build next question, grade, save attempt
src/engine/storage.ts      per-learner localStorage + session counters
src/components/            number line, keypad, lift, header/footer, buttons
src/screens/               the 7 screens
src/lib/register-sw.ts     guarded service worker registration
```
Question text sits with each item in `questions.ts`; all other text is in `i18n.ts`.
