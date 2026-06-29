/**
 * Global polyfills that must run BEFORE any other module evaluates.
 *
 * Privy's SDK (@privy-io/expo) calls `Buffer.isEncoding(...)` at module-load
 * time. React Native has no global `Buffer`, so without this the app crashes
 * with "Cannot read property 'isEncoding' of undefined" the moment a Privy
 * module is imported.
 *
 * This file is imported as the very first statement in the app entry. Because
 * ES module imports are evaluated in source order, importing this side-effect
 * module first guarantees the `Buffer` global exists before Privy loads.
 */

import { Buffer as NodeBuffer } from 'buffer';

const g = globalThis as { Buffer?: typeof NodeBuffer };
if (typeof g.Buffer === 'undefined') {
  g.Buffer = NodeBuffer;
}
