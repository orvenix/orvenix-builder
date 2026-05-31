"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportTraversal_1 = require("../../lib/builder-core/compiler/exportTraversal");
const tree = {
    rootId: "root",
    nodes: {
        root: {
            id: "root",
            type: "section",
            props: {},
            children: ["a", "hidden"],
            version: 1,
        },
        a: {
            id: "a",
            type: "text",
            props: { content: "A" },
            children: ["b"],
            version: 1,
            parentId: "root",
        },
        b: {
            id: "b",
            type: "heading",
            props: { text: "B" },
            children: [],
            version: 1,
            parentId: "a",
        },
        hidden: {
            id: "hidden",
            type: "text",
            props: { content: "Hidden" },
            children: [],
            hidden: true,
            version: 1,
            parentId: "root",
        },
    },
};
(0, node_test_1.default)("compiler export traversal renders descendants and skips hidden nodes", () => {
    const output = (0, exportTraversal_1.renderExportNodeTree)("a", tree, 2, ({ node, indent, children }) => {
        return `${indent}${node.id}${children ? `\n${children}` : ""}`;
    });
    strict_1.default.match(output, /^    a/m);
    strict_1.default.match(output, /^      b/m);
    strict_1.default.doesNotMatch(output, /hidden/);
});
(0, node_test_1.default)("compiler export traversal renders root children with blank-line separator", () => {
    const output = (0, exportTraversal_1.renderExportRootChildren)(tree, 1, ({ node, indent }) => `${indent}${node.id}`);
    strict_1.default.equal(output, "  a");
});
