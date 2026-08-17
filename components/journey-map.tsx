"use client";

import {
  LngLat as MapLngLat,
  Map as MapLibreMap,
  Marker,
} from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  groundLine,
  overnightStops,
  placeLabels,
  routeSegments,
  unresolvedPoint,
} from "@/data/route";
import type { MapFrame } from "@/data/types";
import { adaptBasemapStyle, fallbackStyle, STYLE_URL } from "@/lib/basemap-style";
import {
  along,
  centerOfBounds,
  nearestT,
  sliceLine,
  type LngLat,
} from "@/lib/geo";
import { animateValue, prefersReducedMotion } from "@/lib/motion";
import "maplibre-gl/dist/maplibre-gl.css";

export type JourneyMapHandle = {
  showJourney: (opts?: { draw?: boolean }) => void;
  showDay: (dayId: number, frame: MapFrame, opts?: { alongRoute?: boolean }) => void;
  setScrub: (from: MapFrame, to: MapFrame, progress: number) => void;
  setEmphasis: (dayId: number | null) => void;
  resize: () => void;
};

type Props = {
  interactive: boolean;
  onDestination: (slug: string) => void;
  onExpand?: () => void;
  onReady?: () => void;
};

const SESSION_DRAW_KEY = "europe-2026-route-drawn";

function lineFeature(
  id: string,
  coordinates: LngLat[],
  properties: Record<string, unknown>,
) {
  return {
    type: "Feature" as const,
    id,
    properties: { id, ...properties },
    geometry: { type: "LineString" as const, coordinates },
  };
}

function collection(features: ReturnType<typeof lineFeature>[]) {
  return { type: "FeatureCollection" as const, features };
}

function cameraForFrame(map: MapLibreMap, frame: MapFrame) {
  const camera = map.cameraForBounds(frame.bounds, {
    padding: { top: 48, right: 36, bottom: 56, left: 36 },
    bearing: frame.bearing ?? 0,
    pitch: frame.pitch ?? 0,
  });
  if (!camera?.center) {
    return {
      center: centerOfBounds(frame.bounds),
      zoom: frame.zoom ?? 7,
      bearing: frame.bearing ?? 0,
      pitch: frame.pitch ?? 0,
    };
  }
  const ll = MapLngLat.convert(camera.center);
  return {
    center: [ll.lng, ll.lat] as LngLat,
    zoom: camera.zoom ?? frame.zoom ?? 7,
    bearing: frame.bearing ?? 0,
    pitch: frame.pitch ?? 0,
  };
}

export const JourneyMap = forwardRef<JourneyMapHandle, Props>(
  function JourneyMap({ interactive, onDestination, onExpand, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const cancelRef = useRef<() => void>(() => {});
    const lastFrameRef = useRef<MapFrame | null>(null);
    const destinationRef = useRef(onDestination);
    const onReadyRef = useRef(onReady);
    destinationRef.current = onDestination;
    onReadyRef.current = onReady;
    const markersRef = useRef<Marker[]>([]);
    const readyRef = useRef(false);
    const pendingRef = useRef<(() => void) | null>(null);

    function whenReady(fn: () => void) {
      if (readyRef.current && mapRef.current) fn();
      else pendingRef.current = fn;
    }

    function setEmphasis(dayId: number | null) {
      const map = mapRef.current;
      if (!map?.getLayer("route-rail")) return;

      if (dayId == null) {
        map.setPaintProperty("route-flight", "line-opacity", 0);
        map.setPaintProperty("route-rail", "line-opacity", 1);
        map.setPaintProperty("route-bus", "line-opacity", 0.7);
        map.setPaintProperty("route-trail", "line-opacity", 1);
        map.setPaintProperty("route-water", "line-opacity", 1);
        map.setPaintProperty("route-unresolved", "line-opacity", 1);
      } else {
        const expr = [
          "case",
          ["in", dayId, ["get", "days"]],
          1,
          0.2,
        ] as never;
        const busExpr = [
          "case",
          ["in", dayId, ["get", "days"]],
          0.7,
          0.2,
        ] as never;
        map.setPaintProperty("route-rail", "line-opacity", expr);
        map.setPaintProperty("route-bus", "line-opacity", busExpr);
        map.setPaintProperty("route-trail", "line-opacity", expr);
        map.setPaintProperty("route-water", "line-opacity", expr);
        map.setPaintProperty("route-unresolved", "line-opacity", expr);
        map.setPaintProperty("route-flight", "line-opacity", expr);
      }

      for (const marker of markersRef.current) {
        const days = (marker.getElement().dataset.days ?? "")
          .split(",")
          .map(Number)
          .filter(Boolean);
        const always = marker.getElement().dataset.always === "true";
        const active = dayId == null || always || days.includes(dayId);
        marker.getElement().style.opacity = active ? "1" : "0.28";
      }
    }

    function applyCamera(frame: MapFrame, alongRoute: boolean) {
      const map = mapRef.current;
      if (!map) return;
      cancelRef.current();
      const next = cameraForFrame(map, frame);
      const prevFrame = lastFrameRef.current;
      lastFrameRef.current = frame;

      if (!alongRoute || !prevFrame || prefersReducedMotion()) {
        map.jumpTo({
          center: next.center,
          zoom: next.zoom,
          bearing: next.bearing,
          pitch: next.pitch,
        });
        return;
      }

      const from = cameraForFrame(map, prevFrame);
      const fromFlight = Boolean(prevFrame.showFlight);
      const toFlight = Boolean(frame.showFlight);
      const follow =
        !fromFlight && !toFlight && groundLine.length > 1;

      const t0 = follow ? nearestT(groundLine, from.center) : 0;
      const t1 = follow ? nearestT(groundLine, next.center) : 1;

      cancelRef.current = animateValue(720, (p) => {
        const center = follow
          ? along(groundLine, t0 + (t1 - t0) * p)
          : ([
              from.center[0] + (next.center[0] - from.center[0]) * p,
              from.center[1] + (next.center[1] - from.center[1]) * p,
            ] as LngLat);
        map.jumpTo({
          center,
          zoom: from.zoom + (next.zoom - from.zoom) * p,
          bearing: 0,
          pitch: 0,
        });
      });
    }

    function playDrawOn() {
      const map = mapRef.current;
      if (!map?.getSource("draw")) return;
      if (prefersReducedMotion()) {
        map.setLayoutProperty("route-draw", "visibility", "none");
        return;
      }
      try {
        if (sessionStorage.getItem(SESSION_DRAW_KEY)) {
          map.setLayoutProperty("route-draw", "visibility", "none");
          return;
        }
      } catch {
        // sessionStorage may be blocked
      }

      map.setLayoutProperty("route-draw", "visibility", "visible");
      for (const layer of [
        "route-rail",
        "route-bus",
        "route-trail",
        "route-water",
        "route-unresolved",
      ]) {
        if (map.getLayer(layer)) map.setPaintProperty(layer, "line-opacity", 0);
      }

      cancelRef.current = animateValue(1800, (p) => {
        const source = map.getSource("draw") as GeoJSONSource | undefined;
        source?.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: sliceLine(groundLine, 0, Math.max(0.001, p)),
          },
        });
      }, () => {
        map.setLayoutProperty("route-draw", "visibility", "none");
        setEmphasis(null);
        try {
          sessionStorage.setItem(SESSION_DRAW_KEY, "1");
        } catch {
          // ignore
        }
      });
    }

    useImperativeHandle(ref, () => ({
      showJourney: ({ draw } = {}) => {
        whenReady(() => {
          const map = mapRef.current;
          if (!map) return;
          setEmphasis(null);
          const frame: MapFrame = { bounds: [10.95, 45.28, 12.55, 48.35] };
          applyCamera(frame, true);
          if (draw) playDrawOn();
        });
      },
      showDay: (dayId, frame, { alongRoute = true } = {}) => {
        whenReady(() => {
          setEmphasis(dayId);
          applyCamera(frame, alongRoute);
        });
      },
      setScrub: (from, to, progress) => {
        const map = mapRef.current;
        if (!map) return;
        cancelRef.current();
        const a = cameraForFrame(map, from);
        const b = cameraForFrame(map, to);
        const follow = !from.showFlight && !to.showFlight;
        const t0 = follow ? nearestT(groundLine, a.center) : 0;
        const t1 = follow ? nearestT(groundLine, b.center) : 1;
        const p = progress;
        const center = follow
          ? along(groundLine, t0 + (t1 - t0) * p)
          : ([
              a.center[0] + (b.center[0] - a.center[0]) * p,
              a.center[1] + (b.center[1] - a.center[1]) * p,
            ] as LngLat);
        map.jumpTo({
          center,
          zoom: a.zoom + (b.zoom - a.zoom) * p,
          bearing: 0,
          pitch: 0,
        });
      },
      setEmphasis: (dayId) => whenReady(() => setEmphasis(dayId)),
      resize: () => mapRef.current?.resize(),
    }));

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;
      let cancelled = false;
      let map: MapLibreMap | null = null;
      let observer: ResizeObserver | undefined;

      async function init() {
        let style = fallbackStyle;
        try {
          const response = await fetch(STYLE_URL);
          if (response.ok) {
            style = adaptBasemapStyle(await response.json());
          }
        } catch {
          style = fallbackStyle;
        }
        const container = containerRef.current;
        if (cancelled || !container) return;

        const features = routeSegments.map((segment) =>
          lineFeature(segment.id, segment.coordinates, {
            mode: segment.mode,
            days: segment.days,
          }),
        );

        style.sources = {
          ...style.sources,
          route: {
            type: "geojson",
            data: collection(features),
          },
          draw: {
            type: "geojson",
            lineMetrics: true,
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: groundLine },
            },
          },
          unresolved: {
            type: "geojson",
            lineMetrics: true,
            data: lineFeature(
              "unresolved-exit",
              routeSegments.find((s) => s.id === "unresolved-exit")?.coordinates ?? [],
              { mode: "unresolved", days: [8] },
            ),
          },
        };

        style.layers = [
          ...style.layers,
          {
            id: "route-draw",
            type: "line",
            source: "draw",
            layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
            paint: {
              "line-color": "#1F2421",
              "line-width": 2.4,
            },
          },
          {
            id: "route-rail",
            type: "line",
            source: "route",
            filter: ["==", ["get", "mode"], "rail"],
            layout: { "line-cap": "butt", "line-join": "round" },
            paint: {
              "line-color": "#1F2421",
              "line-width": 2.5,
              "line-dasharray": [2.2, 1.6],
            },
          },
          {
            id: "route-bus",
            type: "line",
            source: "route",
            filter: ["==", ["get", "mode"], "bus"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#1F2421",
              "line-width": 2,
              "line-opacity": 0.7,
            },
          },
          {
            id: "route-trail",
            type: "line",
            source: "route",
            filter: ["==", ["get", "mode"], "trail"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#4E6E58",
              "line-width": 2.5,
              "line-dasharray": [0.3, 1.4],
            },
          },
          {
            id: "route-water",
            type: "line",
            source: "route",
            filter: ["==", ["get", "mode"], "water"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#3E5C76",
              "line-width": 2.5,
            },
          },
          {
            id: "route-flight",
            type: "line",
            source: "route",
            filter: ["==", ["get", "mode"], "flight"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#8A8F98",
              "line-width": 1.5,
              "line-dasharray": [4, 2.6],
              "line-opacity": 0,
            },
          },
          {
            id: "route-unresolved",
            type: "line",
            source: "unresolved",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-width": 2.5,
              "line-dasharray": [0.35, 1.4],
              "line-gradient": [
                "interpolate",
                ["linear"],
                ["line-progress"],
                0,
                "#B3592E",
                0.65,
                "rgba(179,89,46,0.45)",
                1,
                "rgba(179,89,46,0)",
              ],
            },
          },
        ];

        map = new MapLibreMap({
          container,
          style,
          attributionControl: { compact: true },
          interactive: true,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          fadeDuration: prefersReducedMotion() ? 0 : 300,
          bounds: [10.95, 45.28, 12.55, 48.35],
          fitBoundsOptions: { padding: 40 },
        });
        map.touchZoomRotate.disableRotation();
        mapRef.current = map;

        map.on("load", () => {
          if (!map) return;
          for (const stop of overnightStops) {
            const el = document.createElement("button");
            el.type = "button";
            el.className = stop.kind === "hut" ? "map-hut" : "map-stop";
            el.dataset.days = stop.days.join(",");
            el.setAttribute("aria-label", stop.label);
            if (stop.kind === "hut") {
              el.innerHTML =
                '<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><polygon points="7,1.2 13,6.6 13,13 1,13 1,6.6" fill="#4E6E58"/></svg>';
            }
            if (stop.kind === "tbd") el.classList.add("map-stop-tbd");
            el.addEventListener("click", (event) => {
              event.stopPropagation();
              if (stop.destinationSlug) destinationRef.current(stop.destinationSlug);
            });
            const marker = new Marker({ element: el, anchor: "center" })
              .setLngLat(stop.lngLat)
              .addTo(map);
            markersRef.current.push(marker);
          }

          for (const place of placeLabels) {
            const el = document.createElement("button");
            el.type = "button";
            el.className = `map-label map-label-${place.anchor ?? "right"}`;
            el.textContent = place.label;
            el.dataset.always = "true";
            el.addEventListener("click", (event) => {
              event.stopPropagation();
              destinationRef.current(place.destinationSlug);
            });
            const marker = new Marker({
              element: el,
              anchor: place.anchor === "left" ? "right" : place.anchor === "right" ? "left" : "bottom",
            })
              .setLngLat(place.lngLat)
              .addTo(map);
            markersRef.current.push(marker);
          }

          const q = document.createElement("div");
          q.className = "map-unresolved";
          q.textContent = "?";
          q.dataset.days = "8";
          const qMarker = new Marker({ element: q, anchor: "center" })
            .setLngLat(unresolvedPoint)
            .addTo(map);
          markersRef.current.push(qMarker);

          const note = document.createElement("div");
          note.className = "map-unresolved-caption";
          note.textContent = "route to be decided";
          note.dataset.days = "8";
          const noteMarker = new Marker({ element: note, anchor: "top" })
            .setLngLat(unresolvedPoint)
            .addTo(map);
          markersRef.current.push(noteMarker);

          readyRef.current = true;
          pendingRef.current?.();
          pendingRef.current = null;
          onReadyRef.current?.();
        });

        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container);
      }

      void init();

      return () => {
        cancelled = true;
        cancelRef.current();
        observer?.disconnect();
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        map?.remove();
        mapRef.current = null;
        readyRef.current = false;
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      const toggle = (handler: { enable: () => void; disable: () => void }) => {
        if (interactive) handler.enable();
        else handler.disable();
      };
      toggle(map.dragPan);
      toggle(map.scrollZoom);
      toggle(map.boxZoom);
      toggle(map.doubleClickZoom);
      toggle(map.keyboard);
      toggle(map.touchZoomRotate);
      map.touchZoomRotate.disableRotation();
    }, [interactive]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        onClick={() => {
          if (!interactive) onExpand?.();
        }}
      />
    );
  },
);
