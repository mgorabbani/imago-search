"use client";

import { ArrowUpDown, CalendarDays, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatRestriction } from "@/lib/format-restriction";
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
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function SearchFilters({
  filters,
  onFiltersChange,
  filterOptions,
  sortOrder,
  onSortOrderChange,
}: SearchFiltersProps) {
  const hasActiveFilters =
    filters.credit || filters.dateFrom || filters.dateTo || filters.restriction;
  const today = getToday();

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
    <div className="space-y-5">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-input py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Clear all filters"
        >
          <XCircle className="size-3.5" />
          Clear all filters
        </button>
      )}

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sort by</label>
        <button
          type="button"
          onClick={cycleSortOrder}
          className="flex w-full h-9 items-center justify-between gap-1.5 rounded-lg border border-input px-3 text-sm hover:bg-accent"
          aria-label={`Sort by date: ${sortOrder ?? "relevance"}`}
        >
          <span>
            {sortOrder === "asc"
              ? "Date (oldest first)"
              : sortOrder === "desc"
                ? "Date (newest first)"
                : "Relevance"}
          </span>
          <ArrowUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <Separator />

      {/* Photographer */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Photographer</label>
        <Select
          value={filters.credit ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              credit: !v || v === "all" ? undefined : v,
            })
          }
        >
          <SelectTrigger
            className="w-full"
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
      </div>

      <Separator />

      {/* Date range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          Date range
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="date-from"
              className="w-10 shrink-0 text-sm text-muted-foreground"
            >
              From:
            </label>
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom ?? ""}
              max={filters.dateTo ?? today}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value || undefined,
                })
              }
              className="flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 text-sm text-center [&::-webkit-date-and-time-value]:text-center [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
              aria-label="Filter from date"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="date-to"
              className="w-10 shrink-0 text-sm text-muted-foreground"
            >
              To:
            </label>
            <input
              id="date-to"
              type="date"
              value={filters.dateTo ?? ""}
              min={filters.dateFrom ?? undefined}
              max={today}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateTo: e.target.value || undefined,
                })
              }
              className="flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 text-sm text-center [&::-webkit-date-and-time-value]:text-center [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
              aria-label="Filter to date"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Restrictions */}
      {filterOptions && filterOptions.restrictions.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage restriction</label>
          <Select
            value={filters.restriction ?? "all"}
            onValueChange={(v) =>
              onFiltersChange({
                ...filters,
                restriction: !v || v === "all" ? undefined : v,
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-label="Filter by usage restriction"
            >
              <span className="flex flex-1 text-left truncate">
                {filters.restriction
                  ? formatRestriction(filters.restriction)
                  : "All restrictions"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All restrictions</SelectItem>
              {filterOptions.restrictions.map((r) => (
                <SelectItem key={r} value={r}>
                  {formatRestriction(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
