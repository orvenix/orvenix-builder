"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const serializeToHtml_1 = require("../../lib/export/serializeToHtml");
const serializeToJsx_1 = require("../../lib/export/serializeToJsx");
const validateHtmlExport_1 = require("../../lib/export/validateHtmlExport");
function createTree() {
    return {
        rootId: "root",
        nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["hero", "wrapper", "hidden"],
                version: 1,
            },
            hero: {
                id: "hero",
                type: "landing-hero",
                props: {
                    styleBackground: "#0f172a",
                    stylePadding: 32,
                },
                children: ["title", "copy", "cta", "image"],
                version: 1,
                parentId: "root",
            },
            title: {
                id: "title",
                type: "heading",
                props: {
                    level: 1,
                    text: "Impulsa tu operación",
                    align: "center",
                },
                children: [],
                version: 1,
                parentId: "hero",
            },
            copy: {
                id: "copy",
                type: "text",
                props: {
                    content: "Automatiza ventas\nsin <fricción>",
                },
                children: [],
                version: 1,
                parentId: "hero",
            },
            cta: {
                id: "cta",
                type: "ctaButton",
                props: {
                    label: "Agenda demo",
                    href: "https://orvenix.com.mx/demo",
                    variant: "secondary",
                },
                children: [],
                version: 1,
                parentId: "hero",
            },
            image: {
                id: "image",
                type: "image",
                props: {
                    src: "https://cdn.orvenix.com.mx/hero.png",
                    alt: "Panel analítico principal",
                    title: "Vista principal del dashboard",
                    width: 960,
                    height: 640,
                    objectFit: "cover",
                },
                children: [],
                version: 1,
                parentId: "hero",
            },
            wrapper: {
                id: "wrapper",
                type: "genericWrapper",
                props: {
                    positionMode: "free",
                    x: 24,
                    y: 48,
                    width: 300,
                    height: 120,
                },
                children: ["custom"],
                version: 1,
                parentId: "root",
            },
            custom: {
                id: "custom",
                type: "custom-widget",
                displayName: "Widget personalizado",
                props: {},
                children: [],
                version: 1,
                parentId: "wrapper",
            },
            hidden: {
                id: "hidden",
                type: "text",
                props: {
                    content: "No debe exportarse",
                },
                children: [],
                hidden: true,
                version: 1,
                parentId: "root",
            },
        },
        seo: {
            title: "Orvenix Export Test",
            description: "Exportación con metadatos y contenido semántico.",
            keywords: "builder, export, nextjs",
            ogImage: "https://cdn.orvenix.com.mx/og.png",
        },
        theme: {
            colors: {
                primary: "#0ea5e9",
                secondary: "#22c55e",
                background: "#ffffff",
                text: "#0f172a",
                accent: "#f97316",
            },
            fontHeading: "Sora, sans-serif",
            fontBody: "Instrument Sans, sans-serif",
        },
    };
}
(0, node_test_1.default)("serializeTreeToHtml exports semantic HTML, styles and SEO metadata", () => {
    const result = (0, serializeToHtml_1.serializeTreeToHtml)(createTree(), "Sitio Demo");
    strict_1.default.match(result.html, /<header class="orv-block orv-block--landing-hero"[^>]*aria-labelledby="landing-hero-heading"/);
    strict_1.default.match(result.html, /<h2 id="landing-hero-heading" class="sr-only">Hero principal<\/h2>/);
    strict_1.default.match(result.html, /<h1 class="text-center">Impulsa tu operación<\/h1>/);
    strict_1.default.match(result.html, /Automatiza ventas<br \/>sin &lt;fricción&gt;/);
    strict_1.default.match(result.html, /<figure>/);
    strict_1.default.match(result.html, /<figcaption>Vista principal del dashboard<\/figcaption>/);
    strict_1.default.match(result.html, /target="_blank" rel="noopener noreferrer"/);
    strict_1.default.match(result.html, /style="position:absolute;left:24px;top:48px;width:300px;height:120px"/);
    strict_1.default.doesNotMatch(result.html, /No debe exportarse/);
    strict_1.default.equal(result.seo.title, "Orvenix Export Test");
    strict_1.default.equal(result.seo.description, "Exportación con metadatos y contenido semántico.");
    strict_1.default.match(result.css, /--font-heading: "Sora, sans-serif";/);
    strict_1.default.match(result.css, /\.sr-only \{/);
});
(0, node_test_1.default)("serializeTreeToJsx exports current framework versions and accessible placeholders", () => {
    const result = (0, serializeToJsx_1.serializeTreeToJsx)(createTree(), "Sitio Demo");
    const pkg = JSON.parse(result.packageJson);
    strict_1.default.equal(pkg.dependencies.next, "16.2.4");
    strict_1.default.equal(pkg.dependencies.react, "19.2.4");
    strict_1.default.equal(pkg.dependencies["react-dom"], "19.2.4");
    strict_1.default.match(result.pageTsx, /export const metadata: Metadata =/);
    strict_1.default.match(result.pageTsx, /title: "Orvenix Export Test"/);
    strict_1.default.match(result.pageTsx, /<div style=\{\{ position: "absolute", left: 24, top: 48, width: 300, height: 120 \}\}>/);
    strict_1.default.match(result.pageTsx, /<section data-block="custom-widget" aria-label="Widget personalizado" \/>/);
    strict_1.default.match(result.layoutTsx, /<html lang="es">/);
    strict_1.default.match(result.nextConfig, /remotePatterns/);
});
(0, node_test_1.default)("validateHtmlExport accepts the generated static export without critical errors", () => {
    const { html } = (0, serializeToHtml_1.serializeTreeToHtml)(createTree(), "Sitio Demo");
    const report = (0, validateHtmlExport_1.validateHtmlExport)(html);
    strict_1.default.equal(report.valid, true);
    strict_1.default.equal(report.errors, 0);
    strict_1.default.equal(report.issues.some((issue) => issue.code === "canonical-empty"), false);
});
(0, node_test_1.default)("validateHtmlExport flags duplicate ids, missing alt and unsafe blank links", () => {
    const report = (0, validateHtmlExport_1.validateHtmlExport)(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Demo</title>
</head>
<body>
  <main>
    <h1 id="hero">Titulo</h1>
    <h3>Subtitulo</h3>
    <img src="/demo.png" />
    <a href="https://example.com" target="_blank">Abrir</a>
    <section id="hero"></section>
  </main>
</body>
</html>`);
    strict_1.default.equal(report.valid, false);
    strict_1.default.ok(report.issues.some((issue) => issue.code === "html-lang-missing"));
    strict_1.default.ok(report.issues.some((issue) => issue.code === "duplicate-id"));
    strict_1.default.ok(report.issues.some((issue) => issue.code === "img-alt-missing"));
    strict_1.default.ok(report.issues.some((issue) => issue.code === "blank-link-rel-missing"));
    strict_1.default.ok(report.issues.some((issue) => issue.code === "heading-skip"));
});
