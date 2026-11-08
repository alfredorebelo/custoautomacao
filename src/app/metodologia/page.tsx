import type { Metadata } from "next";
import { snapshot } from "@/data/snapshot";
import { recommend } from "@/lib/recommend";
import { SAMPLE_SCENARIO } from "@/lib/parse-scenario";
import type { Scenario } from "@/lib/types";

export const metadata: Metadata = { title: "Metodologia" };

function scenario(overrides: Partial<Scenario>): Scenario {
  return { ...SAMPLE_SCENARIO, ...overrides };
}

const examples = [
  { title: "Exemplo editável da página inicial", scenario: SAMPLE_SCENARIO },
  {
    title: "O mesmo fluxo, com 20 itens por corrida",
    scenario: scenario({ workflows: 1, runsPerWorkflow: 10, actionsPerItem: 2, itemsPerRun: 20 }),
  },
  {
    title: "Com um passo de IA",
    scenario: scenario({ aiStepsPerRun: 1 }),
  },
];

export default function MethodologyPage() {
  return (
    <article className="grid max-w-3xl gap-6">
      <h1 className="text-4xl">Como a conta é feita</h1>
      <p>A calculadora não soma tarefas, créditos e execuções num único número. Estima cada unidade com as regras publicadas e só depois olha para o preço. Se o preço, o imposto, a moeda ou um custo variável não estão fechados, a opção sai da recomendação.</p>
      <section>
        <h2 className="text-2xl">Unidades</h2>
        <ul className="mt-2 grid list-disc gap-2 pl-5">
          <li>Zapier: uma tarefa quando uma ação termina com sucesso. O gatilho, o polling e as ferramentas internas indicadas na página de preços não contam. Falhas não contam.</li>
          <li>Make: em apps não-IA, uma operação é um crédito. O gatilho conta uma vez por corrida. Cada item multiplica as ações seguintes. Router e módulos de erro não contam.</li>
          <li>n8n: uma execução é a corrida inteira do fluxo, com os passos e os dados que tiver. Subfluxos, testes manuais e fluxos de erro não somam, segundo a documentação.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl">O que fica de fora</h2>
        <ul className="mt-2 grid list-disc gap-2 pl-5">
          <li>Taxas de IA, MCP e código alargado da Zapier: a página de taxas deu 404 nesta leitura.</li>
          <li>Preços de Core, Pro e Teams da Make: os cartões não vieram no texto e há números contraditórios no blog e num exemplo da ajuda.</li>
          <li>Câmbio. Um preço em USD não é convertido e não é chamado PVP.</li>
          <li>Imposto, quando a ficha não o indica. O extra do n8n Pro-2 diz “mais imposto sobre vendas” e por isso não entra na conta.</li>
          <li>Self-hosted sem alojamento e manutenção indicados por quem calcula. A licença Community a zero não significa servidor gratuito.</li>
          <li>Retries automáticos, além da regra de que uma falha na Zapier não é tarefa e de que um horário no n8n conta quando dispara.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl">Três cenários, com o mesmo código da calculadora</h2>
        <div className="mt-3 grid gap-4">
          {examples.map((example) => {
            const result = recommend(example.scenario);
            return (
              <section key={example.title} className="rounded-3xl border border-line bg-card p-4">
                <h3 className="text-xl">{example.title}</h3>
                <p className="mt-2 text-sm">{result.verdict.text}</p>
                <p className="mt-2 text-sm text-muted">
                  {result.estimate.zapierTasks.toLocaleString("pt-PT")} tarefas · {result.estimate.makeCredits.toLocaleString("pt-PT")} créditos · {result.estimate.n8nExecutions.toLocaleString("pt-PT")} execuções
                </p>
              </section>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-2xl">Fontes desta leitura</h2>
        <ul className="mt-2 grid gap-3">
          {snapshot.sources.map((source) => (
            <li key={source.id}>
              <a className="text-teal-dark" href={source.url}>{source.publisher}: {source.url}</a>
              <span className="block text-sm text-muted">{source.retrievedOn} · {source.status}. {source.note}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-muted">Isto descreve o método do sítio. Não é aconselhamento fiscal, jurídico nem uma garantia de que o checkout do fornecedor vai mostrar o mesmo cêntimo.</p>
    </article>
  );
}
