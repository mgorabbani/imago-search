import { getAnalytics } from "@/lib/analytics";

export function GET(): Response {
  return Response.json(getAnalytics());
}
