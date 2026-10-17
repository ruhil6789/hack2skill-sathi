import Link from "next/link";

export default function Home() {
  return (
    <div className="road-bg relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[18%] h-1.5 lane-strip"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="font-display text-lg font-bold tracking-wide text-[var(--hi-vis)]">
          Saathi
        </span>
        <span className="text-xs text-[var(--mist)] sm:text-sm">
          Generative AI companion
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-24 pt-6 sm:px-8">
        <p className="animate-rise text-sm font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">
          For delivery partners, drivers & daily-wage workers
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-[var(--paper)] sm:text-7xl">
          Saathi
        </h1>
        <p className="animate-rise-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-[var(--mist)] sm:text-xl">
          Multilingual AI for earnings, safety, rights, documents, and
          grievances — connected in one companion workflow.
        </p>
        <div className="animate-rise-delay-2 mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/companion"
            className="cta-pulse inline-flex items-center justify-center rounded-2xl bg-[var(--hi-vis)] px-7 py-3.5 text-base font-bold text-[var(--ink)] transition hover:bg-[var(--hi-vis-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hi-vis)]"
          >
            Open companion
          </Link>
          <span className="text-sm text-[var(--mist)]">
            Hindi · Tamil · Telugu · Bengali · more
          </span>
        </div>
      </main>
    </div>
  );
}
