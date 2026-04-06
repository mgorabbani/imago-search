import type { MediaItem } from "@/lib/types";
import { tokenize } from "./preprocessor";

export type FieldName = "suchtext" | "fotografen" | "bildnummer";
/** Maps token → Set of document IDs */
export type TokenPostings = Map<string, Set<string>>;
/** Maps field name → token postings */
export type InvertedIndex = Map<FieldName, TokenPostings>;

/** Builds an inverted index from preprocessed media items. */
export function buildIndex(items: MediaItem[]): InvertedIndex {
  const index: InvertedIndex = new Map([
    ["suchtext", new Map()],
    ["fotografen", new Map()],
    ["bildnummer", new Map()],
  ]);

  for (const item of items) {
    addTokens(index.get("suchtext")!, item.tokens, item.id);
    addTokens(index.get("fotografen")!, tokenize(item.fotografen), item.id);
    addTokens(index.get("bildnummer")!, tokenize(item.bildnummer), item.id);
  }

  return index;
}

function addTokens(
  postings: TokenPostings,
  tokens: string[],
  docId: string,
): void {
  for (const token of tokens) {
    let docs = postings.get(token);
    if (!docs) {
      docs = new Set();
      postings.set(token, docs);
    }
    docs.add(docId);
  }
}

/** Returns doc IDs for an exact token match, optionally filtered by field. */
export function lookupExact(
  index: InvertedIndex,
  token: string,
  field?: FieldName,
): Set<string> {
  const normalized = token.toLowerCase();
  if (field) {
    return index.get(field)?.get(normalized) ?? new Set();
  }
  const result = new Set<string>();
  for (const [, postings] of index) {
    const docs = postings.get(normalized);
    if (docs) for (const id of docs) result.add(id);
  }
  return result;
}

/** Returns doc IDs where any token starts with the prefix (3+ chars required). */
export function lookupPrefix(
  index: InvertedIndex,
  prefix: string,
  field?: FieldName,
): Set<string> {
  const normalized = prefix.toLowerCase();
  if (normalized.length < 3) return new Set();

  const result = new Set<string>();
  const fields: FieldName[] = field ? [field] : ["suchtext", "fotografen", "bildnummer"];

  for (const f of fields) {
    const postings = index.get(f);
    if (!postings) continue;
    for (const [token, docs] of postings) {
      if (token.startsWith(normalized)) {
        for (const id of docs) result.add(id);
      }
    }
  }
  return result;
}
