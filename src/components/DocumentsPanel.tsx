"use client";

import { useState } from "react";
import { LIMITS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { recognizeDocumentText } from "@/lib/ocr";
import type { Language } from "@/lib/types";

interface Props {
  language: Language;
  pending?: boolean;
  onExplain: (text: string) => void;
  onDispute: (text: string) => void;
}

export function DocumentsPanel({ language, pending, onExplain, onDispute }: Props) {
  const [docText, setDocText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  async function runOcr(file: File) {
    setOcrStatus("Reading photo…");
    try {
      const text = await recognizeDocumentText(file);
      if (!text) {
        setOcrStatus("No text found. Try a clearer photo or paste text.");
        return;
      }
      setDocText(text);
      setOcrStatus("OCR done — review text, then explain.");
    } catch {
      setOcrStatus("OCR failed. Paste the text instead.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="font-display text-xl font-bold">{t(language, "docsTitle")}</h3>
      <p className="text-sm text-[var(--mist)]">
        {t(language, "docsHint")} Snap a payslip/notice for OCR, or paste text.
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--ink)]/40 px-4 py-5 text-sm hover:border-[var(--hi-vis)]">
        <span className="font-semibold text-[var(--hi-vis)]">Photo OCR</span>
        <span className="mt-1 text-xs text-[var(--mist)]">
          JPG / PNG payslip or notice
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void runOcr(file);
            e.target.value = "";
          }}
        />
      </label>

      {ocrStatus && (
        <p className="text-xs text-[var(--mist)]" role="status">
          {ocrStatus}
        </p>
      )}

      <textarea
        value={docText}
        onChange={(e) => setDocText(e.target.value.slice(0, LIMITS.documentChars))}
        rows={10}
        maxLength={LIMITS.documentChars}
        aria-label={t(language, "docsTitle")}
        className="min-h-0 flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--ink)] p-3 text-sm text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
        placeholder="Paste text here…"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!docText.trim() || pending}
          onClick={() => onExplain(docText)}
          className="rounded-xl bg-[var(--hi-vis)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] disabled:opacity-40"
        >
          {t(language, "generate")}
        </button>
        <button
          type="button"
          disabled={!docText.trim()}
          onClick={() => onDispute(docText.slice(0, 800))}
          className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--paper)]"
        >
          {t(language, "useInGrievance")}
        </button>
      </div>
    </div>
  );
}
