import type { NextRequest } from "next/server";
import { ensureInitialized } from "@/lib/search/init";
import { search } from "@/lib/search/search-engine";
import { recordSearch } from "@/lib/analytics";
import type { SearchRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await ensureInitialized();

    const params = request.nextUrl.searchParams;
    const query = params.get("query") ?? undefined;
    const page = params.has("page") ? parseInt(params.get("page")!, 10) : undefined;
    const pageSize = params.has("pageSize") ? parseInt(params.get("pageSize")!, 10) : undefined;
    const credit = params.get("credit") ?? undefined;
    const dateFrom = params.get("dateFrom") ?? undefined;
    const dateTo = params.get("dateTo") ?? undefined;
    const restriction = params.get("restriction") ?? undefined;
    const sortByRaw = params.get("sortBy");
    const sortBy = sortByRaw === "datum" ? "datum" as const : undefined;
    const sortOrderRaw = params.get("sortOrder");
    const sortOrder = sortOrderRaw === "asc" || sortOrderRaw === "desc" ? sortOrderRaw : undefined;

    const searchRequest: SearchRequest = {
      query,
      page,
      pageSize,
      credit,
      dateFrom,
      dateTo,
      restriction,
      sortBy,
      sortOrder,
    };

    const start = performance.now();
    const result = search(searchRequest);
    const elapsed = performance.now() - start;

    result.queryTimeMs = Math.round(elapsed * 100) / 100;

    if (query) {
      recordSearch(query, elapsed);
    }

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
