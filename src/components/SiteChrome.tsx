import type { ReactNode } from "react";
import Link from "next/link";
import { SponsorBar } from "@/components/SponsorBar";

const links = [
  ["/", "Calculadora"],
  ["/planos", "Planos"],
  ["/comparar", "Comparar"],
  ["/metodologia", "Metodologia"],
  ["/historico", "Histórico"],
  ["/newsletter", "Newsletter"],
  ["/patrocinio", "Patrocínio"],
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3 text-ink no-underline">
          <span className="grid h-10 w-10 grid-cols-3 items-end gap-1 rounded-xl bg-teal px-2 py-2" aria-hidden="true">
            <span className="h-3 rounded-sm bg-paper" />
            <span className="h-6 rounded-sm bg-[#f4d7a1]" />
            <span className="h-4 rounded-sm bg-card" />
          </span>
          <span>
            <span className="block font-serif text-xl leading-none">CustoAutomação</span>
            <span className="text-sm text-muted">Unidades diferentes, contas separadas</span>
          </span>
        </Link>
        <nav aria-label="Secções">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link className="text-teal-dark underline-offset-4 hover:underline" href={href}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted md:grid-cols-3">
        <p>CustoAutomação é uma revisão privada. Ainda não lançado. Não há entidade comercial, contacto verificado nem patrocinador identificado nesta versão.</p>
        <p>Preços de Zapier, Make e n8n são leituras das páginas oficiais em 8 de novembro de 2026. Não são PVP, salvo quando a própria fonte o disser. Aqui, nenhuma ficha de fornecedor traz IVA incluído.</p>
        <p>
          <Link className="text-teal-dark" href="/privacidade">Privacidade</Link>
          {" · "}
          <Link className="text-teal-dark" href="/sobre">Sobre</Link>
          {" · "}
          <Link className="text-teal-dark" href="/metodologia">Como contamos</Link>
        </p>
      </div>
    </footer>
  );
}

export function LaunchNotice() {
  return (
    <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
      <strong>Ainda não lançado.</strong> Não há estatísticas de audiência para mostrar.
    </p>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-3 focus:py-2" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <SiteHeader />
      <SponsorBar />
      <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
