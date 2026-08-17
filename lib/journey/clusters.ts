import { stopClusters } from "@/data/route";

/**
 * Shared, read-only cluster id lists. Beats name the group they want rather
 * than repeating the literals, so "which pins are showing" stays legible.
 */
export const CLUSTERS = {
  none: [] as readonly string[],
  munich: ["munich"] as readonly string[],
  innsbruck: ["innsbruck"] as readonly string[],
  dolomites: ["dolomites"] as readonly string[],
  venice: ["venice"] as readonly string[],
  /** Everything behind you once Innsbruck is done. */
  pastInnsbruck: ["munich", "innsbruck"] as readonly string[],
  /** Everything behind you once the Dolomites are done. */
  pastDolomites: ["munich", "innsbruck", "dolomites"] as readonly string[],
  /** The whole route, used on the flight home. */
  everywhere: ["munich", "innsbruck", "dolomites", "venice"] as readonly string[],
};

/**
 * Default marker state for a day, derived from each cluster's `expandOnDays`.
 * Beats override this when the narrative disagrees with the calendar — on the
 * morning of day 5 you are still standing in Innsbruck even though the day
 * belongs to the Dolomites.
 */
export function clusterState(dayId: number | null) {
  if (dayId == null) {
    return { expandedClusterIds: CLUSTERS.none, visitedClusterIds: CLUSTERS.none };
  }
  const expandedClusterIds: string[] = [];
  const visitedClusterIds: string[] = [];
  for (const cluster of stopClusters) {
    const lo = Math.min(...cluster.expandOnDays);
    const hi = Math.max(...cluster.expandOnDays);
    if (dayId >= lo && dayId <= hi) expandedClusterIds.push(cluster.id);
    else if (dayId > hi) visitedClusterIds.push(cluster.id);
  }
  return { expandedClusterIds, visitedClusterIds };
}
