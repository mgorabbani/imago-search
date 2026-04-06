"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SearchResultItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  items: SearchResultItem[];
}

export function SearchResults({ items }: SearchResultsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ item, snippet }) => (
        <Card
          key={item.id}
          className={cn(
            "overflow-hidden transition-shadow hover:shadow-md",
          )}
          aria-label={`Media item ${item.bildnummer} by ${item.fotografen}`}
        >
          {/* Aspect-ratio placeholder */}
          <div
            className="relative flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground/40 overflow-hidden"
            style={{
              aspectRatio: `${item.breite} / ${item.hoehe}`,
              maxHeight: "200px",
            }}
          >
            <span className="font-mono text-lg select-none">{item.bildnummer}</span>
          </div>

          <CardContent className="space-y-1.5 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {item.bildnummer}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.datumOriginal}
              </span>
            </div>
            <p className="text-sm font-medium leading-tight">
              {item.fotografen}
            </p>
            <p
              className="text-sm leading-relaxed text-muted-foreground line-clamp-3 [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
