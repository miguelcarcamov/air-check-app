import { GAUGE_SCALE_PM25, WHO_PM25_GUIDELINE } from "../config.js";
import { categoryFor, ozoneLevel, pm25Tier } from "../quality.js";
import { state } from "../state.js";
import { relTime } from "./dom.js";

/** @returns {{ outCat: import('../types.js').Tier, inCat: import('../types.js').Tier, outPmLevel: number | null, outO3Level: number | null, outPm: number | null, inPm: number | null, inLevel: number | null }} */
function deriveLevels() {
  const outPm = state.outdoor?.pm2_5 ?? null;
  const outO3 = state.outdoor?.ozone ?? null;
  const inPm = state.indoor?.pm2_5 ?? null;

  const outPmLevel = state.outdoor ? pm25Tier(outPm).level : null;
  const outO3Level = state.outdoor ? ozoneLevel(outO3) : null;
  const outLevel = state.outdoor ? Math.max(outPmLevel ?? 0, outO3Level ?? 0) : null;
  const inLevel = state.indoor ? pm25Tier(inPm).level : null;

  return {
    outCat: categoryFor(outLevel),
    inCat: categoryFor(inLevel),
    outPmLevel,
    outO3Level,
    outPm,
    inPm,
    inLevel,
  };
}

export function renderCards() {
  const { outCat, inCat, outPm, inPm, outPmLevel, outO3Level, inLevel } = deriveLevels();
  const outRatio = outPm != null ? outPm / WHO_PM25_GUIDELINE : null;
  const inRatio = inPm != null ? inPm / WHO_PM25_GUIDELINE : null;

  const outAqiNum = document.getElementById("outAqiNum");
  if (outAqiNum) {
    outAqiNum.textContent = outRatio != null ? `${outRatio.toFixed(1)}×` : "--";
    outAqiNum.style.color = outCat.color;
  }

  const outAqiCat = document.getElementById("outAqiCat");
  if (outAqiCat) {
    outAqiCat.textContent = state.outdoor ? outCat.label.replace(/ \(.*\)/, "") : "Loading…";
    outAqiCat.style.color = outCat.color;
  }

  const outPmLine = document.getElementById("outPmLine");
  if (outPmLine) {
    const outO3 = state.outdoor?.ozone ?? null;
    outPmLine.textContent = state.outdoor
      ? `PM2.5 ${outPm?.toFixed(1)} · O₃ ${outO3?.toFixed(0)} µg/m³`
      : "PM2.5 -- µg/m³";
  }

  const sourceEl = document.getElementById("outSourceLine");
  if (sourceEl) {
    if (state.outdoor?.pm25Source) {
      sourceEl.textContent =
        state.outdoor.pm25Source.type === "station"
          ? `● Real station: ${state.outdoor.pm25Source.label}`
          : `○ ${state.outdoor.pm25Source.label}`;
      sourceEl.className =
        "source-line" + (state.outdoor.pm25Source.type === "station" ? " is-station" : "");
    } else {
      sourceEl.textContent = "";
    }
  }

  const inAqiNum = document.getElementById("inAqiNum");
  if (inAqiNum) {
    inAqiNum.textContent = inRatio != null ? `${inRatio.toFixed(1)}×` : "--";
    inAqiNum.style.color = inCat.color;
  }

  const inAqiCat = document.getElementById("inAqiCat");
  if (inAqiCat) {
    inAqiCat.textContent = state.indoor ? inCat.label.replace(/ \(.*\)/, "") : "No reading";
    inAqiCat.style.color = inCat.color;
  }

  const indoorMeta = document.getElementById("indoorMeta");
  if (indoorMeta) {
    indoorMeta.textContent = state.indoor
      ? `${state.indoor.source === "bridge" ? "From bridge" : "Logged"} ${relTime(state.indoor.ts)}`
      : "From your sensor's app";
  }

  const strip = document.getElementById("strip");
  if (strip) strip.style.background = `linear-gradient(90deg, ${outCat.color}, ${inCat.color})`;

  const gaugeOutVal = document.getElementById("gaugeOutVal");
  if (gaugeOutVal) gaugeOutVal.textContent = outPm != null ? `${outPm.toFixed(1)} µg/m³` : "--";

  const gaugeInVal = document.getElementById("gaugeInVal");
  if (gaugeInVal) gaugeInVal.textContent = inPm != null ? `${inPm.toFixed(1)} µg/m³` : "--";

  const outFill = document.getElementById("gaugeOutFill");
  if (outFill) {
    outFill.style.width = outPm != null ? `${Math.min(100, (outPm / GAUGE_SCALE_PM25) * 100)}%` : "0%";
    outFill.style.background =
      outPmLevel != null ? categoryFor(outPmLevel).color : "var(--unknown)";
  }

  const inFill = document.getElementById("gaugeInFill");
  if (inFill) {
    inFill.style.width = inPm != null ? `${Math.min(100, (inPm / GAUGE_SCALE_PM25) * 100)}%` : "0%";
    inFill.style.background = inLevel != null ? categoryFor(inLevel).color : "var(--unknown)";
  }

  return { outCat, inCat, outPmLevel, outO3Level, inLevel, outPm, inPm };
}

/** Format local hour as 12h clock label. */
function formatLocalHour(hour) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h} ${ampm} local`;
}

export function renderSubtitle() {
  const subtitle = document.getElementById("subtitle");
  const subtitleText = subtitle?.firstChild;
  if (!(subtitleText instanceof Text)) return;

  const parts = [];
  if (state.locationLabel) parts.push(state.locationLabel);
  if (state.local) parts.push(formatLocalHour(state.local.localHour));
  if (state.outdoor) parts.push(`updated ${relTime(state.outdoor.fetchedAt)}`);

  if (parts.length) {
    subtitleText.textContent = `${parts.join(" · ")} `;
  }
}
