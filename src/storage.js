/**
 * Persists settings in localStorage. Falls back gracefully when storage is unavailable.
 * (Claude artifact storage is supported when embedded in claude.ai.)
 */

/** @type {{ get: (key: string, shared?: boolean) => Promise<{ key: string, value: string } | null>, set: (key: string, value: string, shared?: boolean) => Promise<{ key: string, value: string }>, delete: (key: string, shared?: boolean) => Promise<{ key: string, deleted: boolean }> }} */
const storage =
  window.storage && typeof window.storage.get === "function"
    ? window.storage
    : {
        async get(key) {
          const raw = localStorage.getItem(key);
          return raw == null ? null : { key, value: raw };
        },
        async set(key, value) {
          localStorage.setItem(key, value);
          return { key, value };
        },
        async delete(key) {
          localStorage.removeItem(key);
          return { key, deleted: true };
        },
      };

/**
 * @param {string} key
 * @returns {Promise<string | null>}
 */
export async function getItem(key) {
  try {
    const res = await storage.get(key, false);
    return res?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
export async function setItem(key, value) {
  try {
    await storage.set(key, value, false);
  } catch {
    /* storage failed silently */
  }
}

/** @param {string} key */
export async function removeItem(key) {
  try {
    await storage.delete(key, false);
  } catch {
    /* storage failed silently */
  }
}

/**
 * @template T
 * @param {string} key
 * @returns {Promise<T | null>}
 */
export async function getJson(key) {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return /** @type {T} */ (JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export async function setJson(key, value) {
  await setItem(key, JSON.stringify(value));
}
