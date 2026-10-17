import { describe, expect, it } from "vitest";
import { LIMITS } from "./constants";
import { buildSystemPrompt } from "./prompts";
import type { WorkerContext } from "./types";

const ctx: WorkerContext = {
  profile: {
    name: "Ravi",
    language: "hi",
    jobType: "delivery",
    city: "Chandigarh",
    platform: "Swiggy",
  },
  earnings: Array.from({ length: 12 }, (_, i) => ({
    id: `e-${i}`,
    date: "2026-10-17",
    amount: 100,
    hours: 1,
    note: `note-${i}`,
    platform: "swiggy" as const,
  })),
  templates: [],
};

describe("buildSystemPrompt", () => {
  it("includes Hindi language and shift mode hint", () => {
    const prompt = buildSystemPrompt("shift", ctx);
    expect(prompt).toMatch(/Hindi/i);
    expect(prompt).toMatch(/Shift planner/i);
    expect(prompt).toMatch(/NEVER use markdown/i);
  });

  it("limits earnings lines in the prompt", () => {
    const prompt = buildSystemPrompt("earnings", ctx);
    const noteHits = (prompt.match(/note-/g) || []).length;
    expect(noteHits).toBe(LIMITS.earningsEntriesInPrompt);
  });

  it("includes grievance mode guidance", () => {
    const prompt = buildSystemPrompt("grievance", {
      ...ctx,
      draftGrievance: "Prior draft text",
    });
    expect(prompt).toMatch(/Grievance drafting/i);
    expect(prompt).toContain("Prior draft text");
  });
});
