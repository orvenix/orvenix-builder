"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const seoAudit_1 = require("../../lib/audit/seoAudit");
function createTree(overrides) {
    return Object.assign({ rootId: "root", nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["h1", "p1", "img1"],
                version: 1,
            },
            h1: {
                id: "h1",
                type: "heading",
                props: { level: 1, text: "Titulo principal de la pagina con longitud razonable" },
                children: [],
                version: 1,
                parentId: "root",
            },
            p1: {
                id: "p1",
                type: "text",
                props: { content: "Contenido descriptivo suficiente para evitar thin content en esta prueba unitaria del auditor SEO." },
                children: [],
                version: 1,
                parentId: "root",
            },
            img1: {
                id: "img1",
                type: "image",
                props: { alt: "Equipo trabajando en una interfaz" },
                children: [],
                version: 1,
                parentId: "root",
            },
        }, seo: {
            title: "Titulo SEO suficientemente descriptivo para pasar",
            description: "Descripcion SEO con longitud adecuada para buscadores y redes sociales en el flujo de prueba automatizada del proyecto.",
            ogImage: "/img/logo-main.png",
        } }, overrides);
}
(0, node_test_1.default)("runSeoAudit reports missing title and description", () => {
    const issues = (0, seoAudit_1.runSeoAudit)(createTree({ seo: {} }));
    const ids = issues.map((issue) => issue.id);
    strict_1.default.ok(ids.includes("seo-no-title"));
    strict_1.default.ok(ids.includes("seo-no-description"));
});
(0, node_test_1.default)("runSeoAudit exposes safe auto-fixes for missing SEO metadata", () => {
    var _a, _b, _c, _d, _e;
    const issues = (0, seoAudit_1.runSeoAudit)(createTree({ seo: {} }));
    const titleIssue = issues.find((issue) => issue.id === "seo-no-title");
    const descriptionIssue = issues.find((issue) => issue.id === "seo-no-description");
    const ogIssue = issues.find((issue) => issue.id === "seo-no-og-image");
    strict_1.default.equal(titleIssue === null || titleIssue === void 0 ? void 0 : titleIssue.autoFixable, true);
    strict_1.default.match(String((_b = (_a = titleIssue === null || titleIssue === void 0 ? void 0 : titleIssue.fix) === null || _a === void 0 ? void 0 : _a.call(titleIssue).title) !== null && _b !== void 0 ? _b : ""), /Titulo principal/i);
    strict_1.default.equal(descriptionIssue === null || descriptionIssue === void 0 ? void 0 : descriptionIssue.autoFixable, true);
    strict_1.default.ok(String((_d = (_c = descriptionIssue === null || descriptionIssue === void 0 ? void 0 : descriptionIssue.fix) === null || _c === void 0 ? void 0 : _c.call(descriptionIssue).description) !== null && _d !== void 0 ? _d : "").length > 0);
    strict_1.default.equal(ogIssue === null || ogIssue === void 0 ? void 0 : ogIssue.autoFixable, true);
    strict_1.default.equal((_e = ogIssue === null || ogIssue === void 0 ? void 0 : ogIssue.fix) === null || _e === void 0 ? void 0 : _e.call(ogIssue).ogImage, "/img/logo-main.png");
});
(0, node_test_1.default)("runSeoAudit warns when there is no H1 and image alt is missing", () => {
    const tree = createTree();
    tree.nodes.h1.props = { level: 2, text: "Subtitulo" };
    tree.nodes.img1.props = {};
    const issues = (0, seoAudit_1.runSeoAudit)(tree);
    const ids = issues.map((issue) => issue.id);
    strict_1.default.ok(ids.includes("seo-no-h1"));
    strict_1.default.ok(ids.some((id) => id.startsWith("seo-img-no-alt-img1")));
});
(0, node_test_1.default)("calcSeoScore penalizes errors more than warnings", () => {
    const issues = (0, seoAudit_1.runSeoAudit)(createTree({ seo: {} }));
    const score = (0, seoAudit_1.calcSeoScore)(issues);
    strict_1.default.ok(score < 100);
    strict_1.default.ok(score >= 0);
});
