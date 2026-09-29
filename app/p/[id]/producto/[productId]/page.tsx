import { notFound } from "next/navigation";
import { getPublishedSite } from "@/lib/auth";
import { PublicRenderer } from "@/components/PublicRenderer";
import { SiteCopyrightBar, parseSiteOwnership } from "@/components/SiteCopyrightBar";
import { loadDynamicProductDetailPageV1 } from "@/lib/commerce/dynamic-product-detail-page";

/**
 * COMMERCE-6: the published dynamic product-detail runtime. Serves ANY
 * active product of THIS published site (the product lookup is scoped to
 * the site id) without a generated page per product; creative detail
 * pages keep priority because product cards only link here when the site
 * has no creative page for that exact product.
 */

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; productId: string }>;
}

export default async function PublicDynamicProductDetailPage({ params }: Props) {
  const { id, productId } = await params;
  const site = await getPublishedSite(id);
  if (!site) notFound();

  const page = await loadDynamicProductDetailPageV1(id, productId);
  if (!page) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <PublicRenderer
          siteId={id}
          tree={page.tree}
          activePageSlug={page.activePageSlug}
          activePageName={page.productName}
          availablePages={page.pages}
        />
      </div>
      <SiteCopyrightBar siteName={site.name} ownership={parseSiteOwnership(site.description)} attributions={[]} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id, productId } = await params;
  const site = await getPublishedSite(id);
  if (!site) return { title: "Orvenix" };
  const page = await loadDynamicProductDetailPageV1(id, productId);
  return { title: page ? `${page.productName} · ${site.name}` : site.name };
}
