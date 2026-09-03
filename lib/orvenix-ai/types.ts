import type {
  EditorTree,
  GlobalTheme,
  BrandKit,
  SEOMetadata,
  NodeProps,
} from "@/types/editor";

export type OrvenixAIIntent =
  | "create_site"
  | "redesign_site"
  | "improve_site"
  | "edit_content"
  | "edit_design"
  | "add_section"
  | "remove_section"
  | "reorder_sections"
  | "generate_copy"
  | "improve_seo"
  | "improve_conversion"
  | "improve_responsive"
  | "analyze_site"
  | "unknown";

export type OrvenixAIRisk =
  | "read"
  | "safe_write"
  | "structural_write"
  | "publish";

export type OrvenixAIOperation =
  | {
      type: "set_node_props";
      nodeId: string;
      props: NodeProps;
    }
  | {
      type: "set_theme";
      theme: Partial<GlobalTheme>;
    }
  | {
      type: "set_brand";
      brand: Partial<BrandKit>;
    }
  | {
      type: "set_seo";
      seo: Partial<SEOMetadata>;
    }
  | {
      type: "hide_node";
      nodeId: string;
      hidden: boolean;
    }
  | {
      type: "remove_node";
      nodeId: string;
    }
  | {
      type: "reorder_children";
      parentId: string;
      children: string[];
    };

export interface OrvenixAIContext {
  siteId?: string;
  userId?: string;
  tree?: EditorTree;

  request: string;

  business?: {
    name?: string;
    industry?: string;
    description?: string;
    location?: string;
    audience?: string;
    objective?: string;
  };
}

export interface OrvenixAIPlan {
  id: string;
  intent: OrvenixAIIntent;
  objective: string;
  reasoning: string[];
  operations: OrvenixAIOperation[];
  risk: OrvenixAIRisk;
  requiresExternalAI: boolean;
  requiresConfirmation: boolean;
}

export interface OrvenixAIQualityReport {
  score: number;

  design: number;
  content: number;
  conversion: number;
  seo: number;
  responsive: number;
  accessibility: number;

  problems: string[];
  recommendations: string[];
}

export interface OrvenixAIResult {
  ok: boolean;
  plan?: OrvenixAIPlan;
  quality?: OrvenixAIQualityReport;
  error?: string;
}
