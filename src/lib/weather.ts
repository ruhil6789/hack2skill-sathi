/** Free Open-Meteo geocoding + forecast (no API key). */

export interface WeatherHint {
  city: string;
  summary: string;
  tempC: number | null;
  rainMm: number | null;
  isPeakLikely: boolean;
}

export async function fetchWeatherHint(city: string): Promise<WeatherHint> {
  const q = city.trim() || "Bengaluru";
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) {
      return {
        city: q,
        summary: "Weather unavailable — using schedule heuristics only.",
        tempC: null,
        rainMm: null,
        isPeakLikely: isLocalPeakHour(),
      };
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

    return {
      city: place.name,
      summary,
      tempC,
      rainMm,
      isPeakLikely: isLocalPeakHour() || rainy,
    };
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
