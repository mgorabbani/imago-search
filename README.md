# IMAGO Search App

Full-text search UI for IMAGO's media content library. Searches 10,000+ media items with an in-memory inverted index, weighted relevance scoring, filtering, sorting, and pagination.

## Quick Start

```bash
# Install dependencies
bun install

# Generate the 10K media items dataset
bun run generate-data

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
bun run test          # Unit tests (vitest)
bun run test:e2e      # E2E tests (Playwright)
bun run build         # Production build
bun lint              # Lint
```

## High-Level Approach

The app implements a **custom in-memory inverted index** rather than using SQLite or Elasticsearch. This was a deliberate choice: the challenge asks for a "lightweight search layer," and building the index from scratch demonstrates understanding of tokenization, scoring, and relevance ranking. For 10K items, the in-memory approach yields sub-5ms query times.

### Architecture

```
Browser                          Server (Next.js API routes)
┌──────────────┐   fetch   ┌──────────────────────────────┐
│  React UI    │ ────────▶ │  GET /api/search              │
│  (shadcn/ui) │ ◀──────── │  ├─ SearchEngine (singleton)  │
└──────────────┘   JSON    │  │  ├─ Preprocessor            │
                           │  │  ├─ InvertedIndex           │
                           │  │  └─ Scorer                  │
                           │  └─ lazy init from JSON        │
                           └──────────────────────────────┘
```

**Lazy initialization**: The search engine loads and preprocesses `data/media-items.json` once on first request, then stays in memory for the server's lifetime.

## Assumptions

- **No real images**: The dataset has dimensions (`hoehe`/`breite`) but no image URLs. Cards render aspect-ratio placeholder boxes using the real dimensions with the `bildnummer` overlaid.
- **German + English content**: The `suchtext` field mixes German and English. Tokenization handles both with a combined stop-word list.
- **Date format**: Raw dates are `DD.MM.YYYY` (German format). Parsed to ISO `YYYY-MM-DD` at preprocessing time to enable range filtering and sorting.
- **Restrictions embedded in text**: Tokens like `PUBLICATIONxINxGERxSUIxAUTxONLY` are restriction markers, extracted via regex `/[A-Z]{2,}(?:x[A-Z]{2,})+/g` and normalized for display.

## Design Decisions

### Search & Relevance

**Field-partitioned inverted index** with weighted scoring:

| Field        | Weight | Rationale                                |
|-------------|--------|------------------------------------------|
| `suchtext`  | 3x     | Primary content field                    |
| `fotografen`| 2x     | Agency searches are common               |
| `bildnummer`| 1x     | Exact ID lookups                         |

**Scoring bonuses**:
- Exact token match: 2x multiplier
- Prefix match (3+ chars): 1x multiplier (supports typeahead)
- Scores are summed across all query tokens and sorted descending

**Preprocessing pipeline** (runs once at startup):
1. **Tokenization**: lowercase, split on non-alphanumeric characters, remove stop words, discard tokens < 2 characters
2. **Date parsing**: `DD.MM.YYYY` to `YYYY-MM-DD` for ISO string comparison
3. **Restriction extraction**: regex extracts `PUBLICATIONxINxGERxSUIxAUTxONLY` style tokens from `suchtext`
4. **Index build**: each token maps to a `Set<documentId>`, partitioned by source field

**Snippet highlighting**: 200-character window centered on the first match, with `<mark>` tags wrapping matched tokens.

### Data Generation

A seeded PRNG (LCG, seed=42) generates 10K deterministic items across 5 categories (sports, music, politics, nature, entertainment). The first 2 items are the seed data from the challenge spec. ~30% of items have restriction markers.

### Frontend

- **Desktop**: Sidebar filters (w-64) + fluid auto-fill grid for results
- **Mobile**: Bottom sheet drawer for filters via shadcn Sheet component
- **Debounce**: 300ms on search input to avoid excessive API calls
- **Loading state**: Skeleton cards matching results grid layout
- **Accessibility**: ARIA labels on all interactive elements, keyboard navigation, `aria-live` for pagination status

### Loading State Pattern

Uses `useSyncExternalStore` with an external loading store to track in-flight fetches without calling `setState` synchronously inside effects (React 19 lint compliance).

## API Endpoints

### `GET /api/search`

| Param       | Type   | Default | Description                     |
|-------------|--------|---------|---------------------------------|
| `query`     | string | `""`    | Search terms                    |
| `page`      | number | `1`     | Page number (1-indexed)         |
| `pageSize`  | number | `20`    | Items per page (max 100)        |
| `credit`    | string | —       | Filter by photographer          |
| `dateFrom`  | string | —       | ISO date lower bound            |
| `dateTo`    | string | —       | ISO date upper bound            |
| `restriction`| string| —       | Filter by restriction token     |
| `sortBy`    | string | —       | `"datum"` for date sorting      |
| `sortOrder` | string | —       | `"asc"` or `"desc"`             |

**Response**: `{ items, page, pageSize, total, totalPages, queryTimeMs }`

### `GET /api/search/filters`

Returns available filter options: `{ credits: string[], restrictions: string[] }`

### `GET /api/analytics`

Returns: `{ totalSearches, averageResponseTimeMs, topKeywords }`

## Testing

**45 unit tests** (vitest) covering:
- Preprocessor: date parsing, restriction extraction, tokenization, stop words
- Inverted index: build, exact lookup, prefix lookup
- Search engine: scoring, filtering, sorting, pagination, snippets
- Analytics: tracking, averages, keyword frequency

**6 E2E tests** (Playwright) covering:
- Initial page load with all items
- Search for a term + results display
- Pagination (forward navigation)
- No-results state for unknown queries
- Clear button resets to full listing
- Sort order cycling (relevance/date asc/date desc)

## Scaling to Millions of Items

### Search Infrastructure

1. **Elasticsearch** replaces the in-memory index — native BM25 scoring, sharding, replication
2. **PostgreSQL + GIN indexes** as a simpler alternative for moderate scale
3. **Redis cache** for hot queries (60s TTL) to reduce search backend load
4. Stateless API servers behind a load balancer for horizontal scaling

### Continuous Ingestion ("New items every minute")

1. **Message queue** (Kafka/SQS) receives new items from the ingestion pipeline
2. **Preprocessing worker** consumes from the queue, normalizes metadata, and indexes into Elasticsearch
3. Elasticsearch supports real-time document additions without full rebuild
4. Decouples ingestion from serving — no query latency impact during indexing
5. UI polling or WebSocket push to surface new items without page refresh

## Limitations & What I Would Do Next

- **No real images**: Would integrate with IMAGO's CDN and use `next/image` for optimized delivery with blur placeholders
- **Single-node in-memory index**: Not suitable for production at scale — Elasticsearch or similar would be needed
- **No fuzzy/typo tolerance**: Could add Levenshtein distance or n-gram indexing for approximate matching
- **No faceted counts**: Filter dropdowns don't show result counts per option — would require aggregation queries
- **No query suggestions/autocomplete**: Could build a prefix trie or use Elasticsearch's completion suggester
- **No dark mode**: Theme structure supports it (CSS variables), but not implemented yet
- **Analytics are in-memory**: Reset on server restart — would persist to a database in production

## Tech Stack

- **Next.js 16.2.2** (App Router) with Turbopack
- **TypeScript 5** (strict mode)
- **Tailwind CSS v4** (CSS-based config)
- **shadcn/ui** (base-nova style, base-ui/react primitives)
- **React 19**
- **vitest** + **Playwright** for testing
- **Lucide** icons
