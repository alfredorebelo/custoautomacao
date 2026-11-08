"use client";

import { useState } from "react";

export function InquiryForm({
  action,
  enabled,
  disabledMessage,
  submitLabel,
  messageLabel,
}: {
  action: string;
  enabled: boolean;
  disabledMessage: string;
  submitLabel: string;
  messageLabel: string;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!enabled) return;
        const data = new FormData(event.currentTarget);
        data.set("startedAt", String(startedAt));
        const response = await fetch(action, { method: "POST", body: data });
        const body = (await response.json()) as { message?: string };
        setNotice(body.message ?? "Não foi possível ler a resposta.");
      }}
    >
      <fieldset className="grid gap-4" disabled={!enabled}>
        <label className="field">
          Nome
          <input name="name" autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          Correio, se quiser resposta
          <input name="email" type="email" autoComplete="email" maxLength={254} />
        </label>
        <label className="field">
          {messageLabel}
          <textarea name="message" required minLength={10} maxLength={2000} />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input className="mt-1" name="consent" type="checkbox" value="yes" required />
          <span>Aceito que este texto fique guardado para revisão. Não fica publicado só por ser enviado.</span>
        </label>
        <label className="honeypot">
          Sítio da empresa
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
        <button className="min-h-11 rounded-full bg-teal px-5 text-white disabled:opacity-50" type="submit">
          {submitLabel}
        </button>
      </fieldset>
      {!enabled ? <p role="status">{disabledMessage}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
    </form>
  );
}
