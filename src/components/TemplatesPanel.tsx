"use client";

import { useState } from "react";
import type { Language, SavedTemplate } from "@/lib/types";

interface Props {
  language: Language;
  templates: SavedTemplate[];
  onSave: (templates: SavedTemplate[]) => void;
  onUseInChat: (body: string) => void;
  onUseInGrievance: (body: string) => void;
}

export function TemplatesPanel({
  templates,
  onSave,
  onUseInChat,
  onUseInGrievance,
}: Props) {
  const [activeId, setActiveId] = useState(templates[0]?.id || "");
  const active = templates.find((t) => t.id === activeId) || templates[0];
  const [draft, setDraft] = useState(active?.body || "");

  function select(id: string) {
    setActiveId(id);
    const t = templates.find((x) => x.id === id);
    setDraft(t?.body || "");
  }

  function saveEdits() {
    if (!active) return;
    onSave(
      templates.map((t) =>
        t.id === active.id
          ? { ...t, body: draft, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
  }

  if (!active) {
    return <p className="text-sm text-[var(--mist)]">No templates yet.</p>;
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h3 className="font-display text-xl font-bold">Saved templates</h3>
        <p className="mt-1 text-sm text-[var(--mist)]">
          Grievance, leave, and polite customer replies — edit and reuse.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => select(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              t.id === active.id
                ? "bg-[var(--hi-vis)] font-semibold text-[var(--ink)]"
                : "border border-[var(--line)] text-[var(--mist)]"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={12}
        className="min-h-0 flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--ink)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
        aria-label={active.title}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveEdits}
          className="rounded-xl bg-[var(--hi-vis)] px-3 py-2 text-sm font-bold text-[var(--ink)]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => onUseInChat(`Improve this message:\n\n${draft}`)}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
        >
          Improve with AI
        </button>
        <button
          type="button"
          onClick={() => onUseInGrievance(draft)}
          className="rounded-xl border border-[var(--warn)]/40 px-3 py-2 text-sm text-[var(--warn)]"
        >
          Use in grievance
        </button>
      </div>
    </div>
  );
}
