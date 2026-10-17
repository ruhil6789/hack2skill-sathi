import type { EarningEntry, WorkerContext, WorkerProfile } from "./types";

const KEY = "saathi-worker-v1";

const defaultProfile: WorkerProfile = {
  name: "",
  language: "en",
  jobType: "delivery",
  city: "",
  platform: "",
};

export function loadContext(): WorkerContext {
  if (typeof window === "undefined") {
    return { profile: defaultProfile, earnings: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { profile: defaultProfile, earnings: [] };
    return JSON.parse(raw) as WorkerContext;
  } catch {
    return { profile: defaultProfile, earnings: [] };
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
