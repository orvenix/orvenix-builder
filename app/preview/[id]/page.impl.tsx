import { getAuthSession } from "@/lib/auth-session";
import { notFound, redirect } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";
import { editorPrisma } from "@/lib/editor-db";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId, WEB_LABELS } from "@/lib/editorWebs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const pageSlug = (await searchParams)?.page?.trim() || "home";

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
