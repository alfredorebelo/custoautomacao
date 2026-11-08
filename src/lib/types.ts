export type Platform = "zapier" | "make" | "n8n";

export type Currency = "USD" | "EUR";

export type TaxTreatment = "unknown_excluded" | "vat_included" | "not_applicable";

export type PriceStatus = "verified" | "unavailable" | "unconfirmed" | "custom";

export type Hosting = "cloud" | "self" | "license_only";

export type Commitment = "monthly" | "annual";

export type SourceRecord = {
  id: string;
  publisher: string;
  url: string;
  retrievedOn: string;
  status: "retrieved" | "partial" | "unavailable";
  note: string;
};

export type CatalogEntry = {
  id: string;
  platform: Platform;
  kind: "plan" | "limit" | "rule";
  name: string;
  summary: string;
  billingUnit: string | null;
  includedUnits: number | null;
  monthlyMinor: number | null;
  annualPerMonthMinor: number | null;
  annualTotalMinor: number | null;
  currency: Currency | null;
  tax: TaxTreatment;
  priceStatus: PriceStatus;
  priceComparable: boolean;
  teamFeatures: boolean;
  businessFeatures: boolean;
  hosting: Hosting;
  maxActionsInFlow: number | null;
  maxWorkflows: number | null;
  sourceIds: string[];
  notes: string[];
};

export type PriceSnapshot = {
  id: string;
  observedOn: string;
  title: string;
  historyNote: string;
  sources: SourceRecord[];
  entries: CatalogEntry[];
};

export type Scenario = {
  workflows: number;
  runsPerWorkflow: number;
  actionsPerItem: number;
  itemsPerRun: number;
  branchActionsPerRun: number;
  aiStepsPerRun: number;
  commitment: Commitment;
  zapierTeamFeatures: boolean;
  n8nBusinessFeatures: boolean;
  includeSelfHost: boolean;
  /** Cêntimos de euro por mês. Null se a pessoa não indicou valor. */
  hostingMinorPerMonth: number | null;
  maintenanceMinorPerMonth: number | null;
  zapierNonprofit: boolean;
};

export type FieldError = {
  field: string;
  message: string;
};
