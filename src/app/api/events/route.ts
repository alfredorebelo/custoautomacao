import { handleEvent } from "@/lib/handlers";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handleEvent(request, { store: getStore() });
}
