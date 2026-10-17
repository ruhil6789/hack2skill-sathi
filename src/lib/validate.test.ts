import { describe, expect, it } from "vitest";
import {
  parseMode,
  publicErrorMessage,
  sanitizeHistory,
  sanitizeMessage,
  sanitizeContext,
  ValidationError,
} from "./validate";

describe("sanitizeMessage", () => {
  it("rejects empty messages", () => {
    expect(() => sanitizeMessage("   ")).toThrow(ValidationError);
  });

  it("trims and clamps long messages", () => {
    const long = "x".repeat(5000);
    expect(sanitizeMessage(long).length).toBe(4000);
  });
});

describe("parseMode", () => {
  it("accepts known modes and falls back safely", () => {
    expect(parseMode("rights")).toBe("rights");
    expect(parseMode("hack")).toBe("chat");
  });
});

describe("sanitizeHistory", () => {
  it("keeps only user/assistant roles and recent turns", () => {
    const history = sanitizeHistory([
      { role: "system", content: "ignore" },
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "help" },
    ]);
    expect(history).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "help" },
    ]);
  });
});

describe("sanitizeContext", () => {
  it("normalizes unknown job/language and clamps earnings", () => {
    const ctx = sanitizeContext({
      profile: { name: "Ravi", language: "xx", jobType: "hacker", city: "Pune" },
      earnings: [{ id: "1", date: "2026-10-17", amount: -50, hours: 2, note: "x" }],
    });
    expect(ctx.profile.language).toBe("en");
    expect(ctx.profile.jobType).toBe("other");
    expect(ctx.earnings[0]?.amount).toBe(0);
  });
});

describe("publicErrorMessage", () => {
  it("hides API key details from clients", () => {
    const result = publicErrorMessage(new Error("Missing XAI_API_KEY in env"));
    expect(result.status).toBe(503);
    expect(result.message).not.toMatch(/XAI_API_KEY/);
  });
});
