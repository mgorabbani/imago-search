import type { AnalyticsData } from "@/lib/types";

let totalSearches = 0;
let totalResponseTimeMs = 0;
const keywordCounts = new Map<string, number>();

export function recordSearch(query: string, responseTimeMs: number): void {
  totalSearches++;
  totalResponseTimeMs += responseTimeMs;

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0);

  for (const keyword of keywords) {
    keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
  }
}

export function getAnalytics(): AnalyticsData {
  const sorted = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalSearches,
    avgResponseTimeMs:
      totalSearches > 0
        ? Math.round((totalResponseTimeMs / totalSearches) * 100) / 100
        : 0,
    topKeywords: sorted,
  };
}

export function resetAnalytics(): void {
  totalSearches = 0;
  totalResponseTimeMs = 0;
  keywordCounts.clear();
}
