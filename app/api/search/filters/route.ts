import { ensureInitialized } from "@/lib/search/init";
import { getFilterOptions } from "@/lib/search/search-engine";

export async function GET(): Promise<Response> {
  try {
    await ensureInitialized();
    return Response.json(getFilterOptions());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
