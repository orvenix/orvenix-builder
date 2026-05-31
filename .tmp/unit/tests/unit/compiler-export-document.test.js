"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportDocument_1 = require("../../lib/builder-core/compiler/exportDocument");
(0, node_test_1.default)("compiler export document normalizes export SEO with site fallback", () => {
    const seo = (0, exportDocument_1.getExportSeoModel)("Sitio Demo", {
        title: "  ",
        description: "Descripcion de prueba",
        keywords: "seo, export",
        ogImage: "https://cdn.orvenix.com.mx/og.png",
        canonicalUrl: " https://orvenix.com.mx/demo ",
    });
    strict_1.default.equal(seo.title, "Sitio Demo");
    strict_1.default.equal(seo.description, "Descripcion de prueba");
    strict_1.default.equal(seo.keywords, "seo, export");
    strict_1.default.equal(seo.ogImage, "https://cdn.orvenix.com.mx/og.png");
    strict_1.default.equal(seo.canonicalUrl, "https://orvenix.com.mx/demo");
});
(0, node_test_1.default)("compiler export document derives html and jsx metadata models", () => {
    var _a, _b, _c, _d, _e;
    const seo = (0, exportDocument_1.getExportSeoModel)("Sitio Demo", {
        title: "Orvenix Demo",
        description: "Landing exportada",
        ogImage: "https://cdn.orvenix.com.mx/og.png",
    });
    const htmlMeta = (0, exportDocument_1.getExportHtmlSeoMetaModel)(seo);
    const jsxMeta = (0, exportDocument_1.getExportJsxMetadataModel)(seo);
    strict_1.default.equal((_a = htmlMeta.openGraph[0]) === null || _a === void 0 ? void 0 : _a.property, "og:title");
    strict_1.default.equal((_b = htmlMeta.twitter[0]) === null || _b === void 0 ? void 0 : _b.name, "twitter:card");
    strict_1.default.equal(jsxMeta.title, "Orvenix Demo");
    strict_1.default.equal((_d = (_c = jsxMeta.openGraph.images) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url, "https://cdn.orvenix.com.mx/og.png");
    strict_1.default.equal((_e = jsxMeta.twitter.images) === null || _e === void 0 ? void 0 : _e[0], "https://cdn.orvenix.com.mx/og.png");
});
