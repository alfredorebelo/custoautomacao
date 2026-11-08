import { handleAdmin } from "@/lib/handlers";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handleAdmin(request, { token: process.env.ADMIN_TOKEN, store: getStore(), action: "approve" });
}
