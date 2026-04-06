import { describe, it, expect, beforeAll } from "vitest";
import type { RawMediaItem } from "@/lib/types";
import {
  initializeEngine,
  search,
  getFilterOptions,
} from "@/lib/search/search-engine";

const fixtures: RawMediaItem[] = [
  {
    suchtext: "Manchester United Fussball Bundesliga Tor Jubel",
    bildnummer: "0060000001",
    fotografen: "IMAGO / Sven Simon",
    datum: "15.03.2020",
    hoehe: "2000",
    breite: "3000",
  },
  {
    suchtext: "Manchester City Premier League Spielszene",
    bildnummer: "0060000002",
    fotografen: "IMAGO / Sven Simon",
    datum: "10.06.2021",
    hoehe: "1500",
    breite: "2500",
  },
  {
    suchtext: "Michael Jackson Konzert Bühne PUBLICATIONxINxGERxSUIxAUTxONLY",
    bildnummer: "0060000003",
    fotografen: "IMAGO / teutopress",
    datum: "01.11.1995",
    hoehe: "948",
    breite: "1440",
  },
  {
    suchtext: "Angela Merkel Bundestag Rede Berlin",
    bildnummer: "0060000004",
    fotografen: "IMAGO / Xinhua",
    datum: "22.09.2021",
    hoehe: "1800",
    breite: "2700",
  },
  {
    suchtext: "Alpen Landschaft Sonnenuntergang Bayern",
    bildnummer: "0060000005",
    fotografen: "IMAGO / Westend61",
    datum: "05.08.2019",
    hoehe: "3000",
    breite: "4500",
  },
  {
    suchtext: "Manchester Arena Konzert EDITORIALxUSExONLY",
    bildnummer: "0060000006",
    fotografen: "IMAGO / ZUMA Wire",
    datum: "20.01.2022",
    hoehe: "1200",
    breite: "1800",
  },
];

beforeAll(() => {
  initializeEngine(fixtures);
});

describe("search - scoring", () => {
  it("returns results for keyword search", () => {
    const result = search({ query: "manchester" });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((r) => r.score > 0)).toBe(true);
  });

  it("ranks suchtext matches higher than fotografen-only matches", () => {
    // "manchester" appears in suchtext for items 1,2,6
    // "sven" appears only in fotografen for items 1,2
    const manchesterResult = search({ query: "manchester" });
    const svenResult = search({ query: "sven" });
    // Manchester items have suchtext weight (3x), sven items only fotografen (2x)
    expect(manchesterResult.items[0].score).toBeGreaterThan(svenResult.items[0].score);
  });

  it("empty query returns all items with score 0", () => {
    const result = search({});
    expect(result.items.length).toBe(6);
    expect(result.items.every((r) => r.score === 0)).toBe(true);
  });
});

describe("search - filtering", () => {
  it("filters by credit", () => {
    const result = search({ credit: "IMAGO / teutopress" });
    expect(result.items.length).toBe(1);
    expect(result.items[0].item.bildnummer).toBe("0060000003");
  });

  it("filters by date range", () => {
    const result = search({ dateFrom: "2021-01-01", dateTo: "2021-12-31" });
    expect(result.items.length).toBe(2); // items 2 and 4
  });

  it("filters by restriction", () => {
    const result = search({
      restriction: "PUBLICATIONxINxGERxSUIxAUTxONLY",
    });
    expect(result.items.length).toBe(1);
    expect(result.items[0].item.bildnummer).toBe("0060000003");
  });

  it("combines filters", () => {
    const result = search({
      query: "manchester",
      credit: "IMAGO / Sven Simon",
    });
    expect(result.items.length).toBe(2); // items 1 and 2
  });
});

describe("search - sorting", () => {
  it("sorts by datum ascending", () => {
    const result = search({ sortBy: "datum", sortOrder: "asc" });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].item.datum >= result.items[i - 1].item.datum).toBe(true);
    }
  });

  it("sorts by datum descending", () => {
    const result = search({ sortBy: "datum", sortOrder: "desc" });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].item.datum <= result.items[i - 1].item.datum).toBe(true);
    }
  });
});

describe("search - pagination", () => {
  it("returns correct pagination metadata", () => {
    const result = search({ pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.total).toBe(6);
    expect(result.totalPages).toBe(3);
    expect(result.items.length).toBe(2);
  });

  it("returns correct items for page 2", () => {
    const page1 = search({ pageSize: 2, page: 1 });
    const page2 = search({ pageSize: 2, page: 2 });
    expect(page2.items[0].item.id).not.toBe(page1.items[0].item.id);
  });

  it("returns empty items for out-of-range page", () => {
    const result = search({ page: 100, pageSize: 20 });
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(6);
  });

  it("clamps pageSize to 1-100", () => {
    const big = search({ pageSize: 500 });
    expect(big.pageSize).toBe(100);
    const small = search({ pageSize: 0 });
    expect(small.pageSize).toBe(1);
  });
});

describe("search - snippets", () => {
  it("wraps matched tokens in <mark> tags", () => {
    const result = search({ query: "manchester" });
    const snippet = result.items[0].snippet;
    expect(snippet).toContain("<mark>");
    expect(snippet.toLowerCase()).toContain("manchester");
  });

  it("returns plain snippet when no query", () => {
    const result = search({});
    expect(result.items[0].snippet).not.toContain("<mark>");
    expect(result.items[0].snippet.length).toBeLessThanOrEqual(200);
  });
});

describe("getFilterOptions", () => {
  it("returns sorted unique credits", () => {
    const options = getFilterOptions();
    expect(options.credits).toContain("IMAGO / Sven Simon");
    expect(options.credits).toContain("IMAGO / teutopress");
    expect(options.credits).toEqual([...options.credits].sort());
  });

  it("returns sorted unique restrictions", () => {
    const options = getFilterOptions();
    expect(options.restrictions).toContain("PUBLICATIONxINxGERxSUIxAUTxONLY");
    expect(options.restrictions).toContain("EDITORIALxUSExONLY");
  });

  it("returns min/max date range", () => {
    const options = getFilterOptions();
    expect(options.dateRange.min).toBeTruthy();
    expect(options.dateRange.max).toBeTruthy();
    expect(options.dateRange.min <= options.dateRange.max).toBe(true);
  });
});
