/**
 * Low-level DOM helpers shared across render modules.
 */

/**
 * @param {number | undefined} ts Unix ms
 * @returns {string}
 */
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

/** @param {string | null} msg */
export function setBanner(msg) {
  const el = document.getElementById("statusBanner");
  if (!el) return;
  if (!msg) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.textContent = msg;
}

/** @param {string} text */
export function setBridgeStatus(text) {
  const el = document.getElementById("bridgeStatus");
  if (el) el.textContent = text;
}

/** @param {boolean} spinning */
export function setRefreshSpinning(spinning) {
  document.getElementById("refreshBtn")?.classList.toggle("spinning", spinning);
}

export function toggleSettingsPanel() {
  const panel = document.getElementById("settingsPanel");
  if (!panel) return;
  const show = panel.style.display === "none";
  panel.style.display = show ? "flex" : "none";
  if (show) document.getElementById("locInput")?.focus();
}

/** @param {number} pm25 */
export function syncIndoorInput(pm25) {
  const input = document.getElementById("indoorInput");
  if (input instanceof HTMLInputElement) input.value = String(pm25);
}

/** @param {string} url */
export function syncBridgeInput(url) {
  const input = document.getElementById("bridgeInput");
  if (input instanceof HTMLInputElement) input.value = url;
}
