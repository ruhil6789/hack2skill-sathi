import type { CompanionMode, JobType, Language } from "./types";

export const LANGUAGES_SET = new Set<Language>([
  "en",
  "hi",
  "ta",
  "te",
  "bn",
  "mr",
  "kn",
  "ml",
]);

export const JOB_TYPES_SET = new Set<JobType>([
  "delivery",
  "driver",
  "daily_wage",
  "other",
]);

export const MODES_SET = new Set<CompanionMode>([
  "chat",
  "earnings",
  "shift",
  "sos",
  "safety",
  "rights",
  "documents",
  "templates",
  "grievance",
]);

/** Hard limits to protect cost, latency, and abuse surface. */
export const LIMITS = {
  messageChars: 4000,
  historyTurns: 8,
  historyMessageChars: 2000,
  documentChars: 8000,
  earningsEntriesInPrompt: 7,
  audioMaxBytes: 8 * 1024 * 1024, // 8 MB
  nameChars: 80,
  cityChars: 80,
  platformChars: 80,
  weatherCacheMs: 20 * 60 * 1000, // 20 min
} as const;

/** Mode-scoped completion caps — shorter modes finish faster and cost less. */
export const MAX_TOKENS_BY_MODE: Record<CompanionMode, number> = {
  chat: 500,
  earnings: 550,
  shift: 450,
  sos: 350,
  safety: 400,
  rights: 500,
  documents: 600,
  templates: 400,
  grievance: 700,
};

export const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "video/webm", // some browsers label webm audio this way
]);
