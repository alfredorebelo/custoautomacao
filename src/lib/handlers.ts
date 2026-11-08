import { createHash, randomBytes } from "crypto";
import { sponsors } from "@/data/sponsors";
import { SPONSOR_ASKING_PRICE } from "@/lib/money";
import { resolveSponsorRedirect, type SponsorLink } from "@/lib/redirects";
import type { Store } from "@/lib/store/types";
import { clip, normalizeEmail, spamReason } from "@/lib/validation";
import { adminAccess } from "@/lib/admin-auth";

export const NEWSLETTER_CONSENT =
  "Quero receber a newsletter semanal da CustoAutomação. Sei que a inscrição só fica ativa depois de confirmar o correio e que posso cancelar.";

export type Mailer = {
  sendConfirmation(input: { to: string; confirmUrl: string }): Promise<void>;
  subscribeContact(input: { email: string }): Promise<void>;
  unsubscribeContact(input: { email: string }): Promise<void>;
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readForm(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const parsed = (await request.json()) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  }
  const form = await request.formData();
  const data: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") data[key] = value;
  }
  return data;
}

export async function handleNewsletter(
  request: Request,
  deps: { store: Store | null; newsletterReady: boolean; mailer: Mailer; origin: string },
): Promise<Response> {
  if (!deps.store || !deps.newsletterReady) {
    return json(
      {
        ok: false,
        code: "newsletter_unconfigured",
        message: "A newsletter ainda não está ligada. Não guardámos o endereço e não enviámos correio.",
      },
      503,
    );
  }
  const body = await readBody(request);
  if (readForm(body, "consent") !== "yes") {
    return json({ ok: false, code: "consent_required", message: "Falta o consentimento explícito." }, 400);
  }
  const spam = spamReason({ honeypot: readForm(body, "company_website"), startedAt: readForm(body, "startedAt") });
  if (spam) {
    return json({ ok: false, code: spam, message: "O pedido não passou a validação." }, 400);
  }
  const email = normalizeEmail(readForm(body, "email"));
  if (!email) {
    return json({ ok: false, code: "invalid_email", message: "O correio não parece válido." }, 400);
  }
  const confirmToken = randomBytes(32).toString("hex");
  const unsubscribeToken = randomBytes(32).toString("hex");
  const result = await deps.store.startSignup({
    emailNormalized: email,
    consentText: NEWSLETTER_CONSENT,
    confirmTokenHash: hashToken(confirmToken),
    unsubscribeTokenHash: hashToken(unsubscribeToken),
  });
  if (result === "created") {
    try {
      await deps.mailer.sendConfirmation({
        to: email,
        confirmUrl: `${deps.origin}/api/newsletter/confirm?token=${confirmToken}`,
      });
    } catch {
      await deps.store.deletePendingSignup(email);
      await deps.store.recordError("newsletter", "confirmation_not_sent");
      return json(
        {
          ok: false,
          code: "confirmation_not_sent",
          message: "Não conseguimos enviar a confirmação. A inscrição ainda não está ativa.",
        },
        503,
      );
    }
  }
  return json({
    ok: true,
    message: "Se o endereço for válido, enviamos um pedido de confirmação. A inscrição só fica ativa depois desse passo.",
  });
}

export async function handleNewsletterConfirm(
  token: string | null,
  deps: { store: Store | null; mailer: Mailer },
): Promise<Response> {
  if (!deps.store) {
    return html("Confirmação indisponível", "A newsletter não está ligada. Nada foi confirmado.", 503);
  }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return html("Ligação inválida", "Esta ligação de confirmação não é válida.", 400);
  }
  const pending = await deps.store.findByConfirmHash(hashToken(token));
  if (!pending || pending.status !== "pending") {
    return html("Ligação inválida", "Esta ligação já foi usada ou não corresponde a um pedido pendente.", 400);
  }
  try {
    await deps.mailer.subscribeContact({ email: pending.emailNormalized });
  } catch {
    return html("Confirmação incompleta", "Não foi possível concluir a lista. A inscrição continua por confirmar.", 503);
  }
  const result = await deps.store.confirmSignup(hashToken(token));
  if (result !== "confirmed") {
    return html("Ligação inválida", "Esta ligação já foi usada ou não corresponde a um pedido pendente.", 400);
  }
  return html("Inscrição confirmada", "A newsletter semanal fica ativa para este endereço. Pode cancelar quando quiser.", 200);
}

export async function handleUnsubscribe(
  request: Request,
  deps: { store: Store | null; mailer: Mailer },
): Promise<Response> {
  if (!deps.store) {
    return json({ ok: false, code: "newsletter_unconfigured", message: "O cancelamento ainda não está ligado." }, 503);
  }
  const body = await readBody(request);
  const token = readForm(body, "token");
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return json({ ok: false, code: "invalid_token", message: "A ligação de cancelamento não é válida." }, 400);
  }
  const current = await deps.store.findByUnsubscribeHash(hashToken(token));
  if (!current || current.status === "unsubscribed") {
    return json({ ok: false, code: "invalid_token", message: "A ligação de cancelamento não é válida." }, 400);
  }
  try {
    await deps.mailer.unsubscribeContact({ email: current.emailNormalized });
  } catch {
    return json({ ok: false, code: "unsubscribe_failed", message: "Não foi possível atualizar a lista. Nada foi marcado como cancelado." }, 503);
  }
  const result = await deps.store.unsubscribeSignup(hashToken(token));
  if (result !== "unsubscribed") {
    return json({ ok: false, code: "invalid_token", message: "A ligação de cancelamento não é válida." }, 400);
  }
  return json({ ok: true, message: "O endereço deixou de estar ativo na newsletter." });
}

function html(title: string, text: string, status: number): Response {
  const safeTitle = title.replace(/[<>]/g, "");
  const safeText = text.replace(/[<>]/g, "");
  return new Response(
    `<!doctype html><html lang="pt-PT"><meta charset="utf-8"><title>${safeTitle}</title><body><main><h1>${safeTitle}</h1><p>${safeText}</p></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function handleSubmission(
  request: Request,
  deps: { store: Store | null; kind: "correction" | "sponsor_inquiry" },
): Promise<Response> {
  if (!deps.store) {
    return json(
      {
        ok: false,
        code: "storage_unconfigured",
        message: "O envio está desligado. Não há base de dados configurada e nada foi guardado.",
      },
      503,
    );
  }
  const body = await readBody(request);
  if (readForm(body, "consent") !== "yes") {
    return json({ ok: false, code: "consent_required", message: "Falta o consentimento para guardar este pedido." }, 400);
  }
  const spam = spamReason({ honeypot: readForm(body, "company_website"), startedAt: readForm(body, "startedAt") });
  if (spam) return json({ ok: false, code: spam, message: "O pedido não passou a validação." }, 400);
  const message = clip(readForm(body, "message"), 2000);
  if (message.length < 10) {
    return json({ ok: false, code: "invalid_message", message: "Escreva uma mensagem com pelo menos 10 caracteres." }, 400);
  }
  const emailRaw = readForm(body, "email");
  const email = emailRaw.trim() === "" ? "" : normalizeEmail(emailRaw);
  if (emailRaw.trim() !== "" && !email) {
    return json({ ok: false, code: "invalid_email", message: "O correio não parece válido." }, 400);
  }
  const saved = await deps.store.insertSubmission({
    kind: deps.kind,
    payload: {
      name: clip(readForm(body, "name"), 120),
      email: email ?? "",
      message,
    },
  });
  return json({ ok: true, id: saved.id, message: "Pedido guardado para revisão. Ainda não está publicado." });
}

export async function handleEvent(
  request: Request,
  deps: { store: Store | null },
): Promise<Response> {
  if (!deps.store) {
    return json({ ok: false, stored: false, code: "storage_unconfigured" }, 503);
  }
  const body = await readBody(request);
  const type = readForm(body, "type");
  if (type === "pageview") {
    const path = readForm(body, "path");
    if (!/^\/[a-z0-9/-]*$/.test(path) || path.length > 120) {
      return json({ ok: false, code: "invalid_path" }, 400);
    }
    await deps.store.recordPageview(path);
    return json({ ok: true, stored: true });
  }
  if (type === "search") {
    const query = clip(readForm(body, "query"), 120);
    const count = Number(readForm(body, "resultCount"));
    if (!Number.isInteger(count) || count < 0 || count > 10000) {
      return json({ ok: false, code: "invalid_count" }, 400);
    }
    await deps.store.recordSearch({ query, resultCount: count });
    return json({ ok: true, stored: true });
  }
  return json({ ok: false, code: "invalid_type" }, 400);
}

export async function handleSponsorGo(
  slug: string,
  deps: { store: Store | null; sponsors?: readonly SponsorLink[] },
): Promise<Response> {
  const decision = resolveSponsorRedirect(slug, deps.sponsors ?? sponsors);
  if (decision.type !== "allow") {
    return json({ ok: false, code: decision.status === 400 ? "invalid_slug" : "not_found" }, decision.status);
  }
  if (deps.store) {
    try {
      await deps.store.recordClick(slug);
    } catch {
      await deps.store.recordError("sponsor_click", "not_recorded");
    }
  }
  return Response.redirect(decision.url, 302);
}

export async function handleAdmin(
  request: Request,
  deps: {
    token: string | undefined;
    store: Store | null;
    action: "queue" | "approve" | "stats" | "searches" | "sponsors";
  },
): Promise<Response> {
  const access = adminAccess(request.headers.get("authorization"), deps.token);
  if (access === "unconfigured") {
    return json({ ok: false, code: "admin_unconfigured" }, 503);
  }
  if (access === "unauthorized") {
    return json({ ok: false, code: "unauthorized" }, 401);
  }
  if (!deps.store) {
    return json({ ok: false, code: "storage_unconfigured" }, 503);
  }
  if (deps.action === "queue") {
    return json({ ok: true, submissions: await deps.store.listPending() });
  }
  if (deps.action === "approve") {
    const body = await readBody(request);
    const id = readForm(body, "id");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return json({ ok: false, code: "invalid_id" }, 400);
    }
    const result = await deps.store.approve(id);
    if (result === "missing") return json({ ok: false, code: "not_found" }, 404);
    return json({ ok: true, status: "approved" });
  }
  if (deps.action === "stats") {
    return json({
      ok: true,
      publicLabel: "Ainda não lançado",
      note: "Contagens reais das tabelas. Zero é tabela vazia, não uma estimativa de audiência.",
      proposedSponsorPrice: SPONSOR_ASKING_PRICE,
      stats: await deps.store.adminStats(),
    });
  }
  if (deps.action === "searches") {
    return json({ ok: true, searches: await deps.store.adminSearches() });
  }
  return json({
    ok: true,
    publicLabel: "Ainda não lançado",
    proposedAskingPrice: SPONSOR_ASKING_PRICE,
    revenue: null,
    sponsors: await deps.store.adminSponsors(),
  });
}
