const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

export function spamReason(input: { honeypot: string; startedAt: string; now?: number }): string | null {
  if (input.honeypot.trim() !== "") return "spam";
  if (!/^\d{10,16}$/.test(input.startedAt.trim())) return "timing";
  const started = Number(input.startedAt);
  const now = input.now ?? Date.now();
  const elapsed = now - started;
  if (!Number.isFinite(elapsed) || elapsed < 2000 || elapsed > 1000 * 60 * 60 * 24) return "timing";
  return null;
}

export function clip(raw: string, max: number): string {
  return raw.trim().slice(0, max);
}
