# IMAGO Search App — Technical Document

Live URL: https://imago-search-eta.vercel.app/
Github: https://github.com/mgorabbani/imago-search
Readme.md in github has instruction to Run the project locally. I added 10k dummy image data generation script within build script to simplify vercel delopyment

## Architecture Overview

### AI USAGE

I used Claude Code to build this project. My thought process was. I also use AI to assist me write down this docs too but everyline is reviewerd and modified by me.

0. I initialised CLAUDE.md file with my own best practices as well nextjs
1. I run QA mode with Claude to clarify and learn if i don't know something or not 100% clear.
2. Then I wrote down a comprehensive plan then review the plan and update accordingly
3. Then I created a task list to find dependencies and organised for AI to work
4. Then I run ai agent to complete task by task and after it completes one task it also review its own code write tests if relavant
5. Then I review the code again one by one if it followed everything properly or missed soemthing, rerun ai agent or correct myself test again then commit.
6. After it finish core features, I tested thorowlly in browser edge cases write more tests and write e2e as well
7. I fixed some UI issues, like date field UI, i take inspiration from current Imago Search Page, but kept things simple and make sure it's response for all screen sizes. added things like show total images next to search, also added search button which was missing by default by AI. I added it also made sure app is accessible having ARIA compliant as it is very important specailly site like this. one one thing I learned about accessiblity is, it's not necessarily for blind people. You can be eating or holding baby or something and want to use mouse only. or keyboard only. Images might not be loading and alt tag helps to know or screen reader reads for blind people.
8. Then I did some more clean up, fixes, I initially had bun, but then i realised not all server supports bun by default, So I switchted to PNPM.
9. At the last moment I noticed the URL wasn't reflecting search state (query, filters, pagination). I added URL sync so every search is shareable and bookmarkable — a standard UX expectation for any search interface.

### Key architectural decisions

The app is a Next.js application with a client-side search interface that talks to a server-side API. On the frontend, a SearchBar, Filters panel, and Results Grid all feed through a single `useSearch` hook that fetches JSON from the backend. On the server, `GET /api/search` validates input, runs the query through a SearchEngine singleton, and returns scored results.

The search engine uses a custom in-memory inverted index built from `data/media-items.json` (10K items). Supporting endpoints include `/api/search/filters` for available filter options (credits, date range, restrictions) and `/api/analytics` for search metrics (total searches, average response time, top 20 keywords). There is no frontend for analytics rather just the API in JSON format.

- **In-memory index over an external DB** — The challenge asks for a "lightweight search layer." Building a custom inverted index demonstrates understanding of search internals and keeps the app self-contained with zero infrastructure dependencies. I could also use SQLite but then that would abstract away the key concepts in search like precomputed token map, inverted index etc.
- **Lazy singleton initialization** — The search engine loads and indexes data once on the first API request, then stays in memory. A promise-based singleton prevents concurrent initialization race conditions.
- **Server Components by default** — Only components that need state or browser APIs use `"use client"`. The page shell and layout stay server-rendered.
- **Clean separation of concerns** — Preprocessor, inverted index, and search engine are separate modules with clean interfaces, each independently testable.
- **Date range validation** — The "from" date picker sets the `min` attribute on the "to" picker, and the "to" date sets the `max` on "from," preventing users from selecting invalid ranges (e.g., a start date after the end date). Both pickers also cap at today's date.
- **URL state sync** — Search query, page, filters, and sort order are reflected in the URL (`?q=berlin&page=2&credit=AFP&sort=desc`) so searches are shareable and bookmarkable. State is read from URL on initial load and written back via `replaceState` as the user interacts.
- **Request abort/deduplication** — Every search triggers a `fetch` call, but when the user types quickly or changes filters in rapid succession, previous in-flight requests are cancelled via `AbortController` before firing the next one. This prevents race conditions where a slow response from an earlier query could overwrite the results of a newer one. In production, libraries like TanStack Query or SWR handle this automatically, but the manual implementation here demonstrates the underlying pattern.

## Search Strategy & Relevance Scoring

**Tokenization.** Raw text is lowercased and split on non-alphanumeric characters (preserving German umlauts: ä, ö, ü, ß). Tokens shorter than 2 characters and stop words (English + German) are removed. For example, `"J.Morris, Manchester Utd inside right 7th January 1948"` becomes `["morris", "manchester", "utd", "inside", "right", "7th", "january", "1948"]`.

**Field-partitioned inverted index.** The index is split by source field — `suchtext`, `fotografen`, and `bildnummer`. Each partition maps tokens to the set of document IDs containing that token. This partitioning enables per-field weighting so a match in `suchtext` (the descriptive text) contributes more to relevance than a match in `bildnummer` (image number).

**Scoring.** For each query token, the engine checks both exact and prefix matches across all three fields. The scoring works like this:

- Field weights reflect importance: `suchtext` (3), `fotografen` (2), `bildnummer` (1)
- Exact matches get a 2x bonus over prefix matches
- So an exact match in `suchtext` scores 6 points, a prefix match in `bildnummer` scores 1 point
- Prefix matching requires 3+ character tokens to prevent overly broad matches
- Scores are summed across all query tokens for multi-word queries
- Results are sorted by score descending, with optional date-based sorting override

**Snippet highlighting.** For each result, a 200-character text window is extracted from `suchtext`, centered on the first match. Matched tokens are wrapped in `<mark>` tags. The text is HTML-escaped before tag insertion to prevent XSS.

## Preprocessing Strategy

All preprocessing runs once at server startup (lazily, on first request). The 10K items are preprocessed in ~50ms.

What gets preprocessed and why:

- **Date parsing** — Converts `"01.11.1995"` (DD.MM.YYYY) to `"1995-11-01"` (ISO). This enables lexicographic date comparison for range filtering and sorting without needing Date objects on every query. The current regex-based parser validates month (1–12) and day (1–31) but doesn't check calendar-aware validity (e.g., Feb 31 would pass). Sufficient for the controlled dataset, but noted as a trade-off below.
- **Restriction extraction** — Pulls out patterns like `PUBLICATIONxINxGERxSUIxAUTxONLY` from the raw `suchtext` into a structured array. This enables clean dropdown-based filtering without running regex on every query.
- **Dimension parsing** — Converts string dimensions like `"2460"` to numbers for aspect-ratio calculation in image placeholder rendering.
- **Tokenization and index construction** — Builds a `Map<token, Set<docId>>` per field, turning search from an O(n × m) full-text scan into O(k) set lookups. This is what enables sub-5ms query times on 10K items.

## Scaling to Millions of Items + Continuous Ingestion

**Current baseline.** At 10K items, queries run in 1–5ms using ~20MB memory. Estimated 10–20ms at 100K items. Beyond ~500K items, the in-memory approach isn't feasible due to V8 heap limits and GC pressure. Adding new items requires a server restart — incremental inserts are possible with the current data structure but out of scope for this challenge.

**Moderate scale (100K–500K items).** Move metadata to PostgreSQL with GIN indexes and `tsvector` for full-text search. Add Redis caching for hot queries with 60s TTL — most search UIs see heavy query repetition as users refine searches. As well as daily trending searches are usually similar for sites like IMAGO

**Large scale (1M+ items).** Switch to Elasticsearch for native BM25 scoring, horizontal sharding, faceted aggregations, and near-real-time indexing. API servers become stateless behind a load balancer, fetching from Elasticsearch instead of maintaining a local index.

**Multilingual semantic search.** IMAGO's content mixes German and English, and keyword search can't bridge languages — searching "soccer" won't find "Fußball." At scale, I'd add a hybrid search layer: keep Elasticsearch for keyword precision (exact IDs, photographer names) and add vector search for semantic recall. Multilingual embedding models (e.g.OpenAI embeddings) map text from different languages into the same vector space, so "soccer" and "Fußball" become nearby vectors without any translation step. Storage options include pgvector (if already on PostgreSQL), Pinecone, or Elasticsearch's own kNN search. The embedding pipeline would run during ingestion — precompute vectors alongside token preprocessing — so query-time cost is just a vector similarity lookup. We can figure out more based on our exact need and pros and cons of different architecture.

**Continuous ingestion.** For handling new items every minute: a message queue (Kafka/SQS) decouples ingestion from serving so new items don't block queries. A preprocessing worker normalizes metadata, generates embeddings, and feeds Elasticsearch. Elasticsearch supports near real-time indexing natively, but the ingestion trigger, preprocessing, and embedding generation still need an external pipeline. The UI would use polling or WebSocket push to surface new items.

## Testing Approach

**Unit tests (45 tests, vitest).** Cover all core logic:

- Preprocessor (11 tests) — date parsing (valid, invalid, edge cases), restriction extraction, tokenization, stop words, German characters
- Inverted Index (10 tests) — index building, exact lookup, prefix lookup (3+ chars), empty queries, missing tokens
- Search Engine (18 tests) — weighted scoring, multi-token queries, filtering (credit, date range, restriction), sorting, pagination (bounds, last page), snippet highlighting, edge cases
- Analytics (6 tests) — search counting, response time averaging, keyword frequency, top-20 limit

Tests were written alongside implementation to ensure each module's API contract was validated before moving to the next.

**E2E tests (6 tests, Playwright).** Cover core user flows: initial load (20 cards + pagination), search (query → results update), pagination (navigate pages), no results (empty state), clear (return to full listing), and sort cycling (relevance → date asc → date desc → relevance). All selectors use ARIA labels (`getByLabel`, `getByText`) rather than CSS classes — this makes tests resilient to styling changes while also validating accessibility.

## Trade-offs

**Custom inverted index vs. Elasticsearch/SQLite.** Even though AI wrote these things, It helps me to review fundamentals of search, has zero infrastructure, and delivers sub-5ms queries. But it won't scale beyond ~500K items and lacks fuzzy matching, BM25/TF-IDF, or vector/semantic search. SQLite with FTS5 would be a lightweight persistent middle ground, but still doesn't provide fuzzy matching, faceted aggregations, or cross-language semantic search. The challenge explicitly asks for a "lightweight search layer," which is why I build search from scratch, not configure a library.

**Placeholder boxes vs. actual images.** The dataset has dimensions but no image URLs. Placeholders use real `breite`/`hoehe` values so the layout accurately represents a real image grid. In production, `bildnummer` would serve as the CDN lookup key (e.g., `https://cdn.imago-images.com/{bildnummer}/thumb.jpg`). The ingestion pipeline would generate thumbnails at multiple resolutions (e.g., 200px for grid, 800px for detail view, full-res for download) and upload to the CDN. The frontend would use `next/image` with blur placeholders and lazy loading, with the CDN domain whitelisted in Next.js config.

**No vector/semantic search.** The dataset mixes German and English, This was a obvious sign we need and keyword search misses cross-language matches (e.g., "soccer" won't find "Fußball"). Embedding-based vector search (via multilingual sentence-transformers + pgvector/Pinecone) would capture semantic similarity across languages without maintaining manual stop-word lists together with some other hybrid aproach.

**Regex date parsing vs. a date library.** The `parseDate` function uses a regex to convert `DD.MM.YYYY` to ISO format with basic range checks (month 1–12, day 1–31). This doesn't catch impossible dates like Feb 31 or Apr 31. In a production app, I would use a date library like `date-fns` (`parse` with strict mode) for calendar-aware validation, timezone handling, and locale support.

**Combined EN+DE stop words vs. language detection.** Simpler and handles the mixed-language `suchtext` without complexity. May over-filter in edge cases (e.g., "die" is both a German article and an English word), but language detection adds complexity with minimal benefit for this dataset size.

**Prefix matching vs. fuzzy/Levenshtein matching.** Predictable results, fast lookup, and supports typeahead. No typo tolerance, but prefix matching covers the most common search behavior (typing progressively). Fuzzy matching would be a natural next step.

**`useSyncExternalStore` for loading state vs. `useState` in effect.** Compliant with React 19 lint rules and avoids cascading renders from synchronous `setState` in effects. The external store pattern tracks in-flight fetches outside React's render cycle, calling `setState` only via the subscription mechanism.

**URL state sync via `useState` initializers vs. a dedicated library.** The current approach reads URL params once on mount and writes back via `window.history.replaceState`. This works well for a single-page search app where fresh page loads (shared links, bookmarks) correctly restore state. However, if the app grew to have multiple routes linking into search with different params, or if external navigation updated the URL without a full remount, the `useState` initializers wouldn't re-run. In production, a library like `nuqs` would provide true two-way URL ↔ state binding with proper Next.js router integration.

**Offset-based pagination vs. cursor-based pagination.** The current implementation uses page/offset pagination (`?page=2&pageSize=20`), which is simple and works well with the in-memory index. However, offset pagination has known issues at scale: skipping large offsets is O(n), and results can shift when new items are ingested between page loads (users see duplicates or miss items). Cursor-based pagination (e.g., `?after=bildnummer_12345`) solves both — the cursor points to a stable position in the result set regardless of insertions, and the database/index can seek directly to it. For a production system with continuous ingestion, cursor-based pagination would be the better choice.

**In-memory analytics vs. persistent storage.** Zero setup and instant reads, but resets on server restart. The challenge says "You can implement this in-memory for the demo." Production would use a time-series DB or analytics services like Datadog, Grafana etc.
