import { editorPrisma } from "@/lib/editor-db";
import type { EditorTree, GlobalTheme } from "@/types/editor";
import { validateTree } from "@/types/validateTree";
import { getDefaultStarterEditorTree } from "@/lib/editorWebs";

export const HOME_PAGE_SLUG = "home";
export const HOME_PAGE_NAME = "Inicio";

const DEFAULT_RUNTIME_THEME: GlobalTheme = {
  colors: {
    primary: "#6366f1",
    secondary: "#0f172a",
    background: "#0f172a",
    text: "#ffffff",
    accent: "#6366f1",
  },
  fontHeading: "Inter",
  fontBody: "Inter",
  spacing: {
    sectionX: "1.5rem",
    sectionY: "3rem",
    stack: "1.5rem",
  },
  radius: {
    card: "1rem",
    button: "999px",
  },
  shadow: {
    soft: "0 12px 32px rgba(15,23,42,0.08)",
    strong: "0 24px 60px rgba(15,23,42,0.18)",
  },
  motion: {
    duration: "240ms",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};

type DynamicSitePageRecord = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  tree: unknown;
  seo?: unknown;
  isHome: boolean;
  published: boolean;
};

type DynamicSiteThemeRecord = {
  id: string;
  siteId: string;
  tokens: unknown;
};

type DynamicSitePageDelegate = {
  findMany: (args: {
    where: { siteId: string };
    orderBy: Array<{ isHome: "asc" | "desc" } | { createdAt: "asc" | "desc" }>;
    select: Record<string, boolean>;
  }) => Promise<DynamicSitePageRecord[]>;
  findFirst: (args: {
    where: { siteId: string; slug?: string; isHome?: boolean };
    orderBy?: { createdAt: "asc" | "desc" };
    select: Record<string, boolean>;
  }) => Promise<DynamicSitePageRecord | null>;
  create: (args: {
    data: {
      siteId: string;
      name: string;
      slug: string;
      tree: unknown;
      isHome: boolean;
      published: boolean;
    };
  }) => Promise<DynamicSitePageRecord>;
  update: (args: {
    where: { id: string };
    data: {
      tree?: unknown;
      name?: string;
      slug?: string;
      isHome?: boolean;
      published?: boolean;
      seo?: unknown;
    };
  }) => Promise<DynamicSitePageRecord>;
};

type DynamicSiteThemeDelegate = {
  findUnique: (args: {
    where: { siteId: string };
    select: Record<string, boolean>;
  }) => Promise<DynamicSiteThemeRecord | null>;
  upsert: (args: {
    where: { siteId: string };
    update: { tokens: unknown };
    create: { siteId: string; tokens: unknown };
  }) => Promise<DynamicSiteThemeRecord>;
};

export interface SitePageListItem {
  id: string | null;
  siteId: string;
  name: string;
  slug: string;
  isHome: boolean;
  published: boolean;
  source: "site-page" | "legacy-site-tree";
}

export interface ResolvedSitePage extends SitePageListItem {
  tree: unknown;
  seo?: unknown;
}

export interface ResolvedSiteTheme {
  siteId: string;
  tokens: GlobalTheme;
  source: "site-theme" | "site-page-tree" | "legacy-site-tree" | "runtime-defaults";
}

export interface CreateSitePageInput {
  name: string;
  slug?: string;
  tree?: EditorTree;
}

export interface UpdateSitePageInput {
  name?: string;
  slug?: string;
}

function getSitePageDelegate(): DynamicSitePageDelegate | null {
  return (editorPrisma as unknown as { sitePage?: DynamicSitePageDelegate }).sitePage ?? null;
}

function getSiteThemeDelegate(): DynamicSiteThemeDelegate | null {
  return (editorPrisma as unknown as { siteTheme?: DynamicSiteThemeDelegate }).siteTheme ?? null;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function slugifyPageSegment(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || HOME_PAGE_SLUG;
}

function displayNameFromSlug(slug: string) {
  if (slug === HOME_PAGE_SLUG) return HOME_PAGE_NAME;
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTheme(theme: unknown): GlobalTheme {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    return DEFAULT_RUNTIME_THEME;
  }

  const candidate = theme as Partial<GlobalTheme>;
  return {
    ...DEFAULT_RUNTIME_THEME,
    ...candidate,
    colors: {
      ...DEFAULT_RUNTIME_THEME.colors,
      ...(candidate.colors ?? {}),
    },
    spacing: {
      ...DEFAULT_RUNTIME_THEME.spacing,
      ...(candidate.spacing ?? {}),
    },
    radius: {
      ...DEFAULT_RUNTIME_THEME.radius,
      ...(candidate.radius ?? {}),
    },
    shadow: {
      ...DEFAULT_RUNTIME_THEME.shadow,
      ...(candidate.shadow ?? {}),
    },
    motion: {
      ...DEFAULT_RUNTIME_THEME.motion,
      ...(candidate.motion ?? {}),
    },
  };
}

function extractThemeFromTree(tree: unknown): GlobalTheme | null {
  try {
    const parsed = validateTree(tree);
    return normalizeTheme(parsed.theme ?? parsed.globalTheme ?? null);
  } catch {
    return null;
  }
}

export async function listSitePages(siteId: string): Promise<SitePageListItem[]> {
  const sitePages = getSitePageDelegate();
  if (sitePages) {
    const pages = await sitePages.findMany({
      where: { siteId },
      orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        siteId: true,
        name: true,
        slug: true,
        isHome: true,
        published: true,
      },
    });

    if (pages.length > 0) {
      return pages.map((page) => ({
        id: page.id,
        siteId: page.siteId,
        name: page.name,
        slug: page.slug,
        isHome: page.isHome,
        published: page.published,
        source: "site-page",
      }));
    }
  }

  const legacySite = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, published: true },
  });

  if (!legacySite) {
    return [];
  }

  return [
    {
      id: null,
      siteId,
      name: HOME_PAGE_NAME,
      slug: HOME_PAGE_SLUG,
      isHome: true,
      published: legacySite.published,
      source: "legacy-site-tree",
    },
  ];
}

export async function getResolvedSitePage(
  siteId: string,
  slug = HOME_PAGE_SLUG
): Promise<ResolvedSitePage | null> {
  const sitePages = getSitePageDelegate();

  if (sitePages) {
    const page = await sitePages.findFirst({
      where: slug === HOME_PAGE_SLUG ? { siteId, isHome: true } : { siteId, slug },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteId: true,
        name: true,
        slug: true,
        tree: true,
        seo: true,
        isHome: true,
        published: true,
      },
    });

    if (page) {
      return {
        id: page.id,
        siteId: page.siteId,
        name: page.name,
        slug: page.slug,
        tree: page.tree,
        seo: page.seo,
        isHome: page.isHome,
        published: page.published,
        source: "site-page",
      };
    }
  }

  if (slug !== HOME_PAGE_SLUG) {
    return null;
  }

  const legacySite = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, tree: true, published: true },
  });

  if (!legacySite) {
    return null;
  }

  return {
    id: null,
    siteId,
    name: HOME_PAGE_NAME,
    slug: HOME_PAGE_SLUG,
    tree: legacySite.tree,
    isHome: true,
    published: legacySite.published,
    source: "legacy-site-tree",
  };
}

export async function ensureHomePage(siteId: string): Promise<ResolvedSitePage | null> {
  const existing = await getResolvedSitePage(siteId, HOME_PAGE_SLUG);
  if (existing?.source === "site-page") {
    return existing;
  }

  const sitePages = getSitePageDelegate();
  if (!sitePages) {
    return existing;
  }

  const legacySite = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, tree: true, published: true },
  });

  if (!legacySite) {
    return null;
  }

  const created = await sitePages.create({
    data: {
      siteId,
      name: HOME_PAGE_NAME,
      slug: HOME_PAGE_SLUG,
      tree: toJsonValue(legacySite.tree),
      isHome: true,
      published: legacySite.published,
    },
  });

  return {
    id: created.id,
    siteId: created.siteId,
    name: created.name,
    slug: created.slug,
    tree: created.tree,
    seo: created.seo,
    isHome: created.isHome,
    published: created.published,
    source: "site-page",
  };
}

export async function getResolvedSiteTheme(siteId: string): Promise<ResolvedSiteTheme> {
  const siteTheme = getSiteThemeDelegate();

  if (siteTheme) {
    const theme = await siteTheme.findUnique({
      where: { siteId },
      select: { siteId: true, tokens: true },
    });

    if (theme) {
      return {
        siteId,
        tokens: normalizeTheme(theme.tokens),
        source: "site-theme",
      };
    }
  }

  const resolvedPage = await getResolvedSitePage(siteId);
  if (resolvedPage) {
    const extractedTheme = extractThemeFromTree(resolvedPage.tree);
    if (extractedTheme) {
      return {
        siteId,
        tokens: extractedTheme,
        source: resolvedPage.source === "site-page" ? "site-page-tree" : "legacy-site-tree",
      };
    }
  }

  return {
    siteId,
    tokens: DEFAULT_RUNTIME_THEME,
    source: "runtime-defaults",
  };
}

export async function saveResolvedSiteTheme(siteId: string, theme: GlobalTheme | null | undefined): Promise<void> {
  if (!theme) {
    return;
  }

  const siteTheme = getSiteThemeDelegate();
  if (!siteTheme) {
    return;
  }

  await siteTheme.upsert({
    where: { siteId },
    update: {
      tokens: toJsonValue(theme),
    },
    create: {
      siteId,
      tokens: toJsonValue(theme),
    },
  });
}

export async function createSitePage(siteId: string, input: CreateSitePageInput): Promise<ResolvedSitePage> {
  const sitePages = getSitePageDelegate();
  if (!sitePages) {
    throw new Error("El almacenamiento actual no soporta paginas multiples.");
  }

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true },
  });

  if (!site) {
    throw new Error(`Sitio "${siteId}" no encontrado.`);
  }

  const baseSlug = slugifyPageSegment(input.slug ?? input.name);
  const existingPages = await listSitePages(siteId);
  const usedSlugs = new Set(existingPages.map((page) => page.slug));

  let slug = baseSlug;
  let counter = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const name = input.name.trim() || displayNameFromSlug(slug);
  const initialTree = input.tree ?? getDefaultStarterEditorTree();

  const created = await sitePages.create({
    data: {
      siteId,
      name,
      slug,
      tree: toJsonValue(initialTree),
      isHome: slug === HOME_PAGE_SLUG,
      published: false,
    },
  });

  return {
    id: created.id,
    siteId: created.siteId,
    name: created.name,
    slug: created.slug,
    tree: created.tree,
    seo: created.seo,
    isHome: created.isHome,
    published: created.published,
    source: "site-page",
  };
}

export async function updateSitePageMetadata(
  siteId: string,
  pageId: string,
  input: UpdateSitePageInput
): Promise<ResolvedSitePage> {
  const sitePages = getSitePageDelegate();
  if (!sitePages) {
    throw new Error("El almacenamiento actual no soporta paginas multiples.");
  }

  const pages = await sitePages.findMany({
    where: { siteId },
    orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      siteId: true,
      name: true,
      slug: true,
      tree: true,
      seo: true,
      isHome: true,
      published: true,
    } as Record<string, boolean>,
  });

  const page = pages.find((candidate) => candidate.id === pageId) ?? null;

  if (!page) {
    throw new Error("Pagina no encontrada.");
  }

  const nextName = input.name?.trim() || page.name;
  const requestedSlug = input.slug?.trim();
  const nextSlugBase = requestedSlug ? slugifyPageSegment(requestedSlug) : page.slug;

  if (page.isHome && requestedSlug && nextSlugBase !== HOME_PAGE_SLUG) {
    throw new Error("La pagina de inicio debe conservar el slug 'home'.");
  }

  if (!page.isHome && nextSlugBase === HOME_PAGE_SLUG) {
    throw new Error("El slug 'home' esta reservado para la pagina de inicio.");
  }

  const existingPages = await listSitePages(siteId);
  const usedSlugs = new Set(
    existingPages
      .filter((candidate) => candidate.id !== pageId)
      .map((candidate) => candidate.slug)
  );

  let nextSlug = nextSlugBase;
  let counter = 2;
  while (usedSlugs.has(nextSlug)) {
    nextSlug = `${nextSlugBase}-${counter}`;
    counter += 1;
  }

  const updated = await sitePages.update({
    where: { id: pageId },
    data: {
      name: nextName,
      slug: nextSlug,
      isHome: nextSlug === HOME_PAGE_SLUG,
    },
  });

  return {
    id: updated.id,
    siteId: updated.siteId,
    name: updated.name,
    slug: updated.slug,
    tree: updated.tree,
    seo: updated.seo,
    isHome: updated.isHome,
    published: updated.published,
    source: "site-page",
  };
}

export async function saveResolvedPageTree(
  siteId: string,
  slug: string,
  tree: EditorTree,
  options?: { published?: boolean }
): Promise<void> {
  const sitePages = getSitePageDelegate();
  if (!sitePages) {
    return;
  }

  const targetSlug = slugifyPageSegment(slug);
  let page = await getResolvedSitePage(siteId, targetSlug);

  if (!page) {
    page = await createSitePage(siteId, {
      name: displayNameFromSlug(targetSlug),
      slug: targetSlug,
      tree,
    });
  }

  if (!page.id) {
    const ensuredHome = await ensureHomePage(siteId);
    if (!ensuredHome?.id) {
      return;
    }
    page = ensuredHome;
  }

  await sitePages.update({
    where: { id: page.id },
    data: {
      tree: toJsonValue(tree),
      published: options?.published ?? page.published,
      seo: toJsonValue(tree.seo ?? null),
    },
  });
}
