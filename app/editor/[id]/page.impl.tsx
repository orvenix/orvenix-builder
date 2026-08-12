import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { EditorProvider } from "@/components/editor/store/EditorProvider";
import { getEditorTreeFromDb } from "@/lib/editorPersistence";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isArtisanEditableTree, isEditorWebId } from "@/lib/editorWebs";
import { getUserPlanAccess } from "@/lib/plan-guard";
import { isAdvancedBuilderPlan } from "@/lib/pro-plan";
import { getResolvedSitePage, listSitePages } from "@/lib/builder-core/tree/sitePages";
import { seedProfessionalStarterPages } from "@/lib/professional-site-starter";
import { EditorExperienceShell } from "@/components/editor/experience"

interface EditorPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { id } = await params;
  const pageSlug = (await searchParams)?.page?.trim() || "home";

  let initialUserRole: "admin" | "client" =
  isEditorWebId(id) ? "admin" : "client";
  let shouldEnsureProfessionalPages = false;
  

  if (!isEditorWebId(id)) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/editor/${id}`)}`);
    }

    initialUserRole =
  session.user.role === "ADMIN" ? "admin" : "client";

    if (session.user.role !== "ADMIN") {
      const planAccess = await getUserPlanAccess(session.user.id);
      if (!planAccess.isActive) {
        redirect(`/precios?upgrade=editor&callbackUrl=${encodeURIComponent(`/editor/${id}`)}`);
      }

      shouldEnsureProfessionalPages = isAdvancedBuilderPlan(planAccess.plan?.id);
      initialUserRole = "client";
    }

    const allowed = await canManageSite(
      id,
      session.user.id,
      (session.user.role ?? "CLIENT") as UserRole
    );
    if (!allowed) notFound();
  }

  let tree;
  let resolvedPage = null;
  let availablePages = [];
  try {
    tree = await getEditorTreeFromDb(id, pageSlug);
    availablePages = await listSitePages(id);

    if (shouldEnsureProfessionalPages && availablePages.length <= 1 && !isArtisanEditableTree(tree)) {
      await seedProfessionalStarterPages(id, tree);
      tree = await getEditorTreeFromDb(id, pageSlug);
      availablePages = await listSitePages(id);
    }

    resolvedPage = await getResolvedSitePage(id, pageSlug);
  } catch {
    notFound();
  }
  const activePageName = resolvedPage?.name ?? "Inicio";
  const activePageSlug = resolvedPage?.slug ?? "home";

  return (
    <EditorProvider
  websiteId={id}
  initialTree={tree}
  initialUserRole={initialUserRole}
  initialBuilderTier={shouldEnsureProfessionalPages ? "pro" : "basic"}
  initialPageSlug={activePageSlug}
  initialPageName={activePageName}
  availablePages={availablePages}
>
      <div className="ov-shell editor-shell-page relative flex h-screen flex-col overflow-hidden text-white">
  <EditorExperienceShell />
</div>
    </EditorProvider>
  );
}
