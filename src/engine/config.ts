// ALL thresholds for the adaptive tutor live in this one file.
// Change a number here and the whole app follows. Each value is explained in plain English.

export const CONFIG = {
  // ---- Decision rule (engine/selector.ts) ----

  /** How many recent attempts on the current skill we look at. */
  WINDOW: 3,

  /** PREREQUISITE fires when this many answers in a row on the skill are wrong. */
  WRONG_IN_A_ROW_FOR_PREREQ: 3,

  /** After the number line mini lesson the learner does this many easy S0 tasks, then returns. */
  PREREQ_EASY_TASKS: 2,

  /** ALTERNATIVE EXPLANATION is used for the 1st and 2nd time a misconception shows up.
   *  After that (or if the twin question right after it is still wrong) we go to PREREQUISITE. */
  MAX_ALT_PER_MISCONCEPTION: 2,

  /** HARDER needs this many correct answers in a row at the current level... */
  CORRECT_FOR_HARDER: 2,
  /** ...with at most this many hints in total across those answers... */
  MAX_HINTS_FOR_HARDER: 1,
  /** ...and each answer faster than this many seconds. */
  FAST_SECONDS: 45,

  /** OTHERWISE: if the learner used this many hints, the number line turns on automatically. */
  HINTS_FOR_AUTO_LINE: 2,

  /** How many past questions we avoid repeating. */
  NO_REPEAT_LAST: 5,

  // ---- AI (engine/ai.ts) ----

  /** Every AI call is cancelled after this many milliseconds. No retry. */
  AI_TIMEOUT_MS: 8000,
  /** Request body must be smaller than this many bytes, otherwise we do not send it. */
  AI_MAX_PAYLOAD_BYTES: 2048,
  /** AI explanation judgement is used only if the model is at least this confident. */
  AI_MIN_CONFIDENCE: 0.6,
  /** Learner explanation text is cut to this many characters. */
  EXPLANATION_MAX_CHARS: 200,
  /** After an AI failure, skip AI for this many questions to save the learner's time and data. */
  AI_SKIP_AFTER_FAIL: 3,
  /** How many past question signatures we send to the AI as "do not repeat" (all are checked locally). */
  AI_AVOID_SENT: 15,
  /** An AI reply slower than this marks the network as "Slow". */
  SLOW_MS: 2500,

  // ---- Numbers ----

  /** Every number in a question must stay inside this range. */
  NUMBER_MIN: -20,
  NUMBER_MAX: 20,
  /** Level 1 uses small numbers only. */
  LEVEL1_MIN: -10,
  LEVEL1_MAX: 10,

  /** Keep at most this many items in the saved logs per learner (localStorage is small). */
  MAX_LOG_ITEMS: 600,
} as const;
