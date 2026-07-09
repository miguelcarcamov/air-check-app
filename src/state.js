import { STORAGE_KEYS } from "./config.js";
import { getItem, getJson, removeItem, setJson, setItem } from "./storage.js";

/** @type {import('./types.js').AppState} */
export const state = {
  coords: null,
  locationLabel: null,
  locationOverride: null,
  bridgeUrl: null,
  outdoor: null,
  indoor: null,
};

/** @returns {Promise<import('./types.js').AppState>} */
export async function loadPersistedSettings() {
  state.locationOverride = await getJson(STORAGE_KEYS.locationOverride);
  state.bridgeUrl = await getItem(STORAGE_KEYS.bridgeUrl);
  const indoor = await getJson(STORAGE_KEYS.indoorReading);
  if (indoor) state.indoor = indoor;
  return state;
}

/** @param {import('./types.js').LocationOverride} loc */
export async function saveLocationOverride(loc) {
  state.locationOverride = loc;
  await setJson(STORAGE_KEYS.locationOverride, loc);
}

export async function clearLocationOverride() {
  state.locationOverride = null;
  await removeItem(STORAGE_KEYS.locationOverride);
}

/** @param {string} url */
export async function saveBridgeUrl(url) {
  state.bridgeUrl = url || null;
  if (url) await setItem(STORAGE_KEYS.bridgeUrl, url);
  else await removeItem(STORAGE_KEYS.bridgeUrl);
}

/** @param {import('./types.js').IndoorReading} reading */
export async function saveIndoorReading(reading) {
  state.indoor = reading;
  await setJson(STORAGE_KEYS.indoorReading, reading);
}

/** @returns {Promise<import('./types.js').Coords | null>} */
export async function loadLastLocation() {
  return getJson(STORAGE_KEYS.lastLocation);
}

/** @param {import('./types.js').Coords} coords */
export async function saveLastLocation(coords) {
  await setJson(STORAGE_KEYS.lastLocation, coords);
}
