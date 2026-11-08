import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { integrationFlags } from "@/lib/config";
import { sponsorPriceLabel } from "@/lib/money";

export const metadata: Metadata = { title: "Patrocínio" };
export const dynamic = "force-dynamic";

export default function SponsorPage() {
  const flags = integrationFlags();
  return (
    <article className="grid max-w-2xl gap-5">
      <h1 className="text-4xl">Patrocínio proposto</h1>
      <p className="rounded-3xl border border-line bg-card p-4">{sponsorPriceLabel()}</p>
      <p>Não há semanas vendidas, cliques de patrocinador nem receita. A barra do sítio diz o mesmo e pode ser fechada. Um endereço /go/só redireciona um slug que esteja na lista HTTPS, e essa lista está vazia.</p>
      <h2 className="text-2xl">Pedir informação</h2>
      <InquiryForm
        action="/api/sponsors/inquiry"
        enabled={flags.database}
        disabledMessage="O pedido está desligado porque não há base de dados. Nada foi guardado."
        submitLabel="Guardar pedido"
        messageLabel="O que gostaria de saber"
      />
    </article>
  );
}
