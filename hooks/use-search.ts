"use client";

// In production, I might use TanStack Query (React Query) or SWR for
// built-in caching, deduplication, retry, and stale-while-revalidate from client side.
// Custom implementation here to demonstrate abort handling and React 19 patterns.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "./use-debounce";
import type { SearchResponse, FilterOptions } from "@/lib/types";

interface SearchFilters {
  credit?: string;
  dateFrom?: string;
  dateTo?: string;
  restriction?: string;
}

/**
 * Tracks in-flight fetch count to derive loading state without
 * calling setState synchronously inside an effect body.
 */
function createLoadingStore() {
  let count = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  return {
    start() {
      count++;
      notify();
    },
    stop() {
      count = Math.max(0, count - 1);
      notify();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return count > 0;
    },
  };
}

export function useSearch() {
  const searchParams = useSearchParams();

  const [query, setQueryState] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFiltersState] = useState<SearchFilters>(() => ({
    credit: searchParams.get("credit") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    restriction: searchParams.get("restriction") ?? undefined,
  }));
  const [sortOrder, setSortOrderState] = useState<"asc" | "desc" | undefined>(
    () => {
      const s = searchParams.get("sort");
      return s === "asc" || s === "desc" ? s : undefined;
    },
  );
  const [page, setPageState] = useState(
    () => Number(searchParams.get("page")) || 1,
  );
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef<AbortController | null>(null);
  const [loadingStore] = useState(createLoadingStore);
  const isLoading = useSyncExternalStore(
    loadingStore.subscribe,
    loadingStore.getSnapshot,
    loadingStore.getSnapshot,
  );

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

    loadingStore.start();

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return res.json();
      })
      .then((data: SearchResponse) => {
        setResults(data);
        setError(null);
        loadingStore.stop();
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") {
          loadingStore.stop();
          return;
        }
        setError(err instanceof Error ? err.message : "Search failed");
        loadingStore.stop();
      });

    return () => controller.abort();
  }, [debouncedQuery, page, filters, sortOrder, loadingStore]);

  // Sync state → URL (uses debounced query so URL doesn't thrash while typing)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (page > 1) params.set("page", String(page));
    if (filters.credit) params.set("credit", filters.credit);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.restriction) params.set("restriction", filters.restriction);
    if (sortOrder) params.set("sort", sortOrder);

    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
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
