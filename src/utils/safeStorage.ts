const memoryLocalStorage: Record<string, string> = {};
const memorySessionStorage: Record<string, string> = {};

function createMemoryStorage(store: Record<string, string>) {
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
    get length(): number {
      return Object.keys(store).length;
    },
  };
}

// Global polyfill for window.localStorage & window.sessionStorage if accessing them throws SecurityError
if (typeof window !== 'undefined') {
  try {
    const _ = window.localStorage;
  } catch (e) {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMemoryStorage(memoryLocalStorage),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch (_) {}
  }

  try {
    const _ = window.sessionStorage;
  } catch (e) {
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: createMemoryStorage(memorySessionStorage),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch (_) {}
  }
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryLocalStorage[key] ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryLocalStorage[key] = String(value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      delete memoryLocalStorage[key];
    }
  },
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (e) {
      Object.keys(memoryLocalStorage).forEach((k) => delete memoryLocalStorage[k]);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return memorySessionStorage[key] ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      memorySessionStorage[key] = String(value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      delete memorySessionStorage[key];
    }
  },
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.clear();
    } catch (e) {
      Object.keys(memorySessionStorage).forEach((k) => delete memorySessionStorage[k]);
    }
  },
};
