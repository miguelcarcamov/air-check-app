import { STORAGE_KEYS } from "./config.js";
import { getItem, getJson, removeItem, setJson, setItem } from "./storage.js";

/** Central application state — mutated by modules, rendered by ui.js. */
export const state = {
  coords: null,
  locationLabel: null,
  locationOverride: null,
  bridgeUrl: null,
  outdoor: null,
  indoor: null,
};

export async function loadPersistedSettings() {
  state.locationOverride = await getJson(STORAGE_KEYS.locationOverride);
  state.bridgeUrl = await getItem(STORAGE_KEYS.bridgeUrl);
  const indoor = await getJson(STORAGE_KEYS.indoorReading);
  if (indoor) state.indoor = indoor;
  return state;
}

export async function saveLocationOverride(loc) {
  state.locationOverride = loc;
  await setJson(STORAGE_KEYS.locationOverride, loc);
}

export async function clearLocationOverride() {
  state.locationOverride = null;
  await removeItem(STORAGE_KEYS.locationOverride);
}

export async function saveBridgeUrl(url) {
  state.bridgeUrl = url || null;
  if (url) await setItem(STORAGE_KEYS.bridgeUrl, url);
  else await removeItem(STORAGE_KEYS.bridgeUrl);
}

export async function saveIndoorReading(reading) {
  state.indoor = reading;
  await setJson(STORAGE_KEYS.indoorReading, reading);
}

export async function loadLastLocation() {
  return getJson(STORAGE_KEYS.lastLocation);
}

export async function saveLastLocation(coords) {
  await setJson(STORAGE_KEYS.lastLocation, coords);
}
