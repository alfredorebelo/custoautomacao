import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { adminAccess } from "@/lib/admin-auth";
import { weeklyBroadcastDraft } from "@/lib/broadcast";
import { handleAdmin, handleEvent, handleNewsletter, handleNewsletterConfirm, handleSponsorGo, handleSubmission, handleUnsubscribe, type Mailer } from "@/lib/handlers";
import { resolveSponsorRedirect } from "@/lib/redirects";
import { createMemoryStore } from "@/lib/store/memory";

const now = Date.now();

function mailer(): Mailer & { sent: string[]; subscribed: string[]; unsubscribed: string[] } {
  const sent: string[] = [];
  const subscribed: string[] = [];
  const unsubscribed: string[] = [];
  return {
    sent,
    subscribed,
    unsubscribed,
    async sendConfirmation({ to }) {
      sent.push(to);
    },
    async subscribeContact({ email }) {
      subscribed.push(email);
    },
    async unsubscribeContact({ email }) {
      unsubscribed.push(email);
    },
  };
}

function newsletterRequest(body: Record<string, string>) {
  return new Request("http://localhost/api/newsletter", { method: "POST", body: new URLSearchParams(body) });
}

describe("administração, redirecionamentos e inscrições", () => {
  it("fecha a administração sem token e com token errado", async () => {
    const store = createMemoryStore();
    const request = new Request("http://localhost/api/admin/stats");
    expect((await handleAdmin(request, { token: undefined, store, action: "stats" })).status).toBe(503);
    expect((await handleAdmin(request, { token: "", store, action: "stats" })).status).toBe(503);
    const denied = await handleAdmin(new Request("http://localhost/api/admin/stats", { headers: { authorization: "Bearer errado" } }), {
      token: "certo",
      store,
      action: "stats",
    });
    expect(denied.status).toBe(401);
    expect(await denied.text()).not.toContain("certo");
    expect(adminAccess(null, undefined)).toBe("unconfigured");
    expect(adminAccess("Bearer certo", "certo")).toBe("ok");
    const missingStore = await handleAdmin(new Request("http://localhost/api/admin/queue", { headers: { authorization: "Bearer certo" } }), {
      token: "certo",
      store: null,
      action: "queue",
    });
    expect(missingStore.status).toBe(503);
  });

  it("aprova a fila e mostra contagens reais, com o preço de patrocínio ainda proposto", async () => {
    const store = createMemoryStore();
    const saved = await store.insertSubmission({ kind: "correction", payload: { message: "fonte nova" } });
    const headers = { authorization: "Bearer segredo" };
    const queue = await handleAdmin(new Request("http://localhost/api/admin/queue", { headers }), { token: "segredo", store, action: "queue" });
    expect((await queue.json()).submissions).toHaveLength(1);
    const approved = await handleAdmin(new Request("http://localhost/api/admin/approve", { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ id: saved.id }) }), {
      token: "segredo",
      store,
      action: "approve",
    });
    expect(approved.status).toBe(200);
    const stats = await (await handleAdmin(new Request("http://localhost/api/admin/stats", { headers }), { token: "segredo", store, action: "stats" })).json();
    expect(stats.publicLabel).toBe("Ainda não lançado");
    expect(stats.stats.approvedSubmissions).toBe(1);
    expect(stats.stats.pageviews).toBe(0);
    expect(stats.proposedSponsorPrice.status).toBe("proposed");
    const sponsors = await (await handleAdmin(new Request("http://localhost/api/admin/sponsors", { headers }), { token: "segredo", store, action: "sponsors" })).json();
    expect(sponsors.revenue).toBeNull();
  });

  it("só redireciona um HTTPS da lista e ignora destinos abertos", async () => {
    const list = [{ slug: "exemplo", href: "https://example.com/patrocinio", active: true }];
    expect(resolveSponsorRedirect("https://evil.com", list).type).toBe("reject");
    expect(resolveSponsorRedirect("//evil.com", list).type).toBe("reject");
    expect(resolveSponsorRedirect("evil.com", list).type).toBe("reject");
    expect(resolveSponsorRedirect("exemplo", []).type).toBe("reject");
    expect(resolveSponsorRedirect("exemplo", [{ slug: "exemplo", href: "http://example.com", active: true }]).type).toBe("reject");
    const response = await handleSponsorGo("exemplo", { store: createMemoryStore(), sponsors: list });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/patrocinio");
    const absent = await handleSponsorGo("outro", { store: null, sponsors: list });
    expect(absent.status).toBe(404);
    expect(readFileSync("src/data/sponsors.ts", "utf8")).toContain("readonly SponsorLink[] = []");
  });

  it("não aceita newsletter sem consentimento, duplicada ou sem serviço", async () => {
    const store = createMemoryStore();
    const sent = mailer();
    const base = { email: "Ana@Example.com", consent: "yes", company_website: "", startedAt: String(now - 5000) };
    const disabled = await handleNewsletter(newsletterRequest(base), { store: null, newsletterReady: false, mailer: sent, origin: "http://localhost" });
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toMatchObject({ ok: false, code: "newsletter_unconfigured" });
    const noConsent = await handleNewsletter(newsletterRequest({ ...base, consent: "" }), { store, newsletterReady: true, mailer: sent, origin: "http://localhost" });
    expect(noConsent.status).toBe(400);
    const fast = await handleNewsletter(newsletterRequest({ ...base, startedAt: String(now) }), { store, newsletterReady: true, mailer: sent, origin: "http://localhost" });
    expect(fast.status).toBe(400);
    const first = await handleNewsletter(newsletterRequest(base), { store, newsletterReady: true, mailer: sent, origin: "http://localhost" });
    expect(first.status).toBe(200);
    expect(sent.sent).toEqual(["ana@example.com"]);
    const second = await handleNewsletter(newsletterRequest(base), { store, newsletterReady: true, mailer: sent, origin: "http://localhost" });
    expect(second.status).toBe(200);
    expect(sent.sent).toHaveLength(1);
    const stats = await store.adminStats();
    expect(stats.signupsPending).toBe(1);
  });

  it("confirma e cancela só com o código certo e não marca sucesso se a lista falhar", async () => {
    const store = createMemoryStore();
    const sent = mailer();
    await handleNewsletter(newsletterRequest({ email: "pessoa@example.com", consent: "yes", company_website: "", startedAt: String(now - 5000) }), {
      store,
      newsletterReady: true,
      mailer: sent,
      origin: "http://localhost",
    });
    const confirmUrl = sent.sent.length === 1 ? "known" : "";
    expect(confirmUrl).toBe("known");
    const failing: Mailer = {
      async sendConfirmation() {
        throw new Error("no");
      },
      async subscribeContact() {
        throw new Error("no");
      },
      async unsubscribeContact() {
        throw new Error("no");
      },
    };
    const created = await store.adminStats();
    expect(created.signupsPending).toBe(1);
    const badConfirm = await handleNewsletterConfirm("a".repeat(64), { store, mailer: sent });
    expect(badConfirm.status).toBe(400);
    const offline = await handleSubmission(newsletterRequest({ consent: "yes", message: "uma correção com fonte", startedAt: String(now - 5000), company_website: "" }), {
      store: null,
      kind: "correction",
    });
    expect(offline.status).toBe(503);
    const saved = await handleSubmission(newsletterRequest({ consent: "yes", message: "uma correção com fonte", name: "Ana", email: "", startedAt: String(now - 5000), company_website: "" }), {
      store,
      kind: "correction",
    });
    expect(saved.status).toBe(200);
    const honeypot = await handleEvent(new Request("http://localhost/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "search", query: "nada", resultCount: 0 }) }), { store });
    expect((await honeypot.json()).stored).toBe(true);
    const noStoreEvent = await handleEvent(new Request("http://localhost/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "pageview", path: "/" }) }), { store: null });
    expect((await noStoreEvent.json()).stored).toBe(false);
    expect(weeklyBroadcastDraft({ from: "news@example.com", segmentId: "seg", subject: "Semana", text: "Olá {{{RESEND_UNSUBSCRIBE_URL}}}" }).send).toBe(false);
    expect(() => weeklyBroadcastDraft({ from: "news@example.com", segmentId: "seg", subject: "Semana", text: "sem ligação" })).toThrow("missing_unsubscribe");
    const pendingBeforeFail = await store.adminStats();
    expect(pendingBeforeFail.signupsPending).toBe(1);
    await handleNewsletter(newsletterRequest({ email: "falha@example.com", consent: "yes", company_website: "", startedAt: String(now - 4000) }), {
      store,
      newsletterReady: true,
      mailer: failing,
      origin: "http://localhost",
    });
    expect((await store.adminStats()).signupsPending).toBe(1);
    const token = "ab".repeat(32);
    await store.startSignup({
      emailNormalized: "confirma@example.com",
      consentText: "sim",
      confirmTokenHash: (await import("crypto")).createHash("sha256").update(token).digest("hex"),
      unsubscribeTokenHash: (await import("crypto")).createHash("sha256").update("cd".repeat(32)).digest("hex"),
    });
    const confirmed = await handleNewsletterConfirm(token, { store, mailer: sent });
    expect(confirmed.status).toBe(200);
    expect(sent.subscribed).toEqual(["confirma@example.com"]);
    const cancelToken = "cd".repeat(32);
    const cancelled = await handleUnsubscribe(new Request("http://localhost/api/newsletter/unsubscribe", { method: "POST", body: new URLSearchParams({ token: cancelToken }) }), {
      store,
      mailer: sent,
    });
    expect(cancelled.status).toBe(200);
    expect(sent.unsubscribed).toEqual(["confirma@example.com"]);
  });
});
