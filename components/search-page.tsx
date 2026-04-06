"use client";

import { useSearch } from "@/hooks/use-search";
import { SearchBar } from "./search-bar";
import { SearchFilters } from "./search-filters";
import { SearchResults } from "./search-results";
import { SearchPagination } from "./search-pagination";
import { SearchEmpty } from "./search-empty";
import { SearchLoading } from "./search-loading";

export function SearchPage() {
  const {
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
  } = useSearch();

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        isLoading={isLoading}
      />

      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        totalResults={results?.total ?? 0}
      />

      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {isLoading && !results ? (
        <SearchLoading />
      ) : results && results.items.length > 0 ? (
        <>
          <SearchResults items={results.items} />
          <SearchPagination
            page={results.page}
            totalPages={results.totalPages}
            onPageChange={setPage}
          />
          {results.queryTimeMs > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {results.total.toLocaleString()} results in {results.queryTimeMs}ms
            </p>
          )}
        </>
      ) : (
        <SearchEmpty query={query} />
      )}
    </div>
  );
}
