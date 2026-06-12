import '@testing-library/jest-dom';

global.WebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  send: vi.fn(),
  readyState: 0,
}));

// Fix for "TypeError: The 'event' argument must be an instance of Event."
// This ensures that the global Event and MessageEvent classes match 
// what JSDOM/undici expect.
Object.defineProperty(global, 'Event', { value: window.Event, configurable: true });
Object.defineProperty(global, 'MessageEvent', { value: window.MessageEvent, configurable: true });