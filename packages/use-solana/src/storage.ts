/**
 * Allows storing and persisting user settings.
 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Adapter to use `localStorage` for storage.
 */
export const LOCAL_STORAGE_ADAPTER: StorageAdapter = {
  get(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  set(key, value) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  remove(key) {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};
