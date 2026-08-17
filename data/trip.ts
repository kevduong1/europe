import type { Day, Destination, DetailRecord, Essential } from "./types";

export const trip = {
  title: "Europe 2026",
  eyebrow: "Sept 5 – 14, 2026",
  editorial:
    "Ten days that change character as they go: cities and rail, then two hut nights and a summit over the Dolomites, a spa in Val di Fassa, then down to the lagoon. The middle is the point of the trip.",
};

export const days: Day[] = [
  {
    id: 1,
    isoDate: "2026-09-05",
    weekday: "Saturday",
    monthDay: "Sept 5",
    stripLabel: "Fly",
    title: "Fly out",
    summary: "Kansas City to Munich · sleep on the plane",
    timeline: [
      {
        kind: "event",
        id: "depart-mci",
        time: "1:45 PM",
        title: "Depart Kansas City (MCI)",
        detailSlug: "flight-mci-muc",
      },
      {
        kind: "transport",
        id: "flight-out",
        mode: "flight",
        label: "MCI → Munich",
        meta: "12+ hr overnight flight",
        detailSlug: "flight-mci-muc",
      },
    ],
    lodging: {
      slug: "the-plane",
      name: "The plane",
      context: "Overnight in the air. The first night is the crossing.",
      kind: "plane",
    },
    practical: [
      { text: "Long overnight. Arrive Munich the next morning around 10:00." },
    ],
  },
  {
    id: 2,
    isoDate: "2026-09-06",
    weekday: "Sunday",
    monthDay: "Sept 6",
    stripLabel: "Munich",
    title: "Landing in Munich",
    summary: "Airport train into the city · sleep at The Wombat Hostel",
    timeline: [
      {
        kind: "event",
        id: "arrive-muc",
        time: "10:00",
        title: "Arrive Munich (MUC)",
        detailSlug: "flight-mci-muc",
      },
      {
        kind: "transport",
        id: "airport-train",
        mode: "rail",
        label: "Airport train → München Hbf",
        meta: "Tickets at the airport",
        detailSlug: "airport-train",
      },
      {
        kind: "event",
        id: "check-in-wombat",
        title: "Check in at The Wombat Hostel",
        note: "~€30/night pp",
        detailSlug: "wombat-hostel",
      },
    ],
    lodging: {
      slug: "wombat-hostel",
      name: "The Wombat Hostel",
      context: "~€30/night pp, near the Hauptbahnhof.",
      kind: "hostel",
      todo: "Book 1–2 months out",
    },
    practical: [
      { text: "Book The Wombat Hostel 1–2 months out.", todo: true },
      { text: "Airport train tickets at the airport." },
    ],
  },
  {
    id: 3,
    isoDate: "2026-09-07",
    weekday: "Monday",
    monthDay: "Sept 7",
    stripLabel: "Munich",
    title: "Munich",
    summary: "Open day in the city · sleep at The Wombat Hostel",
    timeline: [
      {
        kind: "open",
        id: "open-munich",
        text: "Nothing planned yet — the day is open.",
      },
      {
        kind: "event",
        id: "eisbachwelle",
        title: "Eisbachwelle",
        optional: true,
        optionalAnnotation: "if it's running",
        note: "Check if the wave is active — a recent cleanup effort may have temporarily eliminated it.",
        detailSlug: "eisbachwelle",
      },
      {
        kind: "event",
        id: "english-garden",
        title: "Walk up the Englischer Garten",
        note: "Eisbachwelle up to the Kleinhesseloher See, past the Monopteros and the Chinese Tower.",
        detailSlug: "english-garden",
      },
      {
        kind: "event",
        id: "hofbrauhaus",
        title: "Hofbräuhaus am Platzl",
        note: "The famous beer hall, back in the old town.",
        detailSlug: "hofbrauhaus",
      },
    ],
    lodging: {
      slug: "wombat-hostel",
      name: "The Wombat Hostel",
      context: "Second night in Munich.",
      kind: "hostel",
    },
    practical: [],
  },
  {
    id: 4,
    isoDate: "2026-09-08",
    weekday: "Tuesday",
    monthDay: "Sept 8",
    stripLabel: "Innsbruck",
    title: "Munich → Innsbruck",
    summary: "Eurail day · sleep at Montagu Hostel",
    timeline: [
      {
        kind: "event",
        id: "leave-wombat",
        title: "Leave The Wombat Hostel",
        note: "Bags packed · the station is a short walk.",
        detailSlug: "wombat-hostel",
      },
      {
        kind: "transport",
        id: "walk-hbf",
        mode: "trail",
        label: "Walk to München Hbf",
        meta: "A few minutes from the door",
      },
      {
        kind: "transport",
        id: "train-munich-innsbruck",
        mode: "rail",
        label: "Munich Hbf → Innsbruck",
        meta: "~1h50 · Eurail",
        detailSlug: "train-munich-innsbruck",
      },
      {
        kind: "event",
        id: "check-in-montagu",
        title: "Check in at Montagu Hostel",
        note: "~€30/night pp",
        detailSlug: "montagu-hostel",
      },
    ],
    lodging: {
      slug: "montagu-hostel",
      name: "Montagu Hostel",
      context: "~€30/night pp. Book 1–2 months out.",
      kind: "hostel",
      todo: "Book 1–2 months out",
    },
    practical: [
      { text: "Eurail day." },
      { text: "Book Montagu Hostel 1–2 months out.", todo: true },
    ],
  },
  {
    id: 5,
    isoDate: "2026-09-09",
    weekday: "Wednesday",
    monthDay: "Sept 9",
    stripLabel: "Ortisei",
    title: "Into the Dolomites",
    summary: "Train, then bus, then the trail · sleep at Rifugio Resciesa",
    timeline: [
      {
        kind: "transport",
        id: "train-innsbruck-bolzano",
        mode: "rail",
        label: "Innsbruck → Bolzano",
        meta: "Morning · Eurail",
        detailSlug: "train-innsbruck-bolzano",
      },
      {
        kind: "transport",
        id: "bus-bolzano-ortisei",
        mode: "bus",
        label: "Bolzano → Ortisei",
        meta: "Bus",
        detailSlug: "bus-bolzano-ortisei",
      },
      {
        kind: "transport",
        id: "onto-the-trail",
        mode: "trail",
        label: "Ortisei → Rifugio Resciesa",
        meta: "Rail ends · trail begins",
        detailSlug: "rifugio-resciesa",
      },
    ],
    lodging: {
      slug: "rifugio-resciesa",
      name: "Rifugio Resciesa",
      context: "First hut night, above Ortisei.",
      kind: "hut",
    },
    practical: [
      { text: "Eurail day, then bus into Val Gardena." },
      {
        text: "Pack light for the hut traverse — bags stay minimal for 3 days.",
        todo: true,
      },
    ],
  },
  {
    id: 6,
    isoDate: "2026-09-10",
    weekday: "Thursday",
    monthDay: "Sept 10",
    stripLabel: "Firenze",
    title: "Resciesa to Rifugio Firenze",
    summary: "Hike across the Odle group · sleep at Rifugio Firenze",
    timeline: [
      {
        kind: "transport",
        id: "hike-resciesa-firenze",
        mode: "trail",
        label: "Resciesa → Rifugio Firenze",
        meta: "Deeper into the Dolomites",
        detailSlug: "rifugio-firenze",
      },
    ],
    lodging: {
      slug: "rifugio-firenze",
      name: "Rifugio Firenze",
      context: "Second hut night, under the Odle.",
      kind: "hut",
    },
    practical: [],
  },
  {
    id: 7,
    isoDate: "2026-09-11",
    weekday: "Friday",
    monthDay: "Sept 11",
    stripLabel: "Seceda",
    title: "Firenze to Val di Fassa",
    summary: "Summit morning on Seceda, then over to the spa at Val di Fassa",
    timeline: [
      {
        kind: "transport",
        id: "hike-firenze-seceda",
        mode: "trail",
        label: "Rifugio Firenze → Seceda",
        meta: "Morning climb to ~2,519 m",
        detailSlug: "seceda-summit",
      },
      {
        kind: "event",
        id: "seceda-summit",
        title: "Seceda summit",
        note: "The Odle ridge, straight ahead.",
        detailSlug: "seceda-summit",
      },
      {
        kind: "transport",
        id: "down-to-ortisei",
        mode: "trail",
        label: "Seceda → Ortisei",
        meta: "Cable car down",
        detailSlug: "down-to-ortisei",
      },
      {
        kind: "transport",
        id: "to-val-di-fassa",
        mode: "bus",
        label: "Ortisei → Val di Fassa",
        meta: "Over Passo Sella via Canazei",
        detailSlug: "to-val-di-fassa",
      },
      {
        kind: "event",
        id: "qc-terme-dolomiti",
        title: "QC Terme Dolomiti",
        note: "Spa afternoon, Pozza di Fassa.",
        detailSlug: "qc-terme-dolomiti",
      },
    ],
    lodging: {
      slug: "val-di-fassa-night",
      name: "Lodging to be decided",
      context: "Somewhere in Val di Fassa — the exact stay isn't booked yet.",
      kind: "tbd",
      todo: "Book a place to stay in Val di Fassa.",
    },
    practical: [
      { text: "Cable car down from Seceda to Ortisei." },
      { text: "Book Val di Fassa lodging.", todo: true },
    ],
  },
  {
    id: 8,
    isoDate: "2026-09-12",
    weekday: "Saturday",
    monthDay: "Sept 12",
    stripLabel: "To Venice",
    title: "Out of the mountains",
    summary: "Bus to Bolzano, train to Venice",
    timeline: [
      {
        kind: "transport",
        id: "bus-fassa-bolzano",
        mode: "bus",
        label: "Val di Fassa → Bolzano",
        meta: "Over Passo Costalunga",
        detailSlug: "bus-fassa-bolzano",
      },
      {
        kind: "transport",
        id: "train-bolzano-venice",
        mode: "rail",
        label: "Bolzano → Venezia Santa Lucia",
        meta: "~4 hr via Verona · Eurail",
        detailSlug: "train-bolzano-venice",
      },
    ],
    lodging: {
      slug: "venice-first-night",
      name: "Lodging to be decided",
      context: "First night in Venice — the booking is still open.",
      kind: "tbd",
      todo: "Book Venice lodging for the night of the 12th.",
    },
    practical: [
      { text: "Eurail day, back on the rails after Bolzano." },
      { text: "Book Venice lodging for the night of the 12th.", todo: true },
    ],
  },
  {
    id: 9,
    isoDate: "2026-09-13",
    weekday: "Sunday",
    monthDay: "Sept 13",
    stripLabel: "Venice",
    title: "Venice",
    summary: "Open day in the city · lodging still to be decided",
    timeline: [
      {
        kind: "open",
        id: "open-venice",
        text: "Nothing planned yet — the day is open.",
      },
    ],
    lodging: {
      slug: "venice-lodging",
      name: "Venice lodging to be decided",
      context: "The night slot is still a TODO.",
      kind: "tbd",
      todo: "Book Venice lodging",
    },
    practical: [{ text: "Book Venice lodging.", todo: true }],
  },
  {
    id: 10,
    isoDate: "2026-09-14",
    weekday: "Monday",
    monthDay: "Sept 14",
    stripLabel: "Home",
    title: "Home",
    summary: "Venice to Kansas City · the line, fully traveled",
    timeline: [
      {
        kind: "transport",
        id: "flight-home",
        mode: "flight",
        label: "Venice → MCI",
        meta: "Homeward",
        detailSlug: "flight-vce-mci",
      },
    ],
    lodging: {
      slug: "flight-home",
      name: "Homeward",
      context: "The trip ends in the air, the same way it began.",
      kind: "plane",
    },
    practical: [
      { text: "Fly Venice → MCI. Confirmation details still to be added." },
    ],
  },
];

export const destinations: Destination[] = [
  {
    slug: "munich",
    name: "Munich",
    dates: "Sept 6–8",
    dayIds: [2, 3, 4],
    lodging: "The Wombat Hostel",
    transportIn: "Overnight flight from Kansas City, then the airport train to München Hbf.",
    transportOut: "Train to Innsbruck on the Eurail pass.",
    photo: "/photos/munich.jpg",
    photoAlt:
      "Surfers on the Eisbachwelle in Munich, the standing wave in the Englischer Garten.",
    summary: "The first city. Two nights after a long flight, then the train south.",
    lngLat: [11.575, 48.137],
  },
  {
    slug: "innsbruck",
    name: "Innsbruck",
    dates: "Sept 8–9",
    dayIds: [4, 5],
    lodging: "Montagu Hostel",
    transportIn: "Train from Munich.",
    transportOut: "Morning train to Bolzano, then bus to Ortisei.",
    photo: "/photos/innsbruck.jpg",
    photoAlt: "Innsbruck along the Inn, mountains standing over the old town.",
    summary: "One night in the valley before the bus into the Dolomites.",
    lngLat: [11.404, 47.269],
  },
  {
    slug: "ortisei",
    name: "Ortisei",
    dates: "Sept 9",
    dayIds: [5],
    lodging: "We pass through; the night is up at Rifugio Resciesa.",
    transportIn: "Bus from Bolzano.",
    transportOut: "Onto the trail toward Rifugio Resciesa.",
    photo: "/photos/ortisei.jpg",
    photoAlt: "Ortisei in Val Gardena, the village at the foot of the ridge.",
    summary: "The last town before the huts. Rail ends here; the trail begins.",
    lngLat: [11.6717, 46.5761],
  },
  {
    slug: "dolomites",
    name: "Dolomites",
    dates: "Sept 9–12",
    dayIds: [5, 6, 7, 8],
    lodging: "Rifugio Resciesa, Rifugio Firenze, then Val di Fassa (lodging TBD)",
    transportIn: "From Ortisei onto the ridge.",
    transportOut: "Bus over Passo Costalunga to Bolzano, then train to Venice.",
    photo: "/photos/dolomites.jpg",
    photoAlt:
      "The Odle peaks from Seceda, limestone spires above the Val Gardena ridge.",
    summary:
      "Two hut nights, a summit morning on Seceda, then down to a spa in Val di Fassa before the train out.",
    stops: ["Rifugio Resciesa", "Rifugio Firenze", "Seceda"],
    lngLat: [11.7, 46.595],
  },
  {
    slug: "venice",
    name: "Venice",
    dates: "Sept 13–14",
    dayIds: [9, 10],
    lodging: "Still to be decided",
    transportIn: "Train from Bolzano via Verona, arriving Sept 12.",
    transportOut: "Flight to Kansas City.",
    photo: "/photos/venice.jpg",
    photoAlt: "A Venice canal at water level, looking toward a bridge.",
    summary: "The last city. An open day, then home.",
    lngLat: [12.3208, 45.4413],
  },
];

export const essentials: Essential[] = [
  {
    id: "eurail",
    title: "Eurail pass",
    body: "Days 4, 5, and 8 are rail days. Keep the pass with the passports.",
  },
  {
    id: "flights",
    title: "Flights",
    body: "MCI → Munich, Sept 5, departs 1:45 PM. Overnight, 12+ hours, arriving around 10:00 the next morning. Venice → MCI, Sept 14. Confirmation details still to be added.",
  },
  {
    id: "packing-huts",
    title: "Packing for the huts",
    body: "Pack light for the two hut nights, Resciesa and Firenze. Normal luggage again from Val di Fassa onward.",
  },
  {
    id: "documents",
    title: "Documents",
    body: "Passports, Eurail pass, hut bookings, and hostel confirmations once they exist.",
  },
  {
    id: "bookings",
    title: "Still to book",
    body: "The Wombat Hostel and Montagu Hostel, 1–2 months out. Val di Fassa lodging, night of the 11th. Venice lodging, night of the 12th.",
  },
];

export const details: DetailRecord[] = [
  {
    slug: "flight-mci-muc",
    dayId: 1,
    title: "Kansas City to Munich",
    kind: "flight",
    body: "Departs MCI at 1:45 PM on Sept 5. Overnight, 12+ hours. Arrive Munich around 10:00 the next morning.",
  },
  {
    slug: "the-plane",
    dayId: 1,
    title: "The plane",
    kind: "stay",
    body: "The first night is the crossing. Sleep on the plane.",
  },
  {
    slug: "airport-train",
    dayId: 2,
    title: "Airport train to München Hbf",
    kind: "train",
    body: "From MUC into the city. Tickets at the airport.",
  },
  {
    slug: "wombat-hostel",
    dayId: 2,
    title: "The Wombat Hostel",
    kind: "stay",
    body: "Two nights in Munich, about €30/night pp, near the Hauptbahnhof.",
    todo: "Book 1–2 months out",
  },
  {
    slug: "eisbachwelle",
    dayId: 3,
    title: "Eisbachwelle",
    kind: "note",
    body: "The river wave in the Englischer Garten. Optional, and only if it's running.",
    extra:
      "Check if the wave is active — a recent cleanup effort may have temporarily eliminated it.",
  },
  {
    slug: "english-garden",
    dayId: 3,
    title: "Englischer Garten",
    kind: "note",
    body: "From Eisbachwelle up to the Kleinhesseloher See, past the Monopteros and the Chinesischer Turm.",
  },
  {
    slug: "hofbrauhaus",
    dayId: 3,
    title: "Hofbräuhaus am Platzl",
    kind: "note",
    body: "The famous beer hall in the old town. No booking needed for a walk-in.",
  },
  {
    slug: "train-munich-innsbruck",
    dayId: 4,
    title: "Munich to Innsbruck",
    kind: "train",
    body: "Eurail day. München Hbf to Innsbruck, about 1h50.",
  },
  {
    slug: "montagu-hostel",
    dayId: 4,
    title: "Montagu Hostel",
    kind: "stay",
    body: "One night in Innsbruck, about €30/night pp.",
    todo: "Book 1–2 months out",
  },
  {
    slug: "train-innsbruck-bolzano",
    dayId: 5,
    title: "Innsbruck to Bolzano",
    kind: "train",
    body: "Morning train on the Eurail pass, down the Brenner.",
  },
  {
    slug: "bus-bolzano-ortisei",
    dayId: 5,
    title: "Bolzano to Ortisei",
    kind: "bus",
    body: "Bus from Bolzano into Val Gardena. The last motorized leg before the huts.",
  },
  {
    slug: "rifugio-resciesa",
    dayId: 5,
    title: "Rifugio Resciesa",
    kind: "stay",
    body: "First hut night, above Ortisei. This is where the trail line begins.",
  },
  {
    slug: "rifugio-firenze",
    dayId: 6,
    title: "Rifugio Firenze",
    kind: "stay",
    body: "Second hut night, after hiking across the Odle group from Resciesa.",
  },
  {
    slug: "seceda-summit",
    dayId: 7,
    title: "Seceda",
    kind: "hike",
    body: "Up from Rifugio Firenze through Val Cisles to the summit ridge, ~2,519 m, looking straight at the Odle group.",
  },
  {
    slug: "down-to-ortisei",
    dayId: 7,
    title: "Seceda to Ortisei",
    kind: "hike",
    body: "The Seceda cable car runs down to Ortisei — a fast, scenic descent instead of retracing the climb on foot.",
  },
  {
    slug: "to-val-di-fassa",
    dayId: 7,
    title: "Ortisei to Val di Fassa",
    kind: "bus",
    body: "Over Passo Sella and down through Canazei into Val di Fassa, ending at QC Terme Dolomiti in Pozza di Fassa.",
  },
  {
    slug: "qc-terme-dolomiti",
    dayId: 7,
    title: "QC Terme Dolomiti",
    kind: "note",
    body: "A spa afternoon in Pozza di Fassa — indoor and outdoor pools with Dolomite views. A different kind of hut day.",
  },
  {
    slug: "val-di-fassa-night",
    dayId: 7,
    title: "Val di Fassa, first night",
    kind: "stay",
    body: "Where exactly in the valley is still open — Pozza, Canazei, and Vigo di Fassa are all in range of the spa.",
    todo: "Book a place to stay in Val di Fassa",
  },
  {
    slug: "bus-fassa-bolzano",
    dayId: 8,
    title: "Val di Fassa to Bolzano",
    kind: "bus",
    body: "Over Passo Costalunga (Karerpass) and down through Nova Levante into Bolzano — the way out of the mountains.",
  },
  {
    slug: "venice-first-night",
    dayId: 8,
    title: "First night in Venice",
    kind: "stay",
    body: "The train from Bolzano gets in with the evening ahead. Lodging for the night of the 12th is still open.",
    todo: "Book Venice lodging",
  },
  {
    slug: "train-bolzano-venice",
    dayId: 8,
    title: "Bolzano to Venezia Santa Lucia",
    kind: "train",
    body: "About 4 hours on the Eurail pass, via Trento, Rovereto, and Verona, then east across the plain to Venice.",
  },
  {
    slug: "venice-lodging",
    dayId: 9,
    title: "Venice lodging",
    kind: "stay",
    body: "Still to be decided. The night slot is a TODO, not a missing page.",
    todo: "Book Venice lodging",
  },
  {
    slug: "flight-vce-mci",
    dayId: 10,
    title: "Venice to Kansas City",
    kind: "flight",
    body: "Fly Venice → MCI on Sept 14. Confirmation details still to be added.",
  },
  {
    slug: "flight-home",
    dayId: 10,
    title: "Homeward",
    kind: "stay",
    body: "The trip ends in the air, the same way it began.",
  },
];

const dayById = new Map<number, Day>();
for (const day of days) {
  if (!dayById.has(day.id)) dayById.set(day.id, day);
}

const destinationBySlug = new Map<string, Destination>();
for (const destination of destinations) {
  if (!destinationBySlug.has(destination.slug)) {
    destinationBySlug.set(destination.slug, destination);
  }
}

const detailBySlug = new Map<string, DetailRecord>();
const detailByDayAndSlug = new Map<string, DetailRecord>();
for (const detail of details) {
  const key = `${detail.dayId}/${detail.slug}`;
  if (!detailByDayAndSlug.has(key)) detailByDayAndSlug.set(key, detail);
  if (!detailBySlug.has(detail.slug)) detailBySlug.set(detail.slug, detail);
}

export function getDay(id: number) {
  return dayById.get(id);
}

export function getDestination(slug: string) {
  return destinationBySlug.get(slug);
}

export function getDetailForDay(dayId: number, slug: string) {
  return detailByDayAndSlug.get(`${dayId}/${slug}`) ?? detailBySlug.get(slug);
}
