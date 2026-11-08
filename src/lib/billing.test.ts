import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { snapshot, snapshotFingerprint } from "@/data/snapshot";
import { verifiedPlanCount } from "@/lib/catalog";
import { pricePhrase, SPONSOR_ASKING_PRICE } from "@/lib/money";
import { parseMoney, parseScenario, SAMPLE_SCENARIO } from "@/lib/parse-scenario";
import { recommend, zapierOverageQuote } from "@/lib/recommend";
import { diffSnapshots } from "@/lib/snapshot-diff";
import type { CatalogEntry, Scenario } from "@/lib/types";

function form(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    workflows: "2",
    runsPerWorkflow: "30",
    actionsPerItem: "3",
    itemsPerRun: "1",
    branchActionsPerRun: "0",
    aiStepsPerRun: "0",
    commitment: "annual",
    hostingEurPerMonth: "",
    maintenanceEurPerMonth: "",
    ...overrides,
  };
}

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return { ...SAMPLE_SCENARIO, ...overrides };
}

describe("leitura e unidades", () => {
  it("guarda uma única fotografia, com planos verificados a sério", () => {
    expect(snapshot.id).toBe("2026-11-08");
    expect(snapshot.entries.length).toBeGreaterThanOrEqual(30);
    expect(verifiedPlanCount()).toBeGreaterThanOrEqual(30);
    expect(snapshot.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(snapshotFingerprint()).toMatch(/^[0-9a-f]{8}$/);
    expect(diffSnapshots(snapshot, snapshot)).toEqual({ added: [], removed: [], changed: [] });
  });

  it("não trata o desconto de 33% como se fosse o preço da tabela", () => {
    const tier = snapshot.entries.find((entry) => entry.id === "zapier-pro-2000");
    expect(tier?.annualPerMonthMinor).toBe(4900);
    expect(tier?.monthlyMinor).toBe(7350);
    expect(Math.round(7350 * 0.67)).not.toBe(4900);
  });

  it("separa tarefas, créditos e execuções no exemplo", () => {
    const result = recommend(SAMPLE_SCENARIO);
    expect(result.estimate).toMatchObject({ zapierTasks: 180, makeCredits: 240, n8nExecutions: 60 });
    expect(result.zapier.quote?.entryId).toBe("zapier-pro-750");
    expect(result.zapier.quote?.amountMinor).toBe(1999 * 12);
    expect(result.n8nCloud.quote?.entryId).toBe("n8n-starter-2500");
    expect(result.n8nCloud.quote?.amountMinor).toBe(24000);
    expect(result.make.partial).toContain("1 000 créditos");
    expect(result.verdict.code).toBe("no_cross_currency_winner");
    expect(result.verdict.text).not.toMatch(/mais barat/i);
  });

  it("multiplica itens na Zapier e na Make e não no n8n", () => {
    const result = recommend(scenario({ workflows: 1, runsPerWorkflow: 10, actionsPerItem: 2, itemsPerRun: 20 }));
    expect(result.estimate.zapierTasks).toBe(400);
    expect(result.estimate.makeCredits).toBe(410);
    expect(result.estimate.n8nExecutions).toBe(10);
  });

  it("tira o Free da Zapier quando há mais do que uma ação", () => {
    const single = recommend(scenario({ workflows: 1, runsPerWorkflow: 10, actionsPerItem: 1, itemsPerRun: 1 }));
    expect(single.zapier.quote?.entryId).toBe("zapier-free-100");
    const multi = recommend(scenario({ workflows: 1, runsPerWorkflow: 10, actionsPerItem: 2, itemsPerRun: 1 }));
    expect(multi.zapier.quote?.entryId).not.toBe("zapier-free-100");
  });

  it("exige Team quando o cenário pede funções de equipa", () => {
    const result = recommend(scenario({ zapierTeamFeatures: true }));
    expect(result.zapier.quote?.entryId).toBe("zapier-team-2000");
  });

  it("deixa a Make de fora acima de dois cenários ou de 1000 créditos", () => {
    expect(recommend(scenario({ workflows: 3 })).make.reason).toContain("2 cenários");
    expect(recommend(scenario({ workflows: 1, runsPerWorkflow: 400, actionsPerItem: 3 })).make.reason).toContain("1 000");
  });

  it("não escolhe vencedor quando há IA", () => {
    const result = recommend(scenario({ aiStepsPerRun: 2 }));
    expect(result.verdict.code).toBe("incomplete_ai");
    expect(result.zapier.quote?.exact).toBe(false);
    expect(result.n8nCloud.quote?.exact).toBe(false);
  });

  it("não chama preço estrangeiro de PVP e não converte moeda", () => {
    const zapier = snapshot.entries.find((entry) => entry.id === "zapier-pro-750");
    expect(pricePhrase(zapier?.monthlyMinor ?? null, "USD", "unknown_excluded")).toContain("não é PVP");
    expect(pricePhrase(zapier?.monthlyMinor ?? null, "USD", "unknown_excluded")).not.toContain("PVP com IVA");
    const n8n = snapshot.entries.find((entry) => entry.id === "n8n-starter-2500");
    expect(pricePhrase(n8n?.monthlyMinor ?? null, "EUR", "unknown_excluded")).toContain("imposto não indicado");
    expect(pricePhrase(SPONSOR_ASKING_PRICE.minor, "EUR", "vat_included")).toContain("PVP com IVA incluído");
  });

  it("soma alojamento indicado e recusa self-hosted sem esse custo", () => {
    const missing = recommend(scenario({ includeSelfHost: true }));
    expect(missing.n8nSelfHost.reason).toContain("alojamento");
    const hosted = recommend(scenario({
      includeSelfHost: true,
      n8nBusinessFeatures: true,
      hostingMinorPerMonth: 1000,
      maintenanceMinorPerMonth: 500,
      workflows: 1,
      runsPerWorkflow: 100,
      actionsPerItem: 1,
    }));
    expect(hosted.n8nCloud.quote).toBeNull();
    expect(hosted.n8nSelfHost.quote?.amountMinor).toBe(800000 + 1500 * 12);
    expect(hosted.n8nSelfHost.quote?.exact).toBe(true);
  });

  it("escolhe a opção mais baixa só dentro da mesma moeda", () => {
    const onlyEuro = recommend(scenario({
      workflows: 1,
      runsPerWorkflow: 10,
      actionsPerItem: 1,
      itemsPerRun: 300000,
    }));
    expect(onlyEuro.zapier.quote).toBeNull();
    expect(onlyEuro.verdict.code).toBe("single_currency_option");
    const base = snapshot.entries.find((entry) => entry.id === "n8n-starter-2500");
    if (!base) throw new Error("missing starter");
    const cloud: CatalogEntry = {
      ...base,
      id: "cloud",
      name: "Cloud",
      annualTotalMinor: 5000,
      includedUnits: 100,
      businessFeatures: true,
    };
    const selfHosted: CatalogEntry = {
      ...base,
      id: "self",
      name: "Self",
      hosting: "self",
      annualTotalMinor: 1000,
      includedUnits: 100,
      businessFeatures: true,
    };
    const custom = recommend(scenario({
      workflows: 1,
      runsPerWorkflow: 10,
      actionsPerItem: 1,
      n8nBusinessFeatures: true,
      includeSelfHost: true,
      hostingMinorPerMonth: 0,
      maintenanceMinorPerMonth: 0,
    }), { ...snapshot, entries: [cloud, selfHosted] });
    expect(custom.verdict.code).toBe("same_currency_lowest");
    expect(custom.verdict.text).toContain("Self");
  });

  it("aplica o tecto de 3 vezes e o multiplicador publicado no extra da Zapier", () => {
    const tier = snapshot.entries.find((entry) => entry.id === "zapier-pro-750")!;
    expect(zapierOverageQuote(tier, 750, "annual").state).toBe("inside");
    expect(zapierOverageQuote(tier, 800, "annual")).toEqual({ state: "quoted", extraMinor: 167 });
    expect(zapierOverageQuote(tier, 2249, "annual").state).toBe("quoted");
    expect(zapierOverageQuote(tier, 2250, "annual")).toEqual({ state: "ceiling", extraMinor: null });
    expect(zapierOverageQuote(tier, 800, "monthly").state).toBe("quoted");
  });

  it("rejeita vazio, negativo, NaN, notação científica e valores enormes", () => {
    for (const workflows of ["", "-1", "NaN", "1e5", "1.5", "10000001"]) {
      const parsed = parseScenario(form({ workflows }));
      expect(parsed.ok).toBe(false);
    }
    expect(parseMoney("", "hostingEurPerMonth", "O alojamento").value).toBeNull();
    expect(parseMoney("0", "hostingEurPerMonth", "O alojamento").value).toBe(0);
    expect(parseMoney("12,50", "hostingEurPerMonth", "O alojamento").value).toBe(1250);
    expect(parseMoney("-5", "hostingEurPerMonth", "O alojamento").error).toBeTruthy();
    const zero = recommend(scenario({ workflows: 0 }));
    expect(zero.verdict.code).toBe("no_complete_price");
  });

  it("deteta uma mudança de preço sem inventar histórico", () => {
    const next = structuredClone(snapshot);
    const entry = next.entries.find((item) => item.id === "n8n-starter-2500");
    if (!entry) throw new Error("missing");
    entry.monthlyMinor = 2500;
    const diff = diffSnapshots(snapshot, next);
    expect(diff.changed).toEqual([
      { id: "n8n-starter-2500", field: "monthlyMinor", before: 2400, after: 2500 },
    ]);
    expect(readFileSync("src/data/snapshot.ts", "utf8")).not.toContain("2026-10");
  });
});
