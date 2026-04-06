# IMAGO Search App

Full-text search UI for IMAGO's media content library. Searches 10,000+ media items with an in-memory inverted index, weighted relevance scoring, filtering, sorting, and pagination.

## Quick Start

```bash
pnpm install              # Install dependencies
pnpm generate-data        # Generate 10K media items dataset
pnpm dev                  # Start dev server → http://localhost:3000
```

```bash
pnpm test                 # Unit tests (vitest, 45 tests)
pnpm test:e2e             # E2E tests (Playwright, 6 tests)
pnpm build                # Production build
pnpm lint                 # Lint
```

## High-Level Approach

The app implements a **custom in-memory inverted index** rather than using SQLite or Elasticsearch. The challenge asks for a "lightweight search layer," and building the index from scratch demonstrates understanding of tokenization, scoring, and relevance ranking. For 10K items, the in-memory approach yields sub-5ms query times.

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

The search engine loads and preprocesses `data/media-items.json` once on first request (lazy singleton), then stays in memory for the server's lifetime.

## Assumptions

- **No real images**: The dataset has dimensions (`hoehe`/`breite`) but no image URLs. Cards render aspect-ratio placeholder boxes using the real dimensions with the `bildnummer` overlaid. `next/image` would slot in directly when connected to a real CDN.
- **German + English content**: The `suchtext` field mixes German and English. Tokenization handles both with a combined stop-word list.
- **Date format**: Raw dates are `DD.MM.YYYY` (German format). Parsed to ISO `YYYY-MM-DD` at preprocessing time to enable range filtering and sorting without Date object overhead.
- **Restrictions embedded in text**: Tokens like `PUBLICATIONxINxGERxSUIxAUTxONLY` are restriction markers embedded in `suchtext`, not a separate field. Extracted via regex `/[A-Z]{2,}(?:x[A-Z]{2,})+/g` and normalized into readable labels for the filter dropdown.
- **10K items fit in memory**: At ~50MB, the full index comfortably fits in a single Node.js process. This assumption breaks at ~500K+ items.

## Design Decisions

### Search & Relevance

**Field-partitioned inverted index** — the index is split by source field so each can carry a different weight:

| Field        | Weight | Rationale                                |
|-------------|--------|------------------------------------------|
| `suchtext`  | 3x     | Primary content field — most relevant    |
| `fotografen`| 2x     | Agency/photographer searches are common  |
| `bildnummer`| 1x     | Exact ID lookups                         |

**Scoring**: Exact token match gets a 2x bonus; prefix match (3+ chars) gets 1x. Scores are summed across all query tokens and sorted descending. This gives precise queries higher relevance while still supporting typeahead via prefix matching.

**Preprocessing pipeline** (runs once at startup):
1. **Tokenization** — lowercase, split on non-alphanumeric (preserving ä/ö/ü/ß), remove stop words, discard tokens < 2 chars
2. **Date parsing** — `DD.MM.YYYY` → `YYYY-MM-DD` for lexicographic comparison
3. **Restriction extraction** — regex pulls structured restriction tokens from free text
4. **Index build** — each token → `Set<docId>`, partitioned by field

**Snippet highlighting**: 200-char window centered on the first match, text HTML-escaped before wrapping matches in `<mark>` tags to prevent XSS.

### Frontend

- **Desktop**: Sidebar filters + fluid auto-fill grid (`repeat(auto-fill, minmax(280px, 1fr))`)
- **Mobile**: Bottom sheet drawer for filters
- **Debounce**: 300ms on search input
- **Accessibility**: ARIA labels on all interactive elements, keyboard navigation, `aria-live` for pagination

### Data Generation

Seeded PRNG (LCG, seed=42) generates 10K deterministic items across 5 categories. The first 2 items are the seed data from the challenge spec. ~30% have restriction markers.

## Limitations & What I Would Do Next

- **No fuzzy/typo tolerance**: "fotball" won't match "football." Would add Levenshtein distance or n-gram indexing for approximate matching.
- **Single-node in-memory index**: Not viable beyond ~500K items. Would migrate to Elasticsearch (BM25, sharding, real-time indexing) or PostgreSQL with GIN indexes.
- **No faceted counts**: Filter dropdowns don't show how many results each option would return. Would require aggregation queries per filter value.
- **No query suggestions/autocomplete**: Could build a prefix trie from the token vocabulary or use Elasticsearch's completion suggester.
- **Analytics are in-memory**: Reset on server restart. Would persist to a time-series database in production.
- **No real images**: Would integrate with IMAGO's CDN and use `next/image` with blur placeholders and lazy loading.
- **No dark mode**: CSS variable theme structure supports it, but not implemented yet.
- **Continuous ingestion**: Currently requires server restart to pick up new items. Would add a message queue (Kafka/SQS) → preprocessing worker → index update pipeline, decoupled from serving.
