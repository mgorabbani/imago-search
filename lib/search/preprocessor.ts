import type { RawMediaItem, MediaItem } from "@/lib/types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "is",
  "it",
  "as",
  "be",
  "was",
  "are",
  "been",
  "from",
  "has",
  "had",
  "her",
  "his",
  "its",
  "not",
  "can",
  "do",
  "did",
  "die",
  "der",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "und",
  "ist",
  "von",
  "mit",
  "für",
  "auf",
  "im",
  "am",
  "an",
  "als",
  "auch",
  "aus",
  "bei",
  "nach",
  "vor",
  "wie",
  "über",
  "nur",
]);

/** Converts DD.MM.YYYY → YYYY-MM-DD. Returns empty string for invalid dates.
 * TODO: In real app, we would use a date library (e.g. date-fns) for calendar-aware validation. */
export function parseDate(datum: string): string {
  const match = datum.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1) return "";
  return `${year}-${month}-${day}`;
}

/** Extracts restriction patterns like PUBLICATIONxINxGERxSUIxAUTxONLY from text. */
export function extractRestrictions(suchtext: string): string[] {
  const matches = suchtext.match(/[A-Z]{2,}(?:x[A-Z]{2,})+/g);
  if (!matches) return [];
  return [...new Set(matches)];
}

/** Tokenizes text: lowercase, split on non-alphanumeric, remove stop words and short tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

/** Transforms a raw media item into a preprocessed MediaItem. */
export function preprocessItem(raw: RawMediaItem): MediaItem {
  return {
    id: raw.bildnummer,
    suchtext: raw.suchtext,
    bildnummer: raw.bildnummer,
    fotografen: raw.fotografen,
    datum: parseDate(raw.datum),
    datumOriginal: raw.datum,
    hoehe: parseInt(raw.hoehe, 10),
    breite: parseInt(raw.breite, 10),
    restrictions: extractRestrictions(raw.suchtext),
    tokens: tokenize(raw.suchtext),
  };
}
