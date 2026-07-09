/**
 * Thermal inversion heuristics for ventilation timing.
 *
 * During an active inversion, cold air and pollutants pool near the ground — opening
 * windows is usually a bad idea even if outdoor PM looks slightly lower. Once the
 * inversion breaks (typically late morning), cross-ventilation becomes viable again.
 * @module inversion
 */

/**
 * @typedef {import('./types.js').InversionAssessment} InversionAssessment
 * @typedef {import('./types.js').Verdict} Verdict
 */

/**
 * @param {Object} input
 * @param {number | null} input.temp2m °C at 2 m
 * @param {number | null} input.temp80m °C at 80 m
 * @param {number} input.localHour 0–23 local clock
 * @param {number} input.month 1–12 local calendar month
 * @returns {InversionAssessment}
 */
export function assessInversion({ temp2m, temp80m, localHour, month }) {
  let gradientC = null;
  if (temp2m != null && temp80m != null) {
    gradientC = temp80m - temp2m;
  }

  const nightMorning = localHour >= 21 || localHour < 11;
  const mixingAfternoon = localHour >= 13 && localHour < 19;
  // Southern-hemisphere cool season — when Santiago-style basin inversions are most common.
  const coolSeason = month >= 4 && month <= 9;

  let score = 0;
  if (gradientC != null) {
    if (gradientC >= 0.5) score += 2;
    if (gradientC >= 2) score += 1;
    if (gradientC < 0) score -= 2;
  }
  if (nightMorning) score += 1;
  if (coolSeason) score += 1;
  if (mixingAfternoon) score -= 2;

  /** @type {import('./types.js').InversionPhase} */
  let phase;
  if (gradientC == null) {
    if (nightMorning && coolSeason) phase = "active";
    else if (nightMorning) phase = "breaking";
    else phase = "unlikely";
  } else if (score >= 3) {
    phase = "active";
  } else if (score >= 1) {
    phase = "breaking";
  } else {
    phase = "unlikely";
  }

  const gradientNote =
    gradientC != null
      ? `Surface ${temp2m?.toFixed(1)}°C · 80 m ${temp80m?.toFixed(1)}°C (${gradientC >= 0 ? "+" : ""}${gradientC.toFixed(1)}°C).`
      : "No temperature profile — using time-of-day estimate only.";

  const labels = {
    active: "Likely active",
    breaking: "Weakening",
    unlikely: "Unlikely",
    unknown: "Unknown",
  };

  const details = {
    active:
      "Warm air aloft is trapping cooler, polluted air near the ground — typical overnight and early morning, especially in winter basins.",
    breaking:
      "The surface layer is starting to mix as the sun warms the ground — ventilation windows often open late morning onward.",
    unlikely:
      "The atmosphere is relatively well mixed — outdoor readings are more representative of what you'd pull in through a window.",
    unknown: "Not enough data to estimate inversion conditions.",
  };

  return {
    phase,
    score,
    gradientC,
    label: labels[phase],
    detail: `${gradientNote} ${details[phase]}`,
  };
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

  if (phase === "active") {
    if (outdoorCleaner) {
      return {
        title: "Wait to ventilate",
        text:
          "Inversion likely — pollution is pooling near the ground. Even though outdoor PM looks lower, wait until late morning when the layer breaks before opening windows.",
      };
    }
    if (outdoorWorse) {
      return {
        title: "Keep windows closed",
        text:
          "Inversion is trapping pollutants at street level and outdoor air is worse than indoors. Filtration beats ventilation right now.",
      };
    }
    return {
      title: "Hold off on windows",
      text:
        "Inversion conditions mean outdoor air near the ground is stagnant and unreliable. Keep windows closed until mixing improves late morning.",
    };
  }

  if (phase === "breaking") {
    if (outdoorCleaner) {
      return {
        title: "Good window opening",
        text:
          "The inversion is weakening and outside air is cleaner — a short cross-ventilation burst (5–15 minutes) should help more than it would at dawn.",
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

  // unlikely or unknown — trust the PM comparison more
  if (outdoorCleaner) {
    return {
      title: "Ventilation can help",
      text:
        phase === "unlikely"
          ? "No strong inversion and outside air is cleaner — a few minutes of cross-ventilation may work as well as filtration."
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
        : "Indoor and outdoor PM are close — check again after the morning inversion breaks if you're in a valley basin.",
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
