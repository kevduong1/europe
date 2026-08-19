/**
 * Single home for scroll pacing: how long each beat lasts under the reader's
 * thumb, and where along the viewport the various "now" anchors sit. Tune
 * numbers here — nothing else should hardcode them.
 */

/** vh height used only while presenting invalid/incomplete authoring data. */
export const DEFAULT_BEAT_SPACE = 56;

/** Hero keeps the overview camera until its base clears this share of the screen. */
export const FREEZE = 0.52;

/** Where on screen "now" is read from for the map camera — a bit above centre. */
export const ANCHOR = 0.3;

/** How late in a day's last beat the next day's camera starts bleeding in. */
export const HANDOFF = 0.72;

/**
 * Day-chrome anchor line, as a share of viewport height above the header
 * (capped in px so it doesn't run away on very tall viewports). Mirrors
 * ANCHOR's role but in trip-shell's px-based math, since header height varies.
 */
export const DAY_ANCHOR_VH = 0.3;
export const DAY_ANCHOR_MAX_PX = 240;

/**
 * Where the outgoing day's chrome starts fading, as a share of viewport
 * height above the header. Must stay far enough above DAY_ANCHOR that the
 * fade finishes before the incoming day's head reaches the sticky pin line
 * (which happens at headerHeight, i.e. DAY_ANCHOR's headerHeight + 0 point) —
 * see trip-shell.tsx for the no-overlap argument.
 */
export const DAY_FADE_START_VH = 0.5;
export const DAY_FADE_START_MAX_PX = 400;
