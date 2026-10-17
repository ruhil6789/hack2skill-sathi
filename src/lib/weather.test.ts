import { afterEach, describe, expect, it, vi } from "vitest";
import { clearWeatherCache, fetchWeatherHint } from "./weather";

describe("fetchWeatherHint", () => {
  afterEach(() => {
    clearWeatherCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("caches successful weather lookups in memory", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          results: [{ name: "Chandigarh", latitude: 30.7, longitude: 76.8 }],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          current: { temperature_2m: 28, precipitation: 0 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchWeatherHint("Chandigarh");
    const second = await fetchWeatherHint("Chandigarh");

    expect(first.city).toBe("Chandigarh");
    expect(first.summary).toMatch(/28/);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back when geocoding returns no place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ results: [] }),
      }),
    );

    const hint = await fetchWeatherHint("NowhereVille");
    expect(hint.summary).toMatch(/unavailable/i);
  });
});
