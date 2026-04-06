"use client";

import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ query, onQueryChange, isLoading }: SearchBarProps) {
  return (
    <div className="relative">
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
          "h-10 pl-9 pr-9 text-base",
          isLoading && "border-ring/50",
        )}
      />
      {isLoading ? (
        <Loader2
          className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin"
          aria-label="Loading results"
        />
      ) : query ? (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
