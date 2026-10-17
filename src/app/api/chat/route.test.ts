import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/grok", () => ({
  getGrokClient: () => ({
    chat: { completions: { create } },
  }),
  getGrokModel: () => "test-model",
}));

import { POST } from "./route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("rejects empty messages", async () => {
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "   ", mode: "chat" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns reply and uses mode max_tokens", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: "Stay safe on night shifts." } }],
      model: "test-model",
    });

    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Night tips",
          mode: "sos",
          context: {
            profile: { name: "Ravi", language: "en", jobType: "delivery" },
            earnings: [],
          },
          history: [],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toContain("Stay safe");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 350 }),
    );
  });
});
