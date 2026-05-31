import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { EditorProvider } from "@/components/editor/store/EditorProvider";
import { EditorShell } from "@/components/editor/shell/EditorShell";
import { HistoryControls } from "@/components/editor/toolbar/HistoryControls";
import { DeviceToggle } from "@/components/editor/toolbar/DeviceToggle";
import { EditorCommandPalette } from "@/components/editor/toolbar/EditorCommandPalette";
import { EditorOpsBar } from "@/components/editor/toolbar/EditorOpsBar";
import { getEditorTreeFromDb } from "@/lib/editorPersistence";
import { canManageSite, type UserRole } from "@/lib/auth";
import { WEB_LABELS, isEditorWebId } from "@/lib/editorWebs";
import { getUserPlanAccess } from "@/lib/plan-guard";
import { getResolvedSitePage, listSitePages } from "@/lib/builder-core/tree/sitePages";
import { ThemeToggle } from "@/components/theme/ThemeMode";
import Link from "next/link";
import { OrvenixBrand } from "@/components/OrvenixLogo";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface EditorPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}

const COLLAB_AVATARS = [
  { initials: "TM", color: "#6366f1" },
  { initials: "SR", color: "#10b981" },
  { initials: "KL", color: "#f59e0b" },
];

const EDITOR_NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/webs", label: "Sitios" },
  { href: "/templates", label: "Templates" },
  { href: "/precios", label: "Precios" },
];

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { id } = await params;
  const pageSlug = (await searchParams)?.page?.trim() || "home";

  if (!isEditorWebId(id)) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/editor/${id}`)}`);
    }

    if (session.user.role !== "ADMIN") {
      const planAccess = await getUserPlanAccess(session.user.id);
      if (!planAccess.isActive) {
        redirect(`/precios?upgrade=editor&callbackUrl=${encodeURIComponent(`/editor/${id}`)}`);
      }
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
    resolvedPage = await getResolvedSitePage(id, pageSlug);
    availablePages = await listSitePages(id);
  } catch {
    notFound();
  }

  const siteName = isEditorWebId(id) ? WEB_LABELS[id] : id;
  const activePageName = resolvedPage?.name ?? "Inicio";
  const activePageSlug = resolvedPage?.slug ?? "home";

  return (
    <EditorProvider
      websiteId={id}
      initialTree={tree}
      initialPageSlug={activePageSlug}
      initialPageName={activePageName}
      availablePages={availablePages}
    >
      <div className="ov-shell editor-shell-page relative flex h-screen flex-col overflow-hidden text-white">

        {/* Topbar con el glassmorphism del sitio */}
        <header className="ov-topbar editor-topbar relative z-20 flex min-h-[58px] shrink-0 items-center gap-0 px-0">

          {/* Grupo izquierdo */}
          <div className="flex min-w-0 flex-1 items-center gap-0 pl-2">

            {/* Botón volver */}
            <Link
              href="/dashboard"
              className="ov-back-btn group relative flex h-[58px] w-11 shrink-0 items-center justify-center transition-colors"
              title="Dashboard"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              <span className="ov-back-btn-overlay absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            {/* Sep */}
            <div className="ov-vsep mx-1 h-4 w-px shrink-0" />

            {/* Logo */}
            <Link
              href="/dashboard"
              className="editor-topbar-logo pl-2 pr-3 transition-transform duration-300 hover:scale-[1.01]"
            >
              <OrvenixBrand iconSize={28} textSize="base" />
            </Link>

            {/* Nav links */}
            <nav className="editor-topbar-menu hidden items-center gap-0.5 lg:flex" aria-label="Navegación del editor">
              {EDITOR_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ov-link-ghost rounded-md px-2.5 py-1.5 text-[12px] font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Breadcrumb */}
            <div className="ml-2 flex items-center gap-1 text-[11px] font-medium min-w-0">
              <span className="hidden text-white/25 sm:inline">Sitios</span>
              <ChevronRight size={11} className="hidden shrink-0 text-white/20 sm:inline" />
              <span className="ov-editor-breadcrumb">{siteName}</span>
              <ChevronRight size={11} className="hidden shrink-0 text-white/20 sm:inline" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/75">
                {activePageName}
              </span>
            </div>

            {/* Auto-save badge */}
            <div className="ov-badge-accent ml-3 hidden items-center gap-1.5 md:flex">
              <span className="ov-live-dot" />
              Auto-save
            </div>

            <div className="ov-vsep mx-2 hidden h-4 w-px shrink-0 sm:block" />

            <HistoryControls />
            <EditorCommandPalette />
          </div>

          {/* Device toggle centrado */}
          <div className="hidden shrink-0 lg:block">
            <DeviceToggle />
          </div>

          {/* Grupo derecho */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pr-3">
            <ThemeToggle className="editor-theme-toggle" />

            {/* Avatares colaboración */}
            <div className="hidden xl:flex items-center">
              <div className="flex items-center -space-x-1.5">
                {COLLAB_AVATARS.map((a) => (
                  <div
                    key={a.initials}
                    className="ov-collab-avatar relative flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: a.color + "cc" }}
                    title={a.initials}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <div className="ov-vsep ml-2 mr-1 h-4 w-px" />
            </div>

            <EditorOpsBar />
          </div>
        </header>

        <EditorShell />
      </div>
    </EditorProvider>
  );
}
