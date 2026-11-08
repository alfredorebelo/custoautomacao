import { Calculator } from "@/components/Calculator";
import { LaunchNotice } from "@/components/SiteChrome";
import { snapshot } from "@/data/snapshot";
import { parseScenario, SAMPLE_SCENARIO } from "@/lib/parse-scenario";
import { recommend } from "@/lib/recommend";
import type { Scenario } from "@/lib/types";

type Search = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringsFromScenario(scenario: Scenario): Record<string, string> {
  return {
    workflows: String(scenario.workflows),
    runsPerWorkflow: String(scenario.runsPerWorkflow),
    actionsPerItem: String(scenario.actionsPerItem),
    itemsPerRun: String(scenario.itemsPerRun),
    branchActionsPerRun: String(scenario.branchActionsPerRun),
    aiStepsPerRun: String(scenario.aiStepsPerRun),
    commitment: scenario.commitment,
    hostingEurPerMonth: "",
    maintenanceEurPerMonth: "",
    zapierTeamFeatures: scenario.zapierTeamFeatures ? "on" : "",
    n8nBusinessFeatures: scenario.n8nBusinessFeatures ? "on" : "",
    includeSelfHost: scenario.includeSelfHost ? "on" : "",
    zapierNonprofit: scenario.zapierNonprofit ? "on" : "",
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.keys(params).map((key) => [key, first(params[key])]));
  const submitted = Object.values(flat).some((value) => value !== "");
  const parsed = submitted ? parseScenario(flat) : { ok: true as const, value: SAMPLE_SCENARIO };
  const values = submitted ? flat : stringsFromScenario(SAMPLE_SCENARIO);
  const result = parsed.ok ? recommend(parsed.value) : null;

  return (
    <div className="grid gap-8">
      <section className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal">Revisão privada · leitura de {snapshot.observedOn}</p>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">Quanto custa o fluxo quando cada ferramenta conta de maneira diferente.</h1>
        <p className="mt-4 text-lg text-muted">
          A Zapier conta tarefas bem-sucedidas. A Make conta créditos, quase sempre uma operação de cada vez. O n8n conta a corrida inteira do fluxo. Esta página não finge que isso é a mesma unidade, nem escolhe um mais barato entre dólares e euros.
        </p>
      </section>
      <LaunchNotice />
      <Calculator values={values} errors={parsed.ok ? [] : parsed.errors} result={result} example={!submitted} />
    </div>
  );
}
