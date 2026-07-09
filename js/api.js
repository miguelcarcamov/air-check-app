import {
  OPEN_METEO_AIR_QUALITY,
  OPEN_METEO_GEOCODING,
  REVERSE_GEOCODE_URL,
  SINCA_MAX_DISTANCE_KM,
  SINCA_URL,
} from "./config.js";
import { extractCurrent } from "./quality.js";

export function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("no geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

function stripDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function geocodeQuery(term) {
  const url = `${OPEN_METEO_GEOCODING}?name=${encodeURIComponent(term)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoding request failed (HTTP ${res.status})`);
  const data = await res.json();
  return data.results || [];
}

export async function searchLocations(query) {
  const term = query.split(",")[0].trim();
  let results = await geocodeQuery(term);
  const stripped = stripDiacritics(term);
  if (results.length === 0 && stripped !== term) {
    results = await geocodeQuery(stripped);
  }
  return results;
}

export async function loadLocationLabel(coords) {
  try {
    const res = await fetch(
      `${REVERSE_GEOCODE_URL}?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`,
    );
    const data = await res.json();
    const place = data.locality || data.city || data.principalSubdivision;
    return place ? `${place}` : `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
  } catch {
    return `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
  }
}

async function findNearestSincaPM25(coords) {
  const res = await fetchWithTimeout(SINCA_URL, 12000);
  if (!res.ok) throw new Error("SINCA request failed");
  const stations = await res.json();
  let best = null;

  for (const st of stations) {
    if (!st.realtime || st.latitud == null || st.longitud == null) continue;
    const pm25 = st.realtime.find((r) => r.code === "PM25");
    if (!pm25?.tableRow) continue;
    const tr = pm25.tableRow;
    if (tr.value == null || tr.color === "#b4b4b4") continue;

    const distanceKm = haversineKm(coords.lat, coords.lon, st.latitud, st.longitud);
    if (!best || distanceKm < best.distanceKm) {
      best = {
        value: tr.value,
        distanceKm,
        name: st.nombre,
        comuna: st.comuna,
        datetime: tr.datetime,
      };
    }
  }

  return best && best.distanceKm <= SINCA_MAX_DISTANCE_KM ? best : null;
}

export async function loadAirQuality(coords) {
  const url =
    `${OPEN_METEO_AIR_QUALITY}?latitude=${coords.lat}&longitude=${coords.lon}` +
    "&current=pm2_5,pm10,us_aqi,ozone&hourly=pm2_5,pm10,us_aqi,ozone&timezone=auto&forecast_days=1";

  const res = await fetch(url);
  if (!res.ok) throw new Error("air quality fetch failed");
  const data = await res.json();
  const cur = extractCurrent(data);

  let pm25Value = cur.pm2_5;
  let pm25Source = { type: "model", label: "Modeled estimate (CAMS) — no nearby station" };

  try {
    const station = await findNearestSincaPM25(coords);
    if (station) {
      pm25Value = station.value;
      pm25Source = {
        type: "station",
        label: `${station.name} station (SINCA) · ${station.distanceKm.toFixed(1)} km away`,
      };
    }
  } catch {
    /* SINCA unreachable — keep modeled estimate */
  }

  return {
    pm2_5: pm25Value,
    pm10: cur.pm10,
    ozone: cur.ozone,
    pm25Source,
    fetchedAt: Date.now(),
  };
}

export async function fetchBridgeReading(bridgeUrl) {
  const res = await fetchWithTimeout(bridgeUrl, 4000);
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  const val = data.pm2_5 ?? data.pm25 ?? data.value;
  if (val == null || Number.isNaN(val)) throw new Error("no pm2_5 field");
  return { pm2_5: parseFloat(val), ts: Date.now(), source: "bridge" };
}
