import { EventTarget, Event } from 'event-target-shim';

if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = EventTarget;
}

if (typeof global.Event === 'undefined') {
  global.Event = Event;
}

// 2. Fix customElements (Web Components)
// We provide a "stub" that does nothing but prevents ReferenceErrors
if (typeof global.customElements === 'undefined') {
  global.customElements = {
    define: () => {},
    get: () => {},
    whenDefined: () => Promise.resolve(),
    upgrade: () => {},
  };
}

// 3. Fix basic DOM expectations
// Many web libraries check for 'window' or 'document'
if (typeof global.window === 'undefined') {
    global.window = global;
}

if (typeof global.document === 'undefined') {
  global.document = {
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
    }),
    getElementsByTagName: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// 4. Fix HTMLElement (often used for inheritance in Web Components)
if (typeof global.HTMLElement === 'undefined') {
  global.HTMLElement = class HTMLElement {};
}