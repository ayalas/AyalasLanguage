// Enable React 18 `act(...)` support in the test environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import '@testing-library/jest-dom';
import { vi } from 'vitest';

const MockWebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  send: vi.fn(),
  readyState: 0,
}));

// Attach the static constants required by the WebSocket interface
Object.assign(MockWebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});

// Assign to global and cast to avoid the type error
globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;