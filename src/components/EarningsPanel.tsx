"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { PLATFORMS, platformLabel, weekPlatformBreakdown } from "@/lib/platforms";
import { todayTotal, weekTotal } from "@/lib/storage";
import type { EarnPlatform, EarningEntry, Language } from "@/lib/types";

interface Props {
  language: Language;
  earnings: EarningEntry[];
  defaultPlatform?: string;
  onAdd: (entry: Omit<EarningEntry, "id">) => void;
  onAsk: (prompt: string) => void;
  onDispute: (prompt: string) => void;
}

function guessDefaultPlatform(raw?: string): EarnPlatform {
  const s = (raw || "").toLowerCase();
  const hit = PLATFORMS.find((p) => s.includes(p.id) || s.includes(p.label.toLowerCase()));
  return hit?.id || "other";
}

export function EarningsPanel({
  language,
  earnings,
  defaultPlatform,
  onAdd,
  onAsk,
  onDispute,
}: Props) {
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [platform, setPlatform] = useState<EarnPlatform>(
    guessDefaultPlatform(defaultPlatform),
  );

  const week = weekTotal(earnings);
  const today = todayTotal(earnings);
  const breakdown = weekPlatformBreakdown(earnings);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    const h = Number(hours) || 0;
    if (!a || a < 0) return;
    onAdd({
      date: new Date().toISOString().slice(0, 10),
      amount: a,
      hours: h,
      note: note.trim(),
      platform,
    });
    setAmount("");
    setHours("");
    setNote("");
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/50 p-4">
          <div className="text-xs uppercase tracking-wider text-[var(--mist)]">
            {t(language, "today")}
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-[var(--hi-vis)]">
            ₹{today.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/50 p-4">
          <div className="text-xs uppercase tracking-wider text-[var(--mist)]">
            {t(language, "weekTotal")}
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-[var(--paper)]">
            ₹{week.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mist)]">
            Weekly by platform
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {breakdown.map((b) => (
              <li key={b.platform} className="flex justify-between gap-2">
                <span>
                  {b.label}
                  <span className="text-[var(--mist)]">
                    {b.hours ? ` · ${b.hours}h` : ""}
                  </span>
                </span>
                <span className="font-semibold text-[var(--hi-vis)]">
                  ₹{b.amount.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-raise)] p-4"
      >
        <label className="grid gap-1 text-xs text-[var(--mist)]">
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as EarnPlatform)}
            className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-[var(--mist)]">
            {t(language, "amount")}
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
              required
            />
          </label>
          <label className="grid gap-1 text-xs text-[var(--mist)]">
            {t(language, "hours")}
            <input
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
            />
          </label>
        </div>
        <label className="grid gap-1 text-xs text-[var(--mist)]">
          {t(language, "note")}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Peak bonus / rain / short trip"
            className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--hi-vis)] px-3 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--hi-vis-deep)]"
        >
          {t(language, "addEarning")}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onAsk(
              `Compare my earnings across platforms this week and suggest where to focus. Breakdown: ${breakdown
                .map((b) => `${b.label}=₹${b.amount}`)
                .join(", ") || "none yet"}.`,
            )
          }
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--paper)] hover:border-[var(--hi-vis)]"
        >
          Compare platforms
        </button>
        <button
          type="button"
          onClick={() =>
            onDispute(
              `My logged earnings this week total ₹${week} across platforms (${breakdown
                .map((b) => `${b.label} ₹${b.amount}`)
                .join(", ")}). I believe I was underpaid. Help me draft a grievance.`,
            )
          }
          className="rounded-full border border-[var(--warn)]/40 px-3 py-1.5 text-xs text-[var(--warn)] hover:bg-[var(--warn)]/10"
        >
          {t(language, "useInGrievance")}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {earnings.length === 0 ? (
          <p className="text-sm text-[var(--mist)]">{t(language, "emptyEarnings")}</p>
        ) : (
          <ul className="space-y-2">
            {earnings.slice(0, 12).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--ink)]/40 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {e.date} · {platformLabel(e.platform)}
                  </div>
                  <div className="text-xs text-[var(--mist)]">
                    {e.hours ? `${e.hours}h` : "—"}
                    {e.note ? ` · ${e.note}` : ""}
                  </div>
                </div>
                <div className="font-semibold text-[var(--hi-vis)]">
                  ₹{e.amount.toLocaleString("en-IN")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
