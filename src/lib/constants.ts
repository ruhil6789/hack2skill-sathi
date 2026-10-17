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
} as const;

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
