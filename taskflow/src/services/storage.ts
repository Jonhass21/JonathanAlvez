// Thin localStorage wrapper. This is the only file that touches
// window.localStorage directly — swapping to Supabase later means replacing
// taskService/clientService internals, not every call site.

const KEYS = {
  tasks: "taskflow.tasks.v1",
  clients: "taskflow.clients.v1",
  settings: "taskflow.settings.v1",
  inbox: "taskflow.inbox.v1",
  seeded: "taskflow.seeded.v1",
} as const;

type StorageListener = (error: Error) => void;

let onWriteError: StorageListener | null = null;

/**
 * A failed write means the change the user just made is gone on reload, which
 * is worth surfacing rather than swallowing (quota exceeded, Safari private
 * mode). The app wires this to a toast in AppDataContext.
 */
export function setStorageErrorHandler(listener: StorageListener | null): void {
  onWriteError = listener;
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    onWriteError?.(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

export function clearAll(): void {
  for (const key of Object.values(KEYS)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing useful to do if storage is unavailable */
    }
  }
}

export { KEYS };
