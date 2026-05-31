import type { EditorTree } from "@/types/editor";

export function extractContentChangesFromTree(tree: EditorTree) {
  const changes: Record<string, string> = {};

  for (const node of Object.values(tree.nodes)) {
    const sourceKey = readSourceKey(node.props);
    if (!sourceKey) {
      continue;
    }

    const value = readNodeContent(node.type, node.props);
    if (!value) {
      continue;
    }

    changes[sourceKey] = value;
  }

  return changes;
}

function readSourceKey(props: Record<string, unknown>) {
  const sourceKey = props.sourceKey;
  return typeof sourceKey === "string" && sourceKey.trim() ? sourceKey.trim() : null;
}

function readNodeContent(type: string, props: Record<string, unknown>) {
  if (type === "heading") {
    return normalizeText(props.text);
  }

  if (type === "text") {
    return normalizeText(props.content);
  }

  if (type === "ctaButton") {
    return normalizeText(props.label);
  }

  if (type === "image") {
    return normalizeText(props.src);
  }

  return normalizeText(props.content) ?? normalizeText(props.text) ?? normalizeText(props.label);
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}
