"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolvedSiteRuntimeContext = getResolvedSiteRuntimeContext;
exports.listResolvedSiteRuntimePages = listResolvedSiteRuntimePages;
const validateTree_1 = require("@/types/validateTree");
const sitePages_1 = require("@/lib/builder-core/tree/sitePages");
async function getResolvedSiteRuntimeContext(siteId, slug = sitePages_1.HOME_PAGE_SLUG) {
    var _a, _b;
    const [page, theme, pages] = await Promise.all([
        (0, sitePages_1.getResolvedSitePage)(siteId, slug),
        (0, sitePages_1.getResolvedSiteTheme)(siteId),
        (0, sitePages_1.listSitePages)(siteId),
    ]);
    if (!page) {
        return null;
    }
    const tree = (0, validateTree_1.validateTree)(page.tree);
    const activePage = pages.find((entry) => entry.slug === page.slug);
    return {
        siteId,
        page,
        theme,
        pages,
        tree: Object.assign(Object.assign({}, tree), { theme: theme.tokens, globalTheme: theme.tokens }),
        activePageSlug: page.slug,
        activePageName: (_b = (_a = activePage === null || activePage === void 0 ? void 0 : activePage.name) !== null && _a !== void 0 ? _a : page.name) !== null && _b !== void 0 ? _b : (page.slug === sitePages_1.HOME_PAGE_SLUG ? sitePages_1.HOME_PAGE_NAME : page.slug),
    };
}
async function listResolvedSiteRuntimePages(siteId) {
    const pages = await (0, sitePages_1.listSitePages)(siteId);
    if (pages.length === 0) {
        return [];
    }
    const resolvedPages = await Promise.all(pages.map(async (entry) => {
        const context = await getResolvedSiteRuntimeContext(siteId, entry.slug);
        if (!context) {
            return null;
        }
        return Object.assign(Object.assign({}, context), { isHome: entry.isHome || entry.slug === sitePages_1.HOME_PAGE_SLUG });
    }));
    return resolvedPages.filter((entry) => entry !== null);
}
