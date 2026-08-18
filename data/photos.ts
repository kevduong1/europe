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
    credit: "Wolfgang Moroder · Wikimedia Commons",
  },
  seceda: {
    src: "/photos/seceda-clouds.jpg",
    pinSrc: "/photos/pins/seceda.jpg",
    alt: "The green Seceda ridge leading toward the jagged Odle peaks under summer clouds.",
    credit: "Luigi Rossini · Wikimedia Commons",
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
  hofbrauhausInterior: {
    src: "/photos/hofbrauhaus-interior.jpg",
    pinSrc: "/photos/pins/hofbrauhaus-interior.jpg",
    alt: "Wooden communal tables, painted arches, and an HB service counter inside the Hofbräuhaus.",
    credit: "Pierre André · Wikimedia Commons",
  },
  monopteros: {
    src: "/photos/monopteros.jpg",
    pinSrc: "/photos/pins/monopteros.jpg",
    alt: "The circular Monopteros temple on its green hill in the Englischer Garten.",
    credit: "Julian Herzog · Wikimedia Commons",
  },
  chineseTower: {
    src: "/photos/chinese-tower.jpg",
    pinSrc: "/photos/pins/chinese-tower.jpg",
    alt: "The wooden Chinesischer Turm rising above beer-garden tables in the Englischer Garten.",
    credit: "Daderot · Wikimedia Commons",
  },
  kleinhesseloherSee: {
    src: "/photos/kleinhesseloher-see.jpg",
    pinSrc: "/photos/pins/kleinhesseloher-see.jpg",
    alt: "Kleinhesseloher See with trees, rowboats, and the Seehaus across the water.",
    credit: "Derbrauni · Wikimedia Commons",
  },
} as const satisfies Record<string, Photo>;

export type GalleryPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  credit: string;
  sourceUrl: string;
};

export const secedaGallery = [
  {
    src: "/photos/seceda-clouds.jpg",
    alt: "The green Seceda ridge leading toward the jagged Odle peaks under summer clouds.",
    width: 1600,
    height: 1067,
    caption: "The Odle ridge from Seceda",
    credit: "Luigi Rossini · CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Seceda_e_nuvole.jpg",
  },
  {
    src: "/photos/seceda-panorama.jpg",
    alt: "A wide summer panorama across the green Seceda plateau and surrounding Dolomites.",
    width: 1800,
    height: 500,
    caption: "Across the Seceda plateau",
    credit: "Jaromír Kavan · CC0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Seceda_2.518_(Panorama)_(Unsplash).jpg",
  },
  {
    src: "/photos/seceda-approach.jpg",
    alt: "The wooded and grassy approach to Seceda above Val Gardena.",
    width: 1600,
    height: 1200,
    caption: "The approach above Val Gardena",
    credit: "Syrio · CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Seceda_01.jpg",
  },
] as const satisfies readonly GalleryPhoto[];
