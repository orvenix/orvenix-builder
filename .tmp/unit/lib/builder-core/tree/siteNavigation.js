"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHiddenSlugs = parseHiddenSlugs;
exports.resolveSiteNavPages = resolveSiteNavPages;
function parseHiddenSlugs(value) {
    return new Set(String(value !== null && value !== void 0 ? value : "")
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean));
}
function resolveSiteNavPages(pages, options) {
    const hiddenSlugs = parseHiddenSlugs(options === null || options === void 0 ? void 0 : options.hiddenSlugs);
    const showHome = (options === null || options === void 0 ? void 0 : options.showHome) !== false;
    return pages.filter((page) => {
        if (!showHome && page.slug === "home") {
            return false;
        }
        return !hiddenSlugs.has(page.slug.toLowerCase());
    });
}
