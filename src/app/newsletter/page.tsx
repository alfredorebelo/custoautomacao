import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";
import { integrationFlags } from "@/lib/config";

export const metadata: Metadata = { title: "Newsletter" };
export const dynamic = "force-dynamic";

export default function NewsletterPage() {
  const flags = integrationFlags();
  return (
    <article className="grid max-w-2xl gap-5">
      <h1 className="text-4xl">Newsletter semanal</h1>
      <p>Uma nota por semana sobre mudanças de preço e de regras. A inscrição tem dois passos: o pedido e a confirmação no correio. Sem o segundo passo o endereço não entra na lista.</p>
      <p>Quando o envio estiver ativo, a lista é um segmento Resend e a mensagem semanal é um Broadcast com a ligação de cancelamento <code>{"{{{RESEND_UNSUBSCRIBE_URL}}}"}</code>. Nesta revisão não partimos correio nem chamamos a rede.</p>
      <NewsletterForm enabled={flags.newsletter} />
    </article>
  );
}
