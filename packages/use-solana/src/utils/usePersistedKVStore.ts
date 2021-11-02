import { useCallback, useEffect, useState } from "react";

import type { StorageAdapter } from "../storage";

export function usePersistedKVStore<T>(
  key: string,
  defaultState: T,
  storageAdapter: StorageAdapter
): [T, (newState: T | null) => Promise<void>] {
  const [state, setState] = useState<T | null>(null);

  useEffect(() => {
    void (async () => {
      const storedState = await storageAdapter.get(key);
      if (storedState) {
        console.debug(`Restoring user settings for ${key}`);
        setState(JSON.parse(storedState) as T);
      }
    })();
  }, [key, storageAdapter]);

  const setLocalStorageState = useCallback(
    async (newState: T | null) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      if (newState === null) {
        await storageAdapter.remove(key);
        setState(defaultState);
      } else {
        await storageAdapter.set(key, JSON.stringify(newState));
        setState(newState);
      }
    },
    [state, defaultState, storageAdapter, key]
  );

  return [state ?? defaultState, setLocalStorageState];
}
