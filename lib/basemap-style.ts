import type { StyleSpecification } from "maplibre-gl";

const PAPER = "#FAF9F6";
const INK = "#1F2421";
const DOLOMITE = "#8A8F98";
const LAGOON = "#3E5C76";

const HIDDEN_LAYERS = new Set([
  "highway_path",
  "highway_minor",
  "highway-name-path",
  "highway-name-minor",
  "highway-name-major",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "airport",
  "label_other",
  "label_village",
  "label_state",
  "label_town",
  "label_city",
  "label_city_capital",
  "aeroway-taxiway",
  "aeroway-runway-casing",
  "aeroway-area",
  "aeroway-runway",
  "waterway_line_label",
  "tunnel_motorway_casing",
  "tunnel_motorway_inner",
  "highway_motorway_bridge_casing",
  "highway_motorway_bridge_inner",
  "boundary_3",
  "boundary_disputed",
  "road_area_pier",
  "road_pier",
]);

export const fallbackStyle: StyleSpecification = {
  version: 8,
  name: "europe-2026-paper",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": PAPER },
    },
  ],
};

export const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

function paint(layer: { paint?: Record<string, unknown> }) {
  layer.paint ??= {};
  return layer.paint;
}

async function inlineVectorSources(style: StyleSpecification) {
  await Promise.all(
    Object.values(style.sources).map(async (source) => {
      if (source.type !== "vector" || !("url" in source) || !source.url) return;
      try {
        const spec = await fetch(source.url).then((response) => {
          if (!response.ok) throw new Error("tilejson");
          return response.json();
        });
        if (!Array.isArray(spec.tiles) || spec.tiles.length === 0) return;
        source.tiles = spec.tiles;
        source.minzoom = spec.minzoom ?? 0;
        source.maxzoom = spec.maxzoom ?? 14;
        if (typeof spec.attribution === "string") {
          source.attribution = spec.attribution;
        }
        delete source.url;
      } catch {
        // Keep the TileJSON url and let MapLibre try.
      }
    }),
  );
}

export function adaptBasemapStyle(input: StyleSpecification): StyleSpecification {
  const style: StyleSpecification = structuredClone(input);

  const reliefLayer = {
    id: "relief",
    type: "raster" as const,
    source: "ne2_shaded",
    maxzoom: 7,
    paint: {
      "raster-opacity": 0.28,
      "raster-saturation": -0.55,
      "raster-contrast": 0.12,
      "raster-brightness-min": 0.15,
    },
  };

  style.layers = style.layers.filter((layer) => !HIDDEN_LAYERS.has(layer.id));

  const bgIndex = style.layers.findIndex((layer) => layer.id === "background");
  if (!style.layers.some((layer) => layer.id === "relief")) {
    if (bgIndex >= 0) style.layers.splice(bgIndex + 1, 0, reliefLayer);
    else style.layers.unshift(reliefLayer);
  }

  for (const layer of style.layers) {
    switch (layer.id) {
      case "background":
        paint(layer)["background-color"] = PAPER;
        break;
      case "water":
        paint(layer)["fill-color"] = "#c5d0d8";
        break;
      case "park":
        paint(layer)["fill-color"] = "#e6ece4";
        break;
      case "landcover_wood":
        paint(layer)["fill-color"] = "#d8e0d6";
        break;
      case "landcover_glacier":
      case "landcover_ice_shelf":
        paint(layer)["fill-color"] = "#e7e6e2";
        break;
      case "landuse_residential":
        paint(layer)["fill-color"] = "#f3f1ec";
        paint(layer)["fill-opacity"] = 0.55;
        break;
      case "building":
        paint(layer)["fill-color"] = "#ebe8e1";
        paint(layer)["fill-outline-color"] = "#ddd9d1";
        break;
      case "waterway":
        paint(layer)["line-color"] = "#b7c4cc";
        break;
      case "boundary_2":
        paint(layer)["line-color"] = DOLOMITE;
        paint(layer)["line-opacity"] = 0.45;
        break;
      case "label_country_1":
      case "label_country_2":
      case "label_country_3":
        if (layer.type === "symbol") {
          paint(layer)["text-color"] = INK;
          paint(layer)["text-halo-color"] = PAPER;
          paint(layer)["text-halo-width"] = 1.4;
          paint(layer)["text-opacity"] = 0.72;
        }
        break;
      case "highway_major_casing":
      case "highway_major_inner":
      case "highway_major_subtle":
      case "highway_motorway_casing":
      case "highway_motorway_inner":
      case "highway_motorway_subtle":
        paint(layer)["line-color"] = "#d3d0c8";
        paint(layer)["line-opacity"] = 0.55;
        break;
      case "railway":
      case "railway_dashline":
      case "railway_service":
      case "railway_service_dashline":
      case "railway_transit":
      case "railway_transit_dashline":
        paint(layer)["line-color"] = DOLOMITE;
        paint(layer)["line-opacity"] = 0.28;
        break;
      case "water_name_point_label":
      case "water_name_line_label":
        if (layer.type === "symbol") {
          paint(layer)["text-color"] = LAGOON;
          paint(layer)["text-halo-color"] = PAPER;
          paint(layer)["text-halo-width"] = 1.2;
          paint(layer)["text-opacity"] = 0.7;
        }
        break;
      default:
        break;
    }
  }

  return style;
}

export async function loadPaperStyle(): Promise<StyleSpecification> {
  try {
    const response = await fetch(STYLE_URL);
    if (!response.ok) return structuredClone(fallbackStyle);
    const style = (await response.json()) as StyleSpecification;
    await inlineVectorSources(style);
    return adaptBasemapStyle(style);
  } catch {
    return structuredClone(fallbackStyle);
  }
}

