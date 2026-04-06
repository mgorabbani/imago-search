import { readFile } from "fs/promises";
import path from "path";
import { initializeEngine, isInitialized } from "./search-engine";
import type { RawMediaItem } from "@/lib/types";

let initPromise: Promise<void> | null = null;

export function ensureInitialized(): Promise<void> {
  if (isInitialized()) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      const filePath = path.join(process.cwd(), "data", "media-items.json");
      const raw = await readFile(filePath, "utf-8");
      const items = JSON.parse(raw) as RawMediaItem[];
      initializeEngine(items);
    })();
    // Clear cached promise on failure so the next request retries
    initPromise.catch(() => {
      initPromise = null;
    });
  }
  return initPromise;
}
