"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFirstJsonObject = extractFirstJsonObject;
exports.normalizeGeneratedTreeCandidate = normalizeGeneratedTreeCandidate;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
const DEFAULT_ONLY_PREFIXES = [
    "landing-",
    "crm-",
    "agency-",
    "saas-",
    "modular-",
    "pm-",
];
function isDefaultOnlyBlockType(type) {
    return DEFAULT_ONLY_PREFIXES.some((prefix) => type.startsWith(prefix));
}
function normalizeNodeId(value, fallback) {
    if (typeof value !== "string")
        return fallback;
    const normalized = value.trim().replace(/\s+/g, "-");
    return normalized || fallback;
}
function toNodeProps(value, type) {
    if (!isRecord(value))
        return {};
    if (isDefaultOnlyBlockType(type))
        return {};
    return value;
}
function uniq(values) {
    return [...new Set(values)];
}
function collectReachable(rootId, nodes) {
    const queue = [rootId];
    const visited = new Set();
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current) || !nodes[current])
            continue;
        visited.add(current);
        queue.push(...nodes[current].children);
    }
    return Object.fromEntries(Object.entries(nodes).filter(([id]) => visited.has(id)));
}
function extractFirstJsonObject(raw) {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaping = false;
    for (let i = 0; i < raw.length; i += 1) {
        const char = raw[i];
        if (inString) {
            if (escaping) {
                escaping = false;
                continue;
            }
            if (char === "\\") {
                escaping = true;
                continue;
            }
            if (char === "\"")
                inString = false;
            continue;
        }
        if (char === "\"") {
            inString = true;
            continue;
        }
        if (char === "{") {
            if (depth === 0)
                start = i;
            depth += 1;
            continue;
        }
        if (char === "}" && depth > 0) {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                return raw.slice(start, i + 1);
            }
        }
    }
    return null;
}
function normalizeGeneratedTreeCandidate(value, allowedBlockTypes) {
    var _a, _b, _c, _d;
    const candidate = isRecord(value) && isRecord(value.tree) ? value.tree : value;
    if (!isRecord(candidate))
        return null;
    const rawNodes = isRecord(candidate.nodes) ? candidate.nodes : null;
    if (!rawNodes)
        return null;
    const allowed = new Set(allowedBlockTypes);
    const aliasToId = new Map();
    const tempNodes = new Map();
    const rawChildMap = new Map();
    const rawParentMap = new Map();
    let index = 0;
    for (const [entryKey, rawNode] of Object.entries(rawNodes)) {
        if (!isRecord(rawNode))
            continue;
        const declaredType = typeof rawNode.type === "string" ? rawNode.type : "";
        if (!allowed.has(declaredType))
            continue;
        const fallbackId = `node-${index + 1}`;
        const normalizedId = normalizeNodeId((_a = rawNode.id) !== null && _a !== void 0 ? _a : entryKey, fallbackId);
        tempNodes.set(normalizedId, {
            id: normalizedId,
            type: declaredType,
            props: toNodeProps(rawNode.props, declaredType),
            children: [],
            version: typeof rawNode.version === "number" && rawNode.version > 0 ? rawNode.version : 1,
        });
        aliasToId.set(entryKey, normalizedId);
        if (typeof rawNode.id === "string")
            aliasToId.set(rawNode.id, normalizedId);
        rawChildMap.set(normalizedId, Array.isArray(rawNode.children) ? rawNode.children.filter((child) => typeof child === "string") : []);
        if (typeof rawNode.parentId === "string")
            rawParentMap.set(normalizedId, rawNode.parentId);
        index += 1;
    }
    if (tempNodes.size === 0)
        return null;
    const firstNodeId = tempNodes.keys().next().value;
    const requestedRootId = typeof candidate.rootId === "string" ? candidate.rootId : firstNodeId;
    const rootId = (_b = aliasToId.get(requestedRootId)) !== null && _b !== void 0 ? _b : (tempNodes.has(requestedRootId) ? requestedRootId : firstNodeId);
    const nodes = Object.fromEntries(tempNodes.entries());
    for (const [nodeId, node] of Object.entries(nodes)) {
        node.children = uniq(((_c = rawChildMap.get(nodeId)) !== null && _c !== void 0 ? _c : [])
            .map((childId) => { var _a; return (_a = aliasToId.get(childId)) !== null && _a !== void 0 ? _a : childId; })
            .filter((childId) => childId !== nodeId && childId in nodes));
        const mappedParentId = rawParentMap.get(nodeId);
        if (mappedParentId) {
            const parentId = (_d = aliasToId.get(mappedParentId)) !== null && _d !== void 0 ? _d : mappedParentId;
            if (parentId in nodes && parentId !== nodeId) {
                node.parentId = parentId;
            }
        }
    }
    const reachableNodes = collectReachable(rootId, nodes);
    return {
        rootId,
        nodes: reachableNodes,
    };
}
