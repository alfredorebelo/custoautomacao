import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageviewBeacon } from "@/components/PageviewBeacon";
import { PageShell } from "@/components/SiteChrome";
import { integrationFlags } from "@/lib/config";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CustoAutomação",
    template: "%s · CustoAutomação",
  },
  description:
    "Calculadora em português para comparar Zapier, Make e n8n sem tratar tarefas, créditos e execuções como se fossem a mesma coisa.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "CustoAutomação",
    description: "Três unidades de faturação, uma conta honesta. Revisão privada, ainda não lançada.",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const flags = integrationFlags();
  return (
    <html lang="pt-PT">
      <body>
        <PageShell>{children}</PageShell>
        <PageviewBeacon enabled={flags.database} />
      </body>
    </html>
  );
}
