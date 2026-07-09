import { GAUGE_SCALE_PM25, WHO_PM25_GUIDELINE } from "./config.js";
import {
  categoryFor,
  exerciseVerdict,
  ozoneLevel,
  pm25Tier,
  purifierVerdict,
} from "./quality.js";
import { state } from "./state.js";

export function relTime(ts) {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function setBanner(msg) {
  const el = document.getElementById("statusBanner");
  if (!msg) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.textContent = msg;
}

export function render() {
  const strip = document.getElementById("strip");
  const outPm = state.outdoor?.pm2_5 ?? null;
  const outO3 = state.outdoor?.ozone ?? null;
  const inPm = state.indoor?.pm2_5 ?? null;

  const outPmLevel = state.outdoor ? pm25Tier(outPm).level : null;
  const outO3Level = state.outdoor ? ozoneLevel(outO3) : null;
  const outLevel = state.outdoor ? Math.max(outPmLevel ?? 0, outO3Level ?? 0) : null;
  const inLevel = state.indoor ? pm25Tier(inPm).level : null;

  const outCat = categoryFor(outLevel);
  const inCat = categoryFor(inLevel);
  const outRatio = outPm != null ? outPm / WHO_PM25_GUIDELINE : null;
  const inRatio = inPm != null ? inPm / WHO_PM25_GUIDELINE : null;

  const outAqiNum = document.getElementById("outAqiNum");
  outAqiNum.textContent = outRatio != null ? `${outRatio.toFixed(1)}×` : "--";
  outAqiNum.style.color = outCat.color;

  const outAqiCat = document.getElementById("outAqiCat");
  outAqiCat.textContent = state.outdoor ? outCat.label.replace(/ \(.*\)/, "") : "Loading…";
  outAqiCat.style.color = outCat.color;

  document.getElementById("outPmLine").textContent = state.outdoor
    ? `PM2.5 ${outPm?.toFixed(1)} · O₃ ${outO3?.toFixed(0)} µg/m³`
    : "PM2.5 -- µg/m³";

  const sourceEl = document.getElementById("outSourceLine");
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

  const inAqiNum = document.getElementById("inAqiNum");
  inAqiNum.textContent = inRatio != null ? `${inRatio.toFixed(1)}×` : "--";
  inAqiNum.style.color = inCat.color;

  const inAqiCat = document.getElementById("inAqiCat");
  inAqiCat.textContent = state.indoor ? inCat.label.replace(/ \(.*\)/, "") : "No reading";
  inAqiCat.style.color = inCat.color;

  document.getElementById("indoorMeta").textContent = state.indoor
    ? `${state.indoor.source === "bridge" ? "From bridge" : "Logged"} ${relTime(state.indoor.ts)}`
    : "From your sensor's app";

  strip.style.background = `linear-gradient(90deg, ${outCat.color}, ${inCat.color})`;

  document.getElementById("gaugeOutVal").textContent =
    outPm != null ? `${outPm.toFixed(1)} µg/m³` : "--";
  document.getElementById("gaugeInVal").textContent =
    inPm != null ? `${inPm.toFixed(1)} µg/m³` : "--";

  const outFill = document.getElementById("gaugeOutFill");
  const inFill = document.getElementById("gaugeInFill");
  outFill.style.width = outPm != null ? `${Math.min(100, (outPm / GAUGE_SCALE_PM25) * 100)}%` : "0%";
  outFill.style.background =
    outPmLevel != null ? categoryFor(outPmLevel).color : "var(--unknown)";
  inFill.style.width = inPm != null ? `${Math.min(100, (inPm / GAUGE_SCALE_PM25) * 100)}%` : "0%";
  inFill.style.background = inLevel != null ? categoryFor(inLevel).color : "var(--unknown)";

  const ev = exerciseVerdict(outPmLevel, outO3Level);
  const evEl = document.getElementById("exerciseVerdict");
  evEl.style.borderLeftColor = outCat.color;
  document.getElementById("exerciseTitle").textContent = ev.title;
  document.getElementById("exerciseText").textContent = ev.text;

  const pv = purifierVerdict(inPm, outPm);
  const pvEl = document.getElementById("purifierVerdict");
  pvEl.style.borderLeftColor = inLevel != null ? categoryFor(inLevel).color : "var(--unknown)";
  document.getElementById("purifierTitle").textContent = pv.title;
  document.getElementById("purifierText").textContent = pv.text;

  const subtitleText = document.getElementById("subtitle").firstChild;
  if (state.locationLabel && state.outdoor) {
    subtitleText.textContent = `${state.locationLabel} · updated ${relTime(state.outdoor.fetchedAt)} `;
  } else if (state.locationLabel) {
    subtitleText.textContent = `${state.locationLabel} `;
  }
}

export function renderLocationSettings(onClearOverride) {
  const el = document.getElementById("locCurrentOverride");
  if (state.locationOverride) {
    el.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = `Locked to ${state.locationOverride.label}. `;
    const clearBtn = document.createElement("button");
    clearBtn.className = "link-btn";
    clearBtn.textContent = "use GPS instead";
    clearBtn.type = "button";
    clearBtn.addEventListener("click", onClearOverride);
    el.appendChild(span);
    el.appendChild(clearBtn);
  } else {
    el.textContent = "Currently using GPS location.";
  }
}

export function syncIndoorInput() {
  if (state.indoor) {
    document.getElementById("indoorInput").value = state.indoor.pm2_5;
  }
}

export function syncBridgeInput() {
  if (state.bridgeUrl) {
    document.getElementById("bridgeInput").value = state.bridgeUrl;
  }
}

export function setBridgeStatus(text) {
  const el = document.getElementById("bridgeStatus");
  if (el) el.textContent = text;
}

export function setRefreshSpinning(spinning) {
  document.getElementById("refreshBtn").classList.toggle("spinning", spinning);
}

export function toggleSettingsPanel() {
  const panel = document.getElementById("settingsPanel");
  const show = panel.style.display === "none";
  panel.style.display = show ? "flex" : "none";
  if (show) document.getElementById("locInput").focus();
}
