# DESIGN.md

**Card:** P4 Adaptive tutor with automatic question generation | T1 Integers: operations with negative numbers (Class 7) | L2 First generation learner, urban low income settlement, NGO centre with shared tablets | C1 Low bandwidth
**Identity token:** 23B2230 (shown in the footer of every screen and on the About screen)

## 1. Problem

Pooja and children like her meet negative numbers for the first time in Class 7, and nobody at home can help. A fixed worksheet cannot tell why an answer is wrong. "-8 is greater than -3" and "5 - (-3) = 2" look like carelessness, but they are systematic misconceptions that need different fixes. This app is an adaptive tutor that generates the next task from the learner's performance and previous responses, diagnoses the misconception from the answer and from her own written explanation, and then decides whether she needs a harder question, a different explanation, or prerequisite teaching. It must run on a shared tablet with weak wifi.

**Context of use:** NGO after school centre, one shared 8 inch Android tablet between 2 or 3 children, about 20 minutes per session, unreliable centre wifi.

## 2. Learning outcomes

1. Compare two negative integers and order a set of four integers from smallest to largest using a number line.
2. Calculate sums and differences of two integers, including subtracting a negative number, for example 5 - (-3) = 8.
3. Explain in one or two sentences why -8 is less than -3, or why subtracting a negative increases a number, using the number line or the udhaar (debt) story.

## 3. Learner persona

Pooja Jadhav, 12, Class 7, first in her family to reach this level. Lives in an urban settlement in Mumbai. Hindi at home and in a Hindi medium school, knows English maths words like plus and minus. Confident with whole number addition and subtraction, can count backwards, has seen a number line for whole numbers. Has heard "minus" for temperature and "udhaar" for debt but not as maths. Motivation: to stop feeling lost in class.

Likely misconceptions:
1. **M1:** "-8 is greater than -3 because 8 is greater than 3" (bigger digit means bigger number, sign ignored).
2. **M2:** "5 - (-3) = 2" (subtraction always makes a number smaller, double minus ignored).

## 4. Content plan

**Skills:** S0 prerequisite (read and place negatives on a number line), S1 order and compare, S2 add integers, S3 subtract integers.
**Levels:** 1 small numbers within -10 to 10 with the number line shown. 2 mixed signs, number line optional. 3 subtracting a negative and story problems.
**Learn chunks (one idea each):** negatives sit left of zero (lift and basement floors), comparing as owing money (owing Rs 8 is worse than owing Rs 3), adding and subtracting as moves on the number line and removing a debt (5 - (-3): worth Rs 5, a Rs 3 debt is removed, now worth Rs 8).
**Question formats:** number line tap, ordering, numeric entry, udhaar story problem, explain in own words (with sentence starter chips).
**Bank:** at least 18 authored items with model answers, 2 hints each, wrong answer patterns linked to M1 or M2, and feedback for correct, M1 and M2. Correct answers are always computed by code, never by the AI.
**Tool for problem solving:** an interactive number line the learner can toggle on during practice.

## 5. Adaptive decision rule

After every attempt the tutor looks at the last 3 attempts on the current skill (correct, hints used, seconds taken, misconception tag, explanation label) and checks in this order. All thresholds live in `src/engine/config.ts`.

| Order | Outcome | Fires when | Action |
|---|---|---|---|
| 1 | Prerequisite instruction | 3 wrong in a row, or quick check showed a number line position gap, or still wrong after an alternative explanation for the same misconception | Number line mini lesson (S0), 2 easy S0 tasks, then return |
| 2 | Alternative explanation | Wrong answer with a recognised misconception tag (M1 or M2), first or second time | Show a different representation than before (number line, udhaar story, lift floors), then a twin question with new numbers |
| 3 | Harder question | Last 2 correct, 1 hint or fewer in total, each under 45 seconds, explanation judged sound | Level up, or next skill after level 3 |
| 4 | Otherwise | None of the above | Same level, new variant. After 2 hints the number line turns on automatically |

Signals used: learner profile (4 question quick check at the start), performance (answers and misconception tags), interaction (hints, time, skipped content). Every decision is logged with its reason and shown in "Why this question?" and on the progress screen.

## 6. AI features and fallbacks

Both run through a Vercel serverless function (`api/ai.ts`). The key is a Vercel environment variable and is never committed.

1. **generate_question:** input is skill, level, last 5 results, misconception tag, wanted format. Output is JSON (format, Hindi and English stem, numbers, two hints). Checked with a schema, number range, no repeat of the last 5 items and level match. The app computes the answer itself. Fallback: local template generator using stored items with new numbers.
2. **evaluate_explanation:** input is the question, a rubric of correct reasoning and the learner's text (max 200 characters). Output is JSON (label sound, M1, M2, partial or unclear, confidence, short Hindi feedback). Accepted only if confidence is 0.6 or more and a local keyword check agrees. If they disagree the learner sees a neutral "ask your didi or bhaiya" message. Fallback: local keyword checker with stored feedback.

## 7. How C1 low bandwidth shapes the design

No images, video, audio or web fonts. Inline SVG, CSS and the system font stack. Small bundle and a service worker so the core activity works offline after the first load. AI is optional with a 5 second timeout, a payload under 2 KB and no retry. When AI fails a labelled banner says offline practice mode is on. A status chip shows Online, Slow or Offline and a counter shows data used by AI calls this session. A "Simulate slow network" switch on the About screen forces the fallback for demos.

## 8. Screens

1. Who is learning (shared tablet picker, no password)
2. Quick check (4 questions, sets start level)
3. Learn (3 short chunks)
4. Practice (one task, hints, number line tool, "Why this question?")
5. Feedback and re-teach (correct, M1, M2, alternative explanation or prerequisite lesson)
6. My progress (skill bars, last decisions with reasons, download log)
7. About (identity token, card, persona, AI and fallback, libraries)

## 9. Tools and AI use

Lovable (React, TypeScript, Tailwind) for the first build, GitHub for version control, Vercel for hosting, Gemini API for the two AI features, Claude for planning and documentation. All AI chats are listed in the report.
