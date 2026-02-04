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

// Mock URL.createObjectURL and URL.revokeObjectURL while preserving URL constructor
const OriginalURL = window.URL;
class URLMock extends OriginalURL {
  constructor(url: string | URL, base?: string | URL) {
    super(url, base);
  }
  static createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  static revokeObjectURL = vi.fn();
}

Object.defineProperty(window, 'URL', {
  value: URLMock,
  configurable: true,
  writable: true,
});

// Mock FileReader
class FileReaderMock {
  result: string | ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(blob: Blob) {
    this.result = 'data:image/webp;base64,mockdata';
    setTimeout(() => this.onloadend?.(), 0);
  }

  readAsText(blob: Blob) {
    this.result = 'mock text content';
    setTimeout(() => this.onloadend?.(), 0);
  }

  readAsArrayBuffer(blob: Blob) {
    this.result = new ArrayBuffer(8);
    setTimeout(() => this.onloadend?.(), 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: FileReaderMock,
  configurable: true,
  writable: true,
});

// Mock OffscreenCanvas
class OffscreenCanvasMock {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(contextId: string) {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(this.width * this.height * 4),
        width: this.width,
        height: this.height,
      }),
      putImageData: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    };
  }

  convertToBlob(options?: { type?: string; quality?: number }): Promise<Blob> {
    return Promise.resolve(new Blob(['mock'], { type: options?.type || 'image/webp' }));
  }
}

Object.defineProperty(window, 'OffscreenCanvas', {
  value: OffscreenCanvasMock,
  configurable: true,
  writable: true,
});

// Mock Image
class ImageMock {
  width = 100;
  height = 100;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Auto-trigger load after setting src
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

Object.defineProperty(window, 'Image', {
  value: ImageMock,
  configurable: true,
  writable: true,
});

// Mock fetch for StateCheckResults
global.fetch = vi.fn().mockResolvedValue({
  blob: vi.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/webp' })),
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  ok: true,
  status: 200,
});

// Mock Worker
class WorkerMock {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;

  postMessage(data: unknown, transfer?: Transferable[]) {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: {
            id: (data as any).id,
            type: (data as any).type,
            result: {
              imageData: (data as any).imageData,
              blob: new Blob(['mock'], { type: 'image/webp' }),
              width: (data as any).options?.width || 100,
              height: (data as any).options?.height || 100,
              processingTime: 10,
            },
          },
        }));
      }
    }, 10);
  }

  terminate() {
    // Cleanup
  }
}

// Mock dynamic worker imports
vi.mock('../src/workers/imageProcessor?worker', () => {
  return {
    default: WorkerMock,
  };
});

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  configurable: true,
  writable: true,
});

// Mock ImageData for canvas/image processing tests
class ImageDataMock {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace;

  constructor(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings) {
    this.data = data;
    this.width = width;
    this.height = height ?? Math.floor(data.length / (width * 4));
    this.colorSpace = settings?.colorSpace ?? 'srgb';
  }
}

Object.defineProperty(global, 'ImageData', {
  value: ImageDataMock,
  configurable: true,
  writable: true,
});

Object.defineProperty(window, 'ImageData', {
  value: ImageDataMock,
  configurable: true,
  writable: true,
});
