"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "./use-debounce";
import type { SearchResponse, FilterOptions } from "@/lib/types";

interface SearchFilters {
  credit?: string;
  dateFrom?: string;
  dateTo?: string;
  restriction?: string;
}

export function useSearch() {
  const [query, setQueryState] = useState("");
  const [filters, setFiltersState] = useState<SearchFilters>({});
  const [sortOrder, setSortOrderState] = useState<"asc" | "desc" | undefined>();
  const [page, setPageState] = useState(1);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef<AbortController | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    setPageState(1);
  }, []);

  const setFilters = useCallback((f: SearchFilters) => {
    setFiltersState(f);
    setPageState(1);
  }, []);

  const setSortOrder = useCallback((o: "asc" | "desc" | undefined) => {
    setSortOrderState(o);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/search/filters", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: FilterOptions) => setFilterOptions(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to load filter options:", err);
        }
      });
    return () => controller.abort();
  }, []);

  // Fetch search results
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    if (debouncedQuery) params.set("query", debouncedQuery);
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (filters.credit) params.set("credit", filters.credit);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.restriction) params.set("restriction", filters.restriction);
    if (sortOrder) {
      params.set("sortBy", "datum");
      params.set("sortOrder", sortOrder);
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return res.json();
      })
      .then((data: SearchResponse) => {
        setResults(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, page, filters, sortOrder]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    results,
    filterOptions,
    isLoading,
    error,
  };
}
