import { randomUUID } from "crypto";
import type { AdminStats, SignupRecord, Store, Submission } from "@/lib/store/types";

/**
 * Repositório só para testes. Não é uma base de dados e não pode ser usado
 * como sucesso de produção.
 */
export function createMemoryStore(): Store {
  const submissions: Submission[] = [];
  const signups: SignupRecord[] = [];
  const searches: Array<{ query: string; resultCount: number; createdAt: string }> = [];
  const pageviews: string[] = [];
  const clicks: string[] = [];
  const errors: string[] = [];

  return {
    async insertSubmission(input) {
      const row: Submission = {
        id: randomUUID(),
        kind: input.kind,
        status: "pending",
        payload: input.payload,
        createdAt: new Date().toISOString(),
      };
      submissions.push(row);
      return { id: row.id };
    },
    async listPending() {
      return submissions.filter((item) => item.status === "pending");
    },
    async approve(id) {
      const row = submissions.find((item) => item.id === id);
      if (!row) return "missing";
      row.status = "approved";
      return "approved";
    },
    async startSignup(input) {
      const existing = signups.find((item) => item.emailNormalized === input.emailNormalized);
      if (existing && existing.status !== "unsubscribed") return "duplicate";
      if (existing && existing.status === "unsubscribed") {
        existing.status = "pending";
        existing.confirmTokenHash = input.confirmTokenHash;
        existing.unsubscribeTokenHash = input.unsubscribeTokenHash;
        return "created";
      }
      signups.push({
        id: randomUUID(),
        emailNormalized: input.emailNormalized,
        status: "pending",
        confirmTokenHash: input.confirmTokenHash,
        unsubscribeTokenHash: input.unsubscribeTokenHash,
      });
      return "created";
    },
    async deletePendingSignup(emailNormalized) {
      const index = signups.findIndex((item) => item.emailNormalized === emailNormalized && item.status === "pending");
      if (index >= 0) signups.splice(index, 1);
    },
    async findByConfirmHash(tokenHash) {
      const row = signups.find((item) => item.confirmTokenHash === tokenHash);
      return row ? { emailNormalized: row.emailNormalized, status: row.status } : null;
    },
    async findByUnsubscribeHash(tokenHash) {
      const row = signups.find((item) => item.unsubscribeTokenHash === tokenHash);
      return row ? { emailNormalized: row.emailNormalized, status: row.status } : null;
    },
    async confirmSignup(tokenHash) {
      const row = signups.find((item) => item.confirmTokenHash === tokenHash && item.status === "pending");
      if (!row) return "invalid";
      row.status = "confirmed";
      return "confirmed";
    },
    async unsubscribeSignup(tokenHash) {
      const row = signups.find((item) => item.unsubscribeTokenHash === tokenHash && item.status !== "unsubscribed");
      if (!row) return "invalid";
      row.status = "unsubscribed";
      return "unsubscribed";
    },
    async recordSearch(input) {
      searches.push({ ...input, createdAt: new Date().toISOString() });
    },
    async recordPageview(path) {
      pageviews.push(path);
    },
    async recordClick(slug) {
      clicks.push(slug);
    },
    async recordError(source, message) {
      errors.push(`${source}:${message}`);
    },
    async adminStats(): Promise<AdminStats> {
      return {
        pendingSubmissions: submissions.filter((item) => item.status === "pending").length,
        approvedSubmissions: submissions.filter((item) => item.status === "approved").length,
        signupsPending: signups.filter((item) => item.status === "pending").length,
        signupsConfirmed: signups.filter((item) => item.status === "confirmed").length,
        signupsUnsubscribed: signups.filter((item) => item.status === "unsubscribed").length,
        zeroResultSearches: searches.filter((item) => item.resultCount === 0).length,
        pageviews: pageviews.length,
        sponsorClicks: clicks.length,
        sponsorWeeks: 0,
        errors: errors.length,
      };
    },
    async adminSearches() {
      return searches.filter((item) => item.resultCount === 0);
    },
    async adminSponsors() {
      return { weeks: [], clicks: clicks.length };
    },
  };
}
