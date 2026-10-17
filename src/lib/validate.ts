import {
  ALLOWED_AUDIO_TYPES,
  JOB_TYPES_SET,
  LIMITS,
  LANGUAGES_SET,
  MODES_SET,
} from "./constants";
import type {
  CompanionMode,
  EarningEntry,
  JobType,
  Language,
  WorkerContext,
  WorkerProfile,
} from "./types";

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function clampString(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function parseLanguage(value: unknown): Language {
  const lang = asString(value, "en") as Language;
  return LANGUAGES_SET.has(lang) ? lang : "en";
}

export function parseMode(value: unknown): CompanionMode {
  const mode = asString(value, "chat") as CompanionMode;
  return MODES_SET.has(mode) ? mode : "chat";
}

export function parseJobType(value: unknown): JobType {
  const job = asString(value, "other") as JobType;
  return JOB_TYPES_SET.has(job) ? job : "other";
}

const PLATFORMS = new Set([
  "swiggy",
  "zomato",
  "uber",
  "ola",
  "rapido",
  "blinkit",
  "cash",
  "other",
]);

export function sanitizeProfile(raw: unknown): WorkerProfile {
  const src = isRecord(raw) ? raw : {};
  return {
    name: clampString(asString(src.name), LIMITS.nameChars) || "Worker",
    language: parseLanguage(src.language),
    jobType: parseJobType(src.jobType),
    city: clampString(asString(src.city), LIMITS.cityChars),
    platform: clampString(asString(src.platform), LIMITS.platformChars),
    emergencyName: clampString(asString(src.emergencyName), LIMITS.nameChars),
    emergencyPhone: clampString(asString(src.emergencyPhone), 20),
  };
}

function sanitizeEarnings(raw: unknown): EarningEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .slice(0, 60)
    .map((item, index) => {
      const platformRaw = asString(item.platform, "other");
      const platform = PLATFORMS.has(platformRaw)
        ? (platformRaw as EarningEntry["platform"])
        : "other";
      return {
        id: clampString(asString(item.id, `e-${index}`), 64),
        date: clampString(asString(item.date), 32),
        amount: Math.max(0, Math.min(Number(item.amount) || 0, 1_000_000)),
        hours: Math.max(0, Math.min(Number(item.hours) || 0, 24)),
        note: clampString(asString(item.note), 200),
        platform,
      };
    })
    .filter((e) => e.amount > 0 || e.note);
}

export function sanitizeContext(raw: unknown): WorkerContext {
  const src = isRecord(raw) ? raw : {};
  return {
    profile: sanitizeProfile(src.profile),
    earnings: sanitizeEarnings(src.earnings),
    templates: [],
    lastSafetyTopic: clampString(asString(src.lastSafetyTopic), 120) || undefined,
    lastRightsTopic: clampString(asString(src.lastRightsTopic), 120) || undefined,
    lastDocumentSummary:
      clampString(asString(src.lastDocumentSummary), 500) || undefined,
    draftGrievance: clampString(asString(src.draftGrievance), 3000) || undefined,
    lastShiftAdvice: clampString(asString(src.lastShiftAdvice), 2000) || undefined,
  };
}

export function sanitizeMessage(raw: unknown): string {
  const message = clampString(asString(raw), LIMITS.messageChars);
  if (!message) throw new ValidationError("Message is required.");
  return message;
}

export function sanitizeHistory(
  raw: unknown,
): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((item) => {
      if (item.role !== "user" && item.role !== "assistant") return null;
      const content = clampString(asString(item.content), LIMITS.historyMessageChars);
      return content
        ? { role: item.role as "user" | "assistant", content }
        : null;
    })
    .filter((item): item is { role: "user" | "assistant"; content: string } =>
      Boolean(item),
    )
    .slice(-LIMITS.historyTurns);
}

export function assertAudioFile(file: File): void {
  if (!file || file.size === 0) {
    throw new ValidationError("Audio file is required.");
  }
  if (file.size > LIMITS.audioMaxBytes) {
    throw new ValidationError("Audio is too large. Keep recordings under 8 MB.");
  }
  const type = (file.type || "").split(";")[0].trim().toLowerCase();
  // Some browsers send empty type for MediaRecorder blobs — allow by extension.
  if (type && !ALLOWED_AUDIO_TYPES.has(type)) {
    const name = file.name.toLowerCase();
    const okExt = [".webm", ".ogg", ".mp3", ".mp4", ".wav", ".flac", ".m4a"].some(
      (ext) => name.endsWith(ext),
    );
    if (!okExt) {
      throw new ValidationError("Unsupported audio format.");
    }
  }
}

/** Never leak secrets / provider internals to the browser. */
export function publicErrorMessage(err: unknown): { message: string; status: number } {
  if (err instanceof ValidationError) {
    return { message: err.message, status: err.status };
  }
  const raw = err instanceof Error ? err.message : "Unknown error";
  if (/api key|XAI_API_KEY|GROQ_API_KEY|Incorrect API key/i.test(raw)) {
    return {
      message: "AI service is not configured. Please try again later.",
      status: 503,
    };
  }
  if (/rate limit|429/i.test(raw)) {
    return { message: "Too many requests. Please wait a moment.", status: 429 };
  }
  return { message: "Something went wrong. Please try again.", status: 500 };
}
