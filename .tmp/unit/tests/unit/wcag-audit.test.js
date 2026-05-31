"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const wcagAudit_1 = require("../../lib/audit/wcagAudit");
function createTree() {
    return {
        rootId: "root",
        nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["heading1", "button1", "image1", "text1"],
                version: 1,
            },
            heading1: {
                id: "heading1",
                type: "heading",
                props: { level: 2, text: "Encabezado secundario", color: "#777777", styleBackground: "#888888" },
                children: [],
                version: 1,
                parentId: "root",
            },
            button1: {
                id: "button1",
                type: "ctaButton",
                props: { label: "" },
                children: [],
                version: 1,
                parentId: "root",
            },
            image1: {
                id: "image1",
                type: "image",
                props: { alt: "imagen" },
                children: [],
                version: 1,
                parentId: "root",
            },
            text1: {
                id: "text1",
                type: "text",
                props: { content: "Texto de prueba", color: "#666666", styleBackground: "#777777" },
                children: [],
                version: 1,
                parentId: "root",
            },
        },
    };
}
(0, node_test_1.default)("runWcagAudit reports generic alt text and missing button label", () => {
    const issues = (0, wcagAudit_1.runWcagAudit)(createTree());
    const ids = issues.map((issue) => issue.id);
    strict_1.default.ok(ids.includes("wcag-alt-generic-image1"));
    strict_1.default.ok(ids.includes("wcag-btn-no-label-button1"));
});
(0, node_test_1.default)("runWcagAudit reports heading hierarchy issue when page does not start with H1", () => {
    const issues = (0, wcagAudit_1.runWcagAudit)(createTree());
    strict_1.default.ok(issues.some((issue) => issue.id === "wcag-heading-hierarchy"));
});
(0, node_test_1.default)("calcWcagScore decreases when there are accessibility issues", () => {
    const score = (0, wcagAudit_1.calcWcagScore)((0, wcagAudit_1.runWcagAudit)(createTree()));
    strict_1.default.ok(score < 100);
    strict_1.default.ok(score >= 0);
});
