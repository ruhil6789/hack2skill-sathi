"use client";

import { useEffect, useState } from "react";
import {
  cacheCheatSheets,
  getCheatSheets,
  loadCachedCheatSheets,
  type CheatCard,
} from "@/lib/cheatsheets";
import type { JobType } from "@/lib/types";

interface Props {
  jobType: JobType;
  online: boolean;
}

export function CheatSheets({ jobType, online }: Props) {
  const [cards, setCards] = useState<CheatCard[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  useEffect(() => {
    const fresh = getCheatSheets(jobType);
    cacheCheatSheets(jobType);
    setCards(fresh);
    setFromCache(false);
    setCachedAt(new Date().toISOString());
  }, [jobType]);

  useEffect(() => {
    function sync() {
      if (!navigator.onLine) {
        const cached = loadCachedCheatSheets();
        if (cached?.cards?.length) {
          setCards(cached.cards);
          setFromCache(true);
          setCachedAt(cached.cachedAt);
        }
      } else {
        const fresh = getCheatSheets(jobType);
        cacheCheatSheets(jobType);
        setCards(fresh);
        setFromCache(false);
      }
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    if (!online) sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [jobType, online]);

  const safety = cards.filter((c) => c.category === "safety");
  const rights = cards.filter((c) => c.category === "rights");

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--paper)]">
          Offline cheat sheets
        </h4>
        <span className="text-[10px] text-[var(--mist)]">
          {fromCache || !online
            ? `Cached${cachedAt ? ` · ${new Date(cachedAt).toLocaleDateString()}` : ""}`
            : "Synced for offline"}
        </span>
      </div>
      {[...safety, ...rights].map((card) => (
        <article
          key={card.id}
          className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/45 p-3"
        >
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--hi-vis)]">
            {card.category} · {card.title}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--paper)]">
            {card.bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
