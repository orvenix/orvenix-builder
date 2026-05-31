"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const document_1 = require("../../lib/builder-core/compiler/document");
(0, node_test_1.default)("compiler document helpers expose stable defaults", () => {
    var _a, _b;
    strict_1.default.equal((_a = document_1.DEFAULT_DOCUMENT_THEME.colors) === null || _a === void 0 ? void 0 : _a.primary, "#111827");
    strict_1.default.equal((_b = document_1.DEFAULT_DOCUMENT_THEME.spacing) === null || _b === void 0 ? void 0 : _b.sectionY, "3rem");
    strict_1.default.equal(document_1.DEFAULT_DOCUMENT_SEO.title, "Mi Sitio Web Orvenix");
});
(0, node_test_1.default)("compiler document helpers normalize SEO with defaults", () => {
    const seo = (0, document_1.normalizeDocumentSeo)({
        title: "  Landing Premium  ",
        description: "",
        keywords: "seo, builder",
    });
    strict_1.default.equal(seo.title, "Landing Premium");
    strict_1.default.equal(seo.description, document_1.DEFAULT_DOCUMENT_SEO.description);
    strict_1.default.equal(seo.keywords, "seo, builder");
    strict_1.default.equal(seo.ogImage, "");
});
(0, node_test_1.default)("compiler document helpers normalize published urls safely", () => {
    strict_1.default.equal((0, document_1.normalizePublishedUrl)("contacto"), "/contacto");
    strict_1.default.equal((0, document_1.normalizePublishedUrl)("./assets/logo.png"), "/assets/logo.png");
    strict_1.default.equal((0, document_1.normalizePublishedUrl)("/legal"), "/legal");
    strict_1.default.equal((0, document_1.normalizePublishedUrl)("mailto:hola@orvenix.com.mx"), "mailto:hola@orvenix.com.mx");
    strict_1.default.equal((0, document_1.normalizePublishedUrl)("#faq"), "#faq");
});
(0, node_test_1.default)("compiler document helpers resolve spacing, sizing and tokens", () => {
    strict_1.default.equal((0, document_1.tokenToSpacing)("lg"), "3rem");
    strict_1.default.equal((0, document_1.tokenToSpacing)("unknown"), null);
    strict_1.default.equal((0, document_1.tokenToMaxWidth)("xl"), "80rem");
    strict_1.default.equal((0, document_1.tokenToFontSize)("md", "text"), "1rem");
    strict_1.default.equal((0, document_1.tokenToFontSize)("md", "heading"), "1.25rem");
    strict_1.default.equal((0, document_1.tokenToFontWeight)("extrabold"), "800");
    strict_1.default.equal((0, document_1.tokenToRadius)("lg"), "1.25rem");
    strict_1.default.equal((0, document_1.tokenToShadow)("md"), "0 16px 40px rgba(15, 23, 42, 0.12)");
});
