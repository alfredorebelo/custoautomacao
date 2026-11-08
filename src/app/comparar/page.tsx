import type { Metadata } from "next";
import Link from "next/link";
import { snapshot } from "@/data/snapshot";
import { entryById } from "@/lib/catalog";
import { pricePhrase } from "@/lib/money";

export const metadata: Metadata = { title: "Comparar fichas" };

type Search = Record<string, string | string[] | undefined>;

export default async function ComparePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const raw = params.ids;
  const ids = (Array.isArray(raw) ? raw[0] : raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);
  const chosen = ids.map((id) => entryById(id)).filter((entry) => entry !== undefined);
  const plans = snapshot.entries.filter((entry) => entry.kind === "plan");

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-4xl">Comparar até três fichas</h1>
        <p className="mt-2 max-w-3xl text-muted">A tabela mostra a unidade, o preço e o imposto tal como foram lidos. Não converte moeda e não declara um vencedor.</p>
      </header>
      <form className="grid gap-3 rounded-3xl border border-line bg-card p-4" method="get">
        <label className="field">
          Identificadores, separados por vírgulas
          <input name="ids" defaultValue={ids.join(",")} aria-describedby="ids-help" />
          <span id="ids-help" className="text-xs text-muted">Exemplo: zapier-pro-750,n8n-starter-2500,make-free-1000</span>
        </label>
        <button className="min-h-11 w-fit rounded-full bg-teal px-4 text-white" type="submit">Comparar</button>
      </form>
      {ids.length > 0 && chosen.length === 0 ? <p role="status">Nenhuma dessas fichas existe na leitura atual.</p> : null}
      {chosen.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Ficha</th>
                {chosen.map((entry) => <th className="p-3" key={entry.id}><Link href={`/planos/${entry.id}`}>{entry.name}</Link></th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <th className="p-3">Unidade</th>
                {chosen.map((entry) => <td className="p-3" key={entry.id}>{entry.billingUnit ?? "—"}</td>)}
              </tr>
              <tr className="border-t border-line">
                <th className="p-3">Incluído</th>
                {chosen.map((entry) => <td className="p-3" key={entry.id}>{entry.includedUnits?.toLocaleString("pt-PT") ?? "não publicado"}</td>)}
              </tr>
              <tr className="border-t border-line">
                <th className="p-3">Preço mensal</th>
                {chosen.map((entry) => <td className="p-3" key={entry.id}>{entry.monthlyMinor !== null && entry.currency ? pricePhrase(entry.monthlyMinor, entry.currency, entry.tax) : "indisponível"}</td>)}
              </tr>
              <tr className="border-t border-line">
                <th className="p-3">Entra na recomendação</th>
                {chosen.map((entry) => <td className="p-3" key={entry.id}>{entry.priceComparable ? "sim, se o volume couber" : "não"}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
      <details>
        <summary>Identificadores de planos</summary>
        <ul className="mt-3 grid gap-1 text-sm">
          {plans.map((entry) => <li key={entry.id}><code>{entry.id}</code> — {entry.name}</li>)}
        </ul>
      </details>
    </div>
  );
}
