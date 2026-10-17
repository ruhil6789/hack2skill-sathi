import { beforeEach, describe, expect, it } from "vitest";
import { loadContext, saveContext, todayTotal, weekTotal } from "./storage";
import type { EarningEntry, WorkerContext } from "./types";

describe("storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
  });

  it("returns defaults for empty storage", () => {
    const ctx = loadContext();
    expect(ctx.profile.name).toBe("");
    expect(ctx.earnings).toEqual([]);
  });

  it("round-trips context and recovers from corrupt JSON", () => {
    const ctx: WorkerContext = {
      profile: {
        name: "Ravi",
        language: "hi",
        jobType: "delivery",
        city: "Chandigarh",
        platform: "Swiggy",
      },
      earnings: [
        {
          id: "1",
          date: "2026-10-17",
          amount: 250,
          hours: 2,
          note: "",
          platform: "swiggy",
        },
      ],
      templates: [],
    };
    saveContext(ctx);
    expect(loadContext().profile.name).toBe("Ravi");

    localStorage.setItem("saathi-worker-v2", "{not-json");
    expect(loadContext().profile.name).toBe("");
  });

  it("computes today and week totals", () => {
    const today = new Date().toISOString().slice(0, 10);
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const earnings: EarningEntry[] = [
      {
        id: "1",
        date: today,
        amount: 100,
        hours: 1,
        note: "",
        platform: "uber",
      },
      {
        id: "2",
        date: today,
        amount: 50,
        hours: 1,
        note: "",
        platform: "cash",
      },
      {
        id: "3",
        date: old,
        amount: 999,
        hours: 1,
        note: "",
        platform: "swiggy",
      },
    ];
    expect(todayTotal(earnings)).toBe(150);
    expect(weekTotal(earnings)).toBe(150);
  });
});
