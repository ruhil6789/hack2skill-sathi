import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/grok", () => ({
  getGrokClient: () => ({
    audio: { transcriptions: { create } },
  }),
}));

import { POST } from "./route";

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("rejects missing audio file", async () => {
    const form = new FormData();
    form.append("language", "hi");
    const res = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects unsupported audio type", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(["x"], "clip.txt", { type: "text/plain" }),
    );
    form.append("language", "en");
    const res = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unsupported/i);
  });

  it("returns transcribed text", async () => {
    create.mockResolvedValue({ text: "  नमस्ते  " });
    const form = new FormData();
    form.append(
      "file",
      new File(["audio"], "voice.webm", { type: "audio/webm" }),
    );
    form.append("language", "hi");

    const res = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: form,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("नमस्ते");
  });
});
