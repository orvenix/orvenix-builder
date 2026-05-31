"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportRenderers_1 = require("../../lib/builder-core/compiler/exportRenderers");
function createNode(overrides) {
    return Object.assign({ id: "node_renderer", type: "text", version: 1, children: [], props: {} }, overrides);
}
(0, node_test_1.default)("compiler export renderers render html button and placeholder", () => {
    const buttonNode = createNode({
        type: "ctaButton",
        props: { label: "Abrir", href: "https://orvenix.com.mx" },
    });
    const placeholderNode = createNode({
        type: "landing-hero",
    });
    const button = (0, exportRenderers_1.renderHtmlExportNode)({ node: buttonNode, props: buttonNode.props, indent: "  ", children: "" }, {}, {
        escape: (value) => String(value),
        styleAttr: () => "",
    });
    const placeholder = (0, exportRenderers_1.renderHtmlExportNode)({ node: placeholderNode, props: placeholderNode.props, indent: "  ", children: "" }, {}, {
        escape: (value) => String(value),
        styleAttr: () => "",
    });
    strict_1.default.match(button, /target="_blank"/);
    strict_1.default.match(button, /rel="noopener noreferrer"/);
    strict_1.default.match(placeholder, /aria-labelledby="landing-hero-heading"/);
});
(0, node_test_1.default)("compiler export renderers render jsx text and nav", () => {
    const textNode = createNode({
        type: "text",
        props: { content: "Hola", align: "center" },
    });
    const navNode = createNode({
        type: "siteNav",
        props: { title: "Principal" },
    });
    const text = (0, exportRenderers_1.renderJsxExportNode)({ node: textNode, props: textNode.props, indent: "  ", children: "" }, {}, {
        escape: (value) => String(value),
        styleExpr: () => "",
    });
    const nav = (0, exportRenderers_1.renderJsxExportNode)({ node: navNode, props: navNode.props, indent: "  ", children: "" }, {
        siteId: "site_demo",
        pages: [{ id: "home", siteId: "site_demo", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page" }],
        currentPageSlug: "home",
    }, {
        escape: (value) => String(value),
        styleExpr: () => "",
    });
    strict_1.default.equal(text, `  <p className="text-center">Hola</p>`);
    strict_1.default.match(nav, /aria-current="page"/);
});
