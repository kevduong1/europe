/**
 * Public entry point for the scroll-driven camera engine.
 *
 * - `lib/journey/cameras.ts` — named viewpoints and the poses built from them
 * - `lib/journey/beats.ts`   — the camera for each timeline beat
 * - `lib/journey/transitions.ts` — blending and travel along a polyline
 * - `lib/journey/scroll.ts`  — turning scroll position into a beat and progress
 */
export { OVERVIEW } from "./journey/cameras";
export { readJourneyView } from "./journey/scroll";
export type { JourneyView } from "./journey/types";
