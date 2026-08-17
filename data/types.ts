export type LngLat = [number, number];

export type TransportMode =
  | "rail"
  | "bus"
  | "trail"
  | "flight"
  | "unresolved"
  | "water";

export type TimelineEvent = {
  kind: "event";
  id: string;
  time?: string;
  title: string;
  note?: string;
  optional?: boolean;
  optionalAnnotation?: string;
  detailSlug?: string;
};

export type TimelineTransport = {
  kind: "transport";
  id: string;
  mode: TransportMode;
  label: string;
  meta?: string;
  detailSlug?: string;
};

export type TimelineOpen = {
  kind: "open";
  id: string;
  text: string;
};

export type TimelineItem = TimelineEvent | TimelineTransport | TimelineOpen;

export type LodgingKind = "hostel" | "hut" | "plane" | "tbd";

export type Lodging = {
  slug: string;
  name: string;
  context: string;
  kind: LodgingKind;
  todo?: string;
  address?: string;
  lngLat?: LngLat;
};

export type PracticalItem = {
  text: string;
  todo?: boolean;
};

export type MapFrame = {
  bounds: [number, number, number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  showFlight?: boolean;
};

export type Day = {
  id: number;
  isoDate: string;
  weekday: string;
  weekdayInitial: string;
  monthDay: string;
  stripLabel: string;
  title: string;
  summary: string;
  isHikeDay: boolean;
  act: 1 | 2 | 3;
  mapFrame: MapFrame;
  timeline: TimelineItem[];
  lodging: Lodging;
  practical: PracticalItem[];
};

export type Destination = {
  slug: string;
  name: string;
  dates: string;
  dayIds: number[];
  lodging: string;
  transportIn: string;
  transportOut: string;
  photo: string;
  photoAlt: string;
  summary: string;
  stops?: string[];
  lngLat: LngLat;
};

export type Essential = {
  id: string;
  title: string;
  body: string;
};

export type DetailRecord = {
  slug: string;
  dayId: number;
  title: string;
  kind: "stay" | "hike" | "train" | "reservation" | "note";
  body: string;
  extra?: string;
  todo?: string;
};

export type SpotKind = "city" | "hut" | "tbd" | "airport" | "town" | "station";

export type OvernightStop = {
  id: string;
  lngLat: LngLat;
  label: string;
  kind: SpotKind;
  destinationSlug?: string;
  detailSlug?: string;
  days: number[];
  always?: boolean;
  clusterId?: string;
};

export type StopCluster = {
  id: string;
  label: string;
  lngLat: LngLat;
  stopIds: string[];
  expandOnDays: number[];
  anchor?: "left" | "right" | "top" | "bottom";
};

export type PlaceLabel = {
  id: string;
  lngLat: LngLat;
  label: string;
  destinationSlug: string;
  anchor?: "left" | "right" | "top" | "bottom";
};

export type RouteSegment = {
  id: string;
  mode: TransportMode;
  days: number[];
  coordinates: LngLat[];
  label?: string;
};
