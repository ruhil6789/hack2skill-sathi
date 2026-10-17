import { defaultTemplates } from "./templates";
import type { EarningEntry, EarnPlatform, WorkerContext, WorkerProfile } from "./types";

const KEY = "saathi-worker-v2";

const defaultProfile: WorkerProfile = {
  name: "",
  language: "en",
  jobType: "delivery",
  city: "",
  platform: "",
  emergencyName: "",
  emergencyPhone: "",
};

function migrateEarnings(raw: unknown): EarningEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const e = item as Partial<EarningEntry> & { platform?: string };
    const platform = (e.platform as EarnPlatform) || "other";
    return {
      id: e.id || `e-${index}`,
      date: e.date || new Date().toISOString().slice(0, 10),
      amount: Number(e.amount) || 0,
      hours: Number(e.hours) || 0,
      note: e.note || "",
      platform,
    };
  });
}

export function loadContext(): WorkerContext {
  if (typeof window === "undefined") {
    return { profile: defaultProfile, earnings: [], templates: [] };
  }
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem("saathi-worker-v1");
    if (!raw) {
      return { profile: defaultProfile, earnings: [], templates: [] };
    }
    const parsed = JSON.parse(raw) as Partial<WorkerContext>;
    const profile = { ...defaultProfile, ...(parsed.profile || {}) };
    return {
      profile,
      earnings: migrateEarnings(parsed.earnings),
      templates: parsed.templates?.length
        ? parsed.templates
        : defaultTemplates(profile),
      lastSafetyTopic: parsed.lastSafetyTopic,
      lastRightsTopic: parsed.lastRightsTopic,
      lastDocumentSummary: parsed.lastDocumentSummary,
      draftGrievance: parsed.draftGrievance,
      lastShiftAdvice: parsed.lastShiftAdvice,
    };
  } catch {
    return { profile: defaultProfile, earnings: [], templates: [] };
  }
}

export function saveContext(ctx: WorkerContext) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ctx));
}

export function weekTotal(earnings: EarningEntry[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return earnings
    .filter((e) => new Date(e.date).getTime() >= weekAgo)
    .reduce((s, e) => s + e.amount, 0);
}

export function todayTotal(earnings: EarningEntry[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return earnings
    .filter((e) => e.date === today)
    .reduce((s, e) => s + e.amount, 0);
}
