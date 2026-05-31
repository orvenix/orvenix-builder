import { EditorProvider } from "@/components/editor/store/EditorProvider";
import { EditorShell } from "@/components/editor/shell/EditorShell";
import { HistoryControls } from "@/components/editor/toolbar/HistoryControls";
import { DeviceToggle } from "@/components/editor/toolbar/DeviceToggle";
import { SaveStatus } from "@/components/editor/toolbar/SaveStatus";
import { PublishButton } from "@/components/editor/toolbar/PublishButton";
import { ResetDraftButton } from "@/components/editor/toolbar/ResetDraftButton";
import { PreviewModeButton } from "@/components/editor/toolbar/PreviewModeButton";
import { CheckoutActionButtons } from "@/components/editor/CheckoutActionButtons";
import { ConstructorSyncButton } from "@/components/editor/toolbar/ConstructorSyncButton";
import { OrvenixIcon } from "@/components/OrvenixLogo";
import {
  getConstructorPresetPreviewHref,
  getConstructorPresetTree,
  resolveConstructorPresetId,
} from "@/lib/constructorPresets";
import { WEB_EDITOR_TREES, isEditorWebId, WEB_LABELS } from "@/lib/editorWebs";
import Link from "next/link";
import type { EditorTree } from "@/types/editor";

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

  // Default: rich agency template
  return "agencia";
}

function getInitialTree(source: string): EditorTree {
  if (isEditorWebId(source)) {
    return WEB_EDITOR_TREES[source];
  }
  return getConstructorPresetTree(source) ?? WEB_EDITOR_TREES["agencia"];
}

function createDraftId(source: string) {
  return `draft:constructor:${encodeURIComponent(source)}`;
}

function toPreviewHref(source: string): string {
  if (isEditorWebId(source)) return `/webs/${source}`;
  return getConstructorPresetPreviewHref(source) ?? "/";
}

function getSourceMeta(source: string): { label: string; emoji: string } {
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
  }>;
}

export default async function ConstructorPage({ searchParams }: ConstructorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sourceFile  = normalizeSource(resolvedSearchParams?.source, resolvedSearchParams?.file);
  const websiteId   = createDraftId(sourceFile);
  const previewHref = toPreviewHref(sourceFile);
  const initialTree = getInitialTree(sourceFile);
  const { label: sourceLabel, emoji: sourceEmoji } = getSourceMeta(sourceFile);

  const presetItems = INDUSTRY_PRESETS.map((preset, index) => ({
    preset,
    showSep: index === 0 || preset.category !== INDUSTRY_PRESETS[index - 1]?.category,
  }));

  return (
    <EditorProvider websiteId={websiteId} initialTree={initialTree}>
      <div className="ov-shell flex flex-col h-screen overflow-hidden">

        {/* ── Top bar ── */}
        <header className="ov-topbar z-20 shrink-0">

          {/* Row 1: Logo + controls */}
          <div className="flex h-14 items-center gap-2 px-3 lg:px-4">

            {/* Left: brand + breadcrumb */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="ov-topbar-sep flex items-center gap-2 pr-3">
                <OrvenixIcon size={24} />
                <span className="hidden text-xs font-bold tracking-tight text-white/90 sm:block">
                  Orvenix
                </span>
              </div>

              {/* Badge + current site chip */}
              <div className="hidden min-w-0 items-center gap-2 md:flex">
                <span className="ov-badge-accent shrink-0">Constructor</span>
                <div className="ov-site-chip flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 leading-none">{sourceEmoji}</span>
                  <span className="truncate text-[11px] font-semibold text-white/75">{sourceLabel}</span>
                </div>
                <Link
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ov-link-ghost shrink-0"
                  title="Abrir sitio en nueva pestaña"
                >
                  Ver sitio ↗
                </Link>
              </div>

              <HistoryControls />
            </div>

            {/* Center: device toggle */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
              <DeviceToggle />
            </div>

            {/* Right: actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <SaveStatus />
              <ConstructorSyncButton />
              <PreviewModeButton />
              <ResetDraftButton initialTree={initialTree} />
              <div className="ov-btn-sep hidden pl-2 lg:block">
                <CheckoutActionButtons />
              </div>
              <PublishButton />
            </div>
          </div>

          {/* Row 2: Industry template switcher */}
          <div className="ov-topbar-row-sep flex items-center gap-0 overflow-x-auto px-3 py-1.5 scrollbar-none">
            <span className="ov-pages-label shrink-0 pr-2">Sitios</span>

            {presetItems.map(({ preset, showSep }) => {
              const isActive = preset.source === sourceFile;

              return (
                <span key={preset.source} className="flex items-center gap-0 shrink-0">
                  {showSep && (
                    <span className="mx-2 h-3.5 w-px bg-white/8 shrink-0" />
                  )}
                  <Link
                    href={`/constructor?source=${encodeURIComponent(preset.source)}`}
                    className={
                      isActive
                        ? "ov-source-pill-active ov-industry-pill"
                        : "ov-source-pill ov-industry-pill"
                    }
                  >
                    <span className="mr-1 text-[12px] leading-none">{preset.emoji}</span>
                    {preset.label}
                  </Link>
                </span>
              );
            })}

            {/* Legacy Orvenix pages section */}
            <span className="mx-2 h-3.5 w-px bg-white/8 shrink-0" />
            <span className="ov-pages-label shrink-0 px-1 text-white/20">Orvenix</span>
            {(["home", "platform", "pricing", "contact", "faq"] as const).map((src) => {
              const labels: Record<string, string> = {
                home: "Inicio", platform: "Plataforma",
                pricing: "Precios", contact: "Contacto", faq: "FAQ",
              };
              const isActive = src === sourceFile;
              return (
                <Link
                  key={src}
                  href={`/constructor?source=${src}`}
                  className={
                    isActive
                      ? "ov-source-pill-active shrink-0 ml-1"
                      : "ov-source-pill shrink-0 ml-1 opacity-50"
                  }
                >
                  {labels[src]}
                </Link>
              );
            })}
          </div>
        </header>

        <EditorShell />
      </div>
    </EditorProvider>
  );
}
