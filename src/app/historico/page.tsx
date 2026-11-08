import type { Metadata } from "next";
import { snapshot, snapshotFingerprint } from "@/data/snapshot";
import { diffSnapshots } from "@/lib/snapshot-diff";

export const metadata: Metadata = { title: "Histórico de preços" };

export default function HistoryPage() {
  const comparedWithItself = diffSnapshots(snapshot, snapshot);
  return (
    <article className="grid max-w-3xl gap-5">
      <h1 className="text-4xl">Histórico de preços</h1>
      <p>Há uma fotografia: {snapshot.title}, datada de {snapshot.observedOn}. {snapshot.historyNote}</p>
      <dl className="grid gap-3 rounded-3xl border border-line bg-card p-4 sm:grid-cols-3">
        <div><dt className="text-sm text-muted">Leituras</dt><dd className="text-2xl font-serif">1</dd></div>
        <div><dt className="text-sm text-muted">Fichas</dt><dd className="text-2xl font-serif">{snapshot.entries.length}</dd></div>
        <div><dt className="text-sm text-muted">Impressão</dt><dd className="text-2xl font-serif">{snapshotFingerprint()}</dd></div>
      </dl>
      <p>Comparar esta leitura consigo mesma dá {comparedWithItself.changed.length} alterações, {comparedWithItself.added.length} fichas novas e {comparedWithItself.removed.length} fichas removidas. Uma leitura futura entra como outro ficheiro e a diferença olha para preço, franquia, moeda e estado.</p>
      <p>Não há preços de meses anteriores. Não foram estimados.</p>
    </article>
  );
}
