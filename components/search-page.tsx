"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    setPage,
    results,
    filterOptions,
    isLoading,
    error,
  } = useSearch();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const filterProps = {
    filters,
    onFiltersChange: setFilters,
    filterOptions,
    sortOrder,
    onSortOrderChange: setSortOrder,
  } as const;

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0" aria-label="Filters">
        <div className="sticky top-8">
          <SearchFilters {...filterProps} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              isLoading={isLoading}
              totalResults={results?.total}
            />
          </div>

          {/* Mobile filter trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-input px-3 text-sm hover:bg-accent lg:hidden"
                  aria-label="Open filters"
                />
              }
            >
              <SlidersHorizontal className="size-4" />
              Filters
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4 px-4 pb-6">
                <SearchFilters
                  {...filterProps}
                  onFiltersChange={(f) => {
                    setFilters(f);
                    setDrawerOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

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
                {results.total.toLocaleString()} results in{" "}
                {results.queryTimeMs}ms
              </p>
            )}
          </>
        ) : (
          <SearchEmpty query={query} />
        )}
      </div>
    </div>
  );
}
