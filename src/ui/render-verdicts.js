import { categoryFor, exerciseVerdict, purifierVerdict } from "../quality.js";

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
}
