/** Free Open-Meteo geocoding + forecast (no API key). Cached ~20 min per city. */

import { LIMITS } from "./constants";

export interface WeatherHint {
  city: string;
  summary: string;
  tempC: number | null;
  rainMm: number | null;
  isPeakLikely: boolean;
}

type CacheEntry = { at: number; hint: WeatherHint };

const memory = new Map<string, CacheEntry>();

function cacheKey(city: string): string {
  return city.trim().toLowerCase() || "bengaluru";
}

function readCache(key: string): WeatherHint | null {
  const mem = memory.get(key);
  if (mem && Date.now() - mem.at < LIMITS.weatherCacheMs) return mem.hint;

  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(`saathi-weather:${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry;
        if (Date.now() - parsed.at < LIMITS.weatherCacheMs) {
          memory.set(key, parsed);
          return parsed.hint;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function writeCache(key: string, hint: WeatherHint) {
  const entry: CacheEntry = { at: Date.now(), hint };
  memory.set(key, entry);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(`saathi-weather:${key}`, JSON.stringify(entry));
    } catch {
      /* ignore quota */
    }
  }
}

/** Test helper — clear in-memory + session weather cache. */
export function clearWeatherCache() {
  memory.clear();
  if (typeof sessionStorage !== "undefined") {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("saathi-weather:")) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  }
}

export async function fetchWeatherHint(city: string): Promise<WeatherHint> {
  const q = city.trim() || "Bengaluru";
  const key = cacheKey(q);
  const cached = readCache(key);
  if (cached) return cached;

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) {
      const hint: WeatherHint = {
        city: q,
        summary: "Weather unavailable — using schedule heuristics only.",
        tempC: null,
        rainMm: null,
        isPeakLikely: isLocalPeakHour(),
      };
      writeCache(key, hint);
      return hint;
    }

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,precipitation&timezone=auto`,
    );
    const forecast = await forecastRes.json();
    const tempC = forecast?.current?.temperature_2m ?? null;
    const rainMm = forecast?.current?.precipitation ?? null;
    const rainy = typeof rainMm === "number" && rainMm >= 0.2;
    const hot = typeof tempC === "number" && tempC >= 35;

    let summary = `${place.name}: ${tempC ?? "?"}°C`;
    if (rainy) summary += ", rain likely (possible delivery surge / slower roads)";
    else if (hot) summary += ", hot — hydrate and shorter blocks may be safer";
    else summary += ", fair conditions";

    const hint: WeatherHint = {
      city: place.name,
      summary,
      tempC,
      rainMm,
      isPeakLikely: isLocalPeakHour() || rainy,
    };
    writeCache(key, hint);
    return hint;
  } catch {
    return {
      city: q,
      summary: "Could not fetch weather. Using time-of-day peak hints.",
      tempC: null,
      rainMm: null,
      isPeakLikely: isLocalPeakHour(),
    };
  }
}

function isLocalPeakHour(): boolean {
  const h = new Date().getHours();
  // Rough India gig peaks: lunch, evening, late dinner
  return (h >= 12 && h <= 14) || (h >= 18 && h <= 22);
}
