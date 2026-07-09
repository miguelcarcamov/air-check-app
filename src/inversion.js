/**
 * Thermal inversion heuristics for ventilation timing.
 *
 * Signals (all from Open-Meteo at the user's coordinates):
 * - Local time + is_day (sun up/down)
 * - Temperature profile at 2 / 80 / 120 / 180 m
 * - Planetary boundary layer height (shallow = trapped pollution)
 * - Wind at 10 m (calm = stagnant)
 * - Modeled PM2.5 trend over the last ~3 hours
 * @module inversion
 */

import { BLH_DEEP_M, BLH_SHALLOW_M, WIND_CALM_KMH, WIND_DISPERSIVE_KMH } from "./config.js";

/**
 * @typedef {import('./types.js').InversionAssessment} InversionAssessment
 * @typedef {import('./types.js').DiurnalPeriod} DiurnalPeriod
 * @typedef {import('./types.js').Pm25Trend} Pm25Trend
 * @typedef {import('./types.js').Verdict} Verdict
 */

/**
 * @param {number} localHour
 * @param {0 | 1 | null | undefined} isDay
 * @returns {DiurnalPeriod}
 */
export function inferDiurnalPeriod(localHour, isDay) {
  if (localHour >= 22 || localHour < 5) return "night";
  if (localHour < 10) return "morning";
  if (localHour >= 11 && localHour < 17 && isDay !== 0) return "midday";
  if (localHour >= 17 || isDay === 0) return "evening";
  return "morning";
}

/**
 * @param {number | null | undefined} temp2m
 * @param {Array<number | null | undefined>} aloftTemps
 * @returns {boolean}
 */
function isMultiLevelInversion(temp2m, aloftTemps) {
  if (temp2m == null) return false;
  const valid = aloftTemps.filter((t) => t != null);
  if (valid.length < 2) return false;
  return valid.every((t) => (t ?? 0) - temp2m >= 0.3);
}

/**
 * @param {Pm25Trend | null | undefined} trend
 * @returns {string}
 */
function formatPmTrend(trend) {
  if (trend === "rising") return "Modeled outdoor PM2.5 rising over the last ~3 h.";
  if (trend === "falling") return "Modeled outdoor PM2.5 falling over the last ~3 h.";
  if (trend === "stable") return "Modeled outdoor PM2.5 steady over the last ~3 h.";
  return "";
}

/**
 * @param {Object} input
 * @param {number | null} input.temp2m
 * @param {number | null} input.temp80m
 * @param {number | null} [input.temp120m]
 * @param {number | null} [input.temp180m]
 * @param {number | null} [input.boundaryLayerHeightM]
 * @param {number | null} [input.windSpeedKmh]
 * @param {number} input.localHour
 * @param {number} input.month
 * @param {0 | 1 | null} [input.isDay]
 * @param {Pm25Trend | null} [input.pm25Trend]
 * @returns {InversionAssessment}
 */
export function assessInversion({
  temp2m,
  temp80m,
  temp120m = null,
  temp180m = null,
  boundaryLayerHeightM = null,
  windSpeedKmh = null,
  localHour,
  month,
  isDay = null,
  pm25Trend = null,
}) {
  let gradientC = null;
  if (temp2m != null && temp80m != null) {
    gradientC = temp80m - temp2m;
  }

  const period = inferDiurnalPeriod(localHour, isDay);
  const coolSeason = month >= 4 && month <= 9;

  let score = 0;
  if (gradientC != null) {
    if (gradientC >= 0.5) score += 2;
    if (gradientC >= 2) score += 1;
    if (gradientC < -0.5) score -= 2;
  }

  if (isMultiLevelInversion(temp2m, [temp80m, temp120m, temp180m])) score += 1;

  if (boundaryLayerHeightM != null) {
    if (boundaryLayerHeightM <= 100) score += 3;
    else if (boundaryLayerHeightM <= BLH_SHALLOW_M) score += 2;
    else if (boundaryLayerHeightM <= 600) score += 1;
    else if (boundaryLayerHeightM >= BLH_DEEP_M) score -= 2;
  }

  if (windSpeedKmh != null) {
    if (windSpeedKmh <= WIND_CALM_KMH) score += 1;
    else if (windSpeedKmh >= WIND_DISPERSIVE_KMH) score -= 1;
  }

  if (period === "night" || period === "morning") score += 2;
  if (period === "evening") score += 2;
  if (period === "midday") score -= 3;
  if (coolSeason) score += 1;

  if (pm25Trend === "rising" && period !== "midday") score += 1;
  if (pm25Trend === "falling") score -= 1;

  /** @type {import('./types.js').InversionPhase} */
  let phase;
  if (gradientC == null && boundaryLayerHeightM == null && isDay == null) {
    if (period === "night" || (period === "morning" && coolSeason)) phase = "active";
    else if (period === "evening") phase = "active";
    else if (period === "morning") phase = "breaking";
    else phase = "unlikely";
  } else if (score >= 5) {
    phase = "active";
  } else if (score >= 2) {
    if (
      period === "evening" ||
      period === "night" ||
      (period === "morning" && isDay === 0) ||
      (boundaryLayerHeightM != null && boundaryLayerHeightM <= BLH_SHALLOW_M)
    ) {
      phase = "active";
    } else {
      phase = "breaking";
    }
  } else if (score >= 0) {
    phase = period === "midday" ? "unlikely" : "breaking";
  } else {
    phase = "unlikely";
  }

  const tempParts = [temp2m, temp80m, temp120m, temp180m]
    .map((t) => (t != null ? `${t.toFixed(1)}°C` : null))
    .filter(Boolean);
  const gradientNote =
    tempParts.length >= 2
      ? `Profile 2–180 m: ${tempParts.join(" → ")}${gradientC != null ? ` (${gradientC >= 0 ? "+" : ""}${gradientC.toFixed(1)}°C aloft at 80 m).` : "."}`
      : "No temperature profile — using time-of-day and mixing depth.";

  const mixingParts = [];
  if (boundaryLayerHeightM != null) {
    mixingParts.push(
      boundaryLayerHeightM <= BLH_SHALLOW_M
        ? `Shallow mixing layer (${Math.round(boundaryLayerHeightM)} m)`
        : `Mixing layer ~${Math.round(boundaryLayerHeightM)} m`,
    );
  }
  if (windSpeedKmh != null) {
    mixingParts.push(
      windSpeedKmh <= WIND_CALM_KMH
        ? `calm wind (${windSpeedKmh.toFixed(1)} km/h)`
        : `wind ${windSpeedKmh.toFixed(1)} km/h`,
    );
  }
  const mixingNote = mixingParts.length ? `${mixingParts.join(" · ")}.` : "";
  const daylightNote = isDay === 0 ? " Sun is down." : isDay === 1 ? " Daylight." : "";
  const trendNote = formatPmTrend(pm25Trend);

  const labels = {
    active: period === "evening" ? "Forming (evening)" : "Likely active",
    breaking: "Weakening",
    unlikely: "Well mixed",
    unknown: "Unknown",
  };

  const periodDetails = {
    night: "Overnight inversion traps pollutants in a shallow layer near the ground.",
    morning: "Cool surface air and light winds often keep pollution pooled until late morning.",
    midday: "Solar heating mixes the lowest layer — outdoor readings better reflect breathable air.",
    evening: "As the surface cools after sunset, a fresh inversion often forms and pollution can climb again.",
  };

  return {
    phase,
    period,
    score,
    gradientC,
    boundaryLayerHeightM,
    windSpeedKmh,
    pm25Trend,
    label: labels[phase],
    detail: [gradientNote, mixingNote, trendNote, daylightNote, periodDetails[period]]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * @param {DiurnalPeriod} period
 * @param {InversionAssessment | null | undefined} inversion
 * @returns {string}
 */
function activeVentilationHint(period, inversion) {
  const shallow =
    inversion?.boundaryLayerHeightM != null &&
    inversion.boundaryLayerHeightM <= BLH_SHALLOW_M;
  const rising = inversion?.pm25Trend === "rising";

  if (period === "evening" || period === "night") {
    if (shallow && rising) {
      return "keep windows closed — the mixing layer is shallow and outdoor PM is rising";
    }
    if (shallow) return "keep windows closed — the mixing layer is very shallow right now";
    return "keep windows closed as the evening inversion builds";
  }
  if (period === "morning") {
    return "wait until late morning when the layer breaks";
  }
  return "keep windows closed until mixing improves";
}

/**
 * @param {number | null | undefined} indoorPm
 * @param {number | null | undefined} outdoorPm
 * @param {InversionAssessment | null | undefined} inversion
 * @returns {Verdict}
 */
export function ventilationVerdict(indoorPm, outdoorPm, inversion) {
  if (indoorPm == null) {
    return {
      title: "Add a reading",
      text: "Log your indoor PM2.5 to compare against outdoor air and inversion timing.",
    };
  }

  const outdoorCleaner = outdoorPm != null && outdoorPm < indoorPm - 5;
  const outdoorWorse = outdoorPm != null && outdoorPm > indoorPm + 5;
  const phase = inversion?.phase ?? "unknown";
  const period = inversion?.period ?? "morning";

  if (phase === "active") {
    const hint = activeVentilationHint(period, inversion);
    if (outdoorCleaner) {
      return {
        title: period === "evening" ? "Don't ventilate yet" : "Wait to ventilate",
        text:
          period === "evening"
            ? `Evening cooling is rebuilding a surface inversion — near-ground pollution often rises even when readings look slightly better. ${hint}.`
            : `Inversion likely — pollution pools near the ground. Even though outdoor PM looks lower, ${hint}.`,
      };
    }
    if (outdoorWorse) {
      return {
        title: "Keep windows closed",
        text:
          period === "evening"
            ? "Evening inversion plus worse outdoor PM — ventilation would pull polluted air in. Let filtration run."
            : "Inversion is trapping pollutants at street level and outdoor air is worse than indoors. Filtration beats ventilation right now.",
      };
    }
    return {
      title: period === "evening" ? "Inversion forming" : "Hold off on windows",
      text:
        period === "evening"
          ? `Surface is cooling and the lowest air layer is stabilizing — a typical time for pollution to worsen. ${hint}.`
          : "Inversion conditions mean outdoor air near the ground is stagnant and unreliable. Keep windows closed until mixing improves.",
    };
  }

  if (phase === "breaking") {
    if (outdoorCleaner) {
      return {
        title: "Good window opening",
        text:
          "The morning inversion is weakening and outside air is cleaner — a short cross-ventilation burst (5–15 minutes) should help.",
      };
    }
    if (outdoorWorse) {
      return {
        title: "Still keep closed",
        text:
          "Mixing is improving, but outdoor PM is still higher than indoors. Wait for outside to drop further before ventilating.",
      };
    }
    return {
      title: "Ventilate soon",
      text:
        "Inversion is easing — if outdoor PM drops below indoor in the next hour or two, a brief window opening becomes worthwhile.",
    };
  }

  if (outdoorCleaner) {
    return {
      title: "Ventilation can help",
      text:
        phase === "unlikely"
          ? "Air is well mixed and outside is cleaner — a few minutes of cross-ventilation may work as well as filtration."
          : "Outside air is cleaner than indoors — short cross-ventilation is reasonable if you're comfortable with the outdoor reading.",
    };
  }
  if (outdoorWorse) {
    return {
      title: "Keep windows closed",
      text: "Outside air is worse than indoors — ventilation would pull polluted air in. Let the purifier run.",
    };
  }

  return {
    title: "Similar inside and out",
    text:
      phase === "unlikely"
        ? "Indoor and outdoor PM are close — ventilation won't change much either way."
        : "Indoor and outdoor PM are close — recheck after the morning inversion breaks if you're in a valley basin.",
  };
}

/**
 * @param {number} utcOffsetSeconds
 * @returns {{ localHour: number, month: number }}
 */
export function localClockFromOffset(utcOffsetSeconds) {
  const nowLocal = new Date(Date.now() + utcOffsetSeconds * 1000);
  return {
    localHour: nowLocal.getUTCHours(),
    month: nowLocal.getUTCMonth() + 1,
  };
}
