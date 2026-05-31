import type { ComponentType, CSSProperties, ReactNode } from "react";

export type NodeId = string;
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";
export type DeviceMode = "desktop" | "lg" | "tablet" | "sm" | "mobile";
export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
export type PublishStatus = "idle" | "review" | "publishing" | "published" | "error";

export type NodeProps = Record<string, unknown> & {
  responsive?: ResponsiveContract;
  positionMode?: string;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  zIndex?: number;
  styleBackground?: string;
  styleOpacity?: number;
  stylePadding?: number;
  styleRadius?: number;
  styleBorderWidth?: number;
  styleBorderColor?: string;
  styleShadow?: string;
  _bindings?: Record<string, DataBinding>;
};

export type ResponsiveContract = Partial<Record<Breakpoint, NodeProps>>;

export interface DataBinding {
  collectionSlug: string;
  fieldSlug: string;
  recordId?: string;
  recordStatus?: "all" | "draft" | "review" | "published";
  [key: string]: unknown;
}

export interface EditorNode {
  id: NodeId;
  type: string;
  displayName?: string;
  props: NodeProps;
  children: NodeId[];
  hidden?: boolean;
  locked?: boolean;
  version: number;
  parentId?: NodeId;
}

export interface GlobalTheme {
  colors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fontHeading?: string;
  fontBody?: string;
  spacing?: {
    sectionX: string;
    sectionY: string;
    stack: string;
  };
  radius?: {
    card: string;
    button: string;
  };
  shadow?: {
    soft: string;
    strong: string;
  };
  motion?: {
    duration: string;
    easing: string;
  };
  [key: string]: unknown;
}

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  [key: string]: unknown;
}

export interface EditorComment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface EditorTree {
  rootId: NodeId;
  nodes: Record<NodeId, EditorNode>;
  theme?: GlobalTheme;
  globalTheme?: GlobalTheme;
  seo?: SEOMetadata;
  comments?: EditorComment[];
  [key: string]: unknown;
}

export interface EditorAsset {
  id: string;
  url: string;
  kind?: string;
  name?: string;
  type?: string;
  source?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface AssetPickerTarget {
  nodeId?: NodeId | null;
  propKey?: string;
  key?: string;
  field?: string;
  [key: string]: unknown;
}

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
}

export interface SettingsField {
  kind: string;
  key?: string;
  label: string;
  help?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  options?: readonly SelectOption[];
  fields?: readonly SettingsField[];
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  presets?: readonly string[];
  clearable?: boolean;
  [key: string]: unknown;
}

export interface GroupDef {
  label: string;
  fields: readonly SettingsField[];
  [key: string]: unknown;
}

export interface EditorBlockDefinition {
  type: string;
  label?: string;
  description?: string;
  category?: string;
  icon?: string;
  component?: ComponentType<unknown>;
  defaults?: NodeProps;
  settings?: SettingsField[];
  groups?: GroupDef[];
  children?: string[];
  acceptsChildren?: boolean;
  version?: number;
  [key: string]: unknown;
}

export type BlockComponentProps<P = Record<string, unknown>> = P & {
  id?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  isEditing?: boolean;
  siteId?: string | null;
};
