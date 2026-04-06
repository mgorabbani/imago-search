import { getAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(getAnalytics());
}
