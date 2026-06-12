import '@testing-library/jest-dom';

// Fix for "TypeError: The 'event' argument must be an instance of Event."
// This ensures that the global Event and MessageEvent classes match 
// what JSDOM/undici expect.
Object.defineProperty(global, 'Event', { value: window.Event, configurable: true });
Object.defineProperty(global, 'MessageEvent', { value: window.MessageEvent, configurable: true });

// If the error persists, you might also need to sync the WebSocket itself
Object.defineProperty(global, 'WebSocket', {
  value: window.WebSocket,
  configurable: true,
});