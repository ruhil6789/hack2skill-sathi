"use client";

import { useEffect, useRef, useState } from "react";
import { CheatSheets } from "@/components/CheatSheets";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { EarningsPanel } from "@/components/EarningsPanel";
import { SetupForm } from "@/components/SetupForm";
import { ShiftPlanner } from "@/components/ShiftPlanner";
import { SosPanel } from "@/components/SosPanel";
import { SpeakRepliesToggle, VoiceMicButton } from "@/components/VoiceBar";
import { TemplatesPanel } from "@/components/TemplatesPanel";
import { ApiError, postChat } from "@/lib/api";
import { cacheCheatSheets } from "@/lib/cheatsheets";
import { LIMITS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { RIGHTS_PROMPTS, SAFETY_PROMPTS } from "@/lib/prompts";
import { loadContext, saveContext } from "@/lib/storage";
import { defaultTemplates } from "@/lib/templates";
import { speakText, stopSpeaking, subscribeSpeaking } from "@/lib/voice";
import type {
  ChatMessage,
  CompanionMode,
  EarningEntry,
  SavedTemplate,
  WorkerContext,
  WorkerProfile,
} from "@/lib/types";

const MODES: {
  id: CompanionMode;
  key:
    | "chat"
    | "earnings"
    | "shift"
    | "sos"
    | "safety"
    | "rights"
    | "documents"
    | "templates"
    | "grievance";
}[] = [
  { id: "chat", key: "chat" },
  { id: "earnings", key: "earnings" },
  { id: "shift", key: "shift" },
  { id: "sos", key: "sos" },
  { id: "safety", key: "safety" },
  { id: "rights", key: "rights" },
  { id: "documents", key: "documents" },
  { id: "templates", key: "templates" },
  { id: "grievance", key: "grievance" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CompanionApp() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [ctx, setCtx] = useState<WorkerContext>(() => ({
    profile: {
      name: "",
      language: "en",
      jobType: "delivery",
      city: "",
      platform: "",
      emergencyName: "",
      emergencyPhone: "",
    },
    earnings: [],
    templates: [],
  }));
  const [mode, setMode] = useState<CompanionMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [grievanceIssue, setGrievanceIssue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const speakRepliesRef = useRef(speakReplies);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    speakRepliesRef.current = speakReplies;
  }, [speakReplies]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    const unsubscribe = subscribeSpeaking(setIsSpeaking);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      unsubscribe();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const loaded = loadContext();
    if (!loaded.templates?.length) {
      loaded.templates = defaultTemplates(loaded.profile);
    }
    setCtx(loaded);
    setOnboarded(Boolean(loaded.profile.name));
    cacheCheatSheets(loaded.profile.jobType);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setReady(true);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveContext(ctx);
  }, [ctx, ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function updateProfile(profile: WorkerProfile) {
    setCtx((c) => ({ ...c, profile }));
  }

  function addEarning(entry: Omit<EarningEntry, "id">) {
    setCtx((c) => ({
      ...c,
      earnings: [{ ...entry, id: uid() }, ...c.earnings],
    }));
  }

  async function askGrok(
    message: string,
    nextMode: CompanionMode = mode,
    patch?: Partial<WorkerContext>,
  ) {
    const trimmed = message.trim().slice(0, LIMITS.messageChars);
    if (!trimmed) return;

    const nextCtx = patch ? { ...ctx, ...patch } : ctx;
    if (patch) setCtx(nextCtx);

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      mode: nextMode,
    };
    setMessages((m) => [...m, userMsg]);
    setError(null);
    setMode(nextMode === "earnings" ? "chat" : nextMode);
    setPending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = [...messages, userMsg].slice(-LIMITS.historyTurns).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { reply } = await postChat({
        message: trimmed,
        mode: nextMode,
        context: nextCtx,
        history,
        signal: controller.signal,
      });

      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: reply, mode: nextMode },
      ]);

      if (speakRepliesRef.current) {
        speakText(reply, nextCtx.profile.language);
      }

      if (nextMode === "grievance") {
        setCtx((c) => ({ ...c, draftGrievance: reply }));
      }
      if (nextMode === "documents") {
        setCtx((c) => ({
          ...c,
          lastDocumentSummary: reply.slice(0, 400),
        }));
      }
      if (nextMode === "shift") {
        setCtx((c) => ({ ...c, lastShiftAdvice: reply }));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setError(message);
    } finally {
      if (abortRef.current === controller) setPending(false);
    }
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    stopSpeaking();
    void askGrok(text, mode === "earnings" ? "chat" : mode);
  }

  function handleVoiceTranscript(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    setInput(cleaned);
    stopSpeaking();
    void askGrok(cleaned, mode === "earnings" ? "chat" : mode);
    setInput("");
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center road-bg text-[var(--mist)]"
        role="status"
        aria-live="polite"
      >
        Loading Saathi…
      </div>
    );
  }

  const lang = ctx.profile.language;

  if (!onboarded) {
    return (
      <div className="road-bg flex min-h-screen flex-col px-4 py-10 sm:px-6">
        <header className="mx-auto mb-8 w-full max-w-xl animate-rise">
          <div className="font-display text-4xl font-extrabold tracking-tight text-[var(--hi-vis)]">
            {t(lang, "brand")}
          </div>
          <p className="mt-2 max-w-md text-[var(--mist)]">{t(lang, "tagline")}</p>
        </header>
        <SetupForm
          profile={ctx.profile}
          onChange={updateProfile}
          onContinue={() => {
            setOnboarded(true);
            setMessages([
              {
                id: uid(),
                role: "assistant",
                content:
                  lang === "hi"
                    ? `नमस्ते ${ctx.profile.name}! मैं आपका साथी हूँ — कमाई, सुरक्षा, अधिकार, दस्तावेज़ और शिकायत में मदद करूँगा। आज क्या चाहिए?`
                    : `Hi ${ctx.profile.name}! I’m Saathi — your companion for earnings, safety, rights, documents, and disputes. What do you need today?`,
                mode: "chat",
              },
            ]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="road-bg flex min-h-screen flex-col">
      <header className="border-b border-[var(--line)] bg-[var(--ink)]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <div className="font-display text-2xl font-extrabold text-[var(--hi-vis)]">
              {t(lang, "brand")}
            </div>
            <div className="text-xs text-[var(--mist)]">
              {ctx.profile.name} · {ctx.profile.jobType.replace("_", " ")}
              {ctx.profile.city ? ` · ${ctx.profile.city}` : ""}
            </div>
          </div>
          <div className="hidden text-xs text-[var(--mist)] sm:block">
            {t(lang, "poweredBy")}
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-3 sm:px-5"
          aria-label="Companion tools"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-current={mode === m.id ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hi-vis)] ${
                mode === m.id
                  ? m.id === "sos"
                    ? "bg-[var(--danger)] font-semibold text-white"
                    : "bg-[var(--hi-vis)] font-semibold text-[var(--ink)]"
                  : m.id === "sos"
                    ? "border border-[var(--danger)]/50 text-[var(--danger)]"
                    : "border border-[var(--line)] text-[var(--mist)] hover:text-[var(--paper)]"
              }`}
            >
              {t(lang, m.key)}
            </button>
          ))}
        </nav>
      </header>

      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true">
        {pending
          ? "Saathi is thinking"
          : isSpeaking
            ? "Saathi is speaking. Press stop speaking to cancel."
            : voiceStatus || ""}
      </div>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:p-6">
        <section
          className="animate-rise flex min-h-[420px] flex-col rounded-3xl border border-[var(--line)] bg-[var(--panel)]/85 p-4 backdrop-blur sm:p-5"
          aria-label={t(lang, MODES.find((m) => m.id === mode)?.key || "chat")}
        >
          {mode === "earnings" && (
            <EarningsPanel
              language={lang}
              earnings={ctx.earnings}
              defaultPlatform={ctx.profile.platform}
              onAdd={addEarning}
              onAsk={(prompt) => void askGrok(prompt, "earnings")}
              onDispute={(prompt) => {
                setGrievanceIssue(prompt);
                setMode("grievance");
              }}
            />
          )}

          {mode === "shift" && (
            <ShiftPlanner
              language={lang}
              profile={ctx.profile}
              earnings={ctx.earnings}
              lastAdvice={ctx.lastShiftAdvice}
              pending={pending}
              onAsk={(prompt) => void askGrok(prompt, "shift")}
            />
          )}

          {mode === "sos" && (
            <SosPanel
              language={lang}
              profile={ctx.profile}
              onSaveContact={(name, phone) =>
                setCtx((c) => ({
                  ...c,
                  profile: {
                    ...c.profile,
                    emergencyName: name,
                    emergencyPhone: phone,
                  },
                }))
              }
              onAskSafety={(prompt) => void askGrok(prompt, "sos")}
            />
          )}

          {mode === "safety" && (
            <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
              <ToolBlock
                title={t(lang, "safetyTitle")}
                actions={[
                  {
                    label: "Open SOS pack",
                    run: () => setMode("sos"),
                  },
                  {
                    label: "Job checklist",
                    run: () =>
                      void askGrok(
                        SAFETY_PROMPTS[ctx.profile.jobType] || SAFETY_PROMPTS.other,
                        "safety",
                        { lastSafetyTopic: ctx.profile.jobType },
                      ),
                  },
                  {
                    label: "Night shift tips",
                    run: () =>
                      void askGrok(
                        "Give night-shift safety tips for my job, including how to stay visible and what to do if I feel unsafe.",
                        "safety",
                        { lastSafetyTopic: "night shift" },
                      ),
                  },
                  {
                    label: "After an accident",
                    run: () =>
                      void askGrok(
                        "What should I do step-by-step after a road or workplace accident as a gig/informal worker?",
                        "safety",
                        { lastSafetyTopic: "accident" },
                      ),
                  },
                ]}
              />
              <CheatSheets jobType={ctx.profile.jobType} online={online} />
            </div>
          )}

          {mode === "rights" && (
            <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
              <ToolBlock
                title={t(lang, "rightsTitle")}
                actions={[
                  {
                    label: "My rights",
                    run: () =>
                      void askGrok(
                        RIGHTS_PROMPTS[ctx.profile.jobType] || RIGHTS_PROMPTS.other,
                        "rights",
                        { lastRightsTopic: "rights overview" },
                      ),
                  },
                  {
                    label: "e-SHRAM & schemes",
                    run: () =>
                      void askGrok(
                        "Explain e-SHRAM and other welfare schemes I may qualify for, and how to register in simple steps.",
                        "rights",
                        { lastRightsTopic: "e-SHRAM" },
                      ),
                  },
                  {
                    label: "Unpaid wages",
                    run: () =>
                      void askGrok(
                        "What can I do if my platform or employer delayed or cut my pay? Give practical steps and when to escalate.",
                        "rights",
                        { lastRightsTopic: "unpaid wages" },
                      ),
                  },
                ]}
              />
              <CheatSheets jobType={ctx.profile.jobType} online={online} />
            </div>
          )}

          {mode === "documents" && (
            <DocumentsPanel
              language={lang}
              pending={pending}
              onExplain={(text) =>
                void askGrok(
                  `Explain this document in simple language and list action items:\n\n${text}`,
                  "documents",
                )
              }
              onDispute={(text) => {
                setGrievanceIssue(
                  `Based on this document, I need help raising a dispute:\n${text}`,
                );
                setMode("grievance");
              }}
            />
          )}

          {mode === "templates" && (
            <TemplatesPanel
              language={lang}
              templates={ctx.templates}
              onSave={(templates: SavedTemplate[]) =>
                setCtx((c) => ({ ...c, templates }))
              }
              onUseInChat={(body) => void askGrok(body, "templates")}
              onUseInGrievance={(body) => {
                setGrievanceIssue(body);
                setMode("grievance");
              }}
            />
          )}

          {mode === "grievance" && (
            <div className="flex h-full flex-col gap-3">
              <h3 className="font-display text-xl font-bold">
                {t(lang, "grievanceTitle")}
              </h3>
              <p className="text-sm text-[var(--mist)]">{t(lang, "grievanceHint")}</p>
              <button
                type="button"
                onClick={() => setMode("templates")}
                className="self-start text-xs font-semibold text-[var(--hi-vis)] hover:underline"
              >
                Open saved templates
              </button>
              <textarea
                value={grievanceIssue}
                onChange={(e) =>
                  setGrievanceIssue(e.target.value.slice(0, LIMITS.messageChars))
                }
                rows={8}
                maxLength={LIMITS.messageChars}
                aria-label={t(lang, "grievanceTitle")}
                className="min-h-0 flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--ink)] p-3 text-sm text-[var(--paper)] outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
                placeholder="Date, order ID, amount missing, what you already tried…"
              />
              <button
                type="button"
                disabled={!grievanceIssue.trim() || pending}
                onClick={() =>
                  void askGrok(
                    `Draft a clear grievance / dispute message I can send. Issue details:\n${grievanceIssue}`,
                    "grievance",
                  )
                }
                className="rounded-xl bg-[var(--hi-vis)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] disabled:opacity-40"
              >
                {t(lang, "generate")}
              </button>
              {ctx.draftGrievance && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(ctx.draftGrievance || "")}
                  className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
                >
                  {t(lang, "copy")}
                </button>
              )}
            </div>
          )}

          {mode === "chat" && (
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">{t(lang, "chat")}</h3>
                <p className="mt-1 text-sm text-[var(--mist)]">
                  Connected to your earnings, safety, rights, and documents context.
                </p>
              </div>
              <div className="grid gap-2">
                {[
                  "How much did I earn this week and is my hourly rate fair?",
                  "Remind me of top safety tips for my job.",
                  "Which welfare schemes should I register for?",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void askGrok(q, "chat")}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/50 px-3 py-2 text-left text-sm text-[var(--paper)] hover:border-[var(--hi-vis)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section
          className="animate-rise-delay flex min-h-[420px] flex-col rounded-3xl border border-[var(--line)] bg-[var(--panel)]/85 backdrop-blur"
          aria-label="Conversation"
        >
          <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Conversation</h2>
                <div className="text-xs text-[var(--mist)]">
                  Voice + text · replies in your language
                </div>
              </div>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={() => stopSpeaking()}
                  aria-label={t(lang, "stopSpeaking")}
                  className="shrink-0 rounded-full border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-3 py-1.5 text-xs font-bold text-[var(--danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                >
                  {t(lang, "stopSpeaking")}
                </button>
              )}
            </div>
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin sm:p-5"
            role="log"
            aria-relevant="additions"
            aria-live="polite"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`msg-in max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[var(--hi-vis)] text-[var(--ink)]"
                    : "mr-auto border border-[var(--line)] bg-[var(--ink)]/55 text-[var(--paper)]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === "assistant" && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => speakText(m.content, lang)}
                      className="text-xs font-semibold text-[var(--hi-vis)] hover:underline"
                    >
                      {t(lang, "speak")}
                    </button>
                    {isSpeaking && (
                      <button
                        type="button"
                        onClick={() => stopSpeaking()}
                        className="text-xs font-semibold text-[var(--danger)] hover:underline"
                      >
                        {t(lang, "stopSpeaking")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="msg-in mr-auto rounded-2xl border border-[var(--line)] bg-[var(--ink)]/55 px-3.5 py-2.5 text-sm text-[var(--mist)]">
                Saathi is thinking…
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendChat}
            className="border-t border-[var(--line)] p-3 sm:p-4"
          >
            <SpeakRepliesToggle
              language={lang}
              checked={speakReplies}
              onChange={setSpeakReplies}
              status={voiceStatus}
            />
            {isSpeaking && (
              <button
                type="button"
                onClick={() => stopSpeaking()}
                className="mb-2 w-full rounded-2xl border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-4 py-2.5 text-sm font-bold text-[var(--danger)]"
              >
                {t(lang, "stopSpeaking")}
              </button>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t(lang, "placeholder")}
                className="flex-1 rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--hi-vis)]"
                disabled={pending}
              />
              <VoiceMicButton
                language={lang}
                disabled={pending}
                onTranscript={handleVoiceTranscript}
                onError={setError}
                onStatus={setVoiceStatus}
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="rounded-2xl bg-[var(--hi-vis)] px-4 py-3 text-sm font-bold text-[var(--ink)] disabled:opacity-40"
              >
                {t(lang, "send")}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function ToolBlock({
  title,
  actions,
}: {
  title: string;
  actions: { label: string; run: () => void }[];
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <div className="grid gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.run}
            className="rounded-2xl border border-[var(--line)] bg-[var(--ink)]/50 px-4 py-3 text-left font-medium hover:border-[var(--hi-vis)]"
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-auto text-sm text-[var(--mist)]">
        Answers appear in the conversation panel and stay linked to your profile.
      </p>
    </div>
  );
}
