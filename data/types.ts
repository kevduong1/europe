import type { Photo } from "./photos";

export type LngLat = [number, number];

export type LocalRouteId =
  | "airport-transfer"
  | "hbf-wombat"
  | "wombat-hbf"
  | "english-garden"
  | "garden-hofbrauhaus";

export type TransportMode =
  | "rail"
  | "bus"
  | "trail"
  | "gondola"
  | "flight"
  | "unresolved"
  | "water";

export type TimelineEvent = {
  kind: "event";
  id: string;
  emoji?: string;
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
};

export type PracticalItem = {
  text: string;
  todo?: boolean;
};

export type Day = {
  id: number;
  isoDate: string;
  weekday: string;
  monthDay: string;
  stripLabel: string;
  title: string;
  summary: string;
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

export type DetailKind = "stay" | "hike" | "train" | "flight" | "bus" | "note";

export type DetailRecord = {
  slug: string;
  dayId: number;
  title: string;
  kind: DetailKind;
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

/**
 * A photo marker on the map. `photo: null` means the image hasn't been
 * sourced yet — a pin that should render a placeholder, not a broken path.
 * `days`/`clusterId` mirror `OvernightStop`'s show/hide keying.
 */
export type PhotoPin = {
  id: string;
  lngLat: LngLat;
  photo: Photo | null;
  secondaryPhoto?: Photo;
  caption: string;
  days: number[];
  clusterId?: string;
  /** Camera focus id that reveals this pin when it is not an overnight stop. */
  focusId?: string;
  /** Viewport-pixel nudge used to keep nearby photo cards from overlapping. */
  offset?: [number, number];
};
