import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { sliceLine } from "../geo";
import type { JourneyView } from "../types";
import { createCameraController } from "./camera-apply";
import { crumbCollection, lineFeature, setLineOpacity } from "./layers";
import type { MarkerController } from "./markers";
import type { TripMapData } from "./types";

export function createViewController(
  map: MapLibreMap,
  data: TripMapData,
  markers: MarkerController,
) {
  const camera = createCameraController(map, data);
  let lastTrailT = -1;
  let lastFlightKey = "";
  let lastLocalRouteKey = "";
  let lastLocalRouteId = "";

  function applyTrail(view: JourneyView) {
    const traveled = Math.min(1, Math.max(0, view.trailT));
    const showTraveled = traveled > 0.004;
    const showPlan = view.phase === "overview" || view.phase === "day";
    const showCrumbs = showTraveled && view.phase !== "flight";
    setLineOpacity(map, "trail-ghost", showPlan ? (showTraveled ? 0.18 : 0.32) : 0);
    setLineOpacity(map, "trail-active-casing", showTraveled ? 0.28 : 0);
    setLineOpacity(map, "trail-active", showTraveled ? 1 : 0);
    if (map.getLayer("trail-crumbs")) {
      map.setPaintProperty("trail-crumbs", "circle-opacity", showCrumbs ? 1 : 0);
    }

    const progress = showTraveled ? Math.max(0.006, traveled) : 0.006;
    if (Math.abs(progress - lastTrailT) < 0.001 && lastTrailT >= 0) return;
    lastTrailT = progress;
    const source = map.getSource("trail-active") as GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: sliceLine(data.trail, 0, progress),
      },
    });
    const crumbs = map.getSource("crumbs") as GeoJSONSource | undefined;
    crumbs?.setData(crumbCollection(data.trail, progress, 7));
  }

  function applyFlight(view: JourneyView) {
    if (!map.getLayer("route-flight")) return;
    const show = Boolean(view.showFlight && view.flightT > 0.003);
    const line = view.flightLeg === "home" ? data.flightHome : data.flightOut;
    const progress = show ? Math.max(0.006, view.flightT) : 0.006;
    const key = `${view.flightLeg ?? "none"}:${progress.toFixed(3)}:${show}`;
    if (key === lastFlightKey) return;
    lastFlightKey = key;
    const source = map.getSource("flights") as GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: sliceLine(line, 0, progress),
      },
    });
    setLineOpacity(map, "route-flight", show ? 0.95 : 0);
  }

  function applyLocalRoute(view: JourneyView) {
    const id = view.localRouteId;
    const route = id ? data.localRoutes[id] : null;
    const progress = Math.min(1, Math.max(0, view.localRouteT));
    const show = Boolean(route && view.phase === "day");
    const key = `${id ?? "none"}:${progress.toFixed(3)}:${show}`;
    if (key === lastLocalRouteKey) return;
    lastLocalRouteKey = key;

    setLineOpacity(map, "local-route-ghost", show ? 0.3 : 0);
    setLineOpacity(map, "local-route-casing", show ? 0.92 : 0);
    setLineOpacity(map, "local-route-active", show ? 1 : 0);
    if (!route) return;

    if (id && lastLocalRouteId !== id) {
      lastLocalRouteId = id;
      const ghost = map.getSource("local-route-ghost") as GeoJSONSource | undefined;
      ghost?.setData(lineFeature("local-route-ghost", route));
    }
    const active = map.getSource("local-route-active") as GeoJSONSource | undefined;
    active?.setData(
      lineFeature(
        "local-route-active",
        sliceLine(route, 0, Math.max(0.002, progress)),
      ),
    );
  }

  return {
    apply(view: JourneyView) {
      camera.apply(view);
      applyTrail(view);
      applyFlight(view);
      applyLocalRoute(view);
      markers.apply(view);
    },
  };
}

export type ViewController = ReturnType<typeof createViewController>;
