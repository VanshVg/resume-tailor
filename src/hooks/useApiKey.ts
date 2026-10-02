import { useCallback, useState } from "react";
import { readItem, removeItem, STORAGE_KEYS, writeItem } from "../utils/storage";

export interface UseApiKey {
  readonly apiKey: string;
  readonly setApiKey: (value: string) => void;
  /** Whether the key is persisted in localStorage (opt-in). */
  readonly remember: boolean;
  readonly setRemember: (value: boolean) => void;
  /** True if the user asked to remember the key but storage refused. */
  readonly storageFailed: boolean;
  readonly clear: () => void;
  /** Sets the key and the remember choice together (first-run setup). */
  readonly connect: (value: string, remember: boolean) => void;
}

/**
 * Holds the API key in memory by default. Only when the user opts in is it
 * written to localStorage, and turning the option off deletes it.
 */
export function useApiKey(): UseApiKey {
  const [initial] = useState(() => readItem(STORAGE_KEYS.apiKey));
  const [apiKey, setKey] = useState(initial ?? "");
  const [remember, setRememberState] = useState(initial !== null);
  const [storageFailed, setStorageFailed] = useState(false);

  const persist = useCallback((value: string) => {
    const saved = value ? writeItem(STORAGE_KEYS.apiKey, value) : removeItem(STORAGE_KEYS.apiKey);
    setStorageFailed(!saved && value !== "");
  }, []);

  const setApiKey = useCallback(
    (value: string) => {
      setKey(value);
      if (remember) persist(value);
    },
    [remember, persist],
  );

  const setRemember = useCallback(
    (value: boolean) => {
      setRememberState(value);
      if (value) {
        persist(apiKey);
      } else {
        removeItem(STORAGE_KEYS.apiKey);
        setStorageFailed(false);
      }
    },
    [apiKey, persist],
  );

  const clear = useCallback(() => {
    setKey("");
    removeItem(STORAGE_KEYS.apiKey);
    setStorageFailed(false);
  }, []);

  const connect = useCallback(
    (value: string, rememberValue: boolean) => {
      setKey(value);
      setRememberState(rememberValue);
      if (rememberValue) persist(value);
      else removeItem(STORAGE_KEYS.apiKey);
    },
    [persist],
  );

  return { apiKey, setApiKey, remember, setRemember, storageFailed, clear, connect };
}
