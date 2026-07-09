/**
 * Shared JSDoc types for editor hints and documentation.
 * @module types
 */

/**
 * @typedef {Object} Coords
 * @property {number} lat
 * @property {number} lon
 */

/**
 * @typedef {Object} LocationOverride
 * @property {number} lat
 * @property {number} lon
 * @property {string} label
 */

/**
 * @typedef {'station' | 'model'} Pm25SourceType
 */

/**
 * @typedef {Object} Pm25Source
 * @property {Pm25SourceType} type
 * @property {string} label
 */

/**
 * @typedef {Object} OutdoorReading
 * @property {number | null} pm2_5
 * @property {number | null} pm10
 * @property {number | null} ozone
 * @property {Pm25Source} pm25Source
 * @property {import('./types.js').Pm25Trend | null} pm25Trend Modeled PM2.5 trend (last ~3 h)
 * @property {number} fetchedAt Unix ms timestamp
 */

/**
 * @typedef {'rising' | 'stable' | 'falling'} Pm25Trend
 */

/**
 * @typedef {'active' | 'breaking' | 'unlikely' | 'unknown'} InversionPhase
 */

/**
 * @typedef {'night' | 'morning' | 'midday' | 'evening'} DiurnalPeriod
 */

/**
 * @typedef {Object} InversionAssessment
 * @property {InversionPhase} phase
 * @property {DiurnalPeriod} period Local time-of-day bucket
 * @property {number} score Heuristic score (higher = stronger inversion signal)
 * @property {number | null} gradientC temperature_80m − temperature_2m in °C
 * @property {number | null} boundaryLayerHeightM
 * @property {number | null} windSpeedKmh
 * @property {Pm25Trend | null} pm25Trend
 * @property {string} label Short UI label
 * @property {string} detail One-line explanation
 */

/**
 * @typedef {Object} LocalContext
 * @property {string} timezone IANA timezone from Open-Meteo
 * @property {number} localHour 0–23 at the location
 * @property {number} month 1–12 at the location
 * @property {number | null} temp2m °C at 2 m
 * @property {number | null} temp80m °C at 80 m
 * @property {number | null} temp120m °C at 120 m
 * @property {number | null} temp180m °C at 180 m
 * @property {number | null} boundaryLayerHeightM Planetary boundary layer depth
 * @property {number | null} windSpeedKmh Wind at 10 m
 * @property {0 | 1 | null} isDay 1 = daylight, 0 = dusk/night
 * @property {Pm25Trend | null} pm25Trend Recent modeled outdoor PM2.5 direction
 * @property {InversionAssessment} inversion
 * @property {number} fetchedAt Unix ms timestamp
 */

/**
 * @typedef {'manual' | 'bridge'} IndoorSource
 */

/**
 * @typedef {Object} IndoorReading
 * @property {number} pm2_5 µg/m³
 * @property {number} ts Unix ms timestamp
 * @property {IndoorSource} [source]
 */

/**
 * @typedef {Object} AppState
 * @property {Coords | null} coords
 * @property {string | null} locationLabel
 * @property {LocationOverride | null} locationOverride
 * @property {string | null} bridgeUrl
 * @property {OutdoorReading | null} outdoor
 * @property {IndoorReading | null} indoor
 * @property {LocalContext | null} local Weather & inversion context at the location
 */

/**
 * @typedef {Object} Tier
 * @property {number} max Upper bound µg/m³ (inclusive)
 * @property {number | null} level Ordinal 0–5, or null when unknown
 * @property {string} key
 * @property {string} label
 * @property {string} color CSS color or var()
 */

/**
 * @typedef {Object} Verdict
 * @property {string} title Short headline
 * @property {string} text Longer recommendation
 */

/**
 * @typedef {Object} GeocodeResult
 * @property {string} name
 * @property {string} [admin1]
 * @property {string} [country]
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {Object} OpenMeteoCurrentSlice
 * @property {number | null} pm2_5
 * @property {number | null} pm10
 * @property {number | null} us_aqi
 * @property {number | null} ozone
 */

export {};
