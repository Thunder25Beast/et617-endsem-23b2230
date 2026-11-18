// Saved data (localStorage) + session data (memory only).
// Shared tablet: many learners, each with their own progress. No email, no password.

import { useSyncExternalStore } from "react";
import { CONFIG } from "./config";
import type { Attempt, Decision, EngineState, Lang, Level, Question, SkillId } from "./types";

export interface LogEvent {
  ts: number;
  type: string;
  data: Record<string, unknown>;
}

/** What the Feedback & re-teach screen shows. */
export interface FeedbackRecord {
  q: Question | null;
  attempt: Attempt | null;
  decision: Decision;
  text: { hi: string; en: string } | null;
  judgedBy: "local" | "ai" | "demo" | "neutral" | null;
  response: string;
}

export interface Learner {
  id: string;
  nickname: string;
  emoji: string;
  createdAt: number;
  engine: EngineState;
  decisions: Decision[];
  events: LogEvent[];
  /** the question on screen right now */
  currentQ: Question | null;
  /** decision waiting to be turned into the next question */
  plan: Decision | null;
  lastFeedback: FeedbackRecord | null;
  learn: Partial<Record<"a" | "b" | "c", "viewed" | "skipped">>;
  qCount: number;
}

export interface Settings {
  lang: Lang;
  simulateSlow: boolean;
  demoMode: boolean;
}

export interface AppData {
  version: 1;
  learners: Learner[];
  activeId: string | null;
  settings: Settings;
}

const KEY = "ank-saathi.v1";

export function emptyEngine(skill: SkillId = "S1", level: Level = 1): EngineState {
  return {
    current: { skill, level },
    windowStart: 0,
    attempts: [],
    profile: {
      done: false,
      positionGap: false,
      wholeNumberGap: false,
      m1Suspected: false,
      addNegOk: false,
      startSkill: skill,
      startLevel: level,
      answers: [],
    },
    altCount: { M1: 0, M2: 0 },
    altPendingTag: null,
    remediation: null,
    gapLessonDone: false,
    learnSkipped: {},
    cleared: { S0: 0, S1: 0, S2: 0, S3: 0 },
  };
}

const DEFAULT: AppData = {
  version: 1,
  learners: [],
  activeId: null,
  settings: { lang: "hi", simulateSlow: false, demoMode: false },
};

let data: AppData = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && parsed.version === 1) data = { ...DEFAULT, ...parsed, settings: { ...DEFAULT.settings, ...parsed.settings } };
    }
  } catch {
    data = DEFAULT;
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full: drop the oldest events and try once more
    data = {
      ...data,
      learners: data.learners.map((l) => ({ ...l, events: l.events.slice(-100) })),
    };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* give up silently: the app still works for this session */
    }
  }
}

export function getData(): AppData {
  load();
  return data;
}

export function setData(fn: (d: AppData) => AppData) {
  data = fn(getData());
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getData, () => DEFAULT);
}

export function useActiveLearner(): Learner | null {
  const d = useAppData();
  return d.learners.find((l) => l.id === d.activeId) ?? null;
}

export function useSettings(): Settings {
  return useAppData().settings;
}

export function setSettings(patch: Partial<Settings>) {
  setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

/** Update the active learner. */
export function updateLearner(id: string, fn: (l: Learner) => Learner) {
  setData((d) => ({ ...d, learners: d.learners.map((l) => (l.id === id ? cap(fn(l)) : l)) }));
}

function cap(l: Learner): Learner {
  const max = CONFIG.MAX_LOG_ITEMS;
  return {
    ...l,
    events: l.events.slice(-max),
    decisions: l.decisions.slice(-200),
    engine: { ...l.engine, attempts: l.engine.attempts.slice(-max) },
  };
}

export function logEvent(id: string, type: string, payload: Record<string, unknown>) {
  updateLearner(id, (l) => ({ ...l, events: [...l.events, { ts: Date.now(), type, data: payload }] }));
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function addLearner(nickname: string, emoji: string): string {
  const id = newId();
  const learner: Learner = {
    id,
    nickname,
    emoji,
    createdAt: Date.now(),
    engine: emptyEngine(),
    decisions: [],
    events: [{ ts: Date.now(), type: "learner_created", data: { nickname, emoji } }],
    currentQ: null,
    plan: null,
    lastFeedback: null,
    learn: {},
    qCount: 0,
  };
  setData((d) => ({ ...d, learners: [...d.learners, learner], activeId: id }));
  return id;
}

export function removeLearner(id: string) {
  setData((d) => ({
    ...d,
    learners: d.learners.filter((l) => l.id !== id),
    activeId: d.activeId === id ? null : d.activeId,
  }));
}

// ---------------- Session (memory only, resets on reload) ----------------

export interface Session {
  /** bytes sent + received by AI calls only */
  bytes: number;
  /** true after an AI failure: show the "offline practice mode" banner */
  fallbackActive: boolean;
  /** last AI call timed out or was slow */
  slowNet: boolean;
  /** skip AI for this many more calls after a failure */
  skipLeft: number;
  aiCalls: number;
}

let session: Session = { bytes: 0, fallbackActive: false, slowNet: false, skipLeft: 0, aiCalls: 0 };
const sessionListeners = new Set<() => void>();

export function getSession(): Session {
  return session;
}
export function setSession(patch: Partial<Session>) {
  session = { ...session, ...patch };
  sessionListeners.forEach((l) => l());
}
export function useSession(): Session {
  return useSyncExternalStore(
    (l) => {
      sessionListeners.add(l);
      return () => sessionListeners.delete(l);
    },
    () => session,
    () => session,
  );
}
