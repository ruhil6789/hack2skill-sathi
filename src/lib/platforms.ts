import type { EarnPlatform, EarningEntry } from "./types";

export const PLATFORMS: { id: EarnPlatform; label: string }[] = [
  { id: "swiggy", label: "Swiggy" },
  { id: "zomato", label: "Zomato" },
  { id: "uber", label: "Uber" },
  { id: "ola", label: "Ola" },
  { id: "rapido", label: "Rapido" },
  { id: "blinkit", label: "Blinkit" },
  { id: "cash", label: "Cash / offline" },
  { id: "other", label: "Other" },
];

export function platformLabel(id: EarnPlatform): string {
  return PLATFORMS.find((p) => p.id === id)?.label || id;
}

export function weekPlatformBreakdown(
  earnings: EarningEntry[],
): { platform: EarnPlatform; label: string; amount: number; hours: number }[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = new Map<EarnPlatform, { amount: number; hours: number }>();

  for (const e of earnings) {
    if (new Date(e.date).getTime() < weekAgo) continue;
    const cur = map.get(e.platform) || { amount: 0, hours: 0 };
    cur.amount += e.amount;
    cur.hours += e.hours;
    map.set(e.platform, cur);
  }

  return [...map.entries()]
    .map(([platform, v]) => ({
      platform,
      label: platformLabel(platform),
      amount: v.amount,
      hours: v.hours,
    }))
    .sort((a, b) => b.amount - a.amount);
}
