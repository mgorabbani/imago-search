# Imago Search App — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax.

## Goal

Build a full-text search UI for IMAGO's 10,000+ media items with an in-memory inverted index, paginated API, analytics, and polished Tailwind UI.

## Architecture at a Glance

```
┌─────────────┐     fetch      ┌──────────────────┐
│  React UI   │ ──────────────▶│ GET /api/search   │
│  (shadcn)   │ ◀──────────────│                   │
└─────────────┘     JSON       │  SearchEngine     │
                               │  ├─ Preprocessor  │
                               │  ├─ InvertedIndex │
                               │  └─ Scorer        │
                               └──────────────────┘
                                       ▲
                                       │ lazy init
                               ┌───────┴──────┐
                               │ media-items  │
                               │   .json      │
                               │  (10K items) │
                               └──────────────┘
```

**Tech:** Next.js 16 | TypeScript 5 | Tailwind v4 | shadcn/ui | React 19 | vitest

---

## Key Design Decisions

### Why in-memory inverted index (not SQLite/Elasticsearch)?

- Challenge says "lightweight search layer" — they want to see **you** build search, not wire up a library
- Demonstrates understanding of tokenization, scoring, relevance ranking
- Fast enough for 10K items (~1-5ms per query)
- README documents how to scale to millions with Elasticsearch

### Search Scoring Strategy

| Field      | Weight | Why                                        |
| ---------- | ------ | ------------------------------------------ |
| suchtext   | 3x     | Primary content — most relevant for search |
| fotografen | 2x     | Agency searches are common                 |
| bildnummer | 1x     | Exact ID lookups                           |

- **Exact token match:** 2x bonus (rewards precise queries)
- **Prefix match:** 1x (supports typeahead, only for 3+ char tokens)
- Scores summed across all query tokens, sorted descending

### Preprocessing Pipeline (runs once at startup)

1. **Date parsing:** `DD.MM.YYYY` → `YYYY-MM-DD` (enables range filtering + sorting)
2. **Restriction extraction:** regex `/[A-Z]{2,}(?:x[A-Z]{2,})+/g` finds `PUBLICATIONxINxGERxSUIxAUTxONLY`
3. **Tokenization:** lowercase → split on non-alphanumeric → remove stop words → remove <2 char tokens
4. **Index build:** map each token → Set of document IDs, partitioned by field

### Image Strategy

The raw data has dimensions (`hoehe`/`breite`) but no image URLs. We add two fields:

| Field       | Example                           | Purpose                                   |
| ----------- | --------------------------------- | ----------------------------------------- |
| `thumbnail` | `/images/thumbs/{bildnummer}.jpg` | Small preview for list view (~200px wide) |
| `bild`      | `/images/full/{bildnummer}.jpg`   | Full-resolution for detail/download       |

**Why two sizes?** Loading full-res images (e.g. 6000x4000) in a search results list destroys performance. Stock platforms always serve thumbnails in grids and full-res on demand.

**In the demo:** No real images available, so we render **aspect-ratio placeholder boxes** using `breite`/`hoehe` values with bildnummer overlay.

- Thumbnails in list view use a fixed aspect ratio for a clean grid (like IMAGO's actual site)
- Detail view uses the real aspect ratio
- `next/image` would slot in directly when connected to a real CDN

### Snippet Highlighting

- Regex from query tokens wraps matches in `<mark>` tags
- 200-char window centered on first match
- Safe from XSS: snippets are built server-side from our own dataset — user query tokens are matched via regex, not injected as raw HTML into the output

---

## File Structure

```
lib/
  types.ts                    ← All shared types (well-documented with JSDoc)
  search/
    preprocessor.ts           ← Date parsing, restriction extraction, tokenization
    inverted-index.ts         ← Token → document ID mapping
    search-engine.ts          ← Scoring + filtering + sorting + pagination + singleton
  analytics.ts                ← In-memory search metrics tracker

data/
  seed-media.json             ← 2 challenge-provided items
  media-items.json            ← 10K generated items

scripts/
  generate-data.ts            ← Generates realistic dataset (sports/music/politics/nature)

app/
  api/search/route.ts         ← GET /api/search (validated params)
  api/search/filters/route.ts ← GET /api/search/filters (dropdown options)
  api/analytics/route.ts      ← GET /api/analytics
  page.tsx                    ← Server Component shell
  loading.tsx / error.tsx     ← Boundaries

components/
  search-page.tsx             ← Client orchestrator (uses all below)
  search-bar.tsx              ← Debounced input + clear button
  search-filters.tsx          ← Credit dropdown, date range, restriction chips, sort toggle
  search-results.tsx          ← Card grid with highlighted snippets
  search-pagination.tsx       ← Page navigation
  search-empty.tsx            ← Empty state
  search-loading.tsx          ← Skeleton loading

hooks/
  use-debounce.ts             ← Generic debounce (300ms)
  use-search.ts               ← Full search lifecycle hook

__tests__/
  lib/search/
    preprocessor.test.ts      ← Date parsing, restrictions, tokenization
    inverted-index.test.ts    ← Index build, exact/prefix lookup
    search-engine.test.ts     ← Scoring, filters, sorting, pagination, snippets
  lib/
    analytics.test.ts         ← Tracking metrics

e2e/
  search-flow.spec.ts         ← Playwright: core search → results → paginate → filter flow
```

---

## Tasks (16 total)

### Phase 1: Foundation

| #   | Task                | What                                                               | Approach                                                  |
| --- | ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | **Testing setup**   | Install vitest, configure paths                                    | `bun add -d vitest`                                       |
| 2   | **Types**           | All shared types with JSDoc (includes `thumbnail` + `bild` fields) | Single `lib/types.ts` file                                |
| 3   | **Preprocessor**    | Date, restrictions, tokenization                                   | TDD: write tests first, then implement                    |
| 4   | **Inverted index**  | Token → doc ID mapping                                             | TDD: test exact + prefix lookup                           |
| 5   | **Data generation** | 10K realistic media items (with `thumbnail` + `bild` URLs)         | Script with category pools (sports/music/politics/nature) |

### Phase 2: Search Engine + API

| #   | Task              | What                                                   | Approach                                  |
| --- | ----------------- | ------------------------------------------------------ | ----------------------------------------- |
| 6   | **Search engine** | Scoring + filters + sort + pagination                  | TDD: comprehensive tests for all features |
| 7   | **Analytics**     | Track searches, timing, keywords                       | TDD: simple in-memory singleton           |
| 8   | **API routes**    | `/api/search`, `/api/search/filters`, `/api/analytics` | Input validation, param clamping          |

### Phase 3: Frontend

| #   | Task                  | What                                                                              | Approach                                     |
| --- | --------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| 9   | **shadcn components** | Install input, badge, card, select, skeleton                                      | CLI: `bunx shadcn@latest add ...`            |
| 10  | **Hooks**             | `useDebounce` + `useSearch`                                                       | 300ms debounce, manages full search state    |
| 11  | **UI components**     | SearchBar, Filters, Results (with image placeholders), Pagination, Empty, Loading | Accessible (ARIA labels, keyboard nav)       |
| 12  | **Page assembly**     | Wire everything together                                                          | Server shell → client `SearchPage` component |

### Phase 4: Quality

| #   | Task             | What                                                                          | Approach                                                |
| --- | ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| 13  | **E2E test**     | Playwright: one core search flow                                              | Install Playwright, single spec covering the happy path |
| 14  | **Build + lint** | Verify everything compiles                                                    | `bun test && bun run build && bun lint`                 |
| 15  | **README**       | Full documentation                                                            | Approach, assumptions, decisions, scaling, limitations  |
| 16  | **Final polish** | Accessibility audit, type safety, cleanup,screenshot from actual imago search | Check for `any`, ARIA, keyboard support                 |

---

## Quality Standards

- **Testing pyramid** — unit (vitest), integration (vitest), E2E (Playwright)
- **TDD for core logic** — tests first for preprocessor, index, engine, analytics
- **Input validation** — clamp page/pageSize, validate ISO dates, handle bad params
- **JSDoc on public APIs** — include rationale, not just param descriptions
- **Accessibility** — ARIA labels, roles, keyboard navigation, `aria-live` regions
- **Clean architecture** — single responsibility per file, clear layer boundaries

---

## Scaling Strategy

**To millions of items:**

1. Replace in-memory index with **Elasticsearch** (native BM25, sharding)
2. **PostgreSQL** for metadata + GIN indexes as simpler alternative
3. **Redis** cache for hot queries (60s TTL)
4. Stateless API servers behind load balancer

**Continuous ingestion (items every minute):**

1. Message queue (Kafka/SQS) → preprocessing worker → index update
2. Elasticsearch supports real-time document additions without rebuild
3. Decouples ingestion from serving (no query latency impact)
