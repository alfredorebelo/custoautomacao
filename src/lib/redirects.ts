export type SponsorLink = {
  slug: string;
  href: string;
  active: boolean;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveSponsorRedirect(
  slug: string,
  sponsors: readonly SponsorLink[],
): { type: "allow"; url: string } | { type: "reject"; status: 400 | 404 } {
  if (slug.length > 64 || !SLUG.test(slug)) {
    return { type: "reject", status: 400 };
  }
  const match = sponsors.find((sponsor) => sponsor.slug === slug && sponsor.active);
  if (!match) {
    return { type: "reject", status: 404 };
  }
  let url: URL;
  try {
    url = new URL(match.href);
  } catch {
    return { type: "reject", status: 404 };
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    return { type: "reject", status: 404 };
  }
  if (match.href !== url.href && match.href !== url.toString()) {
    return { type: "reject", status: 404 };
  }
  return { type: "allow", url: url.href };
}
