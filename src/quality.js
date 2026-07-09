import { PM25_TIERS } from "./config.js";

/**
 * @param {number | null | undefined} concentration µg/m³
 * @returns {import('./types.js').Tier}
 */
export function pm25Tier(concentration) {
  if (concentration == null || Number.isNaN(concentration)) {
    return { max: Infinity, level: null, key: "unknown", label: "--", color: "var(--unknown)" };
  }
  const c = Math.max(0, concentration);
  for (const tier of PM25_TIERS) {
    if (c <= tier.max) return tier;
  }
  return PM25_TIERS[PM25_TIERS.length - 1];
}

/**
 * Map ozone onto the same 0–5 ordinal scale as PM2.5.
 * @param {number | null | undefined} o3 µg/m³
 * @returns {number | null}
 */
export function ozoneLevel(o3) {
  if (o3 == null || Number.isNaN(o3)) return null;
  if (o3 <= 100) return 0;
  if (o3 <= 160) return 1;
  return 3;
}

/**
 * @param {number | null | undefined} level Ordinal 0–5
 * @returns {import('./types.js').Tier}
 */
export function categoryFor(level) {
  if (level == null) {
    return { max: Infinity, level: null, key: "unknown", label: "--", color: "var(--unknown)" };
  }
  return PM25_TIERS.find((t) => t.level === level) || PM25_TIERS[PM25_TIERS.length - 1];
}

/**
 * @param {number | null | undefined} pm25Level
 * @param {number | null | undefined} o3Level
 * @returns {import('./types.js').Verdict}
 */
export function exerciseVerdict(pm25Level, o3Level) {
  if (pm25Level == null && o3Level == null) {
    return { title: "No data yet", text: "Waiting on outdoor readings." };
  }

  const level = Math.max(pm25Level ?? 0, o3Level ?? 0);
  const drivenByOzone = (o3Level ?? -1) > (pm25Level ?? -1);
  const driver = drivenByOzone
    ? " Driven mostly by ozone, which matters more once you're breathing hard."
    : "";

  if (level === 0) {
    return {
      title: "Good to go",
      text: "Air is within WHO guideline levels — good conditions for a run, ride, or swim outside.",
    };
  }
  if (level === 1) {
    return {
      title: "Fine for most",
      text: `Above the WHO guideline but still moderate. If you're unusually sensitive to pollution, ease off the hardest intervals.${driver}`,
    };
  }
  if (level === 2) {
    return {
      title: "Shorten it",
      text: `Sensitive groups should cut prolonged or hard efforts. Everyone else is fine, but consider a lighter session.${driver}`,
    };
  }
  if (level === 3) {
    return {
      title: "Take it indoors",
      text: `Well above WHO guideline levels. Move hard training indoors and keep any outdoor activity light and short.${driver}`,
    };
  }
  if (level === 4) {
    return {
      title: "Stay in",
      text: `Very high pollution by WHO standards. Skip outdoor exercise today.${driver}`,
    };
  }
  return { title: "Stay in", text: "Extreme pollution levels. Do not exercise outside." };
}

/**
 * @param {number | null | undefined} indoorPm µg/m³
 * @param {number | null | undefined} outdoorPm µg/m³
 * @returns {import('./types.js').Verdict}
 */
export function purifierVerdict(indoorPm, outdoorPm) {
  const inLevel = pm25Tier(indoorPm).level;
  if (inLevel == null) {
    return {
      title: "Add a reading",
      text: "Enter your current indoor PM2.5 to get a recommendation.",
    };
  }

  let title;
  let text;
  if (inLevel === 0) {
    title = "Not needed";
    text = "Indoor air is within the WHO guideline already.";
  } else if (inLevel === 1) {
    title = "Optional";
    text =
      "Indoor air is above the WHO guideline but still moderate — low speed is enough if anyone at home is sensitive.";
  } else if (inLevel === 2) {
    title = "Worth switching on";
    text = "Indoor PM is elevated enough to matter over a few hours of exposure.";
  } else {
    title = "Turn it on";
    text = "Indoor air is well above WHO guideline levels and needs active filtering.";
  }

  if (outdoorPm != null && indoorPm != null) {
    if (outdoorPm < indoorPm - 5) {
      text +=
        " Outside air is cleaner right now — a few minutes of cross-ventilation could help as much as the purifier.";
    } else if (outdoorPm > indoorPm + 5) {
      text += " Outside air is worse — keep windows closed and let the purifier do the work.";
    }
  }

  return { title, text };
}

/**
 * Pick the current hour from Open-Meteo hourly or current payload.
 * @param {Record<string, unknown>} data Open-Meteo air-quality JSON
 * @returns {import('./types.js').OpenMeteoCurrentSlice}
 */
export function extractCurrent(data) {
  const current = /** @type {{ pm2_5?: number, pm10?: number, us_aqi?: number, ozone?: number }} */ (
    data.current
  );
  if (current?.pm2_5 != null) {
    return {
      pm2_5: current.pm2_5,
      pm10: current.pm10 ?? null,
      us_aqi: current.us_aqi ?? null,
      ozone: current.ozone ?? null,
    };
  }

  const hourly = /** @type {{ time: string[], pm2_5?: number[], pm10?: number[], us_aqi?: number[], ozone?: number[] }} */ (
    data.hourly
  );
  const times = hourly.time;
  const offsetMs = (/** @type {number} */ (data.utc_offset_seconds) || 0) * 1000;
  const nowLocal = new Date(Date.now() + offsetMs);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
  const nowStr = `${nowLocal.getUTCFullYear()}-${pad(nowLocal.getUTCMonth() + 1)}-${pad(nowLocal.getUTCDate())}T${pad(nowLocal.getUTCHours())}:00`;

  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= nowStr) idx = i;
  }

  return {
    pm2_5: hourly.pm2_5?.[idx] ?? null,
    pm10: hourly.pm10?.[idx] ?? null,
    us_aqi: hourly.us_aqi?.[idx] ?? null,
    ozone: hourly.ozone?.[idx] ?? null,
  };
}
