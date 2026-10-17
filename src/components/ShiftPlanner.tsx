"use client";

import { useEffect, useState } from "react";
import { weekPlatformBreakdown } from "@/lib/platforms";
import { weekTotal } from "@/lib/storage";
import { fetchWeatherHint, type WeatherHint } from "@/lib/weather";
import type { EarningEntry, Language, WorkerProfile } from "@/lib/types";

interface Props {
  language: Language;
  profile: WorkerProfile;
  earnings: EarningEntry[];
  lastAdvice?: string;
  pending?: boolean;
  onAsk: (prompt: string) => void;
}

export function ShiftPlanner({
  profile,
  earnings,
  lastAdvice,
  pending,
  onAsk,
}: Props) {
  const [weather, setWeather] = useState<WeatherHint | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const week = weekTotal(earnings);
  const breakdown = weekPlatformBreakdown(earnings);

  useEffect(() => {
    let cancelled = false;
    setLoadingWeather(true);
    void fetchWeatherHint(profile.city || "Bengaluru").then((w) => {
      if (!cancelled) {
        setWeather(w);
        setLoadingWeather(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile.city]);

  function askShift() {
    const platforms = breakdown
      .map((b) => `${b.label}: ₹${b.amount}`)
      .join("; ");
    const prompt = `Should I take a shift right now?
City: ${profile.city || "unknown"}
Job: ${profile.jobType}
Primary platform: ${profile.platform || "mixed"}
This week earnings: ₹${week}
By platform this week: ${platforms || "none logged"}
Weather: ${weather?.summary || "unknown"}
Peak likely: ${weather?.isPeakLikely ? "yes" : "maybe not"}
Hour now: ${new Date().getHours()}

Give a clear YES / MAYBE / SKIP recommendation with 3 short reasons and one safety note.`;
    onAsk(prompt);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h3 className="font-display text-xl font-bold">Shift planner</h3>
        <p className="mt-1 text-sm text-[var(--mist)]">
          Should you take this shift? Uses your earnings + live weather/peak hints.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/50 p-4 text-sm">
        <div className="text-xs uppercase tracking-wide text-[var(--mist)]">Weather</div>
        <p className="mt-1 text-[var(--paper)]">
          {loadingWeather ? "Fetching…" : weather?.summary}
        </p>
        {!loadingWeather && weather && (
          <p className="mt-2 text-xs text-[var(--hi-vis)]">
            {weather.isPeakLikely ? "Peak / surge window likely" : "Quieter period possible"}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/40 p-4 text-sm">
        <div className="text-xs uppercase tracking-wide text-[var(--mist)]">
          This week · ₹{week.toLocaleString("en-IN")}
        </div>
        {breakdown.length === 0 ? (
          <p className="mt-2 text-[var(--mist)]">Log earnings to improve advice.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {breakdown.map((b) => (
              <li key={b.platform} className="flex justify-between">
                <span>{b.label}</span>
                <span className="text-[var(--hi-vis)]">
                  ₹{b.amount.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={askShift}
        className="rounded-2xl bg-[var(--hi-vis)] px-4 py-3 text-sm font-bold text-[var(--ink)] disabled:opacity-40"
      >
        Ask: should I take this shift?
      </button>

      {lastAdvice && (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--panel-raise)] p-3 text-sm whitespace-pre-wrap scrollbar-thin">
          {lastAdvice}
        </div>
      )}
    </div>
  );
}
