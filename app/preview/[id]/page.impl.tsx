import { getAuthSession } from "@/lib/auth-session";
import { notFound, redirect } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";
import { editorPrisma } from "@/lib/editor-db";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId, WEB_LABELS } from "@/lib/editorWebs";
import { loadDynamicProductDetailPageV1 } from "@/lib/commerce/dynamic-product-detail-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string; product?: string }>;
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pageSlug = resolvedSearchParams?.page?.trim() || "home";
  const productId = resolvedSearchParams?.product?.trim();

  if (!isEditorWebId(id)) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/preview/${id}`)}`);
    }

    const allowed = await canManageSite(
      id,
      session.user.id,
      (session.user.role ?? "CLIENT") as UserRole
    );
    if (!allowed) {
      notFound();
    }
  }

  // COMMERCE-6: dynamic product detail (same loader as the published route, after the access check above).
  if (productId) {
    const productPage = await loadDynamicProductDetailPageV1(id, productId);
    if (!productPage) notFound();
    return (
      <main className="min-h-screen">
        <PublicRenderer
          siteId={id}
          tree={productPage.tree}
          activePageSlug={productPage.activePageSlug}
          activePageName={productPage.productName}
          availablePages={productPage.pages}
        />
      </main>
    );
  }

  let runtimeContext;
  try {
    runtimeContext = await getResolvedSiteRuntimeContext(id, pageSlug);
  } catch {
    notFound();
  }

  if (!runtimeContext) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <PublicRenderer
        siteId={id}
        tree={runtimeContext.tree}
        activePageSlug={runtimeContext.activePageSlug}
        activePageName={runtimeContext.activePageName}
        availablePages={runtimeContext.pages}
      />
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  if (isEditorWebId(id)) {
    return {
      title: `Preview · ${WEB_LABELS[id] ?? id}`,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return {
      title: "Preview · Orvenix",
    };
  }

  const allowed = await canManageSite(
    id,
    session.user.id,
    (session.user.role ?? "CLIENT") as UserRole
  );
  if (!allowed) {
    return {
      title: "Preview · Orvenix",
    };
  }

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: `Preview · ${site?.name ?? id}`,
  };
}
