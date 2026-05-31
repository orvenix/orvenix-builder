"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL_PAGE_LINK_PREFIX = void 0;
exports.isInternalPageLink = isInternalPageLink;
exports.parseInternalPageLink = parseInternalPageLink;
exports.buildPublishedPageHref = buildPublishedPageHref;
exports.buildPreviewPageHref = buildPreviewPageHref;
exports.buildExportPageHref = buildExportPageHref;
exports.resolveRuntimeHref = resolveRuntimeHref;
exports.INTERNAL_PAGE_LINK_PREFIX = "page:";
function isInternalPageLink(value) {
    return typeof value === "string" && value.startsWith(exports.INTERNAL_PAGE_LINK_PREFIX);
}
function parseInternalPageLink(value) {
    if (!isInternalPageLink(value)) {
        return null;
    }
    const slug = value.slice(exports.INTERNAL_PAGE_LINK_PREFIX.length).trim();
    return slug || "home";
}
function buildPublishedPageHref(siteId, slug) {
    return slug === "home" ? `/p/${siteId}` : `/p/${siteId}/${slug}`;
}
function buildPreviewPageHref(siteId, slug) {
    return slug === "home" ? `/preview/${siteId}` : `/preview/${siteId}?page=${encodeURIComponent(slug)}`;
}
function buildExportPageHref(slug) {
    return slug === "home" ? "/index.html" : `/${slug}/index.html`;
}
function resolveRuntimeHref(siteId, href, mode = "published") {
    if (typeof href !== "string" || !href.trim()) {
        return "#";
    }
    const internalSlug = parseInternalPageLink(href);
    if (!internalSlug) {
        return href.trim();
    }
    if (mode === "export") {
        return buildExportPageHref(internalSlug);
    }
    if (!siteId) {
        return "#";
    }
    return mode === "preview"
        ? buildPreviewPageHref(siteId, internalSlug)
        : buildPublishedPageHref(siteId, internalSlug);
}
