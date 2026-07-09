import { state } from "../state.js";
import { cloneTemplate, fillSettingsMessage } from "./templates.js";

/**
 * @param {() => void} onClearOverride
 */
export function renderLocationSettings(onClearOverride) {
  const el = document.getElementById("locCurrentOverride");
  if (!el) return;

  el.replaceChildren();

  if (state.locationOverride) {
    const fragment = cloneTemplate("tpl-loc-override");
    const label = fragment.querySelector(".loc-override-label");
    const clearBtn = fragment.querySelector(".loc-override-clear");
    if (label) label.textContent = `Locked to ${state.locationOverride.label}. `;
    if (clearBtn instanceof HTMLButtonElement) {
      clearBtn.addEventListener("click", onClearOverride);
    }
    el.appendChild(fragment);
  } else {
    el.textContent = "Currently using GPS location.";
  }
}

/** @param {string} message */
export function showLocationSearchMessage(message) {
  const resultsEl = document.getElementById("locResults");
  if (!resultsEl) return;
  resultsEl.replaceChildren(fillSettingsMessage("tpl-settings-message", message));
}

export function clearLocationResults() {
  document.getElementById("locResults")?.replaceChildren();
}

/**
 * @param {import('../types.js').GeocodeResult[]} results
 * @param {(loc: import('../types.js').LocationOverride) => void | Promise<void>} onPick
 */
export function renderLocationResults(results, onPick) {
  const resultsEl = document.getElementById("locResults");
  if (!resultsEl) return;

  resultsEl.replaceChildren();

  for (const r of results) {
    const parts = [r.name, r.admin1, r.country].filter(Boolean);
    const label = parts.join(", ");
    const fragment = cloneTemplate("tpl-loc-result");
    const btn = fragment.querySelector(".loc-result-btn");
    if (btn instanceof HTMLButtonElement) {
      btn.textContent = label;
      btn.addEventListener("click", () => {
        onPick({ lat: r.latitude, lon: r.longitude, label });
      });
    }
    resultsEl.appendChild(fragment);
  }
}
