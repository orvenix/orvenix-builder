"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const publishedSiteArtifacts_1 = require("../../lib/publishedSiteArtifacts");
function createTree(title) {
    return {
        rootId: "root",
        nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["title", "nav"],
                version: 1,
            },
            title: {
                id: "title",
                type: "heading",
                props: {
                    level: 1,
                    text: title,
                },
                children: [],
                version: 1,
                parentId: "root",
            },
            nav: {
                id: "nav",
                type: "siteNav",
                props: {
                    title: "Principal",
                },
                children: [],
                version: 1,
                parentId: "root",
            },
        },
        theme: {
            colors: {
                primary: "#2563eb",
                secondary: "#0f172a",
                background: "#ffffff",
                text: "#0f172a",
                accent: "#22c55e",
            },
            fontHeading: "Sora",
            fontBody: "Inter",
        },
    };
}
(0, node_test_1.default)("static published artifacts write home and nested pages with shared css", async () => {
    const siteId = "test-static-runtime";
    await (0, publishedSiteArtifacts_1.removePublishedSiteArtifact)(siteId);
    try {
        await (0, publishedSiteArtifacts_1.writePublishedSiteArtifacts)(siteId, [
            { slug: "home", name: "Inicio", tree: createTree("Inicio"), isHome: true },
            { slug: "servicios", name: "Servicios", tree: createTree("Servicios"), isHome: false },
        ], [
            {
                id: "page-home",
                siteId,
                name: "Inicio",
                slug: "home",
                isHome: true,
                published: true,
                source: "site-page",
            },
            {
                id: "page-services",
                siteId,
                name: "Servicios",
                slug: "servicios",
                isHome: false,
                published: true,
                source: "site-page",
            },
        ]);
        strict_1.default.equal(await (0, publishedSiteArtifacts_1.hasPublishedSiteArtifact)(siteId), true);
        strict_1.default.equal(await (0, publishedSiteArtifacts_1.hasPublishedSiteArtifact)(siteId, "servicios"), true);
        strict_1.default.equal((0, publishedSiteArtifacts_1.getPublishedSitePublicPath)(siteId), `/published-sites/${siteId}/`);
        strict_1.default.equal((0, publishedSiteArtifacts_1.getPublishedSitePublicPath)(siteId, "servicios"), `/published-sites/${siteId}/servicios/`);
        const homeHtml = await node_fs_1.promises.readFile(node_path_1.default.join(process.cwd(), "public", "published-sites", siteId, "index.html"), "utf8");
        const servicesHtml = await node_fs_1.promises.readFile(node_path_1.default.join(process.cwd(), "public", "published-sites", siteId, "servicios", "index.html"), "utf8");
        strict_1.default.match(homeHtml, /href="\/servicios\/index\.html"/);
        strict_1.default.match(servicesHtml, /href="\/index\.html"/);
        strict_1.default.match(servicesHtml, /\.\.\/styles\.css/);
    }
    finally {
        await (0, publishedSiteArtifacts_1.removePublishedSiteArtifact)(siteId);
    }
});
