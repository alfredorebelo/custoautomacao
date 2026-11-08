import { integrationFlags } from "@/lib/config";
import { handleNewsletter } from "@/lib/handlers";
import { resendMailer } from "@/lib/resend";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handleNewsletter(request, {
    store: getStore(),
    newsletterReady: integrationFlags().newsletter,
    mailer: resendMailer,
    origin: new URL(request.url).origin,
  });
}
