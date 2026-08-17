"use client";

import {
  AttributionControl,
  LngLat as MapLngLat,
  Map as MapLibreMap,
  Marker,
} from "maplibre-gl";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
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
import { adaptBasemapStyle, fallbackStyle, STYLE_URL } from "@/lib/basemap-style";
import {
  along,
  bearingBetween,
  centerOfBounds,
  formatLngLat,
  sliceLine,
  type LngLat,
} from "@/lib/geo";
import { OVERVIEW, type JourneyView } from "@/lib/journey-view";
import { prefersReducedMotion } from "@/lib/motion";
import "maplibre-gl/dist/maplibre-gl.css";

export type JourneyMapHandle = {
  setView: (view: JourneyView) => void;
  resize: () => void;
};

type Props = {
  onReady?: () => void;
};

const TRAIL = "#e45a24";
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
  if (stop.always) el.dataset.always = "true";
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

function withRouteLayers(base: StyleSpecification): StyleSpecification {
  const style = structuredClone(base);
  style.sources = {
    ...style.sources,
    "trail-ghost": {
      type: "geojson",
      data: lineFeature("trail-ghost", orangeTrail),
    },
    "trail-active": {
      type: "geojson",
      data: lineFeature("trail-active", sliceLine(orangeTrail, 0, 0.002)),
    },
    flights: {
      type: "geojson",
      data: lineFeature("flight-active", sliceLine(flightOut, 0, 0.002)),
    },
  };
  style.layers = [
    ...style.layers,
    {
      id: "trail-ghost-glow",
      type: "line",
      source: "trail-ghost",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff6ee",
        "line-width": 10,
        "line-opacity": 0.22,
        "line-blur": 2,
      },
    },
    {
      id: "trail-ghost",
      type: "line",
      source: "trail-ghost",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 2.4,
        "line-opacity": 0.38,
      },
    },
    {
      id: "trail-active-glow",
      type: "line",
      source: "trail-active",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 14,
        "line-opacity": 0.28,
        "line-blur": 3.5,
      },
    },
    {
      id: "trail-active-casing",
      type: "line",
      source: "trail-active",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff6ee",
        "line-width": 7.5,
        "line-opacity": 0.92,
      },
    },
    {
      id: "trail-active",
      type: "line",
      source: "trail-active",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 3.6,
        "line-opacity": 1,
      },
    },
    {
      id: "route-flight-glow",
      type: "line",
      source: "flights",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff6ee",
        "line-width": 6,
        "line-opacity": 0,
        "line-blur": 1.4,
      },
    },
    {
      id: "route-flight",
      type: "line",
      source: "flights",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 2.2,
        "line-dasharray": [2.4, 1.8],
        "line-opacity": 0,
      },
    },
  ];
  return style;
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
      const showGhost = view.phase === "overview" || view.phase === "day";
      const showActive = view.phase === "day" || (view.phase === "overview" && view.trailT > 0.02);
      setLineOpacity("trail-ghost-glow", showGhost ? 0.2 : 0);
      setLineOpacity("trail-ghost", showGhost ? 0.34 : 0);
      setLineOpacity("trail-active-glow", showActive ? 0.28 : 0);
      setLineOpacity("trail-active-casing", showActive ? 0.92 : 0);
      setLineOpacity("trail-active", showActive ? 1 : 0);

      const t = Math.min(1, Math.max(0.002, view.phase === "overview" && view.trailT < 0.02 ? 0.002 : view.trailT));
      if (Math.abs(t - lastTrailT.current) < 0.0015) return;
      lastTrailT.current = t;
      const source = map.getSource("trail-active") as GeoJSONSource | undefined;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: sliceLine(orangeTrail, 0, t),
        },
      });
    }

    function applyFlight(view: JourneyView) {
      const map = mapRef.current;
      if (!map?.getLayer("route-flight")) return;
      const show = view.showFlight && view.flightT > 0.003;
      const line = view.flightLeg === "home" ? flightHome : flightOut;
      const t = show ? Math.max(0.004, view.flightT) : 0.004;
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
      setLineOpacity("route-flight-glow", show ? 0.55 : 0);
    }

    function applyMarkers(view: JourneyView) {
      const map = mapRef.current;
      const markerKey = `${view.phase}|${view.dayId}|${view.expandedClusterIds.join(",")}|${view.visitedClusterIds.join(",")}|${view.flightLeg}|${view.flightT < 0.28}|${view.flightT > 0.72}`;
      if (markerKey !== lastMarkerKey.current) {
        lastMarkerKey.current = markerKey;
        map
          ?.getContainer()
          .classList.toggle(
            "map-zoomed",
            view.phase === "day" && view.dayId != null && view.dayId > 1 && view.dayId < 10,
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
          el.style.opacity = visible ? "1" : "0";
        }
      }

      const onTrail = view.phase === "day";
      const onPlane = view.phase === "flight";
      if (hereRef.current) {
        hereRef.current.getElement().style.opacity = onTrail ? "1" : "0";
        if (onTrail) {
          hereRef.current.setLngLat(
            along(orangeTrail, Math.max(0.002, view.trailT)),
          );
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

        const style = withRouteLayers(structuredClone(fallbackStyle));
        map = new MapLibreMap({
          container: mount,
          style,
          attributionControl: false,
          interactive: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          fadeDuration: prefersReducedMotion() ? 0 : 180,
          center: [11.72, 46.95],
          zoom: 6.2,
          minZoom: 1.6,
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
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(mount);

        const finishReady = () => {
          if (!map || cancelled) return;
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

        map.once("style.load", finishReady);
        if (map.isStyleLoaded()) finishReady();

        try {
          const response = await fetch(STYLE_URL);
          if (!response.ok || cancelled || !map) return;
          const nextStyle = withRouteLayers(
            adaptBasemapStyle(await response.json()),
          );
          map.setStyle(nextStyle);
          map.once("style.load", () => {
            lastTrailT.current = -1;
            lastFlightKey.current = "";
            map?.resize();
            applyViewRef.current(pendingRef.current ?? OVERVIEW);
          });
        } catch {
          // Keep the paper fallback and orange trail.
        }
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
