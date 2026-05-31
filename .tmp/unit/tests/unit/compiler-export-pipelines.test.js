"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportPipelines_1 = require("../../lib/builder-core/compiler/exportPipelines");
function createTree() {
    return {
        rootId: "root",
        nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["title", "cta"],
                version: 1,
            },
            title: {
                id: "title",
                type: "heading",
                props: { level: 1, text: "Hola Orvenix" },
                children: [],
                version: 1,
                parentId: "root",
            },
            cta: {
                id: "cta",
                type: "ctaButton",
                props: { label: "Ver más", href: "page:home" },
                children: [],
                version: 1,
                parentId: "root",
            },
        },
        seo: {
            title: "Demo SEO",
            description: "Descripcion demo",
        },
        theme: {
            colors: {
                primary: "#111827",
                secondary: "#2563eb",
                background: "#ffffff",
                text: "#111827",
                accent: "#f97316",
            },
        },
    };
}
(0, node_test_1.default)("compiler export pipelines builds html artifact", () => {
    const result = (0, exportPipelines_1.buildHtmlExportArtifact)(createTree(), "Sitio Demo", {
        siteId: "site_demo",
        stylesHref: "site.css",
    });
    strict_1.default.match(result.html, /<title>Demo SEO<\/title>/);
    strict_1.default.match(result.html, /href="site\.css"/);
    strict_1.default.match(result.html, /<h1>Hola Orvenix<\/h1>/);
    strict_1.default.match(result.html, /href="\/index\.html"/);
    strict_1.default.match(result.css, /body \{\s+--primary:/);
});
(0, node_test_1.default)("compiler export pipelines builds jsx artifact", () => {
    const result = (0, exportPipelines_1.buildJsxExportArtifact)(createTree(), "Sitio Demo", {
        siteId: "site_demo",
        currentPageSlug: "home",
    });
    strict_1.default.match(result.pageTsx, /title: "Demo SEO"/);
    strict_1.default.match(result.pageTsx, /<h1>Hola Orvenix<\/h1>/);
    strict_1.default.match(result.pageTsx, /href="\/index\.html"/);
    strict_1.default.match(result.layoutTsx, /<html lang="es">/);
    strict_1.default.match(result.packageJson, /"next": "16\.2\.4"/);
});
