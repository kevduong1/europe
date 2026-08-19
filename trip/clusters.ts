import { stopClusters } from "./geometry/legs";

/** Authored marker-group vocabulary used by this trip's camera scenes. */
export const CLUSTERS = {
  none: [] as readonly string[],
  munich: ["munich"] as readonly string[],
  innsbruck: ["innsbruck"] as readonly string[],
  dolomites: ["dolomites"] as readonly string[],
  venice: ["venice"] as readonly string[],
  pastInnsbruck: ["munich", "innsbruck"] as readonly string[],
  pastDolomites: ["munich", "innsbruck", "dolomites"] as readonly string[],
  everywhere: ["munich", "innsbruck", "dolomites", "venice"] as readonly string[],
};

export { stopClusters };
