import { describe, expect, it } from "vitest";
import { platformLabel, weekPlatformBreakdown } from "./platforms";
import type { EarningEntry } from "./types";

function entry(
  partial: Partial<EarningEntry> & Pick<EarningEntry, "platform" | "amount">,
): EarningEntry {
  return {
    id: partial.id || "e1",
    date: partial.date || new Date().toISOString().slice(0, 10),
    amount: partial.amount,
    hours: partial.hours ?? 1,
    note: partial.note || "",
    platform: partial.platform,
  };
}

describe("platformLabel", () => {
  it("maps known platforms", () => {
    expect(platformLabel("swiggy")).toBe("Swiggy");
    expect(platformLabel("cash")).toBe("Cash / offline");
  });
});

describe("weekPlatformBreakdown", () => {
  it("sums only last-7-day earnings and sorts by amount", () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const rows = weekPlatformBreakdown([
      entry({ platform: "uber", amount: 200, date: today, hours: 2 }),
      entry({ platform: "swiggy", amount: 500, date: today, hours: 4 }),
      entry({ platform: "uber", amount: 100, date: today, hours: 1 }),
      entry({ platform: "swiggy", amount: 999, date: old, hours: 8 }),
    ]);

    expect(rows[0]).toMatchObject({
      platform: "swiggy",
      amount: 500,
      hours: 4,
    });
    expect(rows[1]).toMatchObject({
      platform: "uber",
      amount: 300,
      hours: 3,
    });
    expect(rows).toHaveLength(2);
  });
});
