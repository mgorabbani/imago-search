import { describe, it, expect, beforeAll } from "vitest";
import type { MediaItem } from "@/lib/types";
import {
  buildIndex,
  lookupExact,
  lookupPrefix,
} from "@/lib/search/inverted-index";
import type { InvertedIndex } from "@/lib/search/inverted-index";

const fixtures: MediaItem[] = [
  {
    id: "001",
    suchtext: "Manchester United football match",
    bildnummer: "001",
    fotografen: "IMAGO / Sven Simon",
    datum: "2020-01-15",
    datumOriginal: "15.01.2020",
    hoehe: 2000,
    breite: 3000,
    restrictions: [],
    tokens: ["manchester", "united", "football", "match"],
  },
  {
    id: "002",
    suchtext: "Manchester City Premier League",
    bildnummer: "002",
    fotografen: "IMAGO / teutopress",
    datum: "2021-06-10",
    datumOriginal: "10.06.2021",
    hoehe: 1500,
    breite: 2500,
    restrictions: ["PUBLICATIONxINxGER"],
    tokens: ["manchester", "city", "premier", "league"],
  },
  {
    id: "003",
    suchtext: "Michael Jackson concert München",
    bildnummer: "003",
    fotografen: "IMAGO / teutopress",
    datum: "1995-11-01",
    datumOriginal: "01.11.1995",
    hoehe: 948,
    breite: 1440,
    restrictions: [],
    tokens: ["michael", "jackson", "concert", "münchen"],
  },
];

let index: InvertedIndex;

beforeAll(() => {
  index = buildIndex(fixtures);
});

describe("buildIndex", () => {
  it("creates three field partitions", () => {
    expect(index.has("suchtext")).toBe(true);
    expect(index.has("fotografen")).toBe(true);
    expect(index.has("bildnummer")).toBe(true);
  });

  it("indexes suchtext tokens", () => {
    const suchtextPostings = index.get("suchtext")!;
    expect(suchtextPostings.get("manchester")?.has("001")).toBe(true);
    expect(suchtextPostings.get("manchester")?.has("002")).toBe(true);
    expect(suchtextPostings.get("jackson")?.has("003")).toBe(true);
  });

  it("indexes fotografen tokens", () => {
    const fotografenPostings = index.get("fotografen")!;
    expect(fotografenPostings.get("imago")?.size).toBe(3);
    expect(fotografenPostings.get("teutopress")?.has("002")).toBe(true);
    expect(fotografenPostings.get("teutopress")?.has("003")).toBe(true);
  });
});

describe("lookupExact", () => {
  it("finds docs with exact token match", () => {
    const docs = lookupExact(index, "manchester");
    expect(docs.has("001")).toBe(true);
    expect(docs.has("002")).toBe(true);
    expect(docs.has("003")).toBe(false);
  });

  it("returns empty set for non-existent token", () => {
    expect(lookupExact(index, "nonexistent").size).toBe(0);
  });

  it("filters by field when specified", () => {
    const docs = lookupExact(index, "teutopress", "fotografen");
    expect(docs.has("002")).toBe(true);
    expect(docs.has("003")).toBe(true);
    // teutopress is not in suchtext
    const suchtextDocs = lookupExact(index, "teutopress", "suchtext");
    expect(suchtextDocs.size).toBe(0);
  });
});

describe("lookupPrefix", () => {
  it("finds docs matching prefix (3+ chars)", () => {
    const docs = lookupPrefix(index, "man");
    expect(docs.has("001")).toBe(true);
    expect(docs.has("002")).toBe(true);
  });

  it("returns empty set for prefix shorter than 3 chars", () => {
    expect(lookupPrefix(index, "ma").size).toBe(0);
  });

  it("filters by field when specified", () => {
    const docs = lookupPrefix(index, "teut", "fotografen");
    expect(docs.has("002")).toBe(true);
    expect(docs.has("003")).toBe(true);
  });

  it("unions across fields when no field specified", () => {
    // "imago" appears in fotografen for all 3 items
    const docs = lookupPrefix(index, "ima");
    expect(docs.size).toBe(3);
  });
});
