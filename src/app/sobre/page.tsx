import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { integrationFlags } from "@/lib/config";
import { verifiedPlanCount } from "@/lib/catalog";
import { snapshot } from "@/data/snapshot";

export const metadata: Metadata = { title: "Sobre" };
export const dynamic = "force-dynamic";

export default function AboutPage() {
  const flags = integrationFlags();
  return (
    <article className="grid max-w-3xl gap-5">
      <h1 className="text-4xl">Sobre esta revisão</h1>
      <p>CustoAutomação compara o custo de Zapier, Make e n8n para quem constrói fluxos e quer perceber a fatura antes de a receber. A voz é direta, em português europeu, sem imitar a marca de nenhuma das três ferramentas.</p>
      <p>A leitura de {snapshot.observedOn} tem {snapshot.entries.length} fichas, das quais {verifiedPlanCount()} planos com preço verificado e utilizável na recomendação. O resto são limites, regras ou preços que não foi possível fechar.</p>
      <h2 className="text-2xl">O que já está feito, o que falta configurar e o que ainda não está no ar</h2>
      <ul className="grid list-disc gap-2 pl-5">
        <li>Feito: calculadora, catálogo, comparação, metodologia, histórico de uma só leitura, páginas de newsletter e patrocínio, rotas de administração fechadas sem token, e a forma das tabelas.</li>
        <li>Configurar mais tarde: Postgres, token de administração e Resend com domínio verificado e segmento. Os nomes estão em .env.example, sem valores.</li>
        <li>Ainda não está no ar: envio de correio, publicação, patrocinador real, estatísticas e um segundo ponto de histórico.</li>
      </ul>
      <h2 className="text-2xl">Sugerir uma correção</h2>
      <InquiryForm
        action="/api/submissions"
        enabled={flags.database}
        disabledMessage="As sugestões estão desligadas sem base de dados. Nada foi guardado."
        submitLabel="Enviar para a fila"
        messageLabel="Correção ou fonte"
      />
    </article>
  );
}
