/** WHO Global Air Quality Guidelines (2021) and related thresholds. */

/** @type {import('./types.js').Tier[]} */
export const PM25_TIERS = [
  { max: 15, level: 0, key: "good", label: "Good (meets WHO guideline)", color: "var(--good)" },
  { max: 25, level: 1, key: "moderate", label: "Moderate (WHO interim target 4)", color: "var(--moderate)" },
  { max: 37.5, level: 2, key: "elevated", label: "Elevated (WHO interim target 3)", color: "var(--caution)" },
  { max: 50, level: 3, key: "high", label: "High (WHO interim target 2)", color: "var(--bad)" },
  { max: 75, level: 4, key: "veryhigh", label: "Very high (WHO interim target 1)", color: "var(--severe)" },
  { max: Infinity, level: 5, key: "extreme", label: "Extreme (exceeds all WHO targets)", color: "var(--hazard)" },
];

/** @type {number} µg/m³, 24-hour mean */
export const WHO_PM25_GUIDELINE = 15;

/** @type {number} µg/m³, 8-hour mean */
export const WHO_OZONE_GUIDELINE = 100;

/** Shared 0–75 µg/m³ span for gauge bars. */
export const GAUGE_SCALE_PM25 = 75;

export const SINCA_URL = "https://sinca.mma.gob.cl/index.php/json/listadomapa2k19";
export const SINCA_MAX_DISTANCE_KM = 30;

export const OPEN_METEO_AIR_QUALITY = "https://air-quality-api.open-meteo.com/v1/air-quality";
export const OPEN_METEO_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
export const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export const STORAGE_KEYS = {
  locationOverride: "location-override",
  bridgeUrl: "bridge-url",
  indoorReading: "indoor-reading",
  lastLocation: "last-location",
};
