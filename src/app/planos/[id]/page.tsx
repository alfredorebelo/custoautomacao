import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { snapshot } from "@/data/snapshot";
import { entryById } from "@/lib/catalog";
import { formatMinor, pricePhrase } from "@/lib/money";

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return snapshot.entries.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const entry = entryById(id);
  return { title: entry ? entry.name : "Ficha" };
}

export default async function PlanPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const entry = entryById(id);
  if (!entry) notFound();
  const sources = snapshot.sources.filter((source) => entry.sourceIds.includes(source.id));
  return (
    <article className="grid max-w-3xl gap-5">
      <p className="text-sm text-muted"><Link href="/planos">Planos</Link> · {entry.platform}</p>
      <h1 className="text-4xl">{entry.name}</h1>
      <p>{entry.summary}</p>
      <dl className="grid gap-3 rounded-3xl border border-line bg-card p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Estado do preço</dt><dd>{entry.priceStatus}</dd></div>
        <div><dt className="text-muted">Unidade</dt><dd>{entry.billingUnit ?? "não aplicável"}</dd></div>
        <div><dt className="text-muted">Incluído</dt><dd>{entry.includedUnits?.toLocaleString("pt-PT") ?? "não publicado"}</dd></div>
        <div><dt className="text-muted">Mensal</dt><dd>{entry.monthlyMinor !== null && entry.currency ? pricePhrase(entry.monthlyMinor, entry.currency, entry.tax) : "indisponível"}</dd></div>
        <div><dt className="text-muted">Anual, por mês publicado</dt><dd>{entry.annualPerMonthMinor !== null && entry.currency ? pricePhrase(entry.annualPerMonthMinor, entry.currency, entry.tax) : "não publicado assim"}</dd></div>
        <div><dt className="text-muted">Total anual</dt><dd>{entry.annualTotalMinor !== null && entry.currency ? formatMinor(entry.annualTotalMinor, entry.currency) + " · imposto não indicado; não é PVP" : "não publicado"}</dd></div>
      </dl>
      {entry.annualTotalMinor !== null && entry.currency && entry.annualTotalMinor % 12 !== 0 ? (
        <p className="text-sm">O total anual não se divide em euros inteiros por mês. Não inventamos um destaque mensal.</p>
      ) : null}
      <ul className="grid list-disc gap-2 pl-5">
        {entry.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
      <section>
        <h2 className="text-2xl">Fontes</h2>
        <ul className="mt-2 grid gap-2">
          {sources.map((source) => (
            <li key={source.id}>
              <a className="text-teal-dark" href={source.url}>{source.url}</a>
              <span className="block text-sm text-muted">Lida em {source.retrievedOn}. Estado: {source.status}. {source.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
