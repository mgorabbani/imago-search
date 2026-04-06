import { describe, it, expect, beforeEach } from "vitest";
import {
  recordSearch,
  getAnalytics,
  resetAnalytics,
} from "@/lib/analytics";

beforeEach(() => {
  resetAnalytics();
});

describe("analytics", () => {
  it("records a single search", () => {
    recordSearch("manchester united", 5);
    const data = getAnalytics();
    expect(data.totalSearches).toBe(1);
    expect(data.avgResponseTimeMs).toBe(5);
  });

  it("accumulates multiple searches", () => {
    recordSearch("manchester", 4);
    recordSearch("jackson", 6);
    const data = getAnalytics();
    expect(data.totalSearches).toBe(2);
  });

  it("calculates average response time", () => {
    recordSearch("a", 10);
    recordSearch("b", 20);
    expect(getAnalytics().avgResponseTimeMs).toBe(15);
  });

  it("tracks keyword frequency", () => {
    recordSearch("manchester united", 1);
    recordSearch("manchester city", 1);
    recordSearch("jackson", 1);
    const data = getAnalytics();
    const manchesterEntry = data.topKeywords.find(
      (k) => k.keyword === "manchester",
    );
    expect(manchesterEntry?.count).toBe(2);
  });

  it("returns top keywords sorted by count, limited to 20", () => {
    for (let i = 0; i < 25; i++) {
      recordSearch(`keyword${i}`, 1);
    }
    // Search "hot" 10 times to make it rank first
    for (let i = 0; i < 10; i++) {
      recordSearch("hot", 1);
    }
    const data = getAnalytics();
    expect(data.topKeywords.length).toBe(20);
    expect(data.topKeywords[0].keyword).toBe("hot");
    expect(data.topKeywords[0].count).toBe(10);
  });

  it("resets all state", () => {
    recordSearch("test", 10);
    resetAnalytics();
    const data = getAnalytics();
    expect(data.totalSearches).toBe(0);
    expect(data.avgResponseTimeMs).toBe(0);
    expect(data.topKeywords).toEqual([]);
  });
});
