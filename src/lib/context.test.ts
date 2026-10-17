import { describe, expect, it } from "vitest";
import { LIMITS } from "./constants";
import { trimContextForMode } from "./context";
import type { WorkerContext } from "./types";

const fat: WorkerContext = {
  profile: {
    name: "Ravi",
    language: "hi",
    jobType: "delivery",
    city: "Chandigarh",
    platform: "Swiggy",
    emergencyName: "Priya",
    emergencyPhone: "9999999999",
  },
  earnings: Array.from({ length: 20 }, (_, i) => ({
    id: `e-${i}`,
    date: "2026-10-17",
    amount: 100 + i,
    hours: 1,
    note: "n",
    platform: "swiggy" as const,
  })),
  templates: [
    {
      id: "t1",
      kind: "leave",
      title: "Leave",
      body: "body",
      updatedAt: "2026-10-17",
    },
  ],
  lastSafetyTopic: "night",
  lastRightsTopic: "e-SHRAM",
  lastDocumentSummary: "payslip",
  draftGrievance: "full grievance draft ".repeat(20),
  lastShiftAdvice: "take the evening shift ".repeat(20),
};

describe("trimContextForMode", () => {
  it("caps earnings and drops templates for earnings mode", () => {
    const trimmed = trimContextForMode("earnings", fat);
    expect(trimmed.earnings).toHaveLength(LIMITS.earningsEntriesInPrompt);
    expect(trimmed.templates).toEqual([]);
    expect(trimmed.draftGrievance).toBeUndefined();
    expect(trimmed.lastSafetyTopic).toBeUndefined();
  });

  it("keeps grievance + document summary for grievance mode", () => {
    const trimmed = trimContextForMode("grievance", fat);
    expect(trimmed.draftGrievance).toBe(fat.draftGrievance);
    expect(trimmed.lastDocumentSummary).toBe("payslip");
    expect(trimmed.lastSafetyTopic).toBeUndefined();
  });

  it("keeps safety topic for sos mode", () => {
    const trimmed = trimContextForMode("sos", fat);
    expect(trimmed.lastSafetyTopic).toBe("night");
    expect(trimmed.draftGrievance).toBeUndefined();
  });
});
