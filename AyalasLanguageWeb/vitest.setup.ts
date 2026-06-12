import '@testing-library/jest-dom';

//moce websocket for vitest
global.WebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  send: vi.fn(),
  readyState: 0,
}));