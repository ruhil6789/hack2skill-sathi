"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, postTranscribe } from "@/lib/api";
import { t } from "@/lib/i18n";
import { pickRecorderMimeType, watchForSilence } from "@/lib/voice";
import type { Language } from "@/lib/types";

export function SpeakRepliesToggle({
  language,
  checked,
  onChange,
  status,
}: {
  language: Language;
  checked: boolean;
  onChange: (value: boolean) => void;
  status?: string | null;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--mist)]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-[var(--hi-vis)]"
        />
        {t(language, "speakReplies")}
      </label>
      {status ? (
        <span className="text-xs font-medium text-[var(--danger)]" role="status" aria-live="polite">
          {status}
        </span>
      ) : null}
    </div>
  );
}

/** Mic control — auto-stops when the user finishes speaking. */
export function VoiceMicButton({
  language,
  disabled,
  onTranscript,
  onError,
  onStatus,
}: {
  language: Language;
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
  onStatus?: (status: string | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopWatchRef = useRef<(() => void) | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopWatchRef.current?.();
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!onStatus) return;
    if (recording) onStatus(t(language, "listening"));
    else if (transcribing) onStatus(t(language, "processingVoice"));
    else onStatus(null);
  }, [recording, transcribing, language, onStatus]);

  function cleanupStream() {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    stopWatchRef.current?.();
    stopWatchRef.current = null;

    const recorder = mediaRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    setRecording(false);
  }

  async function toggleMic() {
    if (transcribing || disabled) return;

    // Manual stop still works anytime.
    if (recording) {
      stopRecording();
      return;
    }

    stoppingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void finishRecording(recorder.mimeType || "audio/webm");
        cleanupStream();
        mediaRef.current = null;
        stoppingRef.current = false;
      };

      mediaRef.current = recorder;
      // Timeslice keeps chunks flowing for short utterances.
      recorder.start(250);
      setRecording(true);

      // When the customer stops speaking → auto process.
      stopWatchRef.current = watchForSilence(stream, {
        silenceMs: 1200,
        minSpeechMs: 350,
        maxMs: 25000,
        onSilence: () => stopRecording(),
      });
    } catch {
      onError("Microphone permission is needed for voice input.");
      cleanupStream();
    }
  }

  async function finishRecording(mimeType: string) {
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (blob.size < 600) {
      onError("Could not catch your voice — tap the mic and try again.");
      return;
    }

    setTranscribing(true);
    try {
      const ext = mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("ogg")
          ? "ogg"
          : "webm";
      const text = await postTranscribe({
        blob,
        filename: `voice.${ext}`,
        language,
      });
      onTranscript(text);
    } catch (err) {
      onError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not transcribe audio",
      );
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggleMic()}
      disabled={disabled || transcribing}
      title={recording ? t(language, "stopListening") : t(language, "startListening")}
      aria-label={recording ? t(language, "stopListening") : t(language, "startListening")}
      aria-pressed={recording}
      className={`inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border transition ${
        recording
          ? "animate-pulse border-[var(--danger)] bg-[var(--danger)]/20 text-[var(--danger)]"
          : "border-[var(--line)] bg-[var(--ink)] text-[var(--hi-vis)] hover:border-[var(--hi-vis)]"
      } disabled:opacity-40`}
    >
      {transcribing ? (
        <span className="text-[10px] font-bold text-[var(--mist)]">…</span>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
