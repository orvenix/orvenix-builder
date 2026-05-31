"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const layoutNormalizer_1 = require("../../lib/editor/layoutNormalizer");
function createNode(overrides = {}) {
    var _a, _b, _c, _d, _e;
    return {
        id: (_a = overrides.id) !== null && _a !== void 0 ? _a : "node-1",
        type: (_b = overrides.type) !== null && _b !== void 0 ? _b : "section",
        props: (_c = overrides.props) !== null && _c !== void 0 ? _c : {},
        children: (_d = overrides.children) !== null && _d !== void 0 ? _d : [],
        version: (_e = overrides.version) !== null && _e !== void 0 ? _e : 1,
        parentId: overrides.parentId,
    };
}
function createTree(parent) {
    const root = createNode({ id: "root", type: "page" });
    return {
        rootId: "root",
        nodes: {
            root,
            [parent.id]: parent,
        },
    };
}
(0, node_test_1.default)("detectParentLayout resolves free, grid, flex-row and column layouts", () => {
    strict_1.default.equal((0, layoutNormalizer_1.detectParentLayout)(createNode({ props: { positionMode: "free" } })), "free");
    strict_1.default.equal((0, layoutNormalizer_1.detectParentLayout)(createNode({ props: { display: "grid" } })), "grid");
    strict_1.default.equal((0, layoutNormalizer_1.detectParentLayout)(createNode({ props: { display: "flex", flexDirection: "row" } })), "flex-row");
    strict_1.default.equal((0, layoutNormalizer_1.detectParentLayout)(createNode({ props: { display: "flex" } })), "column");
});
(0, node_test_1.default)("normalizeInsertion redirects locked blocks to root and strips free-position props", () => {
    const lockedType = Array.from(layoutNormalizer_1.LOCKED_BLOCKS)[0];
    const parent = createNode({ id: "container" });
    const tree = createTree(parent);
    const result = (0, layoutNormalizer_1.normalizeInsertion)({
        type: lockedType,
        parentId: parent.id,
        tree,
        props: {
            positionMode: "free",
            x: 120,
            y: 160,
            width: 700,
            height: 320,
            zIndex: 10,
            className: "hero",
        },
    });
    strict_1.default.equal(result.parentId, tree.rootId);
    strict_1.default.deepEqual(result.props, { className: "hero" });
});
(0, node_test_1.default)("normalizeInsertion assigns free-layout defaults and staggered coordinates", () => {
    const parent = createNode({
        id: "free-parent",
        props: { positionMode: "free" },
        children: ["a", "b"],
    });
    const tree = createTree(parent);
    const result = (0, layoutNormalizer_1.normalizeInsertion)({
        type: "image",
        parentId: parent.id,
        tree,
        props: { alt: "preview" },
    });
    strict_1.default.equal(result.parentId, parent.id);
    strict_1.default.equal(result.props.positionMode, "free");
    strict_1.default.equal(result.props.width, 400);
    strict_1.default.equal(result.props.height, 240);
    strict_1.default.equal(result.props.x, 88);
    strict_1.default.equal(result.props.y, 88);
    strict_1.default.equal(result.props.alt, "preview");
});
(0, node_test_1.default)("normalizeInsertion keeps explicit free-layout coordinates and custom size overrides", () => {
    const parent = createNode({
        id: "free-parent",
        props: { positionMode: "free" },
    });
    const tree = createTree(parent);
    const props = {
        width: 999,
        height: 111,
        x: 12,
        y: 34,
        label: "custom",
    };
    const result = (0, layoutNormalizer_1.normalizeInsertion)({
        type: "heading",
        parentId: parent.id,
        tree,
        props,
    });
    strict_1.default.equal(result.props.width, 999);
    strict_1.default.equal(result.props.height, 111);
    strict_1.default.equal(result.props.x, 12);
    strict_1.default.equal(result.props.y, 34);
    strict_1.default.equal(result.props.positionMode, "free");
    strict_1.default.equal(result.props.label, "custom");
});
(0, node_test_1.default)("normalizeInsertion strips free props for column, grid and row layouts", () => {
    const flowParent = createNode({
        id: "flow-parent",
        props: { display: "grid" },
    });
    const tree = createTree(flowParent);
    const result = (0, layoutNormalizer_1.normalizeInsertion)({
        type: "text",
        parentId: flowParent.id,
        tree,
        props: {
            positionMode: "free",
            x: 1,
            y: 2,
            width: 300,
            height: 80,
            zIndex: 5,
            content: "hola",
        },
    });
    strict_1.default.deepEqual(result.props, { content: "hola" });
    strict_1.default.equal(result.parentId, flowParent.id);
});
(0, node_test_1.default)("normalizeInsertion leaves props untouched when parent is missing", () => {
    const props = { x: 10, content: "sin padre" };
    const tree = {
        rootId: "root",
        nodes: {
            root: createNode({ id: "root", type: "page" }),
        },
    };
    const result = (0, layoutNormalizer_1.normalizeInsertion)({
        type: "text",
        parentId: "missing-parent",
        tree,
        props,
    });
    strict_1.default.equal(result.parentId, "missing-parent");
    strict_1.default.equal(result.props, props);
});
