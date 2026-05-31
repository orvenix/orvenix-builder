"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportModels_1 = require("../../lib/builder-core/compiler/exportModels");
function createNode(overrides) {
    return Object.assign({ id: "node_1", type: "genericWrapper", version: 1, parentId: null, children: [], hidden: false, displayName: undefined, props: {} }, overrides);
}
(0, node_test_1.default)("compiler export models resolves layout and heading models", () => {
    const layout = (0, exportModels_1.getExportLayoutModel)(createNode({
        type: "section",
        props: { maxWidth: "xl" },
    }));
    const heading = (0, exportModels_1.getExportHeadingModel)(createNode({
        type: "heading",
        props: { level: 9, text: "Hola", align: "center" },
    }));
    strict_1.default.deepEqual(layout, { tag: "section", maxWidth: "xl" });
    strict_1.default.equal(heading.tag, "h6");
    strict_1.default.equal(heading.text, "Hola");
    strict_1.default.equal(heading.alignClass, "text-center");
});
(0, node_test_1.default)("compiler export models resolves text, button and image models", () => {
    const text = (0, exportModels_1.getExportTextModel)(createNode({
        type: "text",
        props: { content: "Linea 1\nLinea 2", align: "end" },
    }));
    const button = (0, exportModels_1.getExportButtonModel)(createNode({
        type: "ctaButton",
        props: { href: "page:servicios", label: "Ver servicios", variant: "secondary" },
    }), "site_demo");
    const image = (0, exportModels_1.getExportImageModel)(createNode({
        type: "image",
        props: { src: "/hero.png", alt: "Hero", width: 1200, height: 700, objectFit: "cover", title: "Portada" },
    }));
    strict_1.default.equal(text.alignClass, "text-end");
    strict_1.default.equal(button.href, "/servicios/index.html");
    strict_1.default.equal(button.className, "cta-button cta-button--secondary");
    strict_1.default.equal(button.isExternal, false);
    strict_1.default.equal(image.caption, "Portada");
    strict_1.default.equal(image.objectFitCover, true);
    strict_1.default.equal(image.width, 1200);
});
(0, node_test_1.default)("compiler export models resolves placeholder metadata for complex and unknown blocks", () => {
    var _a;
    const complex = (0, exportModels_1.getExportPlaceholderModel)(createNode({
        type: "landing-hero",
    }));
    const unknown = (0, exportModels_1.getExportPlaceholderModel)(createNode({
        type: "custom-widget",
        displayName: "Widget custom",
    }));
    strict_1.default.equal(complex.className, "orv-block orv-block--landing-hero");
    strict_1.default.equal((_a = complex.meta) === null || _a === void 0 ? void 0 : _a.tag, "header");
    strict_1.default.equal(unknown.label, "Widget custom");
    strict_1.default.equal(unknown.meta, null);
});
