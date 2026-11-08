import type { CatalogEntry, PriceSnapshot } from "@/lib/types";

export type PriceChange = {
  id: string;
  field: "monthlyMinor" | "annualPerMonthMinor" | "annualTotalMinor" | "includedUnits" | "priceStatus" | "currency";
  before: string | number | null;
  after: string | number | null;
};

const fields: PriceChange["field"][] = [
  "monthlyMinor",
  "annualPerMonthMinor",
  "annualTotalMinor",
  "includedUnits",
  "priceStatus",
  "currency",
];

function valueOf(entry: CatalogEntry, field: PriceChange["field"]): string | number | null {
  return entry[field];
}

export function diffSnapshots(before: PriceSnapshot, after: PriceSnapshot): {
  added: string[];
  removed: string[];
  changed: PriceChange[];
} {
  const previous = new Map(before.entries.map((entry) => [entry.id, entry]));
  const next = new Map(after.entries.map((entry) => [entry.id, entry]));
  const added = after.entries.filter((entry) => !previous.has(entry.id)).map((entry) => entry.id);
  const removed = before.entries.filter((entry) => !next.has(entry.id)).map((entry) => entry.id);
  const changed: PriceChange[] = [];
  for (const [id, entry] of next) {
    const prior = previous.get(id);
    if (!prior) continue;
    for (const field of fields) {
      const left = valueOf(prior, field);
      const right = valueOf(entry, field);
      if (left !== right) {
        changed.push({ id, field, before: left, after: right });
      }
    }
  }
  return { added, removed, changed };
}
