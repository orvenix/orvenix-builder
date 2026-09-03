import { EditorProvider } from "@/components/editor/store/EditorProvider";
import {
  getConstructorPresetTree,
  resolveConstructorPresetId,
} from "@/lib/constructorPresets";
import { getDefaultStarterEditorTree, getEditorTreeForWeb, isEditorWebId, WEB_LABELS } from "@/lib/editorWebs";
import type { EditorTree } from "@/types/editor";
import { EditorExperienceShell } from "@/components/editor/experience"
import { getAuthSession } from "@/lib/auth-session";
import { getUserPlanAccess } from "@/lib/plan-guard";
import { isAdvancedBuilderPlan } from "@/lib/pro-plan";
import { buildProfessionalStarterPages, getProfessionalStarterPageList } from "@/lib/professional-site-starter";

// ── Plantillas de industria con bloques ricos ────────────────────────────────

type IndustryPreset = {
  label: string;
  source: string;
  emoji: string;
  category: "saas" | "marketing" | "services" | "professional" | "commerce";
};

const INDUSTRY_PRESETS: IndustryPreset[] = [
  // SaaS / Tech
  { label: "Landing SaaS", source: "landing",        emoji: "🚀", category: "saas" },
  { label: "AI Dashboard",  source: "ai-dashboard",   emoji: "🤖", category: "saas" },
  { label: "CRM Enterprise",source: "crm",            emoji: "📊", category: "saas" },
  { label: "E-Commerce",    source: "ecommerce",      emoji: "🛒", category: "saas" },
  { label: "Finance",       source: "finance",        emoji: "💰", category: "saas" },
  { label: "HR Suite",      source: "hr",             emoji: "👥", category: "saas" },
  { label: "DevOps",        source: "devops",         emoji: "⚙️", category: "saas" },
  // Marketing
  { label: "Agencia Digital",source: "agencia",       emoji: "🎯", category: "marketing" },
  { label: "Enterprise",    source: "modular-enterprise", emoji: "🏢", category: "marketing" },
  // Services
  { label: "Restaurante",   source: "restaurante",    emoji: "🍽️", category: "services" },
  { label: "Hotel",         source: "hotel",          emoji: "🏨", category: "services" },
  { label: "Clínica",       source: "clinica",        emoji: "🏥", category: "services" },
  { label: "Gimnasio",      source: "gimnasio",       emoji: "💪", category: "services" },
  { label: "Barbería",      source: "barberia",       emoji: "✂️", category: "services" },
  { label: "Transporte",    source: "transporte",     emoji: "🚐", category: "services" },
  // Professional
  { label: "Abogados",      source: "abogados",       emoji: "⚖️", category: "professional" },
  { label: "Contabilidad",  source: "contabilidad",   emoji: "📑", category: "professional" },
  { label: "Notaría",       source: "notaria",        emoji: "🔏", category: "professional" },
  { label: "RRHH",          source: "rrhh",           emoji: "🤝", category: "professional" },
  { label: "Arquitectura",  source: "arquitectura",   emoji: "🏛️", category: "professional" },
  // Commerce / Education
  { label: "Tienda Online", source: "tienda",         emoji: "🏪", category: "commerce" },
  { label: "Inmobiliaria",  source: "inmobiliaria",   emoji: "🏠", category: "commerce" },
  { label: "Academia",      source: "academia",       emoji: "🎓", category: "commerce" },
  { label: "Viajes",        source: "viajes",         emoji: "✈️", category: "commerce" },
];

// ── Resolvers ────────────────────────────────────────────────────────────────

function normalizeSource(
  source?: string | string[],
  file?: string | string[],
): string {
  const sourceValue = Array.isArray(source) ? source[0] : source;
  const normalizedSource = sourceValue?.trim() ?? "";

  if (normalizedSource === "blank") return "blank";

  // Check rich industry templates first
  if (normalizedSource && isEditorWebId(normalizedSource)) {
    return normalizedSource;
  }

  // Check constructor presets (marketing pages of Orvenix)
  const presetFromSource = normalizedSource
    ? resolveConstructorPresetId(normalizedSource)
    : null;
  if (presetFromSource) return presetFromSource;

  // Legacy file param support
  const fileValue = Array.isArray(file) ? file[0] : file;
  const normalizedFile = (fileValue ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(\.\.\/)+/, "");

  if (normalizedFile && isEditorWebId(normalizedFile)) return normalizedFile;
  const presetFromFile = normalizedFile
    ? resolveConstructorPresetId(normalizedFile)
    : null;
  if (presetFromFile) return presetFromFile;

  // Default: blank canvas for a calmer first editing experience
  return "blank";
}

function getInitialTree(source: string): EditorTree {
  if (source === "blank") return getDefaultStarterEditorTree();
  if (isEditorWebId(source)) {
    return getEditorTreeForWeb(source);
  }
  return getConstructorPresetTree(source) ?? getEditorTreeForWeb("agencia");
}

function createDraftId(source: string) {
  if (source === "blank") return "draft:constructor:orvenix-reference-v12-pure-blue-buttons";
  return "draft:constructor:" + encodeURIComponent(source);
}

function getSourceMeta(source: string): { label: string; emoji: string } {
  if (source === "blank") return { label: "Landing editable", emoji: "✦" };
  const preset = INDUSTRY_PRESETS.find((p) => p.source === source);
  if (preset) return { label: preset.label, emoji: preset.emoji };
  if (source in WEB_LABELS)
    return { label: WEB_LABELS[source as keyof typeof WEB_LABELS], emoji: "🌐" };
  return { label: source, emoji: "🌐" };
}

// ── Page component ────────────────────────────────────────────────────────────

interface ConstructorPageProps {
  searchParams?: Promise<{
    source?: string | string[];
    file?: string | string[];
    page?: string | string[];
  }>;
}

export default async function ConstructorPage({ searchParams }: ConstructorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sourceFile  = normalizeSource(resolvedSearchParams?.source, resolvedSearchParams?.file);
  const baseWebsiteId = createDraftId(sourceFile);
  const initialTree = getInitialTree(sourceFile);
  const sourceMeta = getSourceMeta(sourceFile);
  const session = await getAuthSession();
  const planAccess = session?.user?.id
    ? await getUserPlanAccess(session.user.id)
    : null;
  const isAdvancedExperience = isAdvancedBuilderPlan(planAccess?.plan?.id);
  const websiteId = isAdvancedExperience && sourceFile === "blank"
    ? "draft:constructor:starter-site-pro-v18-real-header"
    : baseWebsiteId;
  const proStarterPages = isAdvancedExperience && sourceFile === "blank"
    ? buildProfessionalStarterPages(initialTree)
    : [];
  const requestedPageValue = Array.isArray(resolvedSearchParams?.page)
    ? resolvedSearchParams?.page[0]
    : resolvedSearchParams?.page;
  const requestedPageSlug = requestedPageValue?.trim() || "home";
  const selectedProPage = proStarterPages.find((page) => page.slug === requestedPageSlug) ?? proStarterPages[0];
  const effectiveInitialTree = isAdvancedExperience && sourceFile === "blank"
    ? selectedProPage?.tree ?? initialTree
    : initialTree;
  const availablePages = isAdvancedExperience
    ? getProfessionalStarterPageList(websiteId)
    : undefined;
  const activePageSlug = isAdvancedExperience && sourceFile === "blank"
    ? selectedProPage?.slug ?? "home"
    : "home";
  const activePageName = isAdvancedExperience && sourceFile === "blank"
    ? selectedProPage?.name ?? "Inicio"
    : "Inicio";

  return (
    <EditorProvider
  websiteId={websiteId}
  initialTree={effectiveInitialTree}
  initialUserRole="client"
  initialBuilderTier={isAdvancedExperience ? "pro" : "basic"}
  initialPageSlug={activePageSlug}
  initialPageName={activePageName}
  availablePages={availablePages}
>
      <div className="ov-shell flex h-screen flex-col overflow-hidden" data-source-label={sourceMeta.label} data-source-emoji={sourceMeta.emoji} data-builder-tier={isAdvancedExperience ? "advanced" : "simple"}>
  <EditorExperienceShell />
</div>
    </EditorProvider>
  );
}
