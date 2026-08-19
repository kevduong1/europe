"use client";

import {
  AttributionControl,
  Map as MapLibreMap,
  setWorkerUrl,
} from "maplibre-gl";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createViewController, type ViewController } from "@/lib/engine/map/apply-view";
import { loadPaperStyle } from "@/lib/engine/map/basemap-style";
import { addRouteLayers } from "@/lib/engine/map/layers";
import {
  createMarkerController,
  type MarkerController,
} from "@/lib/engine/map/markers";
import { prefersReducedMotion } from "@/lib/engine/motion";
import type { JourneyView } from "@/lib/engine/types";
import { OVERVIEW } from "@/trip";
import { tripMapData } from "@/trip/map-data";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type JourneyMapHandle = { setView: (view: JourneyView) => void };
type Props = { onReady?: () => void };

function waitForSize(element: HTMLElement, signal: { cancelled: boolean }) {
  if (element.clientWidth > 16 && element.clientHeight > 16) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (
        signal.cancelled ||
        (element.clientWidth > 16 && element.clientHeight > 16)
      ) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(element);
  });
}

export const JourneyMap = forwardRef<JourneyMapHandle, Props>(
  function JourneyMap({ onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<MarkerController | null>(null);
    const viewControllerRef = useRef<ViewController | null>(null);
    const readyRef = useRef(false);
    const pendingRef = useRef<JourneyView | null>(null);
    const lastViewRef = useRef<JourneyView | null>(null);
    const onReadyRef = useRef(onReady);
    const applyViewRef = useRef<(view: JourneyView) => void>(() => {});
    onReadyRef.current = onReady;

    function applyView(view: JourneyView) {
      lastViewRef.current = view;
      if (!readyRef.current || !viewControllerRef.current) {
        pendingRef.current = view;
        return;
      }
      viewControllerRef.current.apply(view);
    }
    applyViewRef.current = applyView;

    useImperativeHandle(ref, () => ({ setView: applyView }));

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

        const style = await loadPaperStyle();
        if (signal.cancelled) return;
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
          minZoom: 1.4,
          maxZoom: 16,
          maxPitch: 70,
          pitch: 0,
          centerClampedToGround: true,
        });
        map.addControl(new AttributionControl({ compact: true }), "bottom-right");
        mapRef.current = map;
        map.resize();
        observer = new ResizeObserver(() => {
          map?.resize();
          if (lastViewRef.current) applyViewRef.current(lastViewRef.current);
        });
        observer.observe(mount);

        let finished = false;
        const finishReady = () => {
          if (!map || signal.cancelled || finished) return;
          finished = true;
          addRouteLayers(map, tripMapData);
          markersRef.current = createMarkerController(map, tripMapData);
          viewControllerRef.current = createViewController(
            map,
            tripMapData,
            markersRef.current,
          );
          map.resize();
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
        markersRef.current?.destroy();
        markersRef.current = null;
        viewControllerRef.current = null;
        map?.remove();
        mapRef.current = null;
        readyRef.current = false;
        pendingRef.current = null;
        lastViewRef.current = null;
      };
    }, []);

    return <div ref={containerRef} className="map-canvas" aria-hidden="true" />;
  },
);
