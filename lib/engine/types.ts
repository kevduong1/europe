export type LngLat = [number, number];

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

export type TimelineOpen = { kind: "open"; id: string; text: string };
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

export type PracticalItem = { text: string; todo?: boolean };

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

export type Essential = { id: string; title: string; body: string };
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

export type Photo = { src: string; pinSrc: string; alt: string; credit: string };

export type PhotoPin = {
  id: string;
  lngLat: LngLat;
  photo: Photo | null;
  caption: string;
  days: number[];
  clusterId?: string;
  focusId?: string;
  minZoom?: number;
  offset?: [number, number];
  tilt?: number;
};

export type JourneyPhase = "overview" | "flight" | "day";
export type FlightLeg = "out" | "home" | null;

export type JourneyView = {
  phase: JourneyPhase;
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  showFlight: boolean;
  flightT: number;
  flightLeg: FlightLeg;
  trailT: number;
  dayId: number | null;
  label: string;
  expandedClusterIds: readonly string[];
  visitedClusterIds: readonly string[];
  here: LngLat | null;
  focusStopId: string | null;
  localRouteId: string | null;
  localRouteT: number;
};

export type BeatDefinition = {
  /** Scroll length in vh for this beat's box. */
  space: number;
  /** Camera for this beat at progress t in the inclusive range 0..1. */
  view: (t: number) => JourneyView;
  /** Optional override for how late the next day's camera bleeds in. */
  handoff?: number;
};

export type DayModule = {
  day: Day;
  beats: Record<string, BeatDefinition>;
  enterView: JourneyView;
};

export type TripMeta = { title: string; eyebrow: string; editorial: string };

export type TripRegistry = {
  readonly modules: readonly DayModule[];
  readonly days: readonly Day[];
  readonly overview: JourneyView;
  day(dayId: number): DayModule | undefined;
  beat(dayId: number, beatId: string): BeatDefinition | undefined;
};

export type TripDefinition = {
  meta: TripMeta;
  dayModules: readonly DayModule[];
  days: readonly Day[];
  destinations: readonly Destination[];
  essentials: readonly Essential[];
  details: readonly DetailRecord[];
  registry: TripRegistry;
};
