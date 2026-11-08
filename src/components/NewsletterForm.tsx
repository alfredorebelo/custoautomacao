"use client";

import { useState } from "react";

export function NewsletterForm({ enabled }: { enabled: boolean }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  return (
    <form
      className="grid gap-4 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!enabled) return;
        const data = new FormData(event.currentTarget);
        data.set("startedAt", String(startedAt));
        const response = await fetch("/api/newsletter", { method: "POST", body: data });
        const body = (await response.json()) as { message?: string };
        setNotice(body.message ?? "Não foi possível ler a resposta.");
      }}
    >
      <fieldset className="grid gap-4" disabled={!enabled}>
        <label className="field">
          Correio
          <input name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby="email-help" />
          <span id="email-help" className="text-xs text-muted">Só guardamos o endereço se a base de dados e o Resend estiverem configurados.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input name="consent" type="checkbox" value="yes" required />
          <span>Quero receber a newsletter semanal. A inscrição só fica ativa depois de eu confirmar o correio.</span>
        </label>
        <label className="honeypot">
          Sítio
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
        <button className="min-h-11 rounded-full bg-teal px-5 text-white" type="submit">Pedir confirmação</button>
      </fieldset>
      {!enabled ? (
        <p role="status">A newsletter está desligada. Falta a base de dados ou a configuração Resend. Não guardámos nenhum endereço e não enviámos correio.</p>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
    </form>
  );
}
