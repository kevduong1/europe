import type { Map as MapLibreMap } from "maplibre-gl";
import { pointsAlong, sliceLine } from "../geo";
import { TRAIL } from "../palette";
import type { LngLat } from "../types";
import type { TripMapData } from "./types";

export function lineFeature(
  id: string,
  coordinates: LngLat[],
  properties: Record<string, unknown> = {},
) {
  return {
    type: "Feature" as const,
    id,
    properties: { id, ...properties },
    geometry: { type: "LineString" as const, coordinates },
  };
}

export function crumbCollection(line: LngLat[], t: number, spacingKm: number) {
  return {
    type: "FeatureCollection" as const,
    features: pointsAlong(line, t, spacingKm).map((coordinates, index) => ({
      type: "Feature" as const,
      id: index,
      properties: {},
      geometry: { type: "Point" as const, coordinates },
    })),
  };
}

export function setLineOpacity(map: MapLibreMap, id: string, opacity: number) {
  if (map.getLayer(id)) map.setPaintProperty(id, "line-opacity", opacity);
}

export function addRouteLayers(map: MapLibreMap, data: TripMapData) {
  if (map.getSource("trail-ghost")) return;
  const defaultLocalRoute = Object.values(data.localRoutes)[0] ?? data.trail;
  map.addSource("trail-ghost", {
    type: "geojson",
    data: lineFeature("trail-ghost", data.trail),
  });
  map.addSource("trail-active", {
    type: "geojson",
    data: lineFeature("trail-active", sliceLine(data.trail, 0, 0.002)),
  });
  map.addSource("crumbs", {
    type: "geojson",
    data: crumbCollection(data.trail, 0, 8),
  });
  map.addSource("flights", {
    type: "geojson",
    data: lineFeature("flight-active", sliceLine(data.flightOut, 0, 0.002)),
  });
  map.addSource("local-route-ghost", {
    type: "geojson",
    data: lineFeature("local-route-ghost", defaultLocalRoute),
  });
  map.addSource("local-route-active", {
    type: "geojson",
    data: lineFeature("local-route-active", sliceLine(defaultLocalRoute, 0, 0.002)),
  });
  const lineWidth: ["interpolate", ["linear"], ["zoom"], ...number[]] = [
    "interpolate",
    ["linear"],
    ["zoom"],
    2,
    3.2,
    6,
    4.5,
    12,
    6,
  ];
  map.addLayer({
    id: "trail-ghost",
    type: "line",
    source: "trail-ghost",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": TRAIL, "line-width": 2, "line-opacity": 0.28 },
  });
  map.addLayer({
    id: "trail-active-casing",
    type: "line",
    source: "trail-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#1f2421", "line-width": 7, "line-opacity": 0 },
  });
  map.addLayer({
    id: "trail-active",
    type: "line",
    source: "trail-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": TRAIL, "line-width": lineWidth, "line-opacity": 0 },
  });
  map.addLayer({
    id: "trail-crumbs",
    type: "circle",
    source: "crumbs",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        3,
        2.4,
        8,
        3.6,
        13,
        4.4,
      ],
      "circle-color": TRAIL,
      "circle-stroke-width": 1.4,
      "circle-stroke-color": "#faf9f6",
      "circle-opacity": 0,
    },
  });
  map.addLayer({
    id: "route-flight",
    type: "line",
    source: "flights",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": TRAIL,
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 3.4, 6, 2.6],
      "line-dasharray": [2.6, 1.8],
      "line-opacity": 0,
    },
  });
  map.addLayer({
    id: "local-route-ghost",
    type: "line",
    source: "local-route-ghost",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": TRAIL,
      "line-width": 3,
      "line-dasharray": [1.2, 1.4],
      "line-opacity": 0,
    },
  });
  map.addLayer({
    id: "local-route-casing",
    type: "line",
    source: "local-route-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#faf9f6", "line-width": 8, "line-opacity": 0 },
  });
  map.addLayer({
    id: "local-route-active",
    type: "line",
    source: "local-route-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": TRAIL, "line-width": 4.5, "line-opacity": 0 },
  });
}
