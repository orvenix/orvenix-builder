"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportTemplates_1 = require("../../lib/builder-core/compiler/exportTemplates");
(0, node_test_1.default)("compiler export templates builds html document shell", () => {
    const html = (0, exportTemplates_1.buildHtmlDocument)({
        title: "Titulo",
        description: "Descripcion",
        keywords: "seo, export",
        canonicalLine: `  <link rel="canonical" href="https://orvenix.com.mx" />`,
        openGraphLines: `  <meta property="og:title" content="Titulo" />`,
        twitterLines: `  <meta name="twitter:title" content="Titulo" />`,
        stylesHref: "styles.css",
        bodyContent: "  <section>Contenido</section>",
    });
    strict_1.default.match(html, /<title>Titulo<\/title>/);
    strict_1.default.match(html, /<meta name="description" content="Descripcion" \/>/);
    strict_1.default.match(html, /<link rel="stylesheet" href="styles\.css" \/>/);
    strict_1.default.match(html, /<section>Contenido<\/section>/);
});
(0, node_test_1.default)("compiler export templates builds next page and layout shells", () => {
    const page = (0, exportTemplates_1.buildNextPageTsx)({
        metadata: {
            title: "Titulo",
            description: "Descripcion",
            keywords: "seo, export",
            openGraph: {
                title: "Titulo",
                description: "Descripcion",
                images: [{ url: "https://cdn.orvenix.com.mx/og.png" }],
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: "Titulo",
                description: "Descripcion",
                images: ["https://cdn.orvenix.com.mx/og.png"],
            },
        },
        bodyContent: "      <section>Contenido</section>",
    });
    const layout = (0, exportTemplates_1.buildNextLayoutTsx)("Sitio Demo");
    strict_1.default.match(page, /export const metadata: Metadata =/);
    strict_1.default.match(page, /images: \[\{ url: "https:\/\/cdn\.orvenix\.com\.mx\/og\.png" \}\],/);
    strict_1.default.match(page, /<section>Contenido<\/section>/);
    strict_1.default.match(layout, /title: "Sitio Demo"/);
    strict_1.default.match(layout, /<html lang="es">/);
});
