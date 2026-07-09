import { fetchBridgeReading, getPosition, loadAirQuality, loadLocationLabel, searchLocations } from "./api.js";
import {
  clearLocationOverride,
  loadLastLocation,
  loadPersistedSettings,
  saveBridgeUrl,
  saveIndoorReading,
  saveLastLocation,
  saveLocationOverride,
  state,
} from "./state.js";
import {
  relTime,
  render,
  renderLocationSettings,
  setBanner,
  setBridgeStatus,
  setRefreshSpinning,
  syncBridgeInput,
  syncIndoorInput,
  toggleSettingsPanel,
} from "./ui.js";

async function tryBridge() {
  if (!state.bridgeUrl) return false;
  try {
    const reading = await fetchBridgeReading(state.bridgeUrl);
    await saveIndoorReading(reading);
    syncIndoorInput();
    setBridgeStatus(`Connected — last read ${relTime(reading.ts)}`);
    return true;
  } catch {
    setBridgeStatus("Could not reach the bridge — using the manual reading below instead.");
    return false;
  }
}

export async function refreshAll() {
  setRefreshSpinning(true);
  setBanner(null);

  try {
    if (state.locationOverride) {
      const { lat, lon, label } = state.locationOverride;
      state.coords = { lat, lon };
      state.locationLabel = label;
      state.outdoor = await loadAirQuality({ lat, lon });
      await tryBridge();
      render();
      return;
    }

    let coords;
    try {
      coords = await getPosition();
      await saveLastLocation(coords);
    } catch {
      const cached = await loadLastLocation();
      if (cached) {
        coords = cached;
        setBanner(
          "Using your last known location — allow location access for live updates, or set one manually via the settings icon.",
        );
      } else {
        setBanner(
          "Location access is off and no previous location is saved. Allow location access, or set one manually via the settings icon.",
        );
        return;
      }
    }

    state.coords = coords;
    const [outdoor, label] = await Promise.all([
      loadAirQuality(coords),
      loadLocationLabel(coords),
    ]);
    state.outdoor = outdoor;
    state.locationLabel = label;
    await tryBridge();
    render();
  } catch (e) {
    setBanner(
      `Could not reach the air quality service (${e.message || e}). Try refreshing, or check your network/browser extensions.`,
    );
  } finally {
    setRefreshSpinning(false);
  }
}

async function handleSaveIndoor() {
  const val = parseFloat(document.getElementById("indoorInput").value);
  if (Number.isNaN(val) || val < 0) return;
  await saveIndoorReading({ pm2_5: val, ts: Date.now(), source: "manual" });
  render();
}

async function handleClearLocationOverride() {
  await clearLocationOverride();
  renderLocationSettings(handleClearLocationOverride);
  await refreshAll();
}

async function runLocationSearch() {
  const query = document.getElementById("locInput").value.trim();
  const resultsEl = document.getElementById("locResults");
  if (!query) {
    resultsEl.innerHTML = "";
    return;
  }

  resultsEl.innerHTML = '<div class="settings-current">Searching…</div>';
  try {
    const results = await searchLocations(query);
    resultsEl.innerHTML = "";
    if (!results.length) {
      resultsEl.innerHTML =
        '<div class="settings-current">No matches. Some smaller comunas aren\'t in this database at all — try the parent city (e.g. "Santiago") or enter coordinates directly below.</div>';
      return;
    }

    for (const r of results) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "loc-result-btn";
      const parts = [r.name, r.admin1, r.country].filter(Boolean);
      btn.textContent = parts.join(", ");
      btn.addEventListener("click", async () => {
        await saveLocationOverride({ lat: r.latitude, lon: r.longitude, label: parts.join(", ") });
        resultsEl.innerHTML = "";
        document.getElementById("locInput").value = "";
        renderLocationSettings(handleClearLocationOverride);
        await refreshAll();
      });
      resultsEl.appendChild(btn);
    }
  } catch (e) {
    resultsEl.innerHTML = `<div class="settings-current">Search failed (${e.message || e}). You can also enter coordinates directly below.</div>`;
  }
}

function bindEvents() {
  document.getElementById("refreshBtn").addEventListener("click", refreshAll);
  document.getElementById("saveIndoorBtn").addEventListener("click", handleSaveIndoor);
  document.getElementById("indoorInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSaveIndoor();
  });
  document.getElementById("settingsBtn").addEventListener("click", toggleSettingsPanel);
  document.getElementById("changeLocBtn").addEventListener("click", toggleSettingsPanel);
  document.getElementById("locSearchBtn").addEventListener("click", runLocationSearch);
  document.getElementById("locInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runLocationSearch();
  });

  document.getElementById("coordSaveBtn").addEventListener("click", async () => {
    const lat = parseFloat(document.getElementById("latInput").value);
    const lon = parseFloat(document.getElementById("lonInput").value);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    await saveLocationOverride({ lat, lon, label: `${lat.toFixed(2)}, ${lon.toFixed(2)}` });
    renderLocationSettings(handleClearLocationOverride);
    await refreshAll();
  });

  document.getElementById("bridgeSaveBtn").addEventListener("click", async () => {
    const url = document.getElementById("bridgeInput").value.trim();
    await saveBridgeUrl(url);
    setBridgeStatus(url ? "Saved — checking…" : "Bridge removed.");
    if (url) await tryBridge();
    render();
  });
}

async function init() {
  await loadPersistedSettings();
  syncBridgeInput();
  syncIndoorInput();
  renderLocationSettings(handleClearLocationOverride);
  render();
  bindEvents();
  await refreshAll();
}

init();
