import type { FieldError, Scenario } from "@/lib/types";

const COUNT_MAX = 10_000_000;
const MONEY_MAX = 1_000_000;

export const SAMPLE_SCENARIO: Scenario = {
  workflows: 2,
  runsPerWorkflow: 30,
  actionsPerItem: 3,
  itemsPerRun: 1,
  branchActionsPerRun: 0,
  aiStepsPerRun: 0,
  commitment: "annual",
  zapierTeamFeatures: false,
  n8nBusinessFeatures: false,
  includeSelfHost: false,
  hostingMinorPerMonth: null,
  maintenanceMinorPerMonth: null,
  zapierNonprofit: false,
};

function countError(field: string, message: string): FieldError {
  return { field, message };
}

export function parseCount(raw: string, field: string, label: string): { value?: number; error?: FieldError } {
  const text = raw.trim();
  if (text === "") {
    return { error: countError(field, `Indique ${label}.`) };
  }
  if (!/^\d+$/.test(text)) {
    return { error: countError(field, `${label} tem de ser um número inteiro igual ou superior a zero.`) };
  }
  if (text.length > 16) {
    return { error: countError(field, `${label} é alto demais para uma estimativa segura.`) };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value > COUNT_MAX) {
    return { error: countError(field, `${label} é alto demais para uma estimativa segura.`) };
  }
  return { value };
}

export function parseMoney(raw: string, field: string, label: string): { value?: number | null; error?: FieldError } {
  const text = raw.trim();
  if (text === "") {
    return { value: null };
  }
  const normalised = text.replace(",", ".");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalised);
  if (!match) {
    return { error: countError(field, `${label} tem de ser um valor em euros, vazio se for desconhecido.`) };
  }
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MONEY_MAX * 100) {
    return { error: countError(field, `${label} é alto demais.`) };
  }
  return { value: cents };
}

function read(form: FormData | Record<string, string>, key: string): string {
  if (form instanceof FormData) {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  }
  return form[key] ?? "";
}

function checked(form: FormData | Record<string, string>, key: string): boolean {
  const value = read(form, key).trim().toLowerCase();
  return value === "on" || value === "true" || value === "1" || value === "yes";
}

export function parseScenario(form: FormData | Record<string, string>): { ok: true; value: Scenario } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const workflows = parseCount(read(form, "workflows"), "workflows", "o número de fluxos");
  const runs = parseCount(read(form, "runsPerWorkflow"), "runsPerWorkflow", "as corridas de cada fluxo");
  const actions = parseCount(read(form, "actionsPerItem"), "actionsPerItem", "as ações por item");
  const items = parseCount(read(form, "itemsPerRun"), "itemsPerRun", "os itens por corrida");
  const branches = parseCount(read(form, "branchActionsPerRun"), "branchActionsPerRun", "as ações de ramos");
  const ai = parseCount(read(form, "aiStepsPerRun"), "aiStepsPerRun", "os passos de IA");
  const hosting = parseMoney(read(form, "hostingEurPerMonth"), "hostingEurPerMonth", "O alojamento");
  const maintenance = parseMoney(read(form, "maintenanceEurPerMonth"), "maintenanceEurPerMonth", "A manutenção");
  for (const parsed of [workflows, runs, actions, items, branches, ai, hosting, maintenance]) {
    if (parsed.error) errors.push(parsed.error);
  }
  const commitment = read(form, "commitment");
  if (commitment !== "monthly" && commitment !== "annual") {
    errors.push(countError("commitment", "Escolha compromisso mensal ou anual."));
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      workflows: workflows.value ?? 0,
      runsPerWorkflow: runs.value ?? 0,
      actionsPerItem: actions.value ?? 0,
      itemsPerRun: items.value ?? 0,
      branchActionsPerRun: branches.value ?? 0,
      aiStepsPerRun: ai.value ?? 0,
      commitment: commitment as Scenario["commitment"],
      zapierTeamFeatures: checked(form, "zapierTeamFeatures"),
      n8nBusinessFeatures: checked(form, "n8nBusinessFeatures"),
      includeSelfHost: checked(form, "includeSelfHost"),
      hostingMinorPerMonth: hosting.value ?? null,
      maintenanceMinorPerMonth: maintenance.value ?? null,
      zapierNonprofit: checked(form, "zapierNonprofit"),
    },
  };
}
