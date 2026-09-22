import { listSitemapEntries, renderUrlset } from "@/lib/sitemap";
import { sitemapXmlResponse } from "@/lib/sitemap-response";

export const dynamic = "force-static";

export async function GET() {
  const entries = await listSitemapEntries();
  return sitemapXmlResponse(
    renderUrlset(entries.filter((entry) => entry.kind === "event"))
  );
}
