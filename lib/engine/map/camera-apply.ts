import type { Map as MapLibreMap } from "maplibre-gl";
import type { JourneyView } from "../types";
import {
  TERRAIN_HILLSHADE_LAYER_ID,
  TERRAIN_SOURCE_ID,
} from "./basemap-style";
import type { TripMapData } from "./types";

const MAX_FRAME_ZOOM = 14.6;
const TERRAIN_EXAGGERATION = 1.12;
const CAMERA_EPSILON = { lngLat: 1e-6, zoom: 1e-4, angle: 1e-3 };
const FRAME_WIDTH = 1280;
const ZOOM_OFFSET_MIN = -1.9;
const ZOOM_OFFSET_MAX = 0.35;
const PITCH_NARROW_WIDTH = 390;
const PITCH_FULL_WIDTH = 900;
const PITCH_MIN_SCALE = 0.55;

export function zoomOffsetFor(width: number) {
  const raw = Math.log2(width / FRAME_WIDTH);
  return Math.min(ZOOM_OFFSET_MAX, Math.max(ZOOM_OFFSET_MIN, raw));
}

export function pitchScaleFor(width: number) {
  if (width >= PITCH_FULL_WIDTH) return 1;
  if (width <= PITCH_NARROW_WIDTH) return PITCH_MIN_SCALE;
  const progress =
    (width - PITCH_NARROW_WIDTH) / (PITCH_FULL_WIDTH - PITCH_NARROW_WIDTH);
  return PITCH_MIN_SCALE + (1 - PITCH_MIN_SCALE) * progress;
}

type Camera = {
  lng: number;
  lat: number;
  zoom: number;
  bearing: number;
  pitch: number;
  elevation: number;
};

export function createCameraController(map: MapLibreMap, data: TripMapData) {
  let terrainEnabled = false;
  let lastCamera: Camera | null = null;

  function applyTerrain(view: JourneyView) {
    const enabled =
      data.terrain.clusterIds.some((id) => view.expandedClusterIds.includes(id)) &&
      view.zoom >= data.terrain.minZoom;
    if (terrainEnabled === enabled) return;
    terrainEnabled = enabled;
    map.setLayoutProperty(
      TERRAIN_HILLSHADE_LAYER_ID,
      "visibility",
      enabled ? "visible" : "none",
    );
    map.setTerrain(
      enabled
        ? { source: TERRAIN_SOURCE_ID, exaggeration: TERRAIN_EXAGGERATION }
        : null,
    );
    map.setCenterClampedToGround(true);
  }

  function applyCamera(view: JourneyView) {
    const width = map.getContainer().clientWidth || FRAME_WIDTH;
    const zoom = Math.min(view.zoom + zoomOffsetFor(width), MAX_FRAME_ZOOM + 1.2);
    const pitch = view.pitch * pitchScaleFor(width);
    const elevation = terrainEnabled
      ? (map.queryTerrainElevation(view.center) ?? 0)
      : 0;
    const last = lastCamera;
    if (
      last &&
      Math.abs(last.lng - view.center[0]) < CAMERA_EPSILON.lngLat &&
      Math.abs(last.lat - view.center[1]) < CAMERA_EPSILON.lngLat &&
      Math.abs(last.zoom - zoom) < CAMERA_EPSILON.zoom &&
      Math.abs(last.bearing - view.bearing) < CAMERA_EPSILON.angle &&
      Math.abs(last.pitch - pitch) < CAMERA_EPSILON.angle &&
      Math.abs(last.elevation - elevation) < 0.5
    ) {
      return;
    }
    lastCamera = {
      lng: view.center[0],
      lat: view.center[1],
      zoom,
      bearing: view.bearing,
      pitch,
      elevation,
    };
    map.jumpTo({
      center: view.center,
      zoom,
      bearing: view.bearing,
      pitch,
      elevation,
    });
  }

  return {
    apply(view: JourneyView) {
      applyTerrain(view);
      applyCamera(view);
    },
  };
}

export type CameraController = ReturnType<typeof createCameraController>;
