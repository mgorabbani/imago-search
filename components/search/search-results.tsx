"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SearchResultItem } from "@/lib/types";
import { cn } from "@/lib/utils";

// Temporary: placeholder colors for demo only.
// In production, replace the colored placeholder div with next/image
// loading thumbnails from IMAGO's CDN.
const PLACEHOLDER_COLORS = [
  "bg-rose-100", "bg-sky-100", "bg-amber-100", "bg-emerald-100",
  "bg-violet-100", "bg-teal-100", "bg-orange-100", "bg-indigo-100",
  "bg-pink-100", "bg-cyan-100", "bg-lime-100", "bg-fuchsia-100",
];

function getPlaceholderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

interface SearchResultsProps {
  items: SearchResultItem[];
}

export function SearchResults({ items }: SearchResultsProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
      {items.map(({ item, snippet }) => (
        <Card
          key={item.id}
          className={cn(
            "overflow-hidden transition-shadow hover:shadow-md pt-0 gap-0",
          )}
          aria-label={`Media item ${item.bildnummer} by ${item.fotografen}`}
        >
          {/* Aspect-ratio placeholder */}
          <div
            className={cn(
              "relative flex items-center justify-center text-muted-foreground/40 overflow-hidden",
              getPlaceholderColor(item.bildnummer),
            )}
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
