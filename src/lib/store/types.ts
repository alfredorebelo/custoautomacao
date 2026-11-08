export type SubmissionKind = "correction" | "sponsor_inquiry";

export type Submission = {
  id: string;
  kind: SubmissionKind;
  status: "pending" | "approved" | "rejected";
  payload: Record<string, string>;
  createdAt: string;
};

export type SignupStatus = "pending" | "confirmed" | "unsubscribed";

export type SignupRecord = {
  id: string;
  emailNormalized: string;
  status: SignupStatus;
  confirmTokenHash: string;
  unsubscribeTokenHash: string;
};

export type AdminStats = {
  pendingSubmissions: number;
  approvedSubmissions: number;
  signupsPending: number;
  signupsConfirmed: number;
  signupsUnsubscribed: number;
  zeroResultSearches: number;
  pageviews: number;
  sponsorClicks: number;
  sponsorWeeks: number;
  errors: number;
};

export type Store = {
  insertSubmission(input: { kind: SubmissionKind; payload: Record<string, string> }): Promise<{ id: string }>;
  listPending(): Promise<Submission[]>;
  approve(id: string): Promise<"approved" | "missing">;
  startSignup(input: {
    emailNormalized: string;
    consentText: string;
    confirmTokenHash: string;
    unsubscribeTokenHash: string;
  }): Promise<"created" | "duplicate">;
  deletePendingSignup(emailNormalized: string): Promise<void>;
  findByConfirmHash(tokenHash: string): Promise<{ emailNormalized: string; status: SignupStatus } | null>;
  findByUnsubscribeHash(tokenHash: string): Promise<{ emailNormalized: string; status: SignupStatus } | null>;
  confirmSignup(tokenHash: string): Promise<"confirmed" | "invalid">;
  unsubscribeSignup(tokenHash: string): Promise<"unsubscribed" | "invalid">;
  recordSearch(input: { query: string; resultCount: number }): Promise<void>;
  recordPageview(path: string): Promise<void>;
  recordClick(slug: string): Promise<void>;
  recordError(source: string, message: string): Promise<void>;
  adminStats(): Promise<AdminStats>;
  adminSearches(): Promise<Array<{ query: string; resultCount: number; createdAt: string }>>;
  adminSponsors(): Promise<{ weeks: Array<Record<string, string>>; clicks: number }>;
};
