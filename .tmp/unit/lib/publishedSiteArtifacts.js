"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedSitePublicPath = getPublishedSitePublicPath;
exports.canPublishAsStaticHtml = canPublishAsStaticHtml;
exports.writePublishedSiteArtifact = writePublishedSiteArtifact;
exports.writePublishedSiteArtifacts = writePublishedSiteArtifacts;
exports.removePublishedSiteArtifact = removePublishedSiteArtifact;
exports.hasPublishedSiteArtifact = hasPublishedSiteArtifact;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const serializeToHtml_1 = require("./export/serializeToHtml");
const publishedSitesRoot = node_path_1.default.join(process.cwd(), "public", "published-sites");
const STATIC_SAFE_BLOCKS = new Set([
    "section",
    "heading",
    "text",
    "ctaButton",
    "siteNav",
    "image",
    "genericWrapper",
]);
function getPublishedSiteDir(siteId) {
    return node_path_1.default.join(publishedSitesRoot, siteId);
}
function getPublishedSitePageDir(siteId, slug = "home") {
    return slug === "home" ? getPublishedSiteDir(siteId) : node_path_1.default.join(getPublishedSiteDir(siteId), slug);
}
function getPublishedSiteIndexPath(siteId, slug = "home") {
    return node_path_1.default.join(getPublishedSitePageDir(siteId, slug), "index.html");
}
function getPublishedSiteStylesPath(siteId) {
    return node_path_1.default.join(getPublishedSiteDir(siteId), "styles.css");
}
function getPublishedSitePublicPath(siteId, slug = "home") {
    const basePath = `/published-sites/${encodeURIComponent(siteId)}`;
    return slug === "home" ? `${basePath}/` : `${basePath}/${encodeURIComponent(slug)}/`;
}
function canPublishAsStaticHtml(tree) {
    return Object.values(tree.nodes).every((node) => STATIC_SAFE_BLOCKS.has(node.type));
}
async function writePublishedSiteArtifact(siteId, tree) {
    return writePublishedSiteArtifacts(siteId, [
        {
            slug: "home",
            name: "Inicio",
            tree,
            isHome: true,
        },
    ]);
}
async function writePublishedSiteArtifacts(siteId, pages, pageList = pages.map((page) => {
    var _a;
    return ({
        id: null,
        siteId,
        name: page.name,
        slug: page.slug,
        isHome: (_a = page.isHome) !== null && _a !== void 0 ? _a : page.slug === "home",
        published: true,
        source: "site-page",
    });
})) {
    if (pages.length === 0) {
        throw new Error("No hay paginas para publicar");
    }
    const outputDir = getPublishedSiteDir(siteId);
    const sharedStyles = (0, serializeToHtml_1.serializeTreeToHtml)(pages[0].tree, pages[0].name, {
        siteId,
        stylesHref: "styles.css",
        currentPageSlug: pages[0].slug,
        pages: pageList,
    }).css;
    await node_fs_1.promises.rm(outputDir, { recursive: true, force: true });
    await node_fs_1.promises.mkdir(outputDir, { recursive: true });
    await node_fs_1.promises.writeFile(getPublishedSiteStylesPath(siteId), sharedStyles, "utf8");
    await Promise.all(pages.map(async (page) => {
        const pageSlug = page.isHome ? "home" : page.slug;
        const outputFile = getPublishedSiteIndexPath(siteId, pageSlug);
        const stylesHref = page.isHome ? "styles.css" : "../styles.css";
        const { html } = (0, serializeToHtml_1.serializeTreeToHtml)(page.tree, page.name, {
            siteId,
            stylesHref,
            currentPageSlug: pageSlug,
            pages: pageList,
        });
        await node_fs_1.promises.mkdir(node_path_1.default.dirname(outputFile), { recursive: true });
        await node_fs_1.promises.writeFile(outputFile, html, "utf8");
    }));
    return getPublishedSiteIndexPath(siteId);
}
async function removePublishedSiteArtifact(siteId) {
    const outputDir = getPublishedSiteDir(siteId);
    await node_fs_1.promises.rm(outputDir, { recursive: true, force: true });
}
async function hasPublishedSiteArtifact(siteId, slug = "home") {
    try {
        await node_fs_1.promises.access(getPublishedSiteIndexPath(siteId, slug));
        return true;
    }
    catch (_a) {
        return false;
    }
}
