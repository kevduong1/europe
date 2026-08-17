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
  placeLabels,
  unresolvedPoint,
} from "@/data/route";
import type { MapFrame, OvernightStop } from "@/data/types";
import { adaptBasemapStyle, fallbackStyle, STYLE_URL } from "@/lib/basemap-style";
import {
  along,
  centerOfBounds,
  formatLngLat,
  sliceLine,
  type LngLat,
} from "@/lib/geo";
import type { JourneyView } from "@/lib/journey-view";
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
  const top = Math.min(72, Math.round(height * 0.1));
  const side = Math.min(28, Math.round(width * 0.07));
  const bottom = Math.min(Math.round(height * 0.42), height - top - 96);
  return {
    top,
    right: side,
    bottom: Math.max(72, bottom),
    left: side,
  };
}

function cameraForFrame(map: MapLibreMap, bounds: MapFrame["bounds"]) {
  const padding = cameraPadding(map);
  const camera = map.cameraForBounds(bounds, {
    padding,
    bearing: 0,
    pitch: 0,
  });
  if (!camera?.center) {
    return {
      center: centerOfBounds(bounds),
      zoom: 7,
      bearing: 0,
      pitch: 0,
    };
  }
  const ll = MapLngLat.convert(camera.center);
  return {
    center: [ll.lng, ll.lat] as LngLat,
    zoom: camera.zoom ?? 7,
    bearing: 0,
    pitch: 0,
  };
}

function pinElement(stop: OvernightStop) {
  const el = document.createElement("div");
  el.className = `map-pin map-pin-${stop.kind}`;
  el.dataset.days = stop.days.join(",");
  if (stop.always) el.dataset.always = "true";
  el.innerHTML = `<span class="map-pin-dot"></span><span class="map-pin-copy"><span class="map-pin-label">${stop.label}</span><span class="map-pin-coords">${formatLngLat(stop.lngLat)}</span></span>`;
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
      data: lineFeature("trail-active", sliceLine(orangeTrail, 0, 1)),
    },
    flights: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          lineFeature("flight-out", flightOut),
          lineFeature("flight-home", flightHome),
        ],
      },
    },
  };
  style.layers = [
    ...style.layers,
    {
      id: "trail-ghost-casing",
      type: "line",
      source: "trail-ghost",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff3ec",
        "line-width": 8,
        "line-opacity": 0.9,
      },
    },
    {
      id: "trail-ghost",
      type: "line",
      source: "trail-ghost",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 3.2,
        "line-opacity": 0.45,
      },
    },
    {
      id: "trail-active-casing",
      type: "line",
      source: "trail-active",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff3ec",
        "line-width": 9,
        "line-opacity": 0.95,
      },
    },
    {
      id: "trail-active",
      type: "line",
      source: "trail-active",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 3.8,
        "line-opacity": 1,
      },
    },
    {
      id: "route-flight",
      type: "line",
      source: "flights",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": TRAIL,
        "line-width": 1.8,
        "line-dasharray": [3.2, 2.4],
        "line-opacity": 0,
      },
    },
  ];
  return style;
}

export const JourneyMap = forwardRef<JourneyMapHandle, Props>(
  function JourneyMap({ onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const hereRef = useRef<Marker | null>(null);
    const readyRef = useRef(false);
    const pendingRef = useRef<JourneyView | null>(null);
    const lastTrailT = useRef(-1);
    const lastFlight = useRef<boolean | null>(null);
    const lastDay = useRef<number | null | undefined>(undefined);
    const onReadyRef = useRef(onReady);
    const applyViewRef = useRef<(view: JourneyView) => void>(() => {});
    onReadyRef.current = onReady;

    function applyTrail(trailT: number) {
      const map = mapRef.current;
      if (!map) return;
      const t = Math.min(1, Math.max(0.002, trailT));
      if (Math.abs(t - lastTrailT.current) < 0.002) return;
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
      const here = hereRef.current;
      if (here) here.setLngLat(along(orangeTrail, t));
    }

    function applyEmphasis(dayId: number | null) {
      if (lastDay.current === dayId) return;
      lastDay.current = dayId;
      const map = mapRef.current;
      map
        ?.getContainer()
        .classList.toggle("map-zoomed", dayId != null && dayId > 1 && dayId < 10);

      for (const marker of markersRef.current) {
        const days = (marker.getElement().dataset.days ?? "")
          .split(",")
          .map(Number)
          .filter(Boolean);
        const always = marker.getElement().dataset.always === "true";
        const city = marker.getElement().dataset.city === "true";
        const active =
          dayId == null
            ? always || city
            : always || city || days.includes(dayId);
        marker.getElement().style.opacity = active ? "1" : "0";
      }

      if (hereRef.current) {
        hereRef.current.getElement().style.opacity = dayId == null ? "0" : "1";
      }
    }

    function applyFlight(show: boolean) {
      const map = mapRef.current;
      if (!map?.getLayer("route-flight")) return;
      if (lastFlight.current === show) return;
      lastFlight.current = show;
      map.setPaintProperty("route-flight", "line-opacity", show ? 0.9 : 0);
    }

    function applyView(view: JourneyView) {
      const map = mapRef.current;
      if (!map || !readyRef.current) {
        pendingRef.current = view;
        return;
      }
      const next = cameraForFrame(map, view.bounds);
      map.jumpTo({
        center: next.center,
        zoom: next.zoom,
        bearing: 0,
        pitch: 0,
      });
      applyTrail(view.dayId == null ? 1 : view.trailT);
      applyEmphasis(view.dayId);
      applyFlight(view.showFlight);
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

        map = new MapLibreMap({
          container: mount,
          style: withRouteLayers(structuredClone(fallbackStyle)),
          attributionControl: false,
          interactive: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          fadeDuration: prefersReducedMotion() ? 0 : 200,
          center: [11.72, 46.95],
          zoom: 6.2,
        });
        map.addControl(new AttributionControl({ compact: true }), "top-right");
        mapRef.current = map;
        map.resize();
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(mount);

        const finishReady = () => {
          if (!map || cancelled) return;
          map.resize();
          if (markersRef.current.length === 0) {
            for (const stop of overnightStops) {
              const marker = new Marker({
                element: pinElement(stop),
                anchor: "bottom-left",
              })
                .setLngLat(stop.lngLat)
                .addTo(map);
              markersRef.current.push(marker);
            }

            for (const place of placeLabels) {
              const el = document.createElement("div");
              el.className = `map-label map-label-${place.anchor ?? "right"}`;
              el.dataset.city = "true";
              el.dataset.always = "true";
              el.textContent = place.label;
              const marker = new Marker({
                element: el,
                anchor:
                  place.anchor === "left"
                    ? "right"
                    : place.anchor === "right"
                      ? "left"
                      : "bottom",
              })
                .setLngLat(place.lngLat)
                .addTo(map);
              markersRef.current.push(marker);
            }

            const q = document.createElement("div");
            q.className = "map-unresolved";
            q.textContent = "?";
            q.dataset.days = "8";
            markersRef.current.push(
              new Marker({ element: q, anchor: "center" })
                .setLngLat(unresolvedPoint)
                .addTo(map),
            );

            const hereEl = document.createElement("div");
            hereEl.className = "map-here";
            hereEl.style.opacity = "0";
            hereRef.current = new Marker({ element: hereEl, anchor: "center" })
              .setLngLat(orangeTrail[0])
              .addTo(map);
          }

          readyRef.current = true;
          if (pendingRef.current) applyViewRef.current(pendingRef.current);
          else {
            applyViewRef.current({
              bounds: [10.95, 45.28, 12.55, 48.35],
              showFlight: false,
              trailT: 1,
              dayId: null,
              label: "The route",
            });
          }
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
            map?.resize();
            if (pendingRef.current) applyViewRef.current(pendingRef.current);
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
        hereRef.current?.remove();
        hereRef.current = null;
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
