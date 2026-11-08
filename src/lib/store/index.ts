import "server-only";
import type { Store } from "@/lib/store/types";
import { PostgresStore } from "@/lib/store/postgres";

let singleton: Store | null | undefined;

export function getStore(): Store | null {
  if (singleton !== undefined) return singleton;
  const url = process.env.DATABASE_URL;
  if (!url) {
    singleton = null;
    return singleton;
  }
  singleton = new PostgresStore(url);
  return singleton;
}

export function resetStoreForTests(): void {
  singleton = undefined;
}
