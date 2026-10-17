import type { Language } from "./types";

/** BCP-47 tags for browser speech synthesis / recognition. */
export const SPEECH_LOCALES: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  ml: "ml-IN",
};

type SpeakingListener = (speaking: boolean) => void;
const speakingListeners = new Set<SpeakingListener>();

function emitSpeaking(speaking: boolean) {
  speakingListeners.forEach((listener) => listener(speaking));
}

export function subscribeSpeaking(listener: SpeakingListener): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

export function speakText(text: string, language: Language) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LOCALES[language] || "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase())) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(language));
  if (match) utterance.voice = match;

  utterance.onstart = () => emitSpeaking(true);
  utterance.onend = () => emitSpeaking(false);
  utterance.onerror = () => emitSpeaking(false);

  emitSpeaking(true);
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  emitSpeaking(false);
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export interface SilenceWatchOptions {
  /** RMS below this = silence (0–1). */
  silenceThreshold?: number;
  /** How long silence must last after speech before auto-stop (ms). */
  silenceMs?: number;
  /** Ignore silence until the user has spoken at least this long (ms). */
  minSpeechMs?: number;
  /** Hard cap so recording never hangs (ms). */
  maxMs?: number;
  onSilence: () => void;
}

/**
 * Watches a mic stream and calls onSilence when the speaker pauses
 * after having spoken.
 */
export function watchForSilence(
  stream: MediaStream,
  options: SilenceWatchOptions,
): () => void {
  const silenceThreshold = options.silenceThreshold ?? 0.018;
  const silenceMs = options.silenceMs ?? 1300;
  const minSpeechMs = options.minSpeechMs ?? 400;
  const maxMs = options.maxMs ?? 20000;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let spokenMs = 0;
  let silentMs = 0;
  let lastTs = performance.now();
  let stopped = false;
  let raf = 0;

  const maxTimer = window.setTimeout(() => {
    if (!stopped) {
      stopped = true;
      options.onSilence();
    }
  }, maxMs);

  const tick = () => {
    if (stopped) return;
    const now = performance.now();
    const dt = now - lastTs;
    lastTs = now;

    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const isSilent = rms < silenceThreshold;

    if (!isSilent) {
      spokenMs += dt;
      silentMs = 0;
    } else if (spokenMs >= minSpeechMs) {
      silentMs += dt;
      if (silentMs >= silenceMs) {
        stopped = true;
        options.onSilence();
        return;
      }
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    clearTimeout(maxTimer);
    source.disconnect();
    void audioCtx.close().catch(() => undefined);
  };
}
