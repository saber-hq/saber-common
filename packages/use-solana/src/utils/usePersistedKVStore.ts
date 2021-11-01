import { useCallback, useEffect, useState } from "react";

import type { StorageAdapter } from "../storage";

export function usePersistedKVStore<T>(
  key: string,
  defaultState: T,
  storageAdapter: StorageAdapter
): [T, (newState: T) => Promise<void>] {
  const [state, setState] = useState<T>(defaultState);

  useEffect(() => {
    void (async () => {
      const storedState = await storageAdapter.get(key);
      if (storedState) {
        console.debug(`Restoring user settings for ${key}`);
        return JSON.parse(storedState) as T;
      }
    })();
  }, [key, storageAdapter]);

  const setLocalStorageState = useCallback(
    async (newState: T | null) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState ?? defaultState);
      if (newState === null) {
        await storageAdapter.remove(key);
      } else {
        await storageAdapter.set(key, JSON.stringify(newState));
      }
    },
    [state, defaultState, storageAdapter, key]
  );

  return [state, setLocalStorageState];
}
