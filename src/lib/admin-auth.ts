import { timingSafeEqual } from "crypto";

export type AdminAccess = "ok" | "unconfigured" | "unauthorized";

export function adminAccess(authorization: string | null, configuredToken: string | undefined): AdminAccess {
  if (!configuredToken) return "unconfigured";
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const left = Buffer.from(provided);
  const right = Buffer.from(configuredToken);
  if (left.length === 0 || left.length !== right.length) return "unauthorized";
  if (!timingSafeEqual(left, right)) return "unauthorized";
  return "ok";
}
