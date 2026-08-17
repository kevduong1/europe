"use client";

import {
  AttributionControl,
  LngLat as MapLngLat,
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
  orangeTrail,
  overnightStops,
  stopClusters,
  unresolvedPoint,
} from "@/data/route";
import type { MapFrame, OvernightStop, StopCluster } from "@/data/types";
import { loadPaperStyle } from "@/lib/basemap-style";
import {
  along,
  bearingBetween,
  centerOfBounds,
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
  resize: () => void;
};

type Props = {
  onReady?: () => void;
};

const MAX_FRAME_ZOOM = 14.6;

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

function waitForSize(el: HTMLElement) {
  if (el.clientWidth > 16 && el.clientHeight > 16) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 16 && el.clientHeight > 16) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(el);
  });
}

function cameraPadding(map: MapLibreMap) {
  const height = Math.max(map.getContainer().clientHeight, 240);
  const width = Math.max(map.getContainer().clientWidth, 240);
  const top = Math.min(108, Math.round(height * 0.16));
  const side = Math.min(28, Math.round(width * 0.07));
  const bottom = Math.min(Math.round(height * 0.42), height - top - 96);
  return {
    top,
    right: side,
    bottom: Math.max(88, bottom),
    left: side,
  };
}

function cameraForFrame(
  map: MapLibreMap,
  bounds: MapFrame["bounds"],
  pitch: number,
  bearing: number,
) {
  const padding = cameraPadding(map);
  const camera = map.cameraForBounds(bounds, {
    padding,
    bearing,
    pitch,
    maxZoom: MAX_FRAME_ZOOM,
  });
  if (!camera?.center) {
    return {
      center: centerOfBounds(bounds),
      zoom: 7,
      bearing,
      pitch,
    };
  }
  const ll = MapLngLat.convert(camera.center);
  return {
    center: [ll.lng, ll.lat] as LngLat,
    zoom: Math.min(camera.zoom ?? 7, MAX_FRAME_ZOOM),
    bearing,
    pitch,
  };
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
}

const MARKER_OPTS = {
  pitchAlignment: "viewport" as const,
  rotationAlignment: "viewport" as const,
};

export const JourneyMap = forwardRef<JourneyMapHandle, Props>(
  function JourneyMap({ onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const clusterMarkersRef = useRef<Marker[]>([]);
    const hereRef = useRef<Marker | null>(null);
    const planeRef = useRef<Marker | null>(null);
    const readyRef = useRef(false);
    const pendingRef = useRef<JourneyView | null>(null);
    const lastTrailT = useRef(-1);
    const lastFlightKey = useRef("");
    const lastMarkerKey = useRef("");
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

    function applyMarkers(view: JourneyView) {
      const map = mapRef.current;
      const markerKey = `${view.phase}|${view.dayId}|${view.expandedClusterIds.join(",")}|${view.visitedClusterIds.join(",")}|${view.flightLeg}|${view.focusStopId}|${view.flightT < 0.28}|${view.flightT > 0.72}`;
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
          marker.getElement().style.opacity = visible ? "1" : "0";
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
            visible = view.phase === "day" && view.dayId === 8;
          } else if (view.phase === "day" && expanded) {
            visible = true;
          } else if (view.phase === "day" && visited) {
            visible = true;
            visitedLook = true;
          }

          el.classList.toggle("map-pin-visited", visitedLook);
          el.classList.toggle("map-pin-active", view.focusStopId === stopId);
          el.style.opacity = visible ? "1" : "0";
        }
      }

      const herePos =
        view.here ??
        (view.phase === "day" || (view.phase === "overview" && view.trailT > 0.02)
          ? along(orangeTrail, Math.max(0.002, view.trailT))
          : null);
      const onPlane = Boolean(view.showFlight);
      if (hereRef.current) {
        hereRef.current.getElement().style.opacity = herePos && !onPlane ? "1" : "0";
        if (herePos && !onPlane) {
          hereRef.current.setLngLat(herePos);
        }
      }
      if (planeRef.current) {
        planeRef.current.getElement().style.opacity = onPlane ? "1" : "0";
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

    function applyView(view: JourneyView) {
      const map = mapRef.current;
      if (!map || !readyRef.current) {
        pendingRef.current = view;
        return;
      }

      const pitch = view.pitch;
      const bearing = view.bearing;
      if (view.center && view.zoom != null) {
        map.jumpTo({
          center: view.center,
          zoom: Math.min(view.zoom, MAX_FRAME_ZOOM + 1.2),
          bearing,
          pitch,
        });
      } else {
        const next = cameraForFrame(map, view.bounds, pitch, bearing);
        map.jumpTo({
          center: next.center,
          zoom: next.zoom,
          bearing: next.bearing,
          pitch: next.pitch,
        });
      }

      applyTrail(view);
      applyFlight(view);
      applyMarkers(view);
    }
    applyViewRef.current = applyView;

    useImperativeHandle(ref, () => ({
      setView: applyView,
      resize: () => mapRef.current?.resize(),
    }));

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;
      let cancelled = false;
      let map: MapLibreMap | null = null;
      let observer: ResizeObserver | undefined;

      async function init() {
        const start = containerRef.current;
        if (!start) return;
        await waitForSize(start);
        const mount = containerRef.current;
        if (cancelled || !mount) return;

        const paper = await loadPaperStyle();
        if (cancelled) return;
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
        });
        observer.observe(mount);

        let finished = false;
        const finishReady = () => {
          if (!map || cancelled || finished) return;
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
                anchor: "bottom-left",
                ...MARKER_OPTS,
              })
                .setLngLat(stop.lngLat)
                .addTo(map);
              markersRef.current.push(marker);
            }

            const q = document.createElement("div");
            q.className = "map-unresolved";
            q.textContent = "?";
            q.dataset.days = "8";
            markersRef.current.push(
              new Marker({ element: q, anchor: "center", ...MARKER_OPTS })
                .setLngLat(unresolvedPoint)
                .addTo(map),
            );

            const hereEl = document.createElement("div");
            hereEl.className = "map-here";
            hereEl.style.opacity = "0";
            hereRef.current = new Marker({
              element: hereEl,
              anchor: "center",
              ...MARKER_OPTS,
            })
              .setLngLat(orangeTrail[0])
              .addTo(map);

            const planeEl = planeElement();
            planeEl.style.opacity = "0";
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
        cancelled = true;
        observer?.disconnect();
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        clusterMarkersRef.current.forEach((marker) => marker.remove());
        clusterMarkersRef.current = [];
        hereRef.current?.remove();
        hereRef.current = null;
        planeRef.current?.remove();
        planeRef.current = null;
        map?.remove();
        mapRef.current = null;
        readyRef.current = false;
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
