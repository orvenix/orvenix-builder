"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTree = validateTree;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateTree(value) {
    if (!isRecord(value)) {
        throw new Error("EditorTree invalido: se esperaba un objeto.");
    }
    const rootId = typeof value.rootId === "string" ? value.rootId : "root";
    const rawNodes = isRecord(value.nodes) ? value.nodes : {};
    const nodes = {};
    for (const [id, rawNode] of Object.entries(rawNodes)) {
        if (!isRecord(rawNode))
            continue;
        nodes[id] = Object.assign({ id, type: typeof rawNode.type === "string" ? rawNode.type : "generic", props: isRecord(rawNode.props) ? rawNode.props : {}, children: Array.isArray(rawNode.children)
                ? rawNode.children.filter((child) => typeof child === "string")
                : [], version: typeof rawNode.version === "number" ? rawNode.version : 1 }, (typeof rawNode.parentId === "string" ? { parentId: rawNode.parentId } : {}));
    }
    if (!nodes[rootId]) {
        nodes[rootId] = {
            id: rootId,
            type: "section",
            props: {},
            children: [],
            version: 1,
        };
    }
    return Object.assign(Object.assign({}, value), { rootId,
        nodes });
}
