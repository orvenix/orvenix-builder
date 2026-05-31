"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportMarkup_1 = require("../../lib/builder-core/compiler/exportMarkup");
function createNode(overrides) {
    return Object.assign({ id: "node_markup", type: "landing-hero", version: 1, parentId: null, children: [], hidden: false, displayName: undefined, props: {} }, overrides);
}
(0, node_test_1.default)("compiler export markup resolves nav links and active state", () => {
    var _a, _b;
    const nav = (0, exportMarkup_1.getExportNavMarkupModel)({
        title: "Menu principal",
        layout: "row",
        justify: "end",
        variant: "minimal",
    }, {
        siteId: "site_demo",
        currentPageSlug: "contacto",
        pages: [
            { id: "home", siteId: "site_demo", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page" },
            { id: "contacto", siteId: "site_demo", name: "Contacto", slug: "contacto", isHome: false, published: true, source: "site-page" },
        ],
    });
    strict_1.default.equal(nav.ariaLabel, "Menu principal");
    strict_1.default.equal(nav.navClass, "site-nav site-nav--row site-nav--end site-nav--minimal");
    strict_1.default.equal(nav.hasLinks, true);
    strict_1.default.equal((_a = nav.links[1]) === null || _a === void 0 ? void 0 : _a.href, "/contacto/index.html");
    strict_1.default.equal((_b = nav.links[1]) === null || _b === void 0 ? void 0 : _b.isActive, true);
});
(0, node_test_1.default)("compiler export markup resolves placeholder metadata and defaults", () => {
    var _a;
    const complex = (0, exportMarkup_1.getExportPlaceholderMarkupModel)(createNode({
        type: "landing-hero",
    }));
    const unknown = (0, exportMarkup_1.getExportPlaceholderMarkupModel)(createNode({
        type: "custom-widget",
        displayName: "Widget custom",
    }));
    strict_1.default.equal(complex.tag, "header");
    strict_1.default.equal(complex.headingId, "landing-hero-heading");
    strict_1.default.equal((_a = complex.meta) === null || _a === void 0 ? void 0 : _a.label, "Hero principal");
    strict_1.default.equal(unknown.tag, "section");
    strict_1.default.equal(unknown.label, "Widget custom");
    strict_1.default.equal(unknown.meta, null);
});
