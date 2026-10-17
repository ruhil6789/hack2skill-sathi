import { beforeEach, describe, expect, it } from "vitest";
import {
  cacheCheatSheets,
  getCheatSheets,
  loadCachedCheatSheets,
} from "./cheatsheets";

describe("getCheatSheets", () => {
  it("includes delivery-specific handoff card", () => {
    const cards = getCheatSheets("delivery");
    expect(cards.some((c) => c.id === "s-delivery")).toBe(true);
    expect(cards.some((c) => c.category === "rights")).toBe(true);
  });

  it("includes driver-specific card", () => {
    expect(getCheatSheets("driver").some((c) => c.id === "s-driver")).toBe(
      true,
    );
  });
});

describe("cheat sheet cache", () => {
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

  it("round-trips cached cards for a job type", () => {
    cacheCheatSheets("daily_wage");
    const cached = loadCachedCheatSheets();
    expect(cached?.jobType).toBe("daily_wage");
    expect(cached?.cards.some((c) => c.id === "s-site")).toBe(true);
    expect(cached?.cachedAt).toBeTruthy();
  });
});
