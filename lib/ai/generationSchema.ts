import type { EditorNode, EditorTree } from "@/types/editor";

function isRecord(value: unknown): value is Record<string, unknown> {
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

function isDefaultOnlyBlockType(type: string): boolean {
  return DEFAULT_ONLY_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function normalizeNodeId(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, "-");
  return normalized || fallback;
}

function toNodeProps(value: unknown, type: string): Record<string, unknown> {
  if (!isRecord(value)) return {};
  if (isDefaultOnlyBlockType(type)) return {};
  return value;
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

function collectReachable(rootId: string, nodes: Record<string, EditorNode>): Record<string, EditorNode> {
  const queue = [rootId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current) || !nodes[current]) continue;
    visited.add(current);
    queue.push(...nodes[current].children);
  }

  return Object.fromEntries(
    Object.entries(nodes).filter(([id]) => visited.has(id))
  );
}

export function extractFirstJsonObject(raw: string): string | null {
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
      if (char === "\"") inString = false;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
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

export function normalizeGeneratedTreeCandidate(
  value: unknown,
  allowedBlockTypes: string[]
): EditorTree | null {
  const candidate = isRecord(value) && isRecord(value.tree) ? value.tree : value;
  if (!isRecord(candidate)) return null;

  const rawNodes = isRecord(candidate.nodes) ? candidate.nodes : null;
  if (!rawNodes) return null;

  const allowed = new Set(allowedBlockTypes);
  const aliasToId = new Map<string, string>();
  const tempNodes = new Map<string, EditorNode>();
  const rawChildMap = new Map<string, string[]>();
  const rawParentMap = new Map<string, string>();

  let index = 0;
  for (const [entryKey, rawNode] of Object.entries(rawNodes)) {
    if (!isRecord(rawNode)) continue;

    const declaredType = typeof rawNode.type === "string" ? rawNode.type : "";
    if (!allowed.has(declaredType)) continue;

    const fallbackId = `node-${index + 1}`;
    const normalizedId = normalizeNodeId(rawNode.id ?? entryKey, fallbackId);

    tempNodes.set(normalizedId, {
      id: normalizedId,
      type: declaredType,
      props: toNodeProps(rawNode.props, declaredType),
      children: [],
      version: typeof rawNode.version === "number" && rawNode.version > 0 ? rawNode.version : 1,
    });

    aliasToId.set(entryKey, normalizedId);
    if (typeof rawNode.id === "string") aliasToId.set(rawNode.id, normalizedId);
    rawChildMap.set(normalizedId, Array.isArray(rawNode.children) ? rawNode.children.filter((child): child is string => typeof child === "string") : []);
    if (typeof rawNode.parentId === "string") rawParentMap.set(normalizedId, rawNode.parentId);
    index += 1;
  }

  if (tempNodes.size === 0) return null;

  const firstNodeId = tempNodes.keys().next().value as string;
  const requestedRootId = typeof candidate.rootId === "string" ? candidate.rootId : firstNodeId;
  const rootId = aliasToId.get(requestedRootId) ?? (tempNodes.has(requestedRootId) ? requestedRootId : firstNodeId);

  const nodes = Object.fromEntries(tempNodes.entries());

  for (const [nodeId, node] of Object.entries(nodes)) {
    node.children = uniq(
      (rawChildMap.get(nodeId) ?? [])
        .map((childId) => aliasToId.get(childId) ?? childId)
        .filter((childId) => childId !== nodeId && childId in nodes)
    );

    const mappedParentId = rawParentMap.get(nodeId);
    if (mappedParentId) {
      const parentId = aliasToId.get(mappedParentId) ?? mappedParentId;
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
