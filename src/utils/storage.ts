/**
 * localStorage can be missing (some embedded browsers) or throw (Safari
 * private mode, quota exceeded, storage blocked by the user). Every call
 * here fails soft: reads return null, writes return false.
 */

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readItem(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_KEYS = {
  apiKey: "resume-tailor:anthropic-api-key",
  resumeText: "resume-tailor:resume-text",
  resumePdf: "resume-tailor:resume-pdf",
  historyEnabled: "resume-tailor:history-enabled",
  history: "resume-tailor:history",
  /** Also read by public/theme.js. */
  theme: "resume-tailor:theme",
} as const;
