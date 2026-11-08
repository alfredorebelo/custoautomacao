import type { Currency, TaxTreatment } from "@/lib/types";

export function usdMinor(input: string): number {
  const cleaned = input.replace(/,/g, "");
  const match = /^(\d+)\.(\d{2})$/.exec(cleaned);
  if (!match) {
    throw new Error(`Preço USD inválido: ${input}`);
  }
  return Number(match[1]) * 100 + Number(match[2]);
}

export function eurMinor(euros: number): number {
  if (!Number.isInteger(euros) || euros < 0) {
    throw new Error(`Preço EUR inteiro inválido: ${euros}`);
  }
  return euros * 100;
}

export function formatMinor(minor: number, currency: Currency): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function formatExactMinor(minor: number, currency: Currency): string {
  if (Number.isInteger(minor)) {
    return formatMinor(minor, currency);
  }
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function pricePhrase(
  minor: number | null,
  currency: Currency | null,
  tax: TaxTreatment,
): string {
  if (minor === null || currency === null) {
    return "Preço indisponível";
  }
  const amount = formatExactMinor(minor, currency);
  if (tax === "vat_included" && currency === "EUR") {
    return `${amount} PVP com IVA incluído`;
  }
  if (tax === "not_applicable" && minor === 0) {
    return `${amount} de subscrição · sem IVA a declarar neste zero`;
  }
  return `${amount} · imposto não indicado; não é PVP`;
}

export function yearlyFromPerMonth(perMonthMinor: number): number {
  return perMonthMinor * 12;
}

export const SPONSOR_ASKING_PRICE = {
  minor: 4900,
  currency: "EUR" as const,
  period: "week" as const,
  tax: "vat_included" as const,
  status: "proposed" as const,
};

export function sponsorPriceLabel(): string {
  return `${formatMinor(SPONSOR_ASKING_PRICE.minor, "EUR")} por semana, PVP com IVA incluído. Preço proposto, ainda sem patrocinador e sem receita.`;
}
