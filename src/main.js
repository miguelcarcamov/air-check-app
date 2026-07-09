import "./css/main.css";

import {
  fetchBridgeReading,
  getPosition,
  loadAirQuality,
  loadLocationLabel,
  searchLocations,
} from "./api.js";
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
  clearLocationResults,
  relTime,
  render,
  renderLocationResults,
  renderLocationSettings,
  setBanner,
  setBridgeStatus,
  setRefreshSpinning,
  showLocationSearchMessage,
  syncBridgeInput,
  syncIndoorInput,
  toggleSettingsPanel,
} from "./ui/index.js";

async function tryBridge() {
  if (!state.bridgeUrl) return false;
  try {
    const reading = await fetchBridgeReading(state.bridgeUrl);
    await saveIndoorReading(reading);
    syncIndoorInput(reading.pm2_5);
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
    const message = e instanceof Error ? e.message : String(e);
    setBanner(
      `Could not reach the air quality service (${message}). Try refreshing, or check your network/browser extensions.`,
    );
  } finally {
    setRefreshSpinning(false);
  }
}

async function handleSaveIndoor() {
  const input = document.getElementById("indoorInput");
  if (!(input instanceof HTMLInputElement)) return;
  const val = parseFloat(input.value);
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
  const input = document.getElementById("locInput");
  if (!(input instanceof HTMLInputElement)) return;
  const query = input.value.trim();
  if (!query) {
    clearLocationResults();
    return;
  }

  showLocationSearchMessage("Searching…");
  try {
    const results = await searchLocations(query);
    if (!results.length) {
      showLocationSearchMessage(
        'No matches. Some smaller comunas aren\'t in this database at all — try the parent city (e.g. "Santiago") or enter coordinates directly below.',
      );
      return;
    }

    renderLocationResults(results, async (loc) => {
      await saveLocationOverride(loc);
      clearLocationResults();
      input.value = "";
      renderLocationSettings(handleClearLocationOverride);
      await refreshAll();
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    showLocationSearchMessage(
      `Search failed (${message}). You can also enter coordinates directly below.`,
    );
  }
}

function bindEvents() {
  document.getElementById("refreshBtn")?.addEventListener("click", refreshAll);
  document.getElementById("saveIndoorBtn")?.addEventListener("click", handleSaveIndoor);
  document.getElementById("indoorInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSaveIndoor();
  });
  document.getElementById("settingsBtn")?.addEventListener("click", toggleSettingsPanel);
  document.getElementById("changeLocBtn")?.addEventListener("click", toggleSettingsPanel);
  document.getElementById("locSearchBtn")?.addEventListener("click", runLocationSearch);
  document.getElementById("locInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runLocationSearch();
  });

  document.getElementById("coordSaveBtn")?.addEventListener("click", async () => {
    const latInput = document.getElementById("latInput");
    const lonInput = document.getElementById("lonInput");
    if (!(latInput instanceof HTMLInputElement) || !(lonInput instanceof HTMLInputElement)) return;
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    await saveLocationOverride({ lat, lon, label: `${lat.toFixed(2)}, ${lon.toFixed(2)}` });
    renderLocationSettings(handleClearLocationOverride);
    await refreshAll();
  });

  document.getElementById("bridgeSaveBtn")?.addEventListener("click", async () => {
    const bridgeInput = document.getElementById("bridgeInput");
    if (!(bridgeInput instanceof HTMLInputElement)) return;
    const url = bridgeInput.value.trim();
    await saveBridgeUrl(url);
    setBridgeStatus(url ? "Saved — checking…" : "Bridge removed.");
    if (url) await tryBridge();
    render();
  });
}

async function init() {
  await loadPersistedSettings();
  if (state.bridgeUrl) syncBridgeInput(state.bridgeUrl);
  if (state.indoor) syncIndoorInput(state.indoor.pm2_5);
  renderLocationSettings(handleClearLocationOverride);
  render();
  bindEvents();
  await refreshAll();
}

init();
