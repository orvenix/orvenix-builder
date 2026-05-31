"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOME_PAGE_NAME = exports.HOME_PAGE_SLUG = void 0;
exports.listSitePages = listSitePages;
exports.getResolvedSitePage = getResolvedSitePage;
exports.ensureHomePage = ensureHomePage;
exports.getResolvedSiteTheme = getResolvedSiteTheme;
exports.saveResolvedSiteTheme = saveResolvedSiteTheme;
exports.createSitePage = createSitePage;
exports.updateSitePageMetadata = updateSitePageMetadata;
exports.saveResolvedPageTree = saveResolvedPageTree;
const editor_db_1 = require("@/lib/editor-db");
const validateTree_1 = require("@/types/validateTree");
const editorWebs_1 = require("@/lib/editorWebs");
exports.HOME_PAGE_SLUG = "home";
exports.HOME_PAGE_NAME = "Inicio";
const DEFAULT_RUNTIME_THEME = {
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
function getSitePageDelegate() {
    var _a;
    return (_a = editor_db_1.editorPrisma.sitePage) !== null && _a !== void 0 ? _a : null;
}
function getSiteThemeDelegate() {
    var _a;
    return (_a = editor_db_1.editorPrisma.siteTheme) !== null && _a !== void 0 ? _a : null;
}
function toJsonValue(value) {
    return JSON.parse(JSON.stringify(value));
}
function slugifyPageSegment(value) {
    const normalized = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized || exports.HOME_PAGE_SLUG;
}
function displayNameFromSlug(slug) {
    if (slug === exports.HOME_PAGE_SLUG)
        return exports.HOME_PAGE_NAME;
    return slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function normalizeTheme(theme) {
    var _a, _b, _c, _d, _e;
    if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
        return DEFAULT_RUNTIME_THEME;
    }
    const candidate = theme;
    return Object.assign(Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME), candidate), { colors: Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME.colors), ((_a = candidate.colors) !== null && _a !== void 0 ? _a : {})), spacing: Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME.spacing), ((_b = candidate.spacing) !== null && _b !== void 0 ? _b : {})), radius: Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME.radius), ((_c = candidate.radius) !== null && _c !== void 0 ? _c : {})), shadow: Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME.shadow), ((_d = candidate.shadow) !== null && _d !== void 0 ? _d : {})), motion: Object.assign(Object.assign({}, DEFAULT_RUNTIME_THEME.motion), ((_e = candidate.motion) !== null && _e !== void 0 ? _e : {})) });
}
function extractThemeFromTree(tree) {
    var _a, _b;
    try {
        const parsed = (0, validateTree_1.validateTree)(tree);
        return normalizeTheme((_b = (_a = parsed.theme) !== null && _a !== void 0 ? _a : parsed.globalTheme) !== null && _b !== void 0 ? _b : null);
    }
    catch (_c) {
        return null;
    }
}
async function listSitePages(siteId) {
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
    const legacySite = await editor_db_1.editorPrisma.editorWebsite.findUnique({
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
            name: exports.HOME_PAGE_NAME,
            slug: exports.HOME_PAGE_SLUG,
            isHome: true,
            published: legacySite.published,
            source: "legacy-site-tree",
        },
    ];
}
async function getResolvedSitePage(siteId, slug = exports.HOME_PAGE_SLUG) {
    const sitePages = getSitePageDelegate();
    if (sitePages) {
        const page = await sitePages.findFirst({
            where: slug === exports.HOME_PAGE_SLUG ? { siteId, isHome: true } : { siteId, slug },
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
    if (slug !== exports.HOME_PAGE_SLUG) {
        return null;
    }
    const legacySite = await editor_db_1.editorPrisma.editorWebsite.findUnique({
        where: { id: siteId },
        select: { id: true, tree: true, published: true },
    });
    if (!legacySite) {
        return null;
    }
    return {
        id: null,
        siteId,
        name: exports.HOME_PAGE_NAME,
        slug: exports.HOME_PAGE_SLUG,
        tree: legacySite.tree,
        isHome: true,
        published: legacySite.published,
        source: "legacy-site-tree",
    };
}
async function ensureHomePage(siteId) {
    const existing = await getResolvedSitePage(siteId, exports.HOME_PAGE_SLUG);
    if ((existing === null || existing === void 0 ? void 0 : existing.source) === "site-page") {
        return existing;
    }
    const sitePages = getSitePageDelegate();
    if (!sitePages) {
        return existing;
    }
    const legacySite = await editor_db_1.editorPrisma.editorWebsite.findUnique({
        where: { id: siteId },
        select: { id: true, tree: true, published: true },
    });
    if (!legacySite) {
        return null;
    }
    const created = await sitePages.create({
        data: {
            siteId,
            name: exports.HOME_PAGE_NAME,
            slug: exports.HOME_PAGE_SLUG,
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
async function getResolvedSiteTheme(siteId) {
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
async function saveResolvedSiteTheme(siteId, theme) {
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
async function createSitePage(siteId, input) {
    var _a, _b;
    const sitePages = getSitePageDelegate();
    if (!sitePages) {
        throw new Error("El almacenamiento actual no soporta paginas multiples.");
    }
    const site = await editor_db_1.editorPrisma.editorWebsite.findUnique({
        where: { id: siteId },
        select: { id: true },
    });
    if (!site) {
        throw new Error(`Sitio "${siteId}" no encontrado.`);
    }
    const baseSlug = slugifyPageSegment((_a = input.slug) !== null && _a !== void 0 ? _a : input.name);
    const existingPages = await listSitePages(siteId);
    const usedSlugs = new Set(existingPages.map((page) => page.slug));
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
    const name = input.name.trim() || displayNameFromSlug(slug);
    const initialTree = (_b = input.tree) !== null && _b !== void 0 ? _b : (0, editorWebs_1.getDefaultStarterEditorTree)();
    const created = await sitePages.create({
        data: {
            siteId,
            name,
            slug,
            tree: toJsonValue(initialTree),
            isHome: slug === exports.HOME_PAGE_SLUG,
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
async function updateSitePageMetadata(siteId, pageId, input) {
    var _a, _b, _c;
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
        },
    });
    const page = (_a = pages.find((candidate) => candidate.id === pageId)) !== null && _a !== void 0 ? _a : null;
    if (!page) {
        throw new Error("Pagina no encontrada.");
    }
    const nextName = ((_b = input.name) === null || _b === void 0 ? void 0 : _b.trim()) || page.name;
    const requestedSlug = (_c = input.slug) === null || _c === void 0 ? void 0 : _c.trim();
    const nextSlugBase = requestedSlug ? slugifyPageSegment(requestedSlug) : page.slug;
    if (page.isHome && requestedSlug && nextSlugBase !== exports.HOME_PAGE_SLUG) {
        throw new Error("La pagina de inicio debe conservar el slug 'home'.");
    }
    if (!page.isHome && nextSlugBase === exports.HOME_PAGE_SLUG) {
        throw new Error("El slug 'home' esta reservado para la pagina de inicio.");
    }
    const existingPages = await listSitePages(siteId);
    const usedSlugs = new Set(existingPages
        .filter((candidate) => candidate.id !== pageId)
        .map((candidate) => candidate.slug));
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
            isHome: nextSlug === exports.HOME_PAGE_SLUG,
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
async function saveResolvedPageTree(siteId, slug, tree, options) {
    var _a, _b;
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
        if (!(ensuredHome === null || ensuredHome === void 0 ? void 0 : ensuredHome.id)) {
            return;
        }
        page = ensuredHome;
    }
    await sitePages.update({
        where: { id: page.id },
        data: {
            tree: toJsonValue(tree),
            published: (_a = options === null || options === void 0 ? void 0 : options.published) !== null && _a !== void 0 ? _a : page.published,
            seo: toJsonValue((_b = tree.seo) !== null && _b !== void 0 ? _b : null),
        },
    });
}
