export type Photo = {
  src: string;
  alt: string;
  credit: string;
};

export const photos = {
  munich: {
    src: "/photos/munich.jpg",
    alt: "Surfers on the Eisbachwelle in Munich, the standing wave in the Englischer Garten.",
    credit: "Unsplash",
  },
  dolomites: {
    src: "/photos/dolomites.jpg",
    alt: "The Odle peaks from Seceda, limestone spires above the Val Gardena ridge.",
    credit: "Unsplash",
  },
  venice: {
    src: "/photos/venice.jpg",
    alt: "A gondola on a Venice canal at water level, looking toward a stone bridge.",
    credit: "Unsplash",
  },
  innsbruck: {
    src: "/photos/innsbruck.jpg",
    alt: "Innsbruck along the Inn, with the Alps standing over the old town.",
    credit: "Wikimedia Commons",
  },
  ortisei: {
    src: "/photos/ortisei.jpg",
    alt: "The parish church and village of Ortisei in Val Gardena.",
    credit: "Wikimedia Commons",
  },
  resciesa: {
    src: "/photos/resciesa.jpg",
    alt: "Rifugio Resciesa on the ridge above Ortisei.",
    credit: "Wikimedia Commons",
  },
  firenze: {
    src: "/photos/firenze.jpg",
    alt: "Rifugio Firenze, a stone hut under the Odle walls.",
    credit: "Wikimedia Commons",
  },
  puez: {
    src: "/photos/puez.jpg",
    alt: "The path from Rifugio Puez down toward Vallunga.",
    credit: "Wikimedia Commons",
  },
} as const satisfies Record<string, Photo>;
