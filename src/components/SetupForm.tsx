"use client";

import { JOB_TYPES, LANGUAGES, t } from "@/lib/i18n";
import type { Language, WorkerProfile } from "@/lib/types";

interface Props {
  profile: WorkerProfile;
  onChange: (profile: WorkerProfile) => void;
  onContinue: () => void;
}

export function SetupForm({ profile, onChange, onContinue }: Props) {
  const lang = profile.language;
  const ready = profile.name.trim().length > 0;

  return (
    <section className="mx-auto w-full max-w-xl animate-rise rounded-3xl border border-[var(--line)] bg-[var(--panel)]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
      <p className="mb-2 text-sm font-medium tracking-wide text-[var(--hi-vis)]">
        {t(lang, "poweredBy")}
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--paper)]">
        {t(lang, "setupTitle")}
      </h2>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm text-[var(--mist)]">
          {t(lang, "name")}
          <input
            className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-[var(--hi-vis)] focus:ring-2"
            value={profile.name}
            onChange={(e) => onChange({ ...profile, name: e.target.value })}
            placeholder="Ravi / Priya / …"
            autoComplete="name"
            required
            aria-required="true"
          />
        </label>

        <label className="grid gap-1.5 text-sm text-[var(--mist)]">
          {t(lang, "language")}
          <select
            className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-[var(--hi-vis)] focus:ring-2"
            value={profile.language}
            onChange={(e) =>
              onChange({ ...profile, language: e.target.value as Language })
            }
            aria-label={t(lang, "language")}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.label})
              </option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm text-[var(--mist)]">Work type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {JOB_TYPES.map((job) => {
              const active = profile.jobType === job.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onChange({ ...profile, jobType: job.id })}
                  aria-pressed={active}
                  className={`rounded-2xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hi-vis)] ${
                    active
                      ? "border-[var(--hi-vis)] bg-[var(--hi-vis)]/10"
                      : "border-[var(--line)] bg-[var(--ink)]/60 hover:border-[var(--mist)]"
                  }`}
                >
                  <div className="font-semibold text-[var(--paper)]">{job.label}</div>
                  <div className="text-xs text-[var(--mist)]">{job.hint}</div>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm text-[var(--mist)]">
            {t(lang, "city")}
            <input
              className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-[var(--hi-vis)] focus:ring-2"
              value={profile.city}
              onChange={(e) => onChange({ ...profile, city: e.target.value })}
              placeholder="Bengaluru"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-[var(--mist)]">
            {t(lang, "platform")}
            <input
              className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-[var(--hi-vis)] focus:ring-2"
              value={profile.platform}
              onChange={(e) => onChange({ ...profile, platform: e.target.value })}
              placeholder="Swiggy / Uber / …"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onContinue}
        className="cta-pulse mt-7 w-full rounded-2xl bg-[var(--hi-vis)] px-4 py-3.5 text-base font-bold text-[var(--ink)] transition enabled:hover:bg-[var(--hi-vis-deep)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t(lang, "continue")}
      </button>
    </section>
  );
}
