"use client";

import { useState } from "react";
import type { Language, WorkerProfile } from "@/lib/types";

const CHECKLIST = [
  "Move to a well-lit public place if you can.",
  "Call your trusted contact below.",
  "Share your live location via WhatsApp / Maps.",
  "Use platform in-app SOS / support if available.",
  "If injured or in immediate danger, call 112.",
];

interface Props {
  language: Language;
  profile: WorkerProfile;
  onSaveContact: (name: string, phone: string) => void;
  onAskSafety: (prompt: string) => void;
}

export function SosPanel({ profile, onSaveContact, onAskSafety }: Props) {
  const [name, setName] = useState(profile.emergencyName || "");
  const [phone, setPhone] = useState(profile.emergencyPhone || "");
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    onSaveContact(name.trim(), phone.trim());
    setStatus("Emergency contact saved on this device.");
  }

  async function shareLocation() {
    if (!navigator.geolocation) {
      setStatus("Location not supported on this device.");
      return;
    }
    setStatus("Getting location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const maps = `https://maps.google.com/?q=${latitude},${longitude}`;
        const text = `SOS — I need help. My live location: ${maps}`;
        try {
          if (navigator.share) {
            await navigator.share({ title: "Saathi SOS", text, url: maps });
            setStatus("Location share sheet opened.");
          } else {
            await navigator.clipboard.writeText(text);
            setStatus("Location link copied. Paste it to WhatsApp.");
          }
        } catch {
          await navigator.clipboard.writeText(text);
          setStatus("Location link copied. Paste it to WhatsApp.");
        }
      },
      () => setStatus("Could not get location. Allow location permission."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const tel = phone.replace(/\s+/g, "");

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h3 className="font-display text-xl font-bold text-[var(--danger)]">SOS pack</h3>
        <p className="mt-1 text-sm text-[var(--mist)]">
          One-tap help: call, share location, follow the checklist.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void shareLocation()}
          className="rounded-2xl bg-[var(--danger)] px-4 py-3 text-sm font-bold text-white"
        >
          Share live location
        </button>
        {tel ? (
          <a
            href={`tel:${tel}`}
            className="rounded-2xl border border-[var(--hi-vis)] bg-[var(--hi-vis)]/15 px-4 py-3 text-center text-sm font-bold text-[var(--hi-vis)]"
          >
            Call {name || "contact"}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--mist)] opacity-50"
          >
            Add a phone to call
          </button>
        )}
      </div>

      <ol className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--ink)]/40 p-4 text-sm">
        {CHECKLIST.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className="font-bold text-[var(--hi-vis)]">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel-raise)] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mist)]">
          Trusted contact
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (+91…)"
          inputMode="tel"
          className="rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
        />
        <button
          type="button"
          onClick={save}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold"
        >
          Save contact
        </button>
      </div>

      <button
        type="button"
        onClick={() =>
          onAskSafety(
            "I may be in an unsafe situation at work. Give me calm 5-step emergency actions for my job type, without fake helpline numbers.",
          )
        }
        className="rounded-xl border border-[var(--line)] px-3 py-2 text-left text-sm hover:border-[var(--hi-vis)]"
      >
        Ask Saathi for emergency steps
      </button>

      {status && (
        <p className="text-xs text-[var(--mist)]" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
