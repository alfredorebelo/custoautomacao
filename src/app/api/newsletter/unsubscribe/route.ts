import { handleUnsubscribe } from "@/lib/handlers";
import { resendMailer } from "@/lib/resend";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handleUnsubscribe(request, { store: getStore(), mailer: resendMailer });
}
