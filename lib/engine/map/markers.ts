import { Marker, type Map as MapLibreMap } from "maplibre-gl";
import { along, bearingBetween, formatLngLat } from "../geo";
import type { JourneyView, OvernightStop, PhotoPin, StopCluster } from "../types";
import type { TripMapData } from "./types";

const MARKER_OPTS = {
  pitchAlignment: "viewport" as const,
  rotationAlignment: "viewport" as const,
};

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
  const badge =
    cluster.stopIds.length > 1
      ? `<span class="map-cluster-count">${cluster.stopIds.length}</span>`
      : "";
  el.innerHTML = `${badge}<span class="map-cluster-label">${cluster.label}</span>`;
  return el;
}

const PHOTO_PLACEHOLDER_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
  '<path fill="none" stroke="currentColor" stroke-width="1.6" ' +
  'd="M4 8.5h3l1.4-2h7.2l1.4 2H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z"/>' +
  '<circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
  "</svg>";

function photoPinElement(pin: PhotoPin) {
  const el = document.createElement("div");
  el.className = "map-photo-pin";
  el.dataset.pin = pin.id;
  el.dataset.days = pin.days.join(",");
  if (pin.clusterId) el.dataset.cluster = pin.clusterId;
  if (pin.tilt) el.style.setProperty("--photo-tilt", `${pin.tilt}deg`);
  const frame = pin.photo
    ? `<span class="map-photo-pin-frame"><img class="map-photo-pin-img" src="${pin.photo.pinSrc}" alt="${pin.photo.alt.replace(/"/g, "&quot;")}" width="128" height="128" loading="lazy" decoding="async" /></span>`
    : `<span class="map-photo-pin-frame"><span class="map-photo-pin-empty" aria-hidden="true">${PHOTO_PLACEHOLDER_ICON}</span></span>`;
  el.innerHTML = `${frame}<span class="map-photo-pin-caption">${pin.caption}</span><span class="map-photo-pin-stem"></span><span class="map-photo-pin-dot"></span>`;
  return el;
}

function planeElement() {
  const el = document.createElement("div");
  el.className = "map-plane is-hidden";
  el.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2.2l2.4 7.2 7.4 1.6-7.4 1.2L12 21.8l-2.4-9.6L2.2 11l7.4-1.6z"/></svg>';
  return el;
}

function clusterAnchor(cluster: StopCluster) {
  if (cluster.anchor === "left") return "right" as const;
  if (cluster.anchor === "right") return "left" as const;
  if (cluster.anchor === "top") return "bottom" as const;
  return "center" as const;
}

export function createMarkerController(map: MapLibreMap, data: TripMapData) {
  const stopMarkers: Marker[] = [];
  const clusterMarkers: Marker[] = [];
  const photoMarkers: Marker[] = [];

  for (const cluster of data.stopClusters) {
    clusterMarkers.push(
      new Marker({
        element: clusterElement(cluster),
        anchor: clusterAnchor(cluster),
        ...MARKER_OPTS,
      })
        .setLngLat(cluster.lngLat)
        .addTo(map),
    );
  }

  for (const stop of data.overnightStops) {
    stopMarkers.push(
      new Marker({
        element: pinElement(stop),
        anchor: "top-left",
        offset: [-5, -7],
        ...MARKER_OPTS,
      })
        .setLngLat(stop.lngLat)
        .addTo(map),
    );
  }

  for (const pin of data.photoPins) {
    const marker = new Marker({
      element: photoPinElement(pin),
      anchor: "bottom",
      offset: pin.offset ? [pin.offset[0], pin.offset[1] + 4] : [0, 4],
      ...MARKER_OPTS,
    })
      .setLngLat(pin.lngLat)
      .addTo(map);
    marker.getElement().classList.add("is-hidden");
    photoMarkers.push(marker);
  }

  const unresolved = document.createElement("div");
  unresolved.className = "map-unresolved";
  unresolved.textContent = "?";
  unresolved.dataset.days = data.markerRules.unresolvedDays.join(",");
  stopMarkers.push(
    new Marker({ element: unresolved, anchor: "center", ...MARKER_OPTS })
      .setLngLat(data.unresolvedPoint)
      .addTo(map),
  );

  const hereElement = document.createElement("div");
  hereElement.className = "map-here is-hidden";
  const hereMarker = new Marker({
    element: hereElement,
    anchor: "center",
    ...MARKER_OPTS,
  })
    .setLngLat(data.trail[0])
    .addTo(map);
  const planeMarker = new Marker({
    element: planeElement(),
    anchor: "center",
    pitchAlignment: "viewport",
    rotationAlignment: "map",
  })
    .setLngLat(data.flightOut[0])
    .addTo(map);

  const stopIds = new Set(data.overnightStops.map((stop) => stop.id));
  let lastMarkerKey = "";

  function photoFocusTarget(pin: PhotoPin) {
    if (pin.focusId) return pin.focusId;
    const candidate = data.markerRules.photoFocusOverrides[pin.id] ?? pin.id;
    return stopIds.has(candidate) ? candidate : null;
  }

  function apply(view: JourneyView) {
    const photoZoomGates = data.photoPins
      .map((pin) => Number(view.zoom >= (pin.minZoom ?? 0)))
      .join("");
    const markerKey = `${view.phase}|${view.dayId}|${view.expandedClusterIds.join(",")}|${view.visitedClusterIds.join(",")}|${view.flightLeg}|${view.focusStopId}|${photoZoomGates}|${view.flightT < 0.28}|${view.flightT > 0.72}`;
    if (markerKey !== lastMarkerKey) {
      lastMarkerKey = markerKey;
      map
        .getContainer()
        .classList.toggle("map-zoomed", Boolean(view.focusStopId) || view.zoom >= 12.55);

      for (const marker of clusterMarkers) {
        const id = marker.getElement().dataset.cluster ?? "";
        const expanded = view.expandedClusterIds.includes(id);
        const visited = view.visitedClusterIds.includes(id);
        const visible =
          view.phase === "overview" || (view.phase === "day" && !expanded && !visited);
        marker.getElement().classList.toggle("is-hidden", !visible);
      }

      for (const marker of stopMarkers) {
        const el = marker.getElement();
        const stopId = el.dataset.stop ?? "";
        const clusterId = el.dataset.cluster;
        const expanded = clusterId
          ? view.expandedClusterIds.includes(clusterId)
          : false;
        const visited = clusterId ? view.visitedClusterIds.includes(clusterId) : false;
        const isUnresolved = el.classList.contains("map-unresolved");
        let visible = false;
        let visitedLook = false;

        if (stopId === data.markerRules.outboundOriginStopId) {
          visible =
            view.flightLeg === "out" ||
            (view.flightLeg === "home" && view.flightT > 0.55);
        } else if (stopId === data.markerRules.outboundArrivalStopId) {
          visible =
            (view.phase === "flight" && view.flightLeg === "out") ||
            (view.phase === "day" && expanded);
        } else if (isUnresolved) {
          visible =
            view.phase === "day" &&
            data.markerRules.unresolvedDays.includes(view.dayId ?? -1);
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

      photoMarkers.forEach((marker, index) => {
        const pin = data.photoPins[index];
        const expanded = pin.clusterId
          ? view.expandedClusterIds.includes(pin.clusterId)
          : true;
        const focusTarget = photoFocusTarget(pin);
        const visible =
          view.phase === "day" &&
          expanded &&
          view.zoom >= (pin.minZoom ?? 0) &&
          (focusTarget
            ? view.focusStopId === focusTarget
            : pin.days.includes(view.dayId ?? -1));
        marker.getElement().classList.toggle("is-hidden", !visible);
      });
    }

    const herePosition =
      view.here ??
      (view.phase === "day" || (view.phase === "overview" && view.trailT > 0.02)
        ? along(data.trail, Math.max(0.002, view.trailT))
        : null);
    const onPlane = Boolean(view.showFlight);
    hereMarker.getElement().classList.toggle("is-hidden", !(herePosition && !onPlane));
    if (herePosition && !onPlane) hereMarker.setLngLat(herePosition);
    planeMarker.getElement().classList.toggle("is-hidden", !onPlane);
    if (onPlane) {
      const line = view.flightLeg === "home" ? data.flightHome : data.flightOut;
      const progress = Math.max(0.004, view.flightT);
      const here = along(line, progress);
      const ahead = along(line, Math.min(1, progress + 0.012));
      planeMarker.setLngLat(here);
      planeMarker.setRotation(bearingBetween(here, ahead));
    }
  }

  function destroy() {
    [...stopMarkers, ...clusterMarkers, ...photoMarkers, hereMarker, planeMarker].forEach(
      (marker) => marker.remove(),
    );
  }

  return { apply, destroy };
}

export type MarkerController = ReturnType<typeof createMarkerController>;
