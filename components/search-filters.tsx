"use client";

import { ArrowUpDown, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOptions } from "@/lib/types";

interface SearchFilters {
  credit?: string;
  dateFrom?: string;
  dateTo?: string;
  restriction?: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions: FilterOptions | null;
  sortOrder: "asc" | "desc" | undefined;
  onSortOrderChange: (order: "asc" | "desc" | undefined) => void;
  totalResults: number;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  filterOptions,
  sortOrder,
  onSortOrderChange,
  totalResults,
}: SearchFiltersProps) {
  const hasActiveFilters = filters.credit || filters.dateFrom || filters.dateTo || filters.restriction;

  function cycleSortOrder() {
    if (!sortOrder) onSortOrderChange("asc");
    else if (sortOrder === "asc") onSortOrderChange("desc");
    else onSortOrderChange(undefined);
  }

  function clearFilters() {
    onFiltersChange({});
    onSortOrderChange(undefined);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Credit dropdown */}
        <Select
          value={filters.credit ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, credit: !v || v === "all" ? undefined : v })
          }
        >
          <SelectTrigger
            className="w-[220px]"
            aria-label="Filter by photographer"
          >
            <SelectValue placeholder="All photographers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All photographers</SelectItem>
            {filterOptions?.credits.map((credit) => (
              <SelectItem key={credit} value={credit}>
                {credit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm text-muted-foreground">
            From
          </label>
          <input
            id="date-from"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value || undefined,
              })
            }
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter from date"
          />
          <label htmlFor="date-to" className="text-sm text-muted-foreground">
            To
          </label>
          <input
            id="date-to"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value || undefined,
              })
            }
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter to date"
          />
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={cycleSortOrder}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input px-3 text-sm hover:bg-accent"
          aria-label={`Sort by date: ${sortOrder ?? "relevance"}`}
        >
          <ArrowUpDown className="size-3.5" />
          {sortOrder === "asc" ? "Date ↑" : sortOrder === "desc" ? "Date ↓" : "Relevance"}
        </button>
      </div>

      {/* Restriction chips */}
      {filterOptions && filterOptions.restrictions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by restrictions">
          {filterOptions.restrictions.map((r) => (
            <Badge
              key={r}
              variant={filters.restriction === r ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  restriction: filters.restriction === r ? undefined : r,
                })
              }
              role="checkbox"
              aria-checked={filters.restriction === r}
            >
              {r}
            </Badge>
          ))}
        </div>
      )}

      {/* Active filter summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalResults.toLocaleString()} result{totalResults !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm hover:text-foreground"
            aria-label="Clear all filters"
          >
            <XCircle className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
