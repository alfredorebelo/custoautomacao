import { snapshot } from "@/data/snapshot";
import { formatMinor, pricePhrase, yearlyFromPerMonth } from "@/lib/money";
import type { CatalogEntry, Commitment, Currency, PriceSnapshot, Scenario } from "@/lib/types";

export type UsageEstimate = {
  totalRuns: number;
  zapierTasks: number;
  makeCredits: number;
  n8nExecutions: number;
  actionSteps: number;
};

export type Quote = {
  entryId: string;
  name: string;
  currency: Currency;
  amountMinor: number;
  basis: "per_month" | "per_year";
  exact: boolean;
  label: string;
  detail: string;
};

export type PlatformView = {
  units: number;
  unitName: string;
  quote: Quote | null;
  partial: string | null;
  reason: string | null;
};

export type VerdictCode =
  | "incomplete_ai"
  | "no_complete_price"
  | "single_currency_option"
  | "same_currency_lowest"
  | "no_cross_currency_winner";

export type Recommendation = {
  estimate: UsageEstimate;
  assumptions: string[];
  zapier: PlatformView;
  make: PlatformView;
  n8nCloud: PlatformView;
  n8nSelfHost: PlatformView;
  nonprofitEstimate: string | null;
  verdict: { code: VerdictCode; text: string };
};

export function estimateUsage(scenario: Scenario): UsageEstimate {
  const totalRuns = scenario.workflows * scenario.runsPerWorkflow;
  const actionSteps = scenario.actionsPerItem + scenario.branchActionsPerRun;
  return {
    totalRuns,
    zapierTasks: totalRuns * scenario.itemsPerRun * scenario.actionsPerItem + totalRuns * scenario.branchActionsPerRun,
    makeCredits: totalRuns * (1 + scenario.itemsPerRun * scenario.actionsPerItem + scenario.branchActionsPerRun),
    n8nExecutions: totalRuns,
    actionSteps,
  };
}

function comparableAmount(entry: CatalogEntry, commitment: Commitment): { minor: number; basis: Quote["basis"] } | null {
  if (!entry.priceComparable || entry.priceStatus !== "verified" || entry.currency === null) {
    return null;
  }
  if (commitment === "monthly") {
    return entry.monthlyMinor === null ? null : { minor: entry.monthlyMinor, basis: "per_month" };
  }
  if (entry.annualPerMonthMinor !== null) {
    return { minor: yearlyFromPerMonth(entry.annualPerMonthMinor), basis: "per_year" };
  }
  if (entry.annualTotalMinor !== null) {
    return { minor: entry.annualTotalMinor, basis: "per_year" };
  }
  return null;
}

function fitsZapier(entry: CatalogEntry, scenario: Scenario, usage: UsageEstimate): boolean {
  if (entry.platform !== "zapier" || entry.kind !== "plan") return false;
  if (entry.includedUnits === null || usage.zapierTasks > entry.includedUnits) return false;
  if (scenario.zapierTeamFeatures && !entry.teamFeatures) return false;
  if (entry.maxActionsInFlow !== null && usage.actionSteps > entry.maxActionsInFlow) return false;
  return comparableAmount(entry, scenario.commitment) !== null;
}

function fitsCloud(entry: CatalogEntry, scenario: Scenario, usage: UsageEstimate): boolean {
  if (entry.platform !== "n8n" || entry.hosting !== "cloud") return false;
  if (scenario.n8nBusinessFeatures && !entry.businessFeatures) return false;
  if (!scenario.n8nBusinessFeatures && entry.businessFeatures) return false;
  if (entry.includedUnits === null || usage.n8nExecutions > entry.includedUnits) return false;
  return comparableAmount(entry, scenario.commitment) !== null;
}

function fitsSelfLicense(entry: CatalogEntry, scenario: Scenario, usage: UsageEstimate): boolean {
  if (entry.platform !== "n8n" || entry.hosting !== "self") return false;
  if (scenario.n8nBusinessFeatures !== entry.businessFeatures) return false;
  if (entry.includedUnits === null || usage.n8nExecutions > entry.includedUnits) return false;
  return comparableAmount(entry, scenario.commitment) !== null;
}

function pickLowest(entries: CatalogEntry[], scenario: Scenario): { entry: CatalogEntry; amount: { minor: number; basis: Quote["basis"] } } | null {
  const ranked = entries
    .map((entry) => ({ entry, amount: comparableAmount(entry, scenario.commitment) }))
    .filter((item): item is { entry: CatalogEntry; amount: { minor: number; basis: Quote["basis"] } } => item.amount !== null)
    .sort((a, b) => a.amount.minor - b.amount.minor || (a.entry.includedUnits ?? 0) - (b.entry.includedUnits ?? 0) || a.entry.id.localeCompare(b.entry.id));
  return ranked[0] ?? null;
}

function quoteFrom(entry: CatalogEntry, amount: { minor: number; basis: Quote["basis"] }, exact: boolean, detail: string): Quote {
  const currency = entry.currency ?? "EUR";
  return {
    entryId: entry.id,
    name: entry.name,
    currency,
    amountMinor: amount.minor,
    basis: amount.basis,
    exact,
    label: pricePhrase(amount.minor, currency, entry.tax),
    detail,
  };
}

function periodLabel(basis: Quote["basis"]): string {
  return basis === "per_year" ? "por ano" : "por mês";
}

export function recommend(scenario: Scenario, data: PriceSnapshot = snapshot): Recommendation {
  const usage = estimateUsage(scenario);
  const aiBlocks = scenario.aiStepsPerRun > 0;
  const assumptions = [
    "Cada corrida é uma execução de produção do fluxo. Testes manuais ficam de fora.",
    "Na Zapier, o gatilho não conta. Contam as ações indicadas, uma tarefa por ação normal e por item. Formatter, filtro, caminho e a ferramenta de ciclo não entram nesta conta.",
    "Na Make, o gatilho conta 1 crédito por corrida e cada ação não-IA conta 1 crédito por item. Router e módulos de erro não entram.",
    "No n8n, a corrida inteira conta 1 execução, mesmo com vários passos, ramos ou itens. Subfluxos não são somados.",
    "Repetições de falhas não multiplicam a conta: na Zapier a falha não é tarefa, e no n8n a página não publica um número extra por retry automático.",
    "Não convertemos moeda. USD e EUR ficam lado a lado.",
    "Um vencedor só existe entre preços completos na mesma moeda. IA variável, imposto em falta num extra, ou alojamento desconhecido tiram a opção da corrida.",
  ];

  if (usage.totalRuns === 0) {
    const empty = (units: number, unitName: string): PlatformView => ({
      units,
      unitName,
      quote: null,
      partial: null,
      reason: "Sem corridas de produção não escolhemos um plano pago.",
    });
    return {
      estimate: usage,
      assumptions,
      zapier: empty(0, "tarefas"),
      make: empty(0, "créditos"),
      n8nCloud: empty(0, "execuções"),
      n8nSelfHost: empty(0, "execuções"),
      nonprofitEstimate: null,
      verdict: {
        code: "no_complete_price",
        text: "Sem corridas de produção não há um preço a recomendar.",
      },
    };
  }

  const zapierPick = pickLowest(
    data.entries.filter((entry) => fitsZapier(entry, scenario, usage)),
    scenario,
  );
  const zapier: PlatformView = {
    units: usage.zapierTasks,
    unitName: "tarefas",
    quote: null,
    partial: null,
    reason: null,
  };
  if (!zapierPick) {
    zapier.reason =
      usage.zapierTasks > 2_000_000
        ? "Acima de 2 000 000 tarefas por mês o self-serve acaba. Enterprise não tem preço publicado."
        : scenario.zapierTeamFeatures
          ? "Não há plano Team publicado que cubra este volume e estas funções."
          : "Não há plano Zapier com preço verificado que cubra este desenho.";
  } else if (aiBlocks) {
    zapier.partial = "A subscrição abaixo cobre as tarefas normais. Os passos de IA ficam de fora: a página de taxas respondeu 404.";
    zapier.quote = quoteFrom(zapierPick.entry, zapierPick.amount, false, "Só a franquia sem IA.");
  } else {
    zapier.quote = quoteFrom(
      zapierPick.entry,
      zapierPick.amount,
      true,
      `Patamar que inclui ${usage.zapierTasks.toLocaleString("pt-PT")} tarefas, ${periodLabel(zapierPick.amount.basis)}.`,
    );
  }

  const makeFree = data.entries.find((entry) => entry.id === "make-free-1000");
  const make: PlatformView = {
    units: usage.makeCredits,
    unitName: "créditos",
    quote: null,
    partial: null,
    reason: null,
  };
  if (aiBlocks) {
    make.reason = "Com IA da Make os créditos variam com tokens. Não há preço fixo para fechar a conta, e os planos pagos não estão confirmados.";
  } else if (makeFree && usage.makeCredits <= (makeFree.includedUnits ?? 0) && scenario.workflows <= (makeFree.maxWorkflows ?? 0)) {
    make.partial = "O Free inclui 1 000 créditos e 2 cenários ativos, com subscrição zero. Outros limites desse plano não ficaram confirmados, por isso não concorre como preço completo.";
  } else if (scenario.workflows > 2) {
    make.reason = "O Free só confirma 2 cenários ativos. Os preços de Core, Pro e Teams não estão confirmados nesta leitura.";
  } else {
    make.reason = "O volume passa dos 1 000 créditos do Free. Os preços pagos da Make não estão confirmados e ficam fora da recomendação.";
  }

  const cloudPick = pickLowest(
    data.entries.filter((entry) => fitsCloud(entry, scenario, usage)),
    scenario,
  );
  const n8nCloud: PlatformView = {
    units: usage.n8nExecutions,
    unitName: "execuções",
    quote: null,
    partial: null,
    reason: null,
  };
  if (!cloudPick && scenario.n8nBusinessFeatures) {
    n8nCloud.reason = "SSO, ambientes e Git não têm, nesta leitura, um plano cloud com preço fechado. O Business publicado é self-hosted.";
  } else if (!cloudPick) {
    n8nCloud.reason = "Não há plano cloud com preço verificado que inclua este número de execuções. O extra do Pro-2 traz imposto desconhecido e fica de fora.";
  } else if (aiBlocks) {
    n8nCloud.partial = "A execução continua a contar como uma corrida. Modelos sem chave própria usam saldo Gateway, e o preço desse saldo não está nesta leitura.";
    n8nCloud.quote = quoteFrom(cloudPick.entry, cloudPick.amount, false, "Só a subscrição, sem o custo variável de IA.");
  } else {
    n8nCloud.quote = quoteFrom(
      cloudPick.entry,
      cloudPick.amount,
      true,
      `Inclui ${usage.n8nExecutions.toLocaleString("pt-PT")} execuções, ${periodLabel(cloudPick.amount.basis)}. O imposto da ficha não está indicado.`,
    );
  }

  const n8nSelfHost: PlatformView = {
    units: usage.n8nExecutions,
    unitName: "execuções",
    quote: null,
    partial: null,
    reason: null,
  };
  if (!scenario.includeSelfHost) {
    n8nSelfHost.reason = "Self-hosted ficou de fora deste cenário.";
  } else if (scenario.hostingMinorPerMonth === null || scenario.maintenanceMinorPerMonth === null) {
    n8nSelfHost.reason = "Sem alojamento e manutenção indicados por si, não tratamos self-hosted como gratuito nem como preço completo.";
    if (!scenario.n8nBusinessFeatures) {
      n8nSelfHost.partial = "A licença Community é descrita como gratuita. A franquia de execuções não tem número publicado.";
    }
  } else if (aiBlocks) {
    n8nSelfHost.reason = "Mesmo com alojamento indicado, os passos de IA podem ter custo de modelo fora da licença.";
  } else {
    const months = scenario.commitment === "annual" ? 12 : 1;
    const infraMinor = (scenario.hostingMinorPerMonth + scenario.maintenanceMinorPerMonth) * months;
    const licensePick = pickLowest(
      data.entries.filter((entry) => fitsSelfLicense(entry, scenario, usage)),
      scenario,
    );
    if (licensePick && licensePick.entry.currency === "EUR") {
      const amount = { minor: licensePick.amount.minor + infraMinor, basis: licensePick.amount.basis };
      n8nSelfHost.quote = quoteFrom(
        licensePick.entry,
        amount,
        true,
        "Licença publicada mais alojamento e manutenção indicados por si. O imposto da licença não está na ficha.",
      );
    } else if (scenario.n8nBusinessFeatures) {
      n8nSelfHost.reason = "Não há licença Business com preço verificado para este volume.";
    } else {
      n8nSelfHost.partial = `A licença Community não tem preço de software. Com o alojamento e a manutenção que indicou, a infraestrutura fica em ${formatMinor(infraMinor, "EUR")} ${periodLabel(scenario.commitment === "annual" ? "per_year" : "per_month")}. A franquia de execuções da Community não está publicada, por isso este valor não concorre.`;
    }
  }

  let nonprofitEstimate: string | null = null;
  if (scenario.zapierNonprofit && zapier.quote && zapier.quote.currency === "USD") {
    const estimated = Math.round(zapier.quote.amountMinor * 0.85);
    nonprofitEstimate = `Estimativa non-profit: ${formatMinor(estimated, "USD")} ${periodLabel(zapier.quote.basis)}, 15% sobre a tabela e sem o extra. Não é o preço observado e não entra na comparação.`;
    assumptions.push("O desconto non-profit da Zapier é uma estimativa de 15% sobre o preço de tabela.");
  }

  const complete = [zapier, n8nCloud, n8nSelfHost]
    .map((view) => view.quote)
    .filter((item): item is Quote => item !== null && item.exact);

  let verdict: Recommendation["verdict"];
  if (aiBlocks) {
    verdict = {
      code: "incomplete_ai",
      text: "Há passos de IA. O custo deixa de ser só a franquia: a Zapier não publicou a taxa nesta leitura, a Make varia com tokens e o n8n pode somar Gateway ou a chave do modelo. Não há vencedor.",
    };
  } else if (complete.length === 0) {
    verdict = {
      code: "no_complete_price",
      text: "Nenhuma opção ficou com preço completo e verificável para este cenário.",
    };
  } else {
    const currencies = new Set(complete.map((item) => item.currency));
    if (currencies.size > 1) {
      verdict = {
        code: "no_cross_currency_winner",
        text: "Há preços completos em moedas diferentes. Sem taxa de câmbio publicada por nós, ficam lado a lado.",
      };
    } else if (complete.length === 1) {
      const only = complete[0];
      verdict = {
        code: "single_currency_option",
        text: `A única opção com preço completo está em ${only.currency}: ${only.name}, ${only.label} ${periodLabel(only.basis)}. Não é um título de mais barata do mercado.`,
      };
    } else {
      const lowest = [...complete].sort((a, b) => a.amountMinor - b.amountMinor || a.name.localeCompare(b.name))[0];
      verdict = {
        code: "same_currency_lowest",
        text: `Entre as opções completas em ${lowest.currency}, a mais baixa é ${lowest.name}: ${lowest.label} ${periodLabel(lowest.basis)}.`,
      };
    }
  }

  return {
    estimate: usage,
    assumptions,
    zapier,
    make,
    n8nCloud,
    n8nSelfHost,
    nonprofitEstimate,
    verdict,
  };
}

export type OverageState = "inside" | "quoted" | "ceiling";

export function zapierOverageQuote(entry: CatalogEntry, tasks: number, commitment: Commitment): { state: OverageState; extraMinor: number | null } {
  if (entry.includedUnits === null || entry.includedUnits <= 0) {
    return { state: "ceiling", extraMinor: null };
  }
  const price = commitment === "monthly" ? entry.monthlyMinor : entry.annualPerMonthMinor;
  if (price === null) return { state: "ceiling", extraMinor: null };
  if (tasks <= entry.includedUnits) return { state: "inside", extraMinor: 0 };
  if (tasks >= entry.includedUnits * 3) return { state: "ceiling", extraMinor: null };
  const extraTasks = tasks - entry.includedUnits;
  const numerator = commitment === "monthly" ? 5 : 5;
  const denominator = commitment === "monthly" ? 2 : 4;
  const extraMinor = Math.round((extraTasks * price * numerator) / (denominator * entry.includedUnits));
  return { state: "quoted", extraMinor };
}
