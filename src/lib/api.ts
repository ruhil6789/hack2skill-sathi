import type { CompanionMode, WorkerContext } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function postChat(params: {
  message: string;
  mode: CompanionMode;
  context: WorkerContext;
  history: { role: "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
}): Promise<{ reply: string; model?: string }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      mode: params.mode,
      context: params.context,
      history: params.history,
    }),
    signal: params.signal,
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Request failed",
      res.status,
    );
  }
  return {
    reply: String(data.reply || ""),
    model: typeof data.model === "string" ? data.model : undefined,
  };
}

export async function postTranscribe(params: {
  blob: Blob;
  filename: string;
  language: string;
  signal?: AbortSignal;
}): Promise<string> {
  const form = new FormData();
  form.append("file", params.blob, params.filename);
  form.append("language", params.language);
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
    signal: params.signal,
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Transcription failed",
      res.status,
    );
  }
  return String(data.text || "");
}
