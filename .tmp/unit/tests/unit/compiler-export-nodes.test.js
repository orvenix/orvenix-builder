"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportNodes_1 = require("../../lib/builder-core/compiler/exportNodes");
(0, node_test_1.default)("compiler export nodes resolves internal export hrefs", () => {
    strict_1.default.equal((0, exportNodes_1.resolveExportHref)("site_demo", "page:home"), "/index.html");
    strict_1.default.equal((0, exportNodes_1.resolveExportHref)("site_demo", "page:servicios"), "/servicios/index.html");
    strict_1.default.equal((0, exportNodes_1.resolveExportHref)("site_demo", "https://orvenix.com.mx"), "https://orvenix.com.mx");
});
(0, node_test_1.default)("compiler export nodes resolves site nav model with active page", () => {
    var _a, _b;
    const model = (0, exportNodes_1.resolveExportNavModel)({
        title: "Principal",
        layout: "row",
        justify: "center",
        variant: "pill",
    }, {
        siteId: "site_demo",
        currentPageSlug: "servicios",
        pages: [
            {
                id: "home",
                siteId: "site_demo",
                name: "Inicio",
                slug: "home",
                isHome: true,
                published: true,
                source: "site-page",
            },
            {
                id: "services",
                siteId: "site_demo",
                name: "Servicios",
                slug: "servicios",
                isHome: false,
                published: true,
                source: "site-page",
            },
        ],
    });
    strict_1.default.equal(model.ariaLabel, "Principal");
    strict_1.default.equal(model.navClass, "site-nav site-nav--row site-nav--center site-nav--pill");
    strict_1.default.equal(model.links.length, 2);
    strict_1.default.equal((_a = model.links[1]) === null || _a === void 0 ? void 0 : _a.href, "/servicios/index.html");
    strict_1.default.equal((_b = model.links[1]) === null || _b === void 0 ? void 0 : _b.isActive, true);
});
(0, node_test_1.default)("compiler export nodes exposes complex block metadata", () => {
    const meta = (0, exportNodes_1.getComplexBlockMeta)("landing-hero");
    strict_1.default.ok(meta);
    strict_1.default.equal(meta === null || meta === void 0 ? void 0 : meta.tag, "header");
    strict_1.default.equal(meta === null || meta === void 0 ? void 0 : meta.heading, "Hero principal");
    strict_1.default.equal((0, exportNodes_1.getComplexBlockMeta)("unknown-widget"), null);
});
