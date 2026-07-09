import { categoryFor, exerciseVerdict, purifierVerdict } from "../quality.js";
import { ventilationVerdict } from "../inversion.js";
import { state } from "../state.js";

/**
 * @param {import('../types.js').Tier} outCat
 * @param {number | null} outPmLevel
 * @param {number | null} outO3Level
 * @param {import('../types.js').Tier} inCat
 * @param {number | null} inLevel
 * @param {number | null} inPm
 * @param {number | null} outPm
 */
export function renderVerdicts(outCat, outPmLevel, outO3Level, inCat, inLevel, inPm, outPm) {
  const ev = exerciseVerdict(outPmLevel, outO3Level);
  const evEl = document.getElementById("exerciseVerdict");
  if (evEl) evEl.style.borderLeftColor = outCat.color;
  const exerciseTitle = document.getElementById("exerciseTitle");
  const exerciseText = document.getElementById("exerciseText");
  if (exerciseTitle) exerciseTitle.textContent = ev.title;
  if (exerciseText) exerciseText.textContent = ev.text;

  const pv = purifierVerdict(inPm, outPm);
  const pvEl = document.getElementById("purifierVerdict");
  if (pvEl) {
    pvEl.style.borderLeftColor = inLevel != null ? categoryFor(inLevel).color : "var(--unknown)";
  }
  const purifierTitle = document.getElementById("purifierTitle");
  const purifierText = document.getElementById("purifierText");
  if (purifierTitle) purifierTitle.textContent = pv.title;
  if (purifierText) purifierText.textContent = pv.text;

  const vv = ventilationVerdict(inPm, outPm, state.local?.inversion);
  const ventEl = document.getElementById("ventilationVerdict");
  if (ventEl) {
    const ventColor =
      vv.title === "Good window opening" || vv.title === "Ventilation can help"
        ? "var(--good)"
        : vv.title === "Wait to ventilate" || vv.title === "Keep windows closed" || vv.title === "Hold off on windows"
          ? "var(--bad)"
          : "var(--moderate)";
    ventEl.style.borderLeftColor = ventColor;
  }
  const ventilationTitle = document.getElementById("ventilationTitle");
  const ventilationText = document.getElementById("ventilationText");
  if (ventilationTitle) ventilationTitle.textContent = vv.title;
  if (ventilationText) ventilationText.textContent = vv.text;

  const inversionLine = document.getElementById("inversionLine");
  if (inversionLine) {
    if (state.local?.inversion) {
      const { label, detail } = state.local.inversion;
      inversionLine.textContent = `Inversion: ${label} — ${detail}`;
      inversionLine.style.display = "block";
    } else {
      inversionLine.style.display = "none";
    }
  }
}
