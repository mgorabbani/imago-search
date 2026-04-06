import type {
  RawMediaItem,
  MediaItem,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  FilterOptions,
} from "@/lib/types";
import { preprocessItem, tokenize } from "./preprocessor";
import {
  buildIndex,
  lookupExact,
  lookupPrefix,
} from "./inverted-index";
import type { InvertedIndex, FieldName } from "./inverted-index";

const FIELD_WEIGHTS: Record<FieldName, number> = {
  suchtext: 3,
  fotografen: 2,
  bildnummer: 1,
};

let items: MediaItem[] = [];
let itemMap: Map<string, MediaItem> = new Map();
let index: InvertedIndex | null = null;
let cachedFilterOptions: FilterOptions | null = null;
let initialized = false;

export function initializeEngine(rawItems: RawMediaItem[]): void {
  items = rawItems.map((raw) => preprocessItem(raw));
  itemMap = new Map(items.map((item) => [item.id, item]));
  index = buildIndex(items);
  cachedFilterOptions = buildFilterOptions();
  initialized = true;
}

export function isInitialized(): boolean {
  return initialized;
}

export function search(request: SearchRequest): SearchResponse {
  const start = performance.now();
  const page = Math.max(1, request.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, request.pageSize ?? 20));

  let scored = scoreItems(request.query);
  scored = applyFilters(scored, request);
  scored = applySorting(scored, request);

  const total = scored.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paged = scored.slice(offset, offset + pageSize);

  const queryTokens = request.query ? tokenize(request.query) : [];
  const resultItems: SearchResultItem[] = paged.map(({ item, score }) => ({
    item,
    score,
    snippet: buildSnippet(item.suchtext, queryTokens),
  }));

  return {
    items: resultItems,
    page,
    pageSize,
    total,
    totalPages,
    queryTimeMs: Math.round((performance.now() - start) * 100) / 100,
  };
}

export function getFilterOptions(): FilterOptions {
  if (cachedFilterOptions) return cachedFilterOptions;
  return buildFilterOptions();
}

function buildFilterOptions(): FilterOptions {
  const credits = [...new Set(items.map((i) => i.fotografen))].sort();
  const restrictions = [...new Set(items.flatMap((i) => i.restrictions))].sort();
  const dates = items.map((i) => i.datum).filter(Boolean).sort();
  return {
    credits,
    restrictions,
    dateRange: {
      min: dates[0] ?? "",
      max: dates[dates.length - 1] ?? "",
    },
  };
}

interface ScoredItem {
  item: MediaItem;
  score: number;
}

function scoreItems(query?: string): ScoredItem[] {
  if (!query || !index) {
    return items.map((item) => ({ item, score: 0 }));
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return items.map((item) => ({ item, score: 0 }));
  }

  const scores = new Map<string, number>();

  for (const token of queryTokens) {
    for (const field of ["suchtext", "fotografen", "bildnummer"] as FieldName[]) {
      const weight = FIELD_WEIGHTS[field];

      // Exact matches: weight * 2
      const exactDocs = lookupExact(index, token, field);
      for (const docId of exactDocs) {
        scores.set(docId, (scores.get(docId) ?? 0) + weight * 2);
      }

      // Prefix matches (only for non-exact): weight * 1
      const prefixDocs = lookupPrefix(index, token, field);
      for (const docId of prefixDocs) {
        if (!exactDocs.has(docId)) {
          scores.set(docId, (scores.get(docId) ?? 0) + weight);
        }
      }
    }
  }

  const results: ScoredItem[] = [];
  for (const [docId, score] of scores) {
    const item = itemMap.get(docId);
    if (item) results.push({ item, score });
  }
  return results;
}

function applyFilters(scored: ScoredItem[], request: SearchRequest): ScoredItem[] {
  return scored.filter(({ item }) => {
    if (request.credit && item.fotografen !== request.credit) return false;
    if (request.dateFrom && item.datum < request.dateFrom) return false;
    if (request.dateTo && item.datum > request.dateTo) return false;
    if (request.restriction && !item.restrictions.includes(request.restriction)) return false;
    return true;
  });
}

function applySorting(scored: ScoredItem[], request: SearchRequest): ScoredItem[] {
  if (request.sortBy === "datum") {
    const dir = request.sortOrder === "asc" ? 1 : -1;
    return scored.sort((a, b) => a.item.datum.localeCompare(b.item.datum) * dir);
  }
  // Default: sort by score desc, then datum desc as tiebreaker
  return scored.sort(
    (a, b) => b.score - a.score || b.item.datum.localeCompare(a.item.datum),
  );
}

function buildSnippet(suchtext: string, queryTokens: string[]): string {
  if (queryTokens.length === 0) {
    return suchtext.slice(0, 200);
  }

  // Find first match position
  const pattern = queryTokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(pattern, "gi");
  const match = regex.exec(suchtext);

  let window: string;
  if (match) {
    const start = Math.max(0, match.index - 80);
    const end = Math.min(suchtext.length, match.index + 120);
    window = (start > 0 ? "..." : "") + suchtext.slice(start, end) + (end < suchtext.length ? "..." : "");
  } else {
    window = suchtext.slice(0, 200);
  }

  // Wrap matches in <mark> tags
  return window.replace(new RegExp(pattern, "gi"), (m) => `<mark>${m}</mark>`);
}
