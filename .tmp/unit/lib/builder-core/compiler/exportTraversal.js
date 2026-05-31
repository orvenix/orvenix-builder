"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderExportNodeTree = renderExportNodeTree;
exports.renderExportRootChildren = renderExportRootChildren;
function renderExportNodeTree(nodeId, tree, depth, renderer, options) {
    const node = tree.nodes[nodeId];
    if (!node || node.hidden)
        return "";
    const children = node.children
        .map((childId) => renderExportNodeTree(childId, tree, depth + 1, renderer, options))
        .filter(Boolean)
        .join("\n");
    return renderer({
        node,
        props: node.props,
        depth,
        indent: "  ".repeat(depth),
        children,
    });
}
function renderExportRootChildren(tree, depth, renderer, options) {
    const rootNode = tree.nodes[tree.rootId];
    if (!rootNode)
        return "";
    return rootNode.children
        .map((nodeId) => renderExportNodeTree(nodeId, tree, depth, renderer, options))
        .filter(Boolean)
        .join("\n\n");
}
