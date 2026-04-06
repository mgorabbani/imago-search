/** Raw media item as it comes from the JSON dataset (German date format, unprocessed text) */
export interface RawMediaItem {
  suchtext: string;
  bildnummer: string;
  fotografen: string;
  datum: string;
  hoehe: string;
  breite: string;
}

/** Preprocessed media item with normalized fields and extracted metadata */
export interface MediaItem {
  id: string;
  suchtext: string;
  bildnummer: string;
  fotografen: string;
  /** ISO date: YYYY-MM-DD */
  datum: string;
  /** Original German date: DD.MM.YYYY */
  datumOriginal: string;
  hoehe: number;
  breite: number;
  /** Extracted restriction tokens (e.g. "PUBLICATIONxINxGERxSUIxAUTxONLY") */
  restrictions: string[];
  /** Tokenized suchtext for search */
  tokens: string[];
}

/** Query parameters for the search API */
export interface SearchRequest {
  query?: string;
  page?: number;
  pageSize?: number;
  /** Filter by fotografen (exact match) */
  credit?: string;
  /** Filter by date range start (ISO: YYYY-MM-DD) */
  dateFrom?: string;
  /** Filter by date range end (ISO: YYYY-MM-DD) */
  dateTo?: string;
  /** Filter by restriction token */
  restriction?: string;
  /** Sort by datum */
  sortBy?: "datum";
  sortOrder?: "asc" | "desc";
}

/** Single result item with optional snippet highlighting */
export interface SearchResultItem {
  item: MediaItem;
  score: number;
  /** Highlighted suchtext snippet with <mark> tags */
  snippet: string;
}

/** Paginated search response */
export interface SearchResponse {
  items: SearchResultItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Server-side query time in ms */
  queryTimeMs: number;
}

/** Available filter options for the UI dropdowns */
export interface FilterOptions {
  credits: string[];
  restrictions: string[];
  dateRange: {
    min: string;
    max: string;
  };
}

/** Analytics data tracked in-memory */
export interface AnalyticsData {
  totalSearches: number;
  avgResponseTimeMs: number;
  topKeywords: Array<{ keyword: string; count: number }>;
}
