import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacyPage() {
  return (
    <article className="grid max-w-3xl gap-4">
      <h1 className="text-4xl">Privacidade</h1>
      <p>Esta página descreve o que a versão atual faz com dados. Não é um aviso jurídico completo nem uma garantia de conformidade.</p>
      <h2 className="text-2xl">O que não fazemos por omissão</h2>
      <ul className="grid list-disc gap-2 pl-5">
        <li>Não usamos cookies de rastreio nem identificadores de publicidade.</li>
        <li>Fechar a barra de patrocínio guarda só uma preferência nesta sessão do navegador, não um perfil.</li>
        <li>A calculadora corre no pedido da página. Os números do cenário não são gravados.</li>
        <li>Não há estatísticas de audiência. O sítio diz “Ainda não lançado”.</li>
      </ul>
      <h2 className="text-2xl">Quando a base de dados existir</h2>
      <ul className="grid list-disc gap-2 pl-5">
        <li>Um pedido de newsletter guarda o correio normalizado, o texto do consentimento e a data. O estado começa pendente e só passa a confirmado depois da ligação no correio.</li>
        <li>Os códigos dessa ligação ficam guardados como resumo criptográfico, não em claro.</li>
        <li>Pedidos de correção e de patrocínio ficam numa fila por aprovar. Não alteram os preços publicados.</li>
        <li>Pesquisas sem resultado, vistas de página e cliques de um slug permitido podem ser contados sem endereço IP e sem identificador de pessoa.</li>
        <li>Se a base não estiver configurada, estes envios respondem que nada foi guardado.</li>
      </ul>
      <h2 className="text-2xl">Correio</h2>
      <p>O envio, quando estiver configurado, usa Resend no servidor. O cancelamento da newsletter semanal passa pelo Broadcast da Resend, com a ligação própria deles, e também por um código nosso que marca o endereço como cancelado. Não há domínio de correio verificado nesta revisão e por isso o envio está desligado.</p>
      <p>Não identificamos aqui um responsável de tratamento, uma morada ou um contacto, porque essa identidade não está confirmada nesta versão.</p>
    </article>
  );
}
