import type { EditorNode, EditorTree, NodeProps, NodeId } from "@/types/editor";

// Full-section blocks that must be direct children of the page root.
// Nesting them inside other nodes produces broken layouts.
export const LOCKED_BLOCKS = new Set([
  // Landing
  "landing-hero", "landing-features", "landing-pricing",
  "landing-testimonials", "landing-footer",
  // CRM
  "crm-pipeline", "crm-contacts", "crm-stats",
  // SaaS / Agency
  "saas-pricing",
  "agency-hero", "agency-services", "agency-testimonials", "agency-cta",
  // Enterprise Modular
  "modular-hero", "modular-architecture", "modular-capabilities",
  "modular-contact-form", "modular-footer", "modular-process", "modular-trust-bar",
  // Dashboards
  "ai-charts", "ai-insights", "ai-kpi-grid",
  "finance-stats", "finance-transactions", "finance-portfolio",
  "hr-stats", "hr-employee-table", "hr-recruitment",
  "devops-server-grid", "devops-alerts", "devops-services",
  "ecommerce-orders", "project-issues", "project-kanban",
  // Rich generic blocks
  "stats-bar", "product-grid",
]);

export type LayoutType = "column" | "grid" | "flex-row" | "free";

/** Returns the layout type of a parent node from its props. */
export function detectParentLayout(parent: EditorNode): LayoutType {
  const { props } = parent;
  if (props.positionMode === "free") return "free";
  const display = String(props.display ?? "flex");
  const direction = String(props.flexDirection ?? "column");
  if (display === "grid") return "grid";
  if (display === "flex" && direction === "row") return "flex-row";
  return "column";
}

function defaultFreeSize(type: string): { width: number; height: number } {
  if (type === "heading")   return { width: 560, height: 80 };
  if (type === "text")      return { width: 480, height: 100 };
  if (type === "ctaButton") return { width: 200, height: 48 };
  if (type === "image")     return { width: 400, height: 240 };
  if (type === "section")   return { width: 720, height: 320 };
  if (type.includes("hero")) return { width: 960, height: 520 };
  if (type.includes("grid") || type.includes("services") || type.includes("testimonial")) {
    return { width: 880, height: 400 };
  }
  return { width: 440, height: 200 };
}

export interface NormalizeResult {
  props: NodeProps;
  parentId: NodeId;
}

/**
 * Normalizes node props before insertion based on the parent's layout.
 *
 * Rules:
 * - Locked blocks dropped on any non-root parent → redirected to rootId
 * - Free-layout parent → child gets positionMode:"free" + default size
 * - Flow layout parent (column/row/grid) → free-position props stripped
 */
export function normalizeInsertion(params: {
  type: string;
  props: NodeProps;
  parentId: NodeId;
  tree: EditorTree;
}): NormalizeResult {
  const { type, props, parentId, tree } = params;

  if (LOCKED_BLOCKS.has(type) && parentId !== tree.rootId) {
    return { props: stripFreeProps(props), parentId: tree.rootId };
  }

  const parent = tree.nodes[parentId];
  if (!parent) return { props, parentId };

  const layout = detectParentLayout(parent);

  if (layout === "free") {
    const offset = Math.min(parent.children.length * 20, 120);
    const { width, height } = defaultFreeSize(type);
    return {
      parentId,
      props: {
        width,
        height,
        ...props,
        positionMode: "free",
        x: Number.isFinite(Number(props.x)) ? Number(props.x) : 48 + offset,
        y: Number.isFinite(Number(props.y)) ? Number(props.y) : 48 + offset,
      },
    };
  }

  // column / flex-row / grid — strip any free-positioning
  return { parentId, props: stripFreeProps(props) };
}

function stripFreeProps(props: NodeProps): NodeProps {
  const next = { ...props };
  delete next.positionMode;
  delete next.x;
  delete next.y;
  delete next.width;
  delete next.height;
  delete next.zIndex;
  return next;
}
