import { handleSponsorGo } from "@/lib/handlers";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleSponsorGo(slug, { store: getStore() });
}
