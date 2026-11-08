import type { Metadata } from "next";
import Link from "next/link";
import { searchCatalog } from "@/lib/catalog";
import { pricePhrase } from "@/lib/money";
import { integrationFlags } from "@/lib/config";
import { ZeroResultBeacon } from "@/components/ZeroResultBeacon";

export const metadata: Metadata = { title: "Planos e limites" };

type Search = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PlanosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const query = {
    q: first(params.q),
    platform: first(params.platform) || "all",
    kind: first(params.kind) || "all",
    priced: first(params.priced) || "all",
  };
  const results = searchCatalog(query);
  const flags = integrationFlags();

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-4xl">Planos, limites e regras</h1>
        <p className="mt-2 max-w-3xl text-muted">Cada ficha aponta para a leitura de 8 de novembro de 2026. Um preço só entra na recomendação quando o número foi visto na fonte e a unidade cabe no cenário.</p>
      </header>
      <form className="grid gap-3 rounded-3xl border border-line bg-card p-4 md:grid-cols-4" method="get">
        <label className="field md:col-span-2">
          Procurar
          <input name="q" defaultValue={query.q} aria-label="Procurar planos e limites" />
        </label>
        <label className="field">
          Ferramenta
          <select name="platform" defaultValue={query.platform} aria-label="Filtrar por ferramenta">
            <option value="all">Todas</option>
            <option value="zapier">Zapier</option>
            <option value="make">Make</option>
            <option value="n8n">n8n</option>
          </select>
        </label>
        <label className="field">
          Tipo
          <select name="kind" defaultValue={query.kind} aria-label="Filtrar por tipo">
            <option value="all">Tudo</option>
            <option value="plan">Planos</option>
            <option value="limit">Limites</option>
            <option value="rule">Regras</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input name="priced" type="checkbox" value="yes" defaultChecked={query.priced === "yes"} />
          Só planos com preço verificado
        </label>
        <button className="min-h-11 rounded-full bg-teal px-4 text-white md:col-span-2" type="submit">Filtrar</button>
      </form>
      <p aria-live="polite">{results.length.toLocaleString("pt-PT")} fichas</p>
      {results.length === 0 ? <p>Nenhuma ficha corresponde a esta pesquisa.</p> : null}
      {results.length === 0 && query.q ? <ZeroResultBeacon query={query.q} enabled={flags.database} /> : null}
      <ul className="grid gap-3">
        {results.map((entry) => (
          <li key={entry.id} className="rounded-3xl border border-line bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{entry.platform} · {entry.kind}</p>
                <h2 className="text-2xl"><Link href={`/planos/${entry.id}`}>{entry.name}</Link></h2>
                <p className="mt-1 text-sm">{entry.summary}</p>
              </div>
              <p className="text-sm sm:max-w-xs sm:text-right">
                {entry.monthlyMinor !== null && entry.currency
                  ? pricePhrase(entry.monthlyMinor, entry.currency, entry.tax)
                  : entry.priceStatus === "verified"
                    ? "Preço verificado sem valor mensal único"
                    : "Preço indisponível ou por confirmar"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
