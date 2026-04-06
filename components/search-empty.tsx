"use client";

import { Search, SearchX } from "lucide-react";

interface SearchEmptyProps {
  query: string;
}

export function SearchEmpty({ query }: SearchEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {query ? (
        <>
          <SearchX className="size-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-sm text-muted-foreground/70">
            Try different keywords or adjust your filters
          </p>
        </>
      ) : (
        <>
          <Search className="size-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-muted-foreground">
            Start searching to find media items
          </p>
        </>
      )}
    </div>
  );
}
