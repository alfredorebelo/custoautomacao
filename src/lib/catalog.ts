import { snapshot } from "@/data/snapshot";
import type { CatalogEntry, Platform } from "@/lib/types";

export type CatalogQuery = {
  q?: string;
  platform?: string;
  kind?: string;
  priced?: string;
};

const platforms = new Set<Platform>(["zapier", "make", "n8n"]);

export function searchCatalog(query: CatalogQuery, entries: CatalogEntry[] = snapshot.entries): CatalogEntry[] {
  const text = (query.q ?? "").trim().toLowerCase();
  return entries.filter((entry) => {
    if (query.platform && query.platform !== "all") {
      if (!platforms.has(query.platform as Platform) || entry.platform !== query.platform) return false;
    }
    if (query.kind && query.kind !== "all" && entry.kind !== query.kind) return false;
    if (query.priced === "yes" && !(entry.priceStatus === "verified" && entry.kind === "plan" && entry.monthlyMinor !== null)) {
      return false;
    }
    if (!text) return true;
    const haystack = [entry.name, entry.summary, entry.platform, entry.billingUnit ?? "", ...entry.notes].join(" ").toLowerCase();
    return haystack.includes(text);
  });
}

export function entryById(id: string): CatalogEntry | undefined {
  return snapshot.entries.find((entry) => entry.id === id);
}

export function verifiedPlanCount(entries: CatalogEntry[] = snapshot.entries): number {
  return entries.filter((entry) => entry.kind === "plan" && entry.priceStatus === "verified" && entry.priceComparable).length;
}
