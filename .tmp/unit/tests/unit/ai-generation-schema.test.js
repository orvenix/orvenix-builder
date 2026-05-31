"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const generationSchema_1 = require("../../lib/ai/generationSchema");
(0, node_test_1.default)("extractFirstJsonObject pulls the first complete JSON object from markdown-wrapped text", () => {
    const raw = "```json\n{\"tree\":{\"rootId\":\"hero\",\"nodes\":{\"hero\":{\"id\":\"hero\",\"type\":\"agency-hero\",\"props\":{},\"children\":[],\"version\":1}}}}\n```";
    const extracted = (0, generationSchema_1.extractFirstJsonObject)(raw);
    strict_1.default.equal(extracted, "{\"tree\":{\"rootId\":\"hero\",\"nodes\":{\"hero\":{\"id\":\"hero\",\"type\":\"agency-hero\",\"props\":{},\"children\":[],\"version\":1}}}}");
});
(0, node_test_1.default)("normalizeGeneratedTreeCandidate unwraps tree payloads and preserves only allowed nodes", () => {
    var _a, _b, _c, _d;
    const tree = (0, generationSchema_1.normalizeGeneratedTreeCandidate)({
        tree: {
            rootId: "root section",
            nodes: {
                "root section": {
                    id: "root section",
                    type: "section",
                    props: { paddingY: "xl" },
                    children: ["hero 1", "rogue"],
                    version: 3,
                },
                "hero 1": {
                    id: "hero 1",
                    type: "agency-hero",
                    props: { shouldDrop: true },
                    children: [],
                    version: 1,
                    parentId: "root section",
                },
                rogue: {
                    id: "rogue",
                    type: "unknown-block",
                    props: { nope: true },
                    children: [],
                    version: 1,
                },
            },
        },
    }, ["section", "agency-hero"]);
    strict_1.default.ok(tree);
    strict_1.default.equal(tree === null || tree === void 0 ? void 0 : tree.rootId, "root-section");
    strict_1.default.deepEqual(Object.keys((_a = tree === null || tree === void 0 ? void 0 : tree.nodes) !== null && _a !== void 0 ? _a : {}), ["root-section", "hero-1"]);
    strict_1.default.deepEqual((_b = tree === null || tree === void 0 ? void 0 : tree.nodes["root-section"]) === null || _b === void 0 ? void 0 : _b.children, ["hero-1"]);
    strict_1.default.deepEqual((_c = tree === null || tree === void 0 ? void 0 : tree.nodes["hero-1"]) === null || _c === void 0 ? void 0 : _c.props, {});
    strict_1.default.equal((_d = tree === null || tree === void 0 ? void 0 : tree.nodes["hero-1"]) === null || _d === void 0 ? void 0 : _d.parentId, "root-section");
});
(0, node_test_1.default)("normalizeGeneratedTreeCandidate removes unreachable nodes and invalid roots", () => {
    var _a;
    const tree = (0, generationSchema_1.normalizeGeneratedTreeCandidate)({
        rootId: "missing-root",
        nodes: {
            first: {
                id: "first",
                type: "section",
                props: {},
                children: [],
                version: 1,
            },
            orphan: {
                id: "orphan",
                type: "text",
                props: { content: "fuera del arbol" },
                children: [],
                version: 1,
            },
        },
    }, ["section", "text"]);
    strict_1.default.ok(tree);
    strict_1.default.equal(tree === null || tree === void 0 ? void 0 : tree.rootId, "first");
    strict_1.default.deepEqual(Object.keys((_a = tree === null || tree === void 0 ? void 0 : tree.nodes) !== null && _a !== void 0 ? _a : {}), ["first"]);
});
