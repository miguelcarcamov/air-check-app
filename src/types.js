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
