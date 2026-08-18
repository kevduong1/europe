import type { StyleSpecification } from "maplibre-gl";
import { DOLOMITE, INK, LAGOON, PAPER } from "@/lib/palette";

export const TERRAIN_SOURCE_ID = "dolomites-terrain";
export const TERRAIN_HILLSHADE_SOURCE_ID = "dolomites-hillshade-dem";
export const TERRAIN_HILLSHADE_LAYER_ID = "dolomites-hillshade";

/**
 * Public, keyless elevation tiles. Mapterhorn's TileJSON includes its required
 * attribution and chooses its best open DEM per region (2.5 m around Bolzano,
 * 5 m in Trentino, with 10 m coverage across the rest of Italy).
 */
const TERRAIN_TILEJSON_URL = "https://tiles.mapterhorn.com/tilejson.json";

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

const fallbackStyle: StyleSpecification = {
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

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

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

function adaptBasemapStyle(input: StyleSpecification): StyleSpecification {
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
  if (
    style.sources.ne2_shaded &&
    !style.layers.some((layer) => layer.id === "relief")
  ) {
    if (bgIndex >= 0) style.layers.splice(bgIndex + 1, 0, reliefLayer);
    else style.layers.unshift(reliefLayer);
  }

  style.sources[TERRAIN_SOURCE_ID] = {
    type: "raster-dem",
    url: TERRAIN_TILEJSON_URL,
    tileSize: 512,
    encoding: "terrarium",
  };
  // MapLibre recommends separate source instances for terrain geometry and
  // hillshade rendering. The browser cache still shares the underlying tiles.
  style.sources[TERRAIN_HILLSHADE_SOURCE_ID] = {
    type: "raster-dem",
    url: TERRAIN_TILEJSON_URL,
    tileSize: 512,
    encoding: "terrarium",
  };

  const waterIndex = style.layers.findIndex((layer) => layer.id === "water");
  const waterLayer =
    waterIndex >= 0 ? style.layers.splice(waterIndex, 1)[0] : null;
  const firstLineIndex = style.layers.findIndex((layer) => layer.type === "line");
  const hillshadeIndex = firstLineIndex >= 0 ? firstLineIndex : style.layers.length;
  style.layers.splice(hillshadeIndex, 0, {
    id: TERRAIN_HILLSHADE_LAYER_ID,
    type: "hillshade",
    source: TERRAIN_HILLSHADE_SOURCE_ID,
    minzoom: 7,
    layout: { visibility: "none" },
    paint: {
      "hillshade-method": "multidirectional",
      "hillshade-exaggeration": 0.42,
      "hillshade-shadow-color": "#58645d",
      "hillshade-highlight-color": "#fffdf7",
      "hillshade-accent-color": DOLOMITE,
    },
  });
  // Keep lakes and rivers flat and blue instead of shading them like slopes.
  if (waterLayer) style.layers.splice(hillshadeIndex + 1, 0, waterLayer);

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
    if (!response.ok) return adaptBasemapStyle(fallbackStyle);
    const style = (await response.json()) as StyleSpecification;
    await inlineVectorSources(style);
    return adaptBasemapStyle(style);
  } catch {
    return adaptBasemapStyle(fallbackStyle);
  }
}
