"use client";

import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  isLoading: boolean;
  totalResults?: number;
}

export function SearchBar({ query, onQueryChange, isLoading, totalResults }: SearchBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search media items..."
          aria-label="Search media items"
          className={cn(
            "h-11 pl-9 pr-28 text-base [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            isLoading && "border-ring/50",
          )}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
          {isLoading ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Loader2 className="size-4 text-primary animate-spin" aria-label="Loading results" />
            </div>
          ) : (
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-primary-foreground hover:bg-primary/90"
              aria-label="Search"
            >
              <Search className="size-4" />
              <span className="text-sm font-medium">Search</span>
            </button>
          )}
        </div>
      </div>
      {totalResults !== undefined && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {totalResults.toLocaleString()} results
        </p>
      )}
    </div>
  );
}
