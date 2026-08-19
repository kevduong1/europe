import type { StopCluster } from "./types";

/** Derives expanded and already-visited marker groups from authored clusters. */
export function clusterState(
  dayId: number | null,
  stopClusters: readonly StopCluster[],
) {
  if (dayId == null) {
    return { expandedClusterIds: [], visitedClusterIds: [] };
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
