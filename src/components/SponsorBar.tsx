"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const storageKey = "custoautomacao.sponsorBar.dismissed";

export function SponsorBar() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") setOpen(false);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <aside aria-label="Proposta de patrocínio" className="border-b border-line bg-[#efe7d4]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>Espaço proposto, ainda sem patrocinador.</strong> Pedido de 49 € por semana, PVP com IVA incluído. Não é um anúncio de cliente nem receita existente.
      </p>
      <div className="flex gap-2">
        <Link className="inline-flex min-h-11 items-center rounded-full bg-teal px-4 text-sm text-white" href="/patrocinio">
          Ver a proposta
        </Link>
        <button
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
          type="button"
          onClick={() => {
            setOpen(false);
            try {
              window.sessionStorage.setItem(storageKey, "1");
            } catch {
              /* preferência só desta visita */
            }
          }}
        >
          Fechar
        </button>
      </div>
      </div>
    </aside>
  );
}
