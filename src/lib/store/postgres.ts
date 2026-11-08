import "server-only";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import type { Store, Submission, SubmissionKind } from "@/lib/store/types";

export class PostgresStore implements Store {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 4 });
  }

  async insertSubmission(input: { kind: SubmissionKind; payload: Record<string, string> }) {
    const id = randomUUID();
    await this.pool.query(
      "insert into submissions (id, kind, status, payload) values ($1, $2, 'pending', $3::jsonb)",
      [id, input.kind, JSON.stringify(input.payload)],
    );
    return { id };
  }

  async listPending(): Promise<Submission[]> {
    const result = await this.pool.query<{
      id: string;
      kind: SubmissionKind;
      status: Submission["status"];
      payload: Record<string, string>;
      created_at: Date;
    }>("select id, kind, status, payload, created_at from submissions where status = 'pending' order by created_at asc");
    return result.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      payload: row.payload,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async approve(id: string) {
    const result = await this.pool.query(
      "update submissions set status = 'approved', decided_at = now() where id = $1 and status = 'pending'",
      [id],
    );
    return result.rowCount ? "approved" : "missing";
  }

  async startSignup(input: {
    emailNormalized: string;
    consentText: string;
    confirmTokenHash: string;
    unsubscribeTokenHash: string;
  }) {
    const existing = await this.pool.query<{ status: string }>(
      "select status from newsletter_signups where email_normalized = $1",
      [input.emailNormalized],
    );
    const current = existing.rows[0];
    if (current && current.status !== "unsubscribed") return "duplicate" as const;
    if (current && current.status === "unsubscribed") {
      await this.pool.query(
        `update newsletter_signups
         set status = 'pending', consent_text = $2, consent_at = now(),
             confirm_token_hash = $3, unsubscribe_token_hash = $4,
             confirmed_at = null, unsubscribed_at = null
         where email_normalized = $1`,
        [input.emailNormalized, input.consentText, input.confirmTokenHash, input.unsubscribeTokenHash],
      );
      return "created" as const;
    }
    await this.pool.query(
      `insert into newsletter_signups
        (id, email_normalized, status, consent_text, confirm_token_hash, unsubscribe_token_hash)
       values ($1, $2, 'pending', $3, $4, $5)`,
      [randomUUID(), input.emailNormalized, input.consentText, input.confirmTokenHash, input.unsubscribeTokenHash],
    );
    return "created" as const;
  }

  async deletePendingSignup(emailNormalized: string) {
    await this.pool.query(
      "delete from newsletter_signups where email_normalized = $1 and status = 'pending'",
      [emailNormalized],
    );
  }

  async findByConfirmHash(tokenHash: string) {
    const result = await this.pool.query<{ email_normalized: string; status: "pending" | "confirmed" | "unsubscribed" }>(
      "select email_normalized, status from newsletter_signups where confirm_token_hash = $1",
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? { emailNormalized: row.email_normalized, status: row.status } : null;
  }

  async findByUnsubscribeHash(tokenHash: string) {
    const result = await this.pool.query<{ email_normalized: string; status: "pending" | "confirmed" | "unsubscribed" }>(
      "select email_normalized, status from newsletter_signups where unsubscribe_token_hash = $1",
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? { emailNormalized: row.email_normalized, status: row.status } : null;
  }

  async confirmSignup(tokenHash: string) {
    const result = await this.pool.query(
      `update newsletter_signups
       set status = 'confirmed', confirmed_at = now()
       where confirm_token_hash = $1 and status = 'pending'`,
      [tokenHash],
    );
    return result.rowCount ? "confirmed" : "invalid";
  }

  async unsubscribeSignup(tokenHash: string) {
    const result = await this.pool.query(
      `update newsletter_signups
       set status = 'unsubscribed', unsubscribed_at = now()
       where unsubscribe_token_hash = $1 and status <> 'unsubscribed'`,
      [tokenHash],
    );
    return result.rowCount ? "unsubscribed" : "invalid";
  }

  async recordSearch(input: { query: string; resultCount: number }) {
    await this.pool.query(
      "insert into search_events (query, result_count, zero_result) values ($1, $2, $3)",
      [input.query, input.resultCount, input.resultCount === 0],
    );
  }

  async recordPageview(path: string) {
    await this.pool.query("insert into pageviews (path) values ($1)", [path]);
  }

  async recordClick(slug: string) {
    await this.pool.query("insert into sponsor_clicks (slug) values ($1)", [slug]);
  }

  async recordError(source: string, message: string) {
    await this.pool.query("insert into app_errors (source, message) values ($1, $2)", [source, message.slice(0, 500)]);
  }

  async adminStats() {
    const result = await this.pool.query<{
      pending_submissions: string;
      approved_submissions: string;
      signups_pending: string;
      signups_confirmed: string;
      signups_unsubscribed: string;
      zero_result_searches: string;
      pageviews: string;
      sponsor_clicks: string;
      sponsor_weeks: string;
      errors: string;
    }>(`
      select
        (select count(*) from submissions where status = 'pending') as pending_submissions,
        (select count(*) from submissions where status = 'approved') as approved_submissions,
        (select count(*) from newsletter_signups where status = 'pending') as signups_pending,
        (select count(*) from newsletter_signups where status = 'confirmed') as signups_confirmed,
        (select count(*) from newsletter_signups where status = 'unsubscribed') as signups_unsubscribed,
        (select count(*) from search_events where zero_result) as zero_result_searches,
        (select count(*) from pageviews) as pageviews,
        (select count(*) from sponsor_clicks) as sponsor_clicks,
        (select count(*) from sponsor_weeks) as sponsor_weeks,
        (select count(*) from app_errors) as errors
    `);
    const row = result.rows[0];
    return {
      pendingSubmissions: Number(row.pending_submissions),
      approvedSubmissions: Number(row.approved_submissions),
      signupsPending: Number(row.signups_pending),
      signupsConfirmed: Number(row.signups_confirmed),
      signupsUnsubscribed: Number(row.signups_unsubscribed),
      zeroResultSearches: Number(row.zero_result_searches),
      pageviews: Number(row.pageviews),
      sponsorClicks: Number(row.sponsor_clicks),
      sponsorWeeks: Number(row.sponsor_weeks),
      errors: Number(row.errors),
    };
  }

  async adminSearches() {
    const result = await this.pool.query<{ query: string; result_count: number; created_at: Date }>(
      "select query, result_count, created_at from search_events where zero_result order by created_at desc limit 100",
    );
    return result.rows.map((row) => ({
      query: row.query,
      resultCount: row.result_count,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async adminSponsors() {
    const weeks = await this.pool.query<Record<string, string>>(
      "select id::text, slug, status, price_minor::text, currency from sponsor_weeks order by starts_on desc limit 100",
    );
    const clicks = await this.pool.query<{ count: string }>("select count(*)::text as count from sponsor_clicks");
    return { weeks: weeks.rows, clicks: Number(clicks.rows[0]?.count ?? 0) };
  }
}
