import { handleNewsletterConfirm } from "@/lib/handlers";
import { resendMailer } from "@/lib/resend";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return handleNewsletterConfirm(token, { store: getStore(), mailer: resendMailer });
}
