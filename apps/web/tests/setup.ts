import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Mock window.confirm
vi.stubGlobal(
  'confirm',
  vi.fn(() => true),
);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset mocks between tests
afterEach(() => {
  vi.restoreAllMocks();
  localStorageMock.clear();
});
