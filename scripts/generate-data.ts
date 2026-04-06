import { readFileSync, writeFileSync } from "fs";
import path from "path";
import type { RawMediaItem } from "../lib/types";

// Seeded PRNG (LCG) for deterministic output
let seed = 42;
function random(): number {
  seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const result: T[] = [];
  const copy = [...arr];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = randInt(0, copy.length - 1);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

const PHOTOGRAPHERS = [
  "IMAGO / Sven Simon", "IMAGO / teutopress", "IMAGO / United Archives International",
  "IMAGO / ZUMA Wire", "IMAGO / Pacific Press Agency", "IMAGO / Panthermedia",
  "IMAGO / Westend61", "IMAGO / Xinhua", "IMAGO / NurPhoto", "IMAGO / AFLOSPORT",
  "IMAGO / Action Plus", "IMAGO / Colorsport", "IMAGO / Contrast",
  "IMAGO / Future Image", "IMAGO / Gonzales Photo", "IMAGO / imagebroker",
  "IMAGO / Jan Huebner", "IMAGO / Laci Perenyi", "IMAGO / MIS", "IMAGO / Newscom",
];

const RESTRICTIONS = [
  "PUBLICATIONxINxGERxSUIxAUTxONLY", "PUBLICATIONxNOTxINxUSA",
  "EDITORIALxUSExONLY", "PUBLICATIONxINxGERxONLY",
  "NOxMODELxRELEASE", "PUBLICATIONxNOTxINxUK",
];

const CATEGORIES = {
  sports: {
    subjects: [
      "Fussball Bundesliga", "Champions League", "Premier League", "FC Bayern München",
      "Borussia Dortmund", "Real Madrid", "FC Barcelona", "Liverpool FC",
      "Tennis Grand Slam", "Formel 1", "Olympische Spiele", "Tour de France",
      "Boxen WM", "Handball Bundesliga", "Eishockey DEL", "Basketball NBA",
      "Leichtathletik WM", "Schwimmen EM", "Ski Alpin Weltcup", "Rugby Six Nations",
    ],
    people: [
      "Thomas Müller", "Robert Lewandowski", "Erling Haaland", "Kylian Mbappé",
      "Lionel Messi", "Cristiano Ronaldo", "Novak Djokovic", "Rafael Nadal",
      "Lewis Hamilton", "Max Verstappen", "Usain Bolt", "Serena Williams",
      "Alexander Zverev", "Joshua Kimmich", "Florian Wirtz", "Jamal Musiala",
    ],
    actions: [
      "Tor Jubel", "Zweikampf Aktion", "Spielszene", "Training",
      "Pressekonferenz", "Pokalübergabe", "Elfmeter", "Freistoss",
      "Mannschaftsfoto", "Einzelporträt", "Aufwärmen", "Siegerehrung",
    ],
    contexts: [
      "Stadion Atmosphäre", "Fans Tribüne", "Rasen Spielfeld", "Kabine",
      "Halbzeit", "Nachspielzeit", "Heimspiel", "Auswärtsspiel",
    ],
  },
  music: {
    subjects: [
      "Rockkonzert", "Pop Festival", "Jazz Session", "Klassik Konzert",
      "Hip Hop Show", "Oper Aufführung", "Musikfestival Open Air",
      "Wacken Open Air", "Rock am Ring", "Glastonbury Festival",
      "MTV Awards", "Grammy Verleihung", "Eurovision Song Contest",
    ],
    people: [
      "Taylor Swift", "Ed Sheeran", "Beyoncé", "Adele", "Coldplay",
      "Rammstein", "Die Toten Hosen", "Herbert Grönemeyer", "Helene Fischer",
      "David Bowie", "Madonna", "Rolling Stones", "Beatles", "Metallica",
      "Bruce Springsteen", "Elton John",
    ],
    actions: [
      "Auftritt Bühne", "Gesang Mikrofon", "Gitarre Solo", "Schlagzeug",
      "Konzert Publikum", "Backstage Interview", "Soundcheck", "Zugabe",
    ],
    contexts: [
      "Arena ausverkauft", "Club Konzert", "Studio Aufnahme", "Musikvideo Dreh",
      "Tourstart", "Abschiedstour", "Comeback Konzert",
    ],
  },
  politics: {
    subjects: [
      "Bundestag Sitzung", "G7 Gipfel", "EU Parlament", "UN Vollversammlung",
      "NATO Gipfel", "Landtagswahl", "Bundestagswahl", "Europawahl",
      "Koalitionsverhandlung", "Parteitag", "Regierungserklärung",
    ],
    people: [
      "Angela Merkel", "Olaf Scholz", "Friedrich Merz", "Annalena Baerbock",
      "Emmanuel Macron", "Joe Biden", "Ursula von der Leyen",
      "Robert Habeck", "Christian Lindner", "Markus Söder",
      "Boris Johnson", "Volodymyr Zelensky", "Donald Trump",
    ],
    actions: [
      "Rede Podium", "Handschlag", "Pressestatement", "Abstimmung",
      "Demonstration Protest", "Wahlkampf", "Staatsbesuch", "Unterzeichnung",
    ],
    contexts: [
      "Reichstag Berlin", "Bundeskanzleramt", "Elysée Palast", "Weißes Haus",
      "Brüssel EU Viertel", "Genf Konferenz", "Wien Hofburg",
    ],
  },
  nature: {
    subjects: [
      "Wildtiere Safari", "Alpen Landschaft", "Nordsee Küste", "Regenwald Amazonas",
      "Polarlichter Norwegen", "Vulkan Ausbruch", "Korallenriff Tauchen",
      "Wüste Sahara", "Nationalpark Yellowstone", "Schwarzwald Herbst",
    ],
    people: [],
    actions: [
      "Sonnenuntergang", "Tierfotografie", "Luftaufnahme Drohne", "Makro Aufnahme",
      "Zeitraffer", "Unterwasser Fotografie", "Panorama Weitwinkel",
    ],
    contexts: [
      "Morgennebel", "Sturm Gewitter", "Schneefall Winter", "Blütezeit Frühling",
      "Dürre Sommer", "Überschwemmung", "Regenbogen",
    ],
  },
  entertainment: {
    subjects: [
      "Filmfestival Berlin Berlinale", "Oscar Verleihung", "Cannes Film Festival",
      "Filmpremiere", "TV Show Aufzeichnung", "Comedy Gala", "Theater Premiere",
      "Buchvorstellung", "Modenschau Fashion Week", "Kunstausstellung",
    ],
    people: [
      "Brad Pitt", "Scarlett Johansson", "Leonardo DiCaprio", "Cate Blanchett",
      "Tom Hanks", "Diane Kruger", "Daniel Brühl", "Sandra Hüller",
      "Til Schweiger", "Elyas M'Barek", "Christoph Waltz",
    ],
    actions: [
      "Roter Teppich", "Interview Kamera", "Autogramme Fans", "Fotocall",
      "Dreharbeiten Set", "Probe Bühne", "Vernissage Eröffnung",
    ],
    contexts: [
      "Glamour Abendkleid", "Smoking elegant", "Kino Saal", "Galerie Raum",
      "Laufsteg Modell", "Backstage Maske",
    ],
  },
};

const GERMAN_DESCRIPTORS = [
  "hoch", "ganz", "stehend", "sitzend", "lachend", "ernst",
  "links", "rechts", "Mitte", "Porträt", "Querformat", "Hochformat",
  "Nahaufnahme", "Weitwinkel", "Detail", "Übersicht", "Gruppe",
];

function generateDate(): string {
  const year = randInt(1950, 2024);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

function generateItem(index: number): RawMediaItem {
  const categoryKeys = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;
  const catKey = pick(categoryKeys);
  const cat = CATEGORIES[catKey];

  const parts: string[] = [];
  parts.push(pick(cat.subjects));
  if (cat.people.length > 0 && random() > 0.3) {
    parts.push(pick(cat.people));
  }
  parts.push(pick(cat.actions));
  if (random() > 0.4) parts.push(pick(cat.contexts));
  parts.push(...pickN(GERMAN_DESCRIPTORS, randInt(1, 3)));

  // ~30% chance of restriction
  if (random() < 0.3) {
    parts.push(pick(RESTRICTIONS));
  }

  const suchtext = parts.join(" ");
  const bildnummer = String(60000000 + index).padStart(10, "0");

  return {
    suchtext,
    bildnummer,
    fotografen: pick(PHOTOGRAPHERS),
    datum: generateDate(),
    hoehe: String(randInt(600, 6000)),
    breite: String(randInt(800, 8000)),
  };
}

// Load seed items
const seedPath = path.join(process.cwd(), "data", "seed-media.json");
const seedItems: RawMediaItem[] = JSON.parse(readFileSync(seedPath, "utf-8"));

// Generate 10,000 items (seed items + generated)
const items: RawMediaItem[] = [...seedItems];
for (let i = 0; i < 10000 - seedItems.length; i++) {
  items.push(generateItem(i));
}

const outPath = path.join(process.cwd(), "data", "media-items.json");
writeFileSync(outPath, JSON.stringify(items, null, 2));
console.log(`Generated ${items.length} media items → ${outPath}`);
