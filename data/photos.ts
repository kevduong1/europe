export type Photo = {
  src: string;
  /** Small square crop of `src`, sized for map-pin thumbnails. */
  pinSrc: string;
  alt: string;
  credit: string;
};

export const photos = {
  munich: {
    src: "/photos/munich.jpg",
    pinSrc: "/photos/pins/munich.jpg",
    alt: "Surfers on the Eisbachwelle in Munich, the standing wave in the Englischer Garten.",
    credit: "Unsplash",
  },
  dolomites: {
    src: "/photos/dolomites.jpg",
    pinSrc: "/photos/pins/dolomites.jpg",
    alt: "The Odle peaks from Seceda, limestone spires above the Val Gardena ridge.",
    credit: "Unsplash",
  },
  venice: {
    src: "/photos/venice.jpg",
    pinSrc: "/photos/pins/venice.jpg",
    alt: "A gondola on a Venice canal at water level, looking toward a stone bridge.",
    credit: "Unsplash",
  },
  innsbruck: {
    src: "/photos/innsbruck.jpg",
    pinSrc: "/photos/pins/innsbruck.jpg",
    alt: "Innsbruck along the Inn, with the Alps standing over the old town.",
    credit: "Wikimedia Commons",
  },
  ortisei: {
    src: "/photos/ortisei.jpg",
    pinSrc: "/photos/pins/ortisei.jpg",
    alt: "The parish church and village of Ortisei in Val Gardena.",
    credit: "Wikimedia Commons",
  },
  resciesa: {
    src: "/photos/resciesa.jpg",
    pinSrc: "/photos/pins/resciesa.jpg",
    alt: "Rifugio Resciesa on the ridge above Ortisei.",
    credit: "Wikimedia Commons",
  },
  firenze: {
    src: "/photos/firenze.jpg",
    pinSrc: "/photos/pins/firenze.jpg",
    alt: "Rifugio Firenze, a stone hut under the Odle walls.",
    credit: "Wikimedia Commons",
  },
  hofbrauhaus: {
    src: "/photos/hofbrauhaus.jpg",
    pinSrc: "/photos/pins/hofbrauhaus.jpg",
    alt: "The corner facade of the Hofbräuhaus am Platzl in Munich's old town.",
    credit: "Wikimedia Commons",
  },
} as const satisfies Record<string, Photo>;
