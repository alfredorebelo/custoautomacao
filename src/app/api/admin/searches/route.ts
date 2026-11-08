import { handleAdmin } from "@/lib/handlers";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  return handleAdmin(request, { token: process.env.ADMIN_TOKEN, store: getStore(), action: "searches" });
}
