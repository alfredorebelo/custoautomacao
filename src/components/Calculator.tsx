import Link from "next/link";
import type { FieldError, Scenario } from "@/lib/types";
import type { Recommendation } from "@/lib/recommend";

const fields: Array<{ name: keyof Scenario | "hostingEur" | "maintenanceEur"; label: string; help: string }> = [
  { name: "workflows", label: "Fluxos", help: "Quantos fluxos de produção conta neste cenário." },
  { name: "runsPerWorkflow", label: "Corridas de cada fluxo, por mês", help: "Execuções de produção. Testes manuais ficam de fora." },
  { name: "actionsPerItem", label: "Ações por item, sem o gatilho", help: "Passos que criam, atualizam ou enviam. Não conte filtro, formatação nem router." },
  { name: "itemsPerRun", label: "Itens por corrida", help: "1 se não houver ciclo. No n8n os itens não multiplicam a execução." },
  { name: "branchActionsPerRun", label: "Ações extra dos ramos que realmente correm", help: "Só o caminho que acontece. Ramos não tomados não entram." },
  { name: "aiStepsPerRun", label: "Passos de IA por corrida", help: "Se for mais de zero, o custo variável fica de fora da recomendação." },
];

function valueOf(values: Record<string, string>, name: string): string {
  return values[name] ?? "";
}

export function Calculator({
  values,
  errors,
  result,
  example,
}: {
  values: Record<string, string>;
  errors: FieldError[];
  result: Recommendation | null;
  example: boolean;
}) {
  const errorFor = (field: string) => errors.find((error) => error.field === field);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
      <form className="rounded-3xl border border-line bg-card p-4 shadow-sm sm:p-6" method="get">
        <div className="mb-5 flex flex-col gap-2">
          <h2 className="text-2xl">O seu cenário</h2>
          <p className="text-sm text-muted">
            {example
              ? "Os números abaixo são um exemplo editável: 2 fluxos, 30 corridas, 3 ações, 1 item, sem IA."
              : "Resultado para os números que enviou."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const error = errorFor(field.name);
            const described = error ? `${field.name}-error` : `${field.name}-help`;
            return (
              <label className="field" key={field.name}>
                {field.label}
                <input
                  name={field.name}
                  inputMode="numeric"
                  defaultValue={valueOf(values, field.name)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={described}
                />
                <span id={`${field.name}-help`} className="text-xs text-muted">{field.help}</span>
                {error ? <span id={`${field.name}-error`} role="alert" className="text-sm text-clay">{error.message}</span> : null}
              </label>
            );
          })}
          <label className="field">
            Compromisso
            <select name="commitment" defaultValue={values.commitment || "annual"} aria-describedby="commitment-help">
              <option value="annual">Anual</option>
              <option value="monthly">Mensal</option>
            </select>
            <span id="commitment-help" className="text-xs text-muted">Usamos o preço publicado para esse ciclo. Não aplicamos 33% por conta própria.</span>
          </label>
          <label className="field">
            Alojamento n8n, euros por mês
            <input name="hostingEurPerMonth" inputMode="decimal" defaultValue={values.hostingEurPerMonth ?? ""} aria-describedby="hosting-help" />
            <span id="hosting-help" className="text-xs text-muted">Vazio significa desconhecido. Zero só se o escrever. Não é um preço de fornecedor.</span>
          </label>
          <label className="field sm:col-span-2">
            Manutenção n8n, euros por mês
            <input name="maintenanceEurPerMonth" inputMode="decimal" defaultValue={values.maintenanceEurPerMonth ?? ""} aria-describedby="maintenance-help" />
            <span id="maintenance-help" className="text-xs text-muted">Tempo de operação, cópias e atualizações. Vazio deixa o self-hosted fora da conta.</span>
          </label>
        </div>
        <fieldset className="mt-4 grid gap-3 text-sm">
          <legend className="mb-1 font-medium">O que o cenário exige</legend>
          <label className="flex items-start gap-3">
            <input name="zapierTeamFeatures" type="checkbox" value="on" defaultChecked={values.zapierTeamFeatures === "on"} />
            <span>Preciso de funções de equipa na Zapier: SSO, pastas partilhadas, até 25 pessoas.</span>
          </label>
          <label className="flex items-start gap-3">
            <input name="n8nBusinessFeatures" type="checkbox" value="on" defaultChecked={values.n8nBusinessFeatures === "on"} />
            <span>Preciso de SSO, ambientes ou Git no n8n.</span>
          </label>
          <label className="flex items-start gap-3">
            <input name="includeSelfHost" type="checkbox" value="on" defaultChecked={values.includeSelfHost === "on"} />
            <span>Incluir n8n self-hosted. A licença Community não torna o alojamento gratuito.</span>
          </label>
          <label className="flex items-start gap-3">
            <input name="zapierNonprofit" type="checkbox" value="on" defaultChecked={values.zapierNonprofit === "on"} />
            <span>Organização sem fins lucrativos na Zapier. Mostramos uma estimativa de 15%, fora da comparação.</span>
          </label>
        </fieldset>
        {errorFor("commitment") ? <p role="alert" className="mt-3 text-sm text-clay">{errorFor("commitment")?.message}</p> : null}
        {errorFor("hostingEurPerMonth") ? <p role="alert" className="mt-3 text-sm text-clay">{errorFor("hostingEurPerMonth")?.message}</p> : null}
        {errorFor("maintenanceEurPerMonth") ? <p role="alert" className="mt-3 text-sm text-clay">{errorFor("maintenanceEurPerMonth")?.message}</p> : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button className="min-h-11 rounded-full bg-teal px-5 text-white" type="submit">Calcular</button>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5" href="/">Repor o exemplo</Link>
        </div>
        <p className="mt-4 text-sm text-muted">Moeda e imposto ficam como na fonte. Não há taxa de câmbio nesta versão e um preço em USD não é PVP.</p>
      </form>
      <ResultPanel result={result} />
    </div>
  );
}

function ResultPanel({ result }: { result: Recommendation | null }) {
  if (!result) {
    return <p className="rounded-3xl border border-dashed border-line bg-card p-6">Corrija os campos assinalados para ver a conta.</p>;
  }
  const cards = [
    ["Zapier", result.zapier],
    ["Make", result.make],
    ["n8n cloud", result.n8nCloud],
    ["n8n self-hosted", result.n8nSelfHost],
  ] as const;
  return (
    <section aria-live="polite" className="grid gap-4">
      <div className="rounded-3xl bg-teal-dark p-5 text-paper">
        <h2 className="text-2xl text-white">Leitura desta conta</h2>
        <p className="mt-2 text-sm leading-6 text-[#e7f3f1]">{result.verdict.text}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-white/10 p-2">
            <dt>Tarefas</dt>
            <dd className="font-serif text-xl">{result.estimate.zapierTasks.toLocaleString("pt-PT")}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <dt>Créditos</dt>
            <dd className="font-serif text-xl">{result.estimate.makeCredits.toLocaleString("pt-PT")}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <dt>Execuções</dt>
            <dd className="font-serif text-xl">{result.estimate.n8nExecutions.toLocaleString("pt-PT")}</dd>
          </div>
        </dl>
      </div>
      {cards.map(([title, view]) => (
        <article key={title} className="rounded-3xl border border-line bg-card p-4">
          <h3 className="text-xl">{title}</h3>
          <p className="text-sm text-muted">{view.units.toLocaleString("pt-PT")} {view.unitName}</p>
          {view.quote ? (
            <p className="mt-2">
              <span className="block font-medium">{view.quote.name}</span>
              <span className="block">{view.quote.label} {view.quote.basis === "per_year" ? "por ano" : "por mês"}</span>
              <span className="mt-1 block text-sm text-muted">{view.quote.detail}</span>
            </p>
          ) : null}
          {view.partial ? <p className="mt-2 text-sm">{view.partial}</p> : null}
          {view.reason ? <p className="mt-2 text-sm text-clay">{view.reason}</p> : null}
        </article>
      ))}
      {result.nonprofitEstimate ? <p className="text-sm">{result.nonprofitEstimate}</p> : null}
      <details className="rounded-3xl border border-line bg-card p-4 text-sm">
        <summary>Pressupostos desta conta</summary>
        <ul className="mt-3 grid list-disc gap-2 pl-5">
          {result.assumptions.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  );
}
