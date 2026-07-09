/**
 * Thermal inversion heuristics for ventilation timing.
 *
 * Uses Open-Meteo's location timezone, 2 m vs 80 m temperatures (inversion
 * signature when air aloft is warmer), and is_day (sun below horizon).
 *
 * Diurnal pattern in basin cities like Santiago:
 * - Night / early morning: inversion traps pollution near the ground
 * - Midday: sun mixes the layer — best ventilation window if outdoor PM allows
 * - Evening: surface cools and inversion rebuilds — pollution often rises again
 * @module inversion
 */

/**
 * @typedef {import('./types.js').InversionAssessment} InversionAssessment
 * @typedef {import('./types.js').DiurnalPeriod} DiurnalPeriod
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
 * @param {Object} input
 * @param {number | null} input.temp2m °C at 2 m
 * @param {number | null} input.temp80m °C at 80 m
 * @param {number} input.localHour 0–23 local clock
 * @param {number} input.month 1–12 local calendar month
 * @param {0 | 1 | null} [input.isDay] 1 = sun up, 0 = dusk/night per Open-Meteo
 * @returns {InversionAssessment}
 */
export function assessInversion({ temp2m, temp80m, localHour, month, isDay = null }) {
  let gradientC = null;
  if (temp2m != null && temp80m != null) {
    gradientC = temp80m - temp2m;
  }

  const period = inferDiurnalPeriod(localHour, isDay);
  // Southern-hemisphere cool season — Santiago-style basin inversions peak Apr–Sep.
  const coolSeason = month >= 4 && month <= 9;

  let score = 0;
  if (gradientC != null) {
    if (gradientC >= 0.5) score += 2;
    if (gradientC >= 2) score += 1;
    if (gradientC < -0.5) score -= 2;
  }

  if (period === "night" || period === "morning") score += 2;
  if (period === "evening") score += 2;
  if (period === "midday") score -= 3;
  if (coolSeason) score += 1;

  /** @type {import('./types.js').InversionPhase} */
  let phase;
  if (gradientC == null && isDay == null) {
    if (period === "night" || (period === "morning" && coolSeason)) phase = "active";
    else if (period === "evening") phase = "active";
    else if (period === "morning") phase = "breaking";
    else phase = "unlikely";
  } else if (score >= 4) {
    phase = "active";
  } else if (score >= 1) {
    if (
      period === "evening" ||
      period === "night" ||
      (period === "morning" && isDay === 0)
    ) {
      phase = "active";
    } else {
      phase = "breaking";
    }
  } else {
    phase = "unlikely";
  }

  const gradientNote =
    gradientC != null
      ? `Surface ${temp2m?.toFixed(1)}°C · 80 m ${temp80m?.toFixed(1)}°C (${gradientC >= 0 ? "+" : ""}${gradientC.toFixed(1)}°C aloft).`
      : "No temperature profile — using local time and daylight.";

  const daylightNote =
    isDay === 0 ? " Sun is down." : isDay === 1 ? " Daylight." : "";

  const labels = {
    active: period === "evening" ? "Forming (evening)" : "Likely active",
    breaking: "Weakening",
    unlikely: "Well mixed",
    unknown: "Unknown",
  };

  const periodDetails = {
    night:
      "Overnight inversion traps pollutants in a shallow layer near the ground.",
    morning:
      "Cool surface air and light winds often keep pollution pooled until late morning.",
    midday:
      "Solar heating mixes the lowest layer — outdoor readings better reflect breathable air.",
    evening:
      "As the surface cools after sunset, a fresh inversion often forms and pollution can climb again.",
  };

  return {
    phase,
    period,
    score,
    gradientC,
    isDay: isDay ?? null,
    label: labels[phase],
    detail: `${gradientNote}${daylightNote} ${periodDetails[period]}`,
  };
}

/**
 * @param {DiurnalPeriod} period
 * @returns {string}
 */
function activeVentilationHint(period) {
  if (period === "evening" || period === "night") {
    return "keep windows closed as the evening inversion builds";
  }
  if (period === "morning") {
    return "wait until late morning when the layer breaks";
  }
  return "keep windows closed until mixing improves";
}

/**
 * Ventilation advice combining PM comparison with inversion timing.
 * @param {number | null | undefined} indoorPm µg/m³
 * @param {number | null | undefined} outdoorPm µg/m³
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
    const hint = activeVentilationHint(period);
    if (outdoorCleaner) {
      return {
        title: period === "evening" ? "Don't ventilate yet" : "Wait to ventilate",
        text:
          period === "evening"
            ? `Evening cooling is rebuilding a surface inversion — pollution near the ground often rises even when sensors look slightly better. ${hint}.`
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
          ? "Surface is cooling and the air layer near the ground is stabilizing — typical time for pollution to worsen. Keep windows closed."
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
