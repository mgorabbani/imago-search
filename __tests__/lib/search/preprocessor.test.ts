import { describe, it, expect } from "vitest";
import {
  parseDate,
  extractRestrictions,
  tokenize,
  preprocessItem,
} from "@/lib/search/preprocessor";

describe("parseDate", () => {
  it("converts DD.MM.YYYY to YYYY-MM-DD", () => {
    expect(parseDate("01.01.1900")).toBe("1900-01-01");
    expect(parseDate("01.11.1995")).toBe("1995-11-01");
    expect(parseDate("25.12.2024")).toBe("2024-12-25");
  });

  it("returns empty string for invalid formats", () => {
    expect(parseDate("")).toBe("");
    expect(parseDate("2024-01-01")).toBe("");
    expect(parseDate("1.1.2024")).toBe("");
    expect(parseDate("00.13.2024")).toBe("");
  });
});

describe("extractRestrictions", () => {
  it("extracts restriction patterns from suchtext", () => {
    const text =
      "J.Morris Manchester Utd PUBLICATIONxINxGERxSUIxAUTxONLY";
    expect(extractRestrictions(text)).toEqual([
      "PUBLICATIONxINxGERxSUIxAUTxONLY",
    ]);
  });

  it("returns empty array when no restrictions found", () => {
    expect(extractRestrictions("Michael Jackson concert")).toEqual([]);
  });

  it("extracts multiple unique restrictions", () => {
    const text =
      "Photo PUBLICATIONxINxGERxSUIxAUTxONLY event EDITORIALxUSExONLY";
    const result = extractRestrictions(text);
    expect(result).toContain("PUBLICATIONxINxGERxSUIxAUTxONLY");
    expect(result).toContain("EDITORIALxUSExONLY");
    expect(result).toHaveLength(2);
  });

  it("deduplicates repeated restrictions", () => {
    const text =
      "PUBLICATIONxINxGER text PUBLICATIONxINxGER";
    expect(extractRestrictions(text)).toEqual(["PUBLICATIONxINxGER"]);
  });
});

describe("tokenize", () => {
  it("lowercases and splits on non-alphanumeric", () => {
    const tokens = tokenize("Manchester Utd 1948");
    expect(tokens).toContain("manchester");
    expect(tokens).toContain("utd");
    expect(tokens).toContain("1948");
  });

  it("removes stop words", () => {
    const tokens = tokenize("the quick and brown");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("and");
    expect(tokens).toContain("quick");
    expect(tokens).toContain("brown");
  });

  it("removes tokens shorter than 2 characters", () => {
    const tokens = tokenize("a b cc dd");
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("b");
    expect(tokens).toContain("cc");
    expect(tokens).toContain("dd");
  });

  it("preserves German umlauts", () => {
    const tokens = tokenize("München Straße Übung");
    expect(tokens).toContain("münchen");
    expect(tokens).toContain("straße");
    expect(tokens).toContain("übung");
  });
});

describe("preprocessItem", () => {
  it("transforms seed item correctly", () => {
    const raw = {
      suchtext:
        "J.Morris, Manchester Utd inside right 7th January 1948 UnitedArchives00421716 PUBLICATIONxINxGERxSUIxAUTxONLY",
      bildnummer: "0059987730",
      fotografen: "IMAGO / United Archives International",
      datum: "01.01.1900",
      hoehe: "2460",
      breite: "3643",
    };
    const item = preprocessItem(raw);
    expect(item.id).toBe("0059987730");
    expect(item.datum).toBe("1900-01-01");
    expect(item.datumOriginal).toBe("01.01.1900");
    expect(item.hoehe).toBe(2460);
    expect(item.breite).toBe(3643);
    expect(item.restrictions).toEqual([
      "PUBLICATIONxINxGERxSUIxAUTxONLY",
    ]);
    expect(item.tokens).toContain("manchester");
    expect(item.tokens).toContain("morris");
    expect(item.tokens).not.toContain("in"); // stop word
  });
});
