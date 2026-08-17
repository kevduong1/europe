import type { StyleSpecification } from "maplibre-gl";

export const SATELLITE_ATTRIBUTION =
  "Imagery © Esri, Maxar, Earthstar Geographics · Terrain AWS/Mapzen";

export const fallbackStyle: StyleSpecification = {
  version: 8,
  name: "europe-2026-fallback",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#1a2420" },
    },
  ],
};

export function satelliteStyle(): StyleSpecification {
  return {
    version: 8,
    name: "europe-2026-satellite",
    projection: {
      type: [
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        "vertical-perspective",
        5.6,
        "mercator",
      ],
    },
    light: {
      anchor: "viewport",
      color: "#f4ebe0",
      intensity: 0.42,
      position: [1.15, 215, 28],
    },
    sky: {
      "sky-color": "#7eb3d9",
      "horizon-color": "#f2e4cc",
      "fog-color": "#d7e4ee",
      "sky-horizon-blend": 0.55,
      "horizon-fog-blend": 0.75,
      "fog-ground-blend": 0.45,
      "atmosphere-blend": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        0.85,
        6,
        0.35,
        10,
        0.08,
      ],
    },
    terrain: {
      source: "terrain",
      exaggeration: 1.5,
    },
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 17,
        attribution: SATELLITE_ATTRIBUTION,
      },
      terrain: {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      },
      hillshade: {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#0e1614" },
      },
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: {
          "raster-saturation": -0.06,
          "raster-contrast": 0.06,
          "raster-resampling": "linear",
        },
      },
      {
        id: "hillshade",
        type: "hillshade",
        source: "hillshade",
        paint: {
          "hillshade-exaggeration": 0.38,
          "hillshade-illumination-direction": 315,
          "hillshade-shadow-color": "#0b1218",
          "hillshade-highlight-color": "#fff4e4",
          "hillshade-accent-color": "#3d3428",
        },
      },
    ],
  };
}
