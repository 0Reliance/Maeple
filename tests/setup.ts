import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Also define on global for node-like access if needed
if (typeof global !== 'undefined') {
  try {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not define localStorage on global:', e.message);
  }
}

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  }),
  deleteDatabase: vi.fn().mockReturnValue({
    onerror: null,
    onsuccess: null,
  }),
  databases: vi.fn().mockResolvedValue([]),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Mock MediaRecorder
class MediaRecorderMock {
  start = vi.fn();
  stop = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
  state = 'inactive';
  ondataavailable = null;
  onerror = null;
  onstart = null;
  onstop = null;
  static isTypeSupported = vi.fn().mockReturnValue(true);
}

Object.defineProperty(window, 'MediaRecorder', {
  value: MediaRecorderMock,
  configurable: true,
  writable: true
});

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn() }
      ])
    }),
  },
  configurable: true,
  writable: true
});

// Mock crypto for encryption tests
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      generateKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
    },
  },
});

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});
