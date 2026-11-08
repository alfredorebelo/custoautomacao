import type { MetadataRoute } from "next";
import { snapshot } from "@/data/snapshot";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const paths = ["", "/planos", "/comparar", "/metodologia", "/historico", "/newsletter", "/patrocinio", "/privacidade", "/sobre"];
  return [
    ...paths.map((path) => ({ url: `${siteUrl}${path || "/"}`, lastModified: snapshot.observedOn })),
    ...snapshot.entries.map((entry) => ({ url: `${siteUrl}/planos/${entry.id}`, lastModified: snapshot.observedOn })),
  ];
}
