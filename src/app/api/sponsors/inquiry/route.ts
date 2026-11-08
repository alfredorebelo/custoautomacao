import { handleSubmission } from "@/lib/handlers";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handleSubmission(request, { store: getStore(), kind: "sponsor_inquiry" });
}
