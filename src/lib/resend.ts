import "server-only";
import type { Mailer } from "@/lib/handlers";

async function resend(path: string, method: string, body: unknown): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("resend_unconfigured");
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("resend_rejected");
}

export const resendMailer: Mailer = {
  async sendConfirmation({ to, confirmUrl }) {
    const from = process.env.RESEND_FROM;
    if (!from) throw new Error("resend_unconfigured");
    await resend("/emails", "POST", {
      from,
      to: [to],
      subject: "Confirme a newsletter CustoAutomação",
      text: `Para ativar a newsletter semanal, abra esta ligação:\n${confirmUrl}\n\nSe não pediu a inscrição, ignore esta mensagem. Sem esta confirmação o endereço não entra na lista.`,
    });
  },
  async subscribeContact({ email }) {
    const segmentId = process.env.RESEND_SEGMENT_ID;
    if (!segmentId) throw new Error("resend_unconfigured");
    await resend("/contacts", "POST", {
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });
  },
  async unsubscribeContact({ email }) {
    await resend(`/contacts/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: true });
  },
};
