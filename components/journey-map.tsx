"use client";

import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  flightHome,
  flightOut,
  localRoutes,
  orangeTrail,
  overnightStops,
  photoPins,
  stopClusters,
  unresolvedPoint,
} from "@/data/route";
import type { OvernightStop, PhotoPin, StopCluster } from "@/data/types";
import {
  loadPaperStyle,
  TERRAIN_HILLSHADE_LAYER_ID,
  TERRAIN_SOURCE_ID,
} from "@/lib/basemap-style";
import {
  along,
  bearingBetween,
  formatLngLat,
  pointsAlong,
  sliceLine,
  type LngLat,
} from "@/lib/geo";
import { TRAIL } from "@/lib/palette";
import { OVERVIEW, type JourneyView } from "@/lib/journey-view";
import { prefersReducedMotion } from "@/lib/motion";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type JourneyMapHandle = {
  setView: (view: JourneyView) => void;
};

type Props = {
  onReady?: () => void;
};

const MAX_FRAME_ZOOM = 14.6;
const TERRAIN_EXAGGERATION = 1.12;

/** Below these deltas a camera move is sub-pixel, so the jump is skipped. */
const CAMERA_EPSILON = { lngLat: 1e-6, zoom: 1e-4, angle: 1e-3 };

/**
 * Every `CITY.*` zoom was composed by eye against a desktop-width window.
 * Zoom fixes meters-per-pixel, not ground extent, so the ground actually
 * shown shrinks with the viewport — on a phone the same zoom frames a third
 * of the intended area. Rather than re-tune every constant, `applyCamera`
 * derives one offset from container width vs. this reference and applies it
 * to every frame, city holds and travel corridors alike.
 */
const FRAME_WIDTH = 1280;

/**
 * Full correction (`log2(width / FRAME_WIDTH)`) exactly restores the desktop
 * composition, but pin labels and line widths don't scale with zoom, so full
 * correction on the narrowest phones crowds them. Clamped short of that:
 * −1.9 covers phones a little past the 390px reference (log2(390/1280) ≈
 * −1.71) with room to spare, +0.35 keeps ultra-wide desktops from pushing
 * already-tight frames past MAX_FRAME_ZOOM.
 */
const ZOOM_OFFSET_MIN = -1.9;
const ZOOM_OFFSET_MAX = 0.35;

function zoomOffsetFor(width: number) {
  const raw = Math.log2(width / FRAME_WIDTH);
  return Math.min(ZOOM_OFFSET_MAX, Math.max(ZOOM_OFFSET_MIN, raw));
}

/**
 * A pitched frame (`CITY.dolomites`, `CITY.seceda`, ...) spends its top third
 * on sky on a tall narrow phone, pushing the actual subject low in the shot.
 * Damped linearly between these two widths rather than cut off entirely —
 * some tilt still reads as "mountains", just not the full desktop lean.
 */
const PITCH_NARROW_WIDTH = 390;
const PITCH_FULL_WIDTH = 900;
const PITCH_MIN_SCALE = 0.55;

function pitchScaleFor(width: number) {
  if (width >= PITCH_FULL_WIDTH) return 1;
  if (width <= PITCH_NARROW_WIDTH) return PITCH_MIN_SCALE;
  const t = (width - PITCH_NARROW_WIDTH) / (PITCH_FULL_WIDTH - PITCH_NARROW_WIDTH);
  return PITCH_MIN_SCALE + (1 - PITCH_MIN_SCALE) * t;
}

type Camera = {
  lng: number;
  lat: number;
  zoom: number;
  bearing: number;
  pitch: number;
  elevation: number;
};

function lineFeature(
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

function waitForSize(el: HTMLElement, signal: { cancelled: boolean }) {
  if (el.clientWidth > 16 && el.clientHeight > 16) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (signal.cancelled || (el.clientWidth > 16 && el.clientHeight > 16)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(el);
  });
}

function pinElement(stop: OvernightStop) {
  const el = document.createElement("div");
  el.className = `map-pin map-pin-${stop.kind}`;
  el.dataset.stop = stop.id;
  el.dataset.days = stop.days.join(",");
  if (stop.clusterId) el.dataset.cluster = stop.clusterId;
  el.innerHTML = `<span class="map-pin-dot"></span><span class="map-pin-copy"><span class="map-pin-label">${stop.label}</span><span class="map-pin-coords">${formatLngLat(stop.lngLat)}</span></span>`;
  return el;
}

function clusterElement(cluster: StopCluster) {
  const el = document.createElement("div");
  el.className = `map-cluster map-cluster-${cluster.anchor ?? "right"}`;
  el.dataset.cluster = cluster.id;
  const count = cluster.stopIds.length;
  const badge =
    count > 1 ? `<span class="map-cluster-count">${count}</span>` : "";
  el.innerHTML = `${badge}<span class="map-cluster-label">${cluster.label}</span>`;
  return el;
}

/** Outline-camera glyph for a photo pin that has no image yet (see `photoPinElement`). */
const PHOTO_PLACEHOLDER_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
  '<path fill="none" stroke="currentColor" stroke-width="1.6" ' +
  'd="M4 8.5h3l1.4-2h7.2l1.4 2H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z"/>' +
  '<circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
  "</svg>";

/**
 * The overnight-stop id a photo pin should be considered "in play" with, for
 * markers whose own id isn't already a stop id (see `photoPinFocusTarget`).
 */
const PHOTO_PIN_FOCUS_OVERRIDES: Record<string, string> = {
  "qc-terme": "val-di-fassa-tbd",
  venice: "venice-tbd",
  innsbruck: "montagu",
};

function photoPinElement(pin: PhotoPin) {
  const el = document.createElement("div");
  el.className = `map-photo-pin${pin.variant === "stack" ? " map-photo-pin-stack" : ""}`;
  el.dataset.pin = pin.id;
  el.dataset.days = pin.days.join(",");
  if (pin.clusterId) el.dataset.cluster = pin.clusterId;
  const photos = [
    pin.photo,
    pin.secondaryPhoto,
    ...(pin.additionalPhotos ?? []),
  ].filter(
    (photo): photo is NonNullable<typeof photo> => Boolean(photo),
  );
  const frames =
    photos.length > 0
      ? photos
          .map(
            (photo) =>
              `<span class="map-photo-pin-frame"><img class="map-photo-pin-img" src="${pin.variant === "stack" ? photo.src : photo.pinSrc}" alt="${photo.alt.replace(/"/g, "&quot;")}" width="${pin.variant === "stack" ? 448 : 64}" height="${pin.variant === "stack" ? 300 : 64}" loading="lazy" decoding="async" /></span>`,
          )
          .join("")
      : `<span class="map-photo-pin-frame"><span class="map-photo-pin-empty" aria-hidden="true">${PHOTO_PLACEHOLDER_ICON}</span></span>`;
  el.innerHTML = `<span class="map-photo-pin-gallery">${frames}</span><span class="map-photo-pin-caption">${pin.caption}</span><span class="map-photo-pin-stem"></span><span class="map-photo-pin-dot"></span>`;
  return el;
}

function planeElement() {
  const el = document.createElement("div");
  el.className = "map-plane";
  el.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2.2l2.4 7.2 7.4 1.6-7.4 1.2L12 21.8l-2.4-9.6L2.2 11l7.4-1.6z"/></svg>`;
  return el;
}

function crumbCollection(line: LngLat[], t: number, spacingKm: number) {
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

function addRouteLayers(map: MapLibreMap) {
  if (map.getSource("trail-ghost")) return;
  map.addSource("trail-ghost", {
    type: "geojson",
    data: lineFeature("trail-ghost", orangeTrail),
  });
  map.addSource("trail-active", {
    type: "geojson",
    data: lineFeature("trail-active", sliceLine(orangeTrail, 0, 0.002)),
  });
  map.addSource("crumbs", {
    type: "geojson",
    data: crumbCollection(orangeTrail, 0, 8),
  });
  map.addSource("flights", {
    type: "geojson",
    data: lineFeature("flight-active", sliceLine(flightOut, 0, 0.002)),
  });
  map.addSource("local-route-ghost", {
    type: "geojson",
    data: lineFeature("local-route-ghost", localRoutes["english-garden"]),
  });
  map.addSource("local-route-active", {
    type: "geojson",
    data: lineFeature(
      "local-route-active",
      sliceLine(localRoutes["english-garden"], 0, 0.002),
    ),
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
    paint: {
      "line-color": TRAIL,
      "line-width": 2,
      "line-opacity": 0.28,
    },
  });
  map.addLayer({
    id: "trail-active-casing",
    type: "line",
    source: "trail-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#1f2421",
      "line-width": 7,
      "line-opacity": 0,
    },
  });
  map.addLayer({
    id: "trail-active",
    type: "line",
    source: "trail-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": TRAIL,
      "line-width": lineWidth,
      "line-opacity": 0,
    },
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
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        3.4,
        6,
        2.6,
      ],
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
    paint: {
      "line-color": "#faf9f6",
      "line-width": 8,
      "line-opacity": 0,
    },
  });
  map.addLayer({
    id: "local-route-active",
    type: "line",
    source: "local-route-active",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": TRAIL,
      "line-width": 4.5,
      "line-opacity": 0,
    },
  });
}

const MARKER_OPTS = {
  pitchAlignment: "viewport" as const,
  rotationAlignment: "viewport" as const,
};

const STOP_IDS = new Set(overnightStops.map((stop) => stop.id));

/**
 * The overnight-stop id whose `focusStopId` moment this photo belongs to, if
 * any. Most pin ids already match a stop id 1:1 (wombat, ortisei, resciesa,
 * firenze, seceda); `PHOTO_PIN_FOCUS_OVERRIDES` covers the ones that
 * don't. A pin with no resolvable stop (hofbrauhaus — not an overnight stop)
 * returns null, and falls back to a coarser day-based gate in `applyMarkers`.
 */
function photoPinFocusTarget(pin: PhotoPin): string | null {
  if (pin.focusId) return pin.focusId;
  const candidate = PHOTO_PIN_FOCUS_OVERRIDES[pin.id] ?? pin.id;
  return STOP_IDS.has(candidate) ? candidate : null;
}

export const JourneyMap = forwardRef<JourneyMapHandle, Props>(
  function JourneyMap({ onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const clusterMarkersRef = useRef<Marker[]>([]);
    const photoMarkersRef = useRef<Marker[]>([]);
    const hereRef = useRef<Marker | null>(null);
    const planeRef = useRef<Marker | null>(null);
    const readyRef = useRef(false);
    const pendingRef = useRef<JourneyView | null>(null);
    const lastTrailT = useRef(-1);
    const lastFlightKey = useRef("");
    const lastLocalRouteKey = useRef("");
    const lastLocalRouteId = useRef("");
    const lastMarkerKey = useRef("");
    const terrainEnabledRef = useRef(false);
    const lastCamera = useRef<Camera | null>(null);
    /** Last view handed to `applyView`, replayed on resize so the width-derived offset recomputes. */
    const lastViewRef = useRef<JourneyView | null>(null);
    const onReadyRef = useRef(onReady);
    const applyViewRef = useRef<(view: JourneyView) => void>(() => {});
    onReadyRef.current = onReady;

    function setLineOpacity(id: string, opacity: number) {
      const map = mapRef.current;
      if (!map?.getLayer(id)) return;
      map.setPaintProperty(id, "line-opacity", opacity);
    }

    function applyTrail(view: JourneyView) {
      const map = mapRef.current;
      if (!map) return;
      const traveled = Math.min(1, Math.max(0, view.trailT));
      const showTraveled = traveled > 0.004;
      const showPlan = view.phase === "overview" || view.phase === "day";
      const showCrumbs = showTraveled && view.phase !== "flight";
      setLineOpacity("trail-ghost", showPlan ? (showTraveled ? 0.18 : 0.32) : 0);
      setLineOpacity("trail-active-casing", showTraveled ? 0.28 : 0);
      setLineOpacity("trail-active", showTraveled ? 1 : 0);
      if (map.getLayer("trail-crumbs")) {
        map.setPaintProperty(
          "trail-crumbs",
          "circle-opacity",
          showCrumbs ? 1 : 0,
        );
      }

      const t = showTraveled ? Math.max(0.006, traveled) : 0.006;
      if (Math.abs(t - lastTrailT.current) < 0.001 && lastTrailT.current >= 0) return;
      lastTrailT.current = t;
      const line = sliceLine(orangeTrail, 0, t);
      const source = map.getSource("trail-active") as GeoJSONSource | undefined;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: line },
      });
      const crumbs = map.getSource("crumbs") as GeoJSONSource | undefined;
      crumbs?.setData(crumbCollection(orangeTrail, t, 7));
    }

    function applyFlight(view: JourneyView) {
      const map = mapRef.current;
      if (!map?.getLayer("route-flight")) return;
      const show = Boolean(view.showFlight && view.flightT > 0.003);
      const line = view.flightLeg === "home" ? flightHome : flightOut;
      const t = show ? Math.max(0.006, view.flightT) : 0.006;
      const key = `${view.flightLeg ?? "none"}:${t.toFixed(3)}:${show}`;
      if (key === lastFlightKey.current) return;
      lastFlightKey.current = key;
      const source = map.getSource("flights") as GeoJSONSource | undefined;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: sliceLine(line, 0, t),
        },
      });
      setLineOpacity("route-flight", show ? 0.95 : 0);
    }

    function applyLocalRoute(view: JourneyView) {
      const map = mapRef.current;
      if (!map) return;
      const id = view.localRouteId;
      const route = id ? localRoutes[id] : null;
      const t = Math.min(1, Math.max(0, view.localRouteT));
      const show = Boolean(route && view.phase === "day");
      const key = `${id ?? "none"}:${t.toFixed(3)}:${show}`;
      if (key === lastLocalRouteKey.current) return;
      lastLocalRouteKey.current = key;

      setLineOpacity("local-route-ghost", show ? 0.3 : 0);
      setLineOpacity("local-route-casing", show ? 0.92 : 0);
      setLineOpacity("local-route-active", show ? 1 : 0);
      if (!route) return;

      if (id && lastLocalRouteId.current !== id) {
        lastLocalRouteId.current = id;
        const ghost = map.getSource("local-route-ghost") as
          | GeoJSONSource
          | undefined;
        ghost?.setData(lineFeature("local-route-ghost", route));
      }
      const active = map.getSource("local-route-active") as
        | GeoJSONSource
        | undefined;
      active?.setData(
        lineFeature("local-route-active", sliceLine(route, 0, Math.max(0.002, t))),
      );
    }

    /**
     * Marker visibility is toggled via the `is-hidden` class (globals.css,
     * `opacity: 0 !important`), never by setting `el.style.opacity` directly.
     * MapLibre's own `Marker` re-asserts `this._element.style.opacity` from
     * its internal occlusion state on every "move"/"moveend" event — i.e.
     * after every `map.jumpTo()` below — which would silently clobber a
     * plain inline-opacity toggle back to "1" a frame later. `!important`
     * on a class rule beats that unflagged inline write.
     */
    function applyMarkers(view: JourneyView) {
      const map = mapRef.current;
      const photoZoomGates = photoPins
        .map((pin) => Number(view.zoom >= (pin.minZoom ?? 0)))
        .join("");
      const markerKey = `${view.phase}|${view.dayId}|${view.expandedClusterIds.join(",")}|${view.visitedClusterIds.join(",")}|${view.flightLeg}|${view.focusStopId}|${photoZoomGates}|${view.flightT < 0.28}|${view.flightT > 0.72}`;
      if (markerKey !== lastMarkerKey.current) {
        lastMarkerKey.current = markerKey;
        map
          ?.getContainer()
          .classList.toggle(
            "map-zoomed",
            Boolean(view.focusStopId) || view.zoom >= 12.55,
          );

        for (const marker of clusterMarkersRef.current) {
          const id = marker.getElement().dataset.cluster ?? "";
          const expanded = view.expandedClusterIds.includes(id);
          const visited = view.visitedClusterIds.includes(id);
          const visible =
            view.phase === "overview" ||
            (view.phase === "day" && !expanded && !visited);
          marker.getElement().classList.toggle("is-hidden", !visible);
        }

        for (const marker of markersRef.current) {
          const el = marker.getElement();
          const stopId = el.dataset.stop ?? "";
          const clusterId = el.dataset.cluster;
          const expanded = clusterId
            ? view.expandedClusterIds.includes(clusterId)
            : false;
          const visited = clusterId
            ? view.visitedClusterIds.includes(clusterId)
            : false;
          const unresolved = el.classList.contains("map-unresolved");

          let visible = false;
          let visitedLook = false;

          if (stopId === "mci") {
            visible =
              view.flightLeg === "out" ||
              (view.flightLeg === "home" && view.flightT > 0.55);
          } else if (stopId === "muc") {
            visible =
              (view.phase === "flight" && view.flightLeg === "out") ||
              (view.phase === "day" && expanded);
          } else if (unresolved) {
            // The Val di Fassa night, not the whole route — everything else
            // by Day 8 is a known line.
            visible = view.phase === "day" && view.dayId === 7;
          } else if (view.phase === "day" && expanded) {
            visible = true;
          } else if (view.phase === "day" && visited) {
            visible = true;
            visitedLook = true;
          }

          el.classList.toggle("map-pin-visited", visitedLook);
          el.classList.toggle("map-pin-active", view.focusStopId === stopId);
          el.classList.toggle("is-hidden", !visible);
        }

        photoMarkersRef.current.forEach((marker, index) => {
          const pin = photoPins[index];
          const el = marker.getElement();
          const expanded = pin.clusterId
            ? view.expandedClusterIds.includes(pin.clusterId)
            : true;
          const focusTarget = photoPinFocusTarget(pin);
          const visible =
            view.phase === "day" &&
            expanded &&
            view.zoom >= (pin.minZoom ?? 0) &&
            (focusTarget
              ? view.focusStopId === focusTarget
              : pin.days.includes(view.dayId ?? -1));
          el.classList.toggle("is-hidden", !visible);
        });
      }

      const herePos =
        view.here ??
        (view.phase === "day" || (view.phase === "overview" && view.trailT > 0.02)
          ? along(orangeTrail, Math.max(0.002, view.trailT))
          : null);
      const onPlane = Boolean(view.showFlight);
      if (hereRef.current) {
        hereRef.current
          .getElement()
          .classList.toggle("is-hidden", !(herePos && !onPlane));
        if (herePos && !onPlane) {
          hereRef.current.setLngLat(herePos);
        }
      }
      if (planeRef.current) {
        planeRef.current.getElement().classList.toggle("is-hidden", !onPlane);
        if (onPlane) {
          const line = view.flightLeg === "home" ? flightHome : flightOut;
          const t = Math.max(0.004, view.flightT);
          const here = along(line, t);
          const ahead = along(line, Math.min(1, t + 0.012));
          planeRef.current.setLngLat(here);
          planeRef.current.setRotation(bearingBetween(here, ahead));
        }
      }
    }

    function applyCamera(view: JourneyView) {
      const map = mapRef.current;
      if (!map) return;
      // Width-derived correction has to land before the MAX_FRAME_ZOOM clamp,
      // not after, or a narrow viewport's wider (lower) zoom gets clamped
      // back down to the same tight frame it was meant to escape.
      const width = map.getContainer().clientWidth || FRAME_WIDTH;
      const zoom = Math.min(view.zoom + zoomOffsetFor(width), MAX_FRAME_ZOOM + 1.2);
      const pitch = view.pitch * pitchScaleFor(width);
      // `jumpTo` otherwise keeps the look-at plane at sea level. At close
      // Dolomites zooms that can put a 2,500 m terrain marker far above the
      // screen even when its lng/lat equals the authored camera center.
      const elevation = terrainEnabledRef.current
        ? (map.queryTerrainElevation(view.center) ?? 0)
        : 0;
      const last = lastCamera.current;
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
      lastCamera.current = {
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

    /**
     * The DEM is deliberately scoped to the mountain chapter. Besides saving
     * GPU/tile work elsewhere, this lets the flat paper map remain the visual
     * language for cities and long travel legs.
     */
    function applyTerrain(view: JourneyView) {
      const map = mapRef.current;
      if (!map) return;
      const enabled =
        view.expandedClusterIds.includes("dolomites") && view.zoom >= 8.5;
      if (terrainEnabledRef.current === enabled) return;

      terrainEnabledRef.current = enabled;
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
      // Keep the camera's look-at point on the DEM surface. Without an
      // explicit refresh after enabling terrain, a tight pitched shot can
      // keep looking at sea level and project a summit marker far above the
      // viewport even though its longitude/latitude is the camera center.
      map.setCenterClampedToGround(true);
    }

    function applyView(view: JourneyView) {
      lastViewRef.current = view;
      const map = mapRef.current;
      if (!map || !readyRef.current) {
        pendingRef.current = view;
        return;
      }

      applyTerrain(view);
      applyCamera(view);
      applyTrail(view);
      applyFlight(view);
      applyLocalRoute(view);
      applyMarkers(view);
    }
    applyViewRef.current = applyView;

    useImperativeHandle(ref, () => ({
      setView: applyView,
    }));

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;
      const signal = { cancelled: false };
      let map: MapLibreMap | null = null;
      let observer: ResizeObserver | undefined;

      async function init() {
        const start = containerRef.current;
        if (!start) return;
        await waitForSize(start, signal);
        const mount = containerRef.current;
        if (signal.cancelled || !mount) return;

        const paper = await loadPaperStyle();
        if (signal.cancelled) return;
        map = new MapLibreMap({
          container: mount,
          style: paper,
          attributionControl: false,
          interactive: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          fadeDuration: prefersReducedMotion() ? 0 : 180,
          center: [11.72, 46.95],
          zoom: 6.2,
          minZoom: 1.4,
          maxZoom: 16,
          maxPitch: 70,
          pitch: 0,
          centerClampedToGround: true,
        });
        map.addControl(
          new AttributionControl({ compact: true }),
          "bottom-right",
        );
        mapRef.current = map;
        map.resize();
        observer = new ResizeObserver(() => {
          if (!mapRef.current) return;
          map?.resize();
          // Width changed, so the zoom/pitch offset did too — replay the last
          // view rather than wait for the next scroll frame.
          if (lastViewRef.current) applyViewRef.current(lastViewRef.current);
        });
        observer.observe(mount);

        let finished = false;
        const finishReady = () => {
          if (!map || signal.cancelled || finished) return;
          finished = true;
          addRouteLayers(map);
          map.resize();
          if (markersRef.current.length === 0) {
            for (const cluster of stopClusters) {
              const marker = new Marker({
                element: clusterElement(cluster),
                anchor:
                  cluster.anchor === "left"
                    ? "right"
                    : cluster.anchor === "right"
                      ? "left"
                      : cluster.anchor === "top"
                        ? "bottom"
                        : "center",
                ...MARKER_OPTS,
              })
                .setLngLat(cluster.lngLat)
                .addTo(map);
              clusterMarkersRef.current.push(marker);
            }

            for (const stop of overnightStops) {
              const marker = new Marker({
                element: pinElement(stop),
                // The visible coordinate glyph is the 10px dot near the
                // element's top-left, not the bottom of its two-line label.
                // Anchor and offset that dot's center to the map coordinate.
                anchor: "top-left",
                offset: [-5, -7],
                ...MARKER_OPTS,
              })
                .setLngLat(stop.lngLat)
                .addTo(map);
              markersRef.current.push(marker);
            }

            for (const pin of photoPins) {
              const marker = new Marker({
                element: photoPinElement(pin),
                anchor: "bottom",
                // Bottom anchoring places the dot's lower edge on the point;
                // move it down by half its 6px height to center it precisely,
                // while retaining per-landmark separation for nearby photos.
                offset: pin.offset
                  ? [pin.offset[0], pin.offset[1] + 3]
                  : [0, 3],
                ...MARKER_OPTS,
              })
                .setLngLat(pin.lngLat)
                .addTo(map);
              marker.getElement().classList.add("is-hidden");
              photoMarkersRef.current.push(marker);
            }

            const q = document.createElement("div");
            q.className = "map-unresolved";
            q.textContent = "?";
            q.dataset.days = "7";
            markersRef.current.push(
              new Marker({ element: q, anchor: "center", ...MARKER_OPTS })
                .setLngLat(unresolvedPoint)
                .addTo(map),
            );

            const hereEl = document.createElement("div");
            hereEl.className = "map-here is-hidden";
            hereRef.current = new Marker({
              element: hereEl,
              anchor: "center",
              ...MARKER_OPTS,
            })
              .setLngLat(orangeTrail[0])
              .addTo(map);

            const planeEl = planeElement();
            planeEl.classList.add("is-hidden");
            planeRef.current = new Marker({
              element: planeEl,
              anchor: "center",
              pitchAlignment: "viewport",
              rotationAlignment: "map",
            })
              .setLngLat(flightOut[0])
              .addTo(map);
          }

          readyRef.current = true;
          applyViewRef.current(pendingRef.current ?? OVERVIEW);
          onReadyRef.current?.();
        };

        map.once("load", finishReady);
        if (map.loaded()) finishReady();
      }

      void init();

      return () => {
        signal.cancelled = true;
        observer?.disconnect();
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        clusterMarkersRef.current.forEach((marker) => marker.remove());
        clusterMarkersRef.current = [];
        photoMarkersRef.current.forEach((marker) => marker.remove());
        photoMarkersRef.current = [];
        hereRef.current?.remove();
        hereRef.current = null;
        planeRef.current?.remove();
        planeRef.current = null;
        map?.remove();
        mapRef.current = null;
        readyRef.current = false;
        lastCamera.current = null;
        lastViewRef.current = null;
        lastTrailT.current = -1;
        lastFlightKey.current = "";
        lastLocalRouteKey.current = "";
        lastLocalRouteId.current = "";
        lastMarkerKey.current = "";
        terrainEnabledRef.current = false;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="map-canvas"
        aria-hidden="true"
      />
    );
  },
);
