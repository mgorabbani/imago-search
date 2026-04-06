# Coding Challenge #2 C4

Hello! 👋🏼

Thank you for taking on this task. Our goal is to better understand your hands-on development skills and workflow.

The following task is designed to evaluate key skills we consider essential for this position. There is no single correct solution, so feel free to approach it in the way you believe is best. Use your judgment and what you know about IMAGO so far. We're particularly interested in your thought process, so please support your ideas with clear and well-reasoned arguments.

We kindly ask you to submit your solution as a PDF. You're welcome to include links to tools like CodeSandbox, GitHub Pages, or any other relevant platform. The deadline for submission is 7 working days from the date you receive this challenge. If you need more time, don't hesitate to contact us to request an extension. We estimate this task should take approximately 4 hours to complete.

We hope you enjoy the challenge.

Best of luck! 🍀

## The Challenge

IMAGO hosts one of the world’s largest media content libraries. Each media item has associated metadata, but the metadata quality is inconsistent and lacks clear structure. Your task is to build a search experience that can handle this metadata and provide relevant results to users.

You will implement a lightweight search layer inside a Next.js app using TypeScript. The goal is to evaluate how you design a maintainable system, model data, implement search and filtering, and build a polished UI with Tailwind.

You are encouraged to make reasonable assumptions where data or requirements are unclear and document these assumptions clearly as part of your submission.

Use the provided example media items as a starting dataset (you may extend it):

```json
[
  {
    "suchtext": "J.Morris, Manchester Utd inside right 7th January 1948 UnitedArchives00421716 PUBLICATIONxINxGERxSUIxAUTxONLY",
    "bildnummer": "0059987730",
    "fotografen": "IMAGO / United Archives International",
    "datum": "01.01.1900",
    "hoehe": "2460",
    "breite": "3643"
  },
  {
    "suchtext": "Michael Jackson 11 95 her Mann Musik Gesang Pop USA Hemd leger Studio hoch ganz stehend Bühne...",
    "bildnummer": "0056821849",
    "fotografen": "IMAGO / teutopress",
    "datum": "01.11.1995",
    "hoehe": "948",
    "breite": "1440"
  }
]
```

For that, create an HTTP endpoint (e.g., `GET /api/search`) that searches media items and returns a paginated list of results.

Your API must support:

1. **Keyword Search**
   - Search across the media text content:
     - `suchtext` (primary)
     - `fotografen` (secondary)
     - `bildnummer` (optional)
   - Explain your relevance approach (e.g., tokenization, normalization, prefix matching, scoring/weights).
2. **Filters**
   - Filter by:
     - **credit** (`fotografen`)
     - **date** (`datum`) — support a range (from/to) or at minimum a single-date filter
     - **restrictions** (derived from `suchtext`, e.g., tokens like `PUBLICATIONxINxGERxSUIxAUTxONLY`)
   - If you infer restrictions from text, describe how (e.g., regex extraction, normalization).
3. **Sorting**
   - Support sorting by `datum` (ascending/descending).
4. **Pagination**
   - Return `items`, `page`, `pageSize`, `total`, and optionally `totalPages`.
5. **Performance Consideration**
   - Your implementation should be reasonably performant for a dataset of at least **10,000** items.
   - Include a short explanation of how you would scale the approach to **millions** of items.

## Optimization & Metadata Handling

### Preprocessing

Propose and implement at least one preprocessing step that improves search consistency. Examples:

- Normalizing inconsistent delimiters and casing (e.g., `PUBLICATIONxINx...`)
- Extracting structured fields from `suchtext` (e.g., restrictions, people names, locations, dates)
- Tokenization and stop-word handling
- Date parsing into a normalized ISO representation
- Lightweight indexing strategy (e.g., precomputed token map, inverted index)

Explain:

- What you preprocess
- Why it helps
- Where it happens (build time vs runtime)
- How you would update the index as new items arrive

### “New items every minute”

Assume new media items are added continuously (about once per minute). Describe how you would:

- Ingest/append new items
- Update your search index
- Keep query latency low
- Avoid blocking the UI (if applicable)

You don’t need to build a full ingestion pipeline—documenting a sensible approach is fine.

## Analytics

Track basic usage metrics. You can implement this in-memory for the demo, or persist locally. Your choice.

Track:

- Number of searches
- Query response time (e.g., server-side timing per request)
- Most common search keywords

## Frontend UI

Build a simple search interface using Tailwind:

- Search input with debounced requests
- Filters UI:
  - credit (dropdown or autocomplete)
  - date range or date selector
  - restrictions (multi-select or chips)
- Sorting toggle for date
- Results list/grid with:
  - `bildnummer`
  - `fotografen`
  - `datum`
  - a snippet/highlight of the matching `suchtext` (if you choose to implement highlighting)
- Pagination controls

Focus on:

- Clear UI states: loading, empty results, error state
- Accessible basics (labels, focus states, keyboard-friendly controls)

## Deliverable

Please include:

- A README outlining your:
  - high-level approach
  - assumptions
  - design decisions (especially search/relevance)
  - limitations and “what I would do next”
- A link to a Git repository or a zip file containing runnable code
- A link to a deployed solution and clear instructions for running locally
- A PDF containing:
  - architecture overview
  - search strategy and relevance/scoring explanation
  - preprocessing strategy
  - scaling approach for millions of items + continuous ingestion
  - testing approach
  - any trade-offs you made

---

_Disclaimer: Due to the high volume of applications we receive, we may not be able to provide detailed feedback on your task. We appreciate your understanding and hope this does not diminish your motivation or enthusiasm to join our team._
