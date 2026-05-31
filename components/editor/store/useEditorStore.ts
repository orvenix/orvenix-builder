"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { produceWithPatches, applyPatches, enablePatches, type Patch, type Draft, setAutoFreeze } from "immer";
import type { EditorAsset, EditorTree, NodeId, NodeProps, DeviceMode, SaveStatus, PublishStatus, AssetPickerTarget } from "@/types/editor";
import { shouldCoalesce, coalesce, type HistoryEntry, HISTORY_LIMIT } from "@/components/editor/history";
import { editorDebug, editorError, editorWarn } from "@/components/editor/logger";
import { validateTree } from "@/types/validateTree";
import { applyResponsivePatch, hasResponsiveDevicePatch, pickResponsiveEditorProps, removeResponsiveDevicePatch, resolveResponsiveProps, shouldStorePatchInDevice } from "@/components/editor/responsive";
import { normalizeInsertion } from "@/lib/editor/layoutNormalizer";
import type { SitePageListItem } from "@/lib/builder-core/tree/sitePages";

export type { DeviceMode, SaveStatus } from "@/types/editor";

enablePatches();
setAutoFreeze(false); // Necesario para evitar errores de solo lectura con algunos componentes de terceros

export type SmartGuide =
  | { type: "vertical";   x: number; key: string; snapCorrectionX?: number }
  | { type: "horizontal"; y: number; key: string; snapCorrectionY?: number };

/** Canvas-level grid size in pixels, or 0 for off. */
export type CanvasGridSize = 8 | 16 | 24 | 0;

export type UserRole = "admin" | "client";
export type PurchaseType = "buy" | "rent" | null;
export type AlignAxis = "horizontal" | "vertical";
export type AlignMode = "start" | "center" | "end";

export type EditorContextMenuState = {
  isOpen: boolean;
  nodeId: NodeId | null;
  x: number;
  y: number;
};

export interface GlobalTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fontHeading: string;
  fontBody: string;
  spacing: {
    sectionX: string;
    sectionY: string;
    stack: string;
  };
  radius: {
    card: string;
    button: string;
  };
  shadow: {
    soft: string;
    strong: string;
  };
  motion: {
    duration: string;
    easing: string;
  };
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
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

type OrvenixChatBridge = {
  internalQuery: (
    prompt: string,
    hidden: boolean,
    context?: Record<string, unknown>
  ) => void;
};

function getOrvenixChat() {
  return (window as Window & { orvenixChat?: OrvenixChatBridge }).orvenixChat;
}

export interface EditorState {
  // Datos de la página
  websiteId: string | null;
  activePageSlug: string;
  activePageName: string;
  availablePages: SitePageListItem[];
  tree: EditorTree;
  
  // UI State
  selectedId: NodeId | null;
  selectedIds: NodeId[];
  editingNodeId: NodeId | null;
  hoveredId: NodeId | null;
  currentDevice: DeviceMode;
  isPreviewMode: boolean;
  isResponsivePreviewMode: boolean;
  isCommentMode: boolean;
  canvasZoom: number;
  lastCanvasPoint: { x: number; y: number } | null;
  smartGuides: SmartGuide[];
  contextMenu: EditorContextMenuState;
  clipboardTree: EditorTree | null;
  userRole: UserRole;
  purchaseType: PurchaseType;
  
  // Asset Picker
  assetPicker: {
    isOpen: boolean;
    target: AssetPickerTarget | null;
  };
  assetLibrary: EditorAsset[];

  // Estados de persistencia
  saveStatus: SaveStatus;
  publishStatus: PublishStatus;
  rev: number;
  lastSavedRev: number;
  lastError: string | null;

  // Historial
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  isApplyingHistory: boolean;

  // Acciones Core
  initialize: (
    id: string,
    tree: EditorTree,
    purchaseType?: PurchaseType,
    pageContext?: { activePageSlug?: string; activePageName?: string; availablePages?: SitePageListItem[] }
  ) => void;
  setWebsiteId: (id: string) => void;
  setActivePageContext: (pageContext: { activePageSlug: string; activePageName: string; availablePages?: SitePageListItem[] }) => void;
  setUserRole: (role: UserRole) => void;
  select: (id: NodeId | null, options?: { additive?: boolean }) => void;
  selectMany: (ids: NodeId[]) => void;
  selectNodesInRect: (rect: { x: number; y: number; width: number; height: number }) => void;
  setEditingNode: (id: NodeId | null) => void;
  hover: (id: NodeId | null) => void;
  setDevice: (device: DeviceMode) => void;
  copyDesktopLayoutToDevice: (device: Exclude<DeviceMode, "desktop">) => void;
  resetDeviceOverrides: (device: Exclude<DeviceMode, "desktop">) => void;
  setPreviewMode: (enabled: boolean) => void;
  setResponsivePreviewMode: (enabled: boolean) => void;
  setCommentMode: (enabled: boolean) => void;
  setCanvasZoom: (zoom: number) => void;
  setLastCanvasPoint: (point: { x: number; y: number } | null) => void;
  setSmartGuides: (guides: SmartGuide[]) => void;
  clearSmartGuides: () => void;
  openContextMenu: (nodeId: NodeId, position: { x: number; y: number }) => void;
  closeContextMenu: () => void;
  
  // Mutaciones del Árbol (con historial)
  updateNodeProps: (id: NodeId, props: NodeProps) => void;
  moveNodeToPosition: (id: NodeId, x: number, y: number) => void;
  moveFreeNodesByDelta: (ids: NodeId[], deltaX: number, deltaY: number) => void;
  resizeFreeNode: (id: NodeId, rect: { x: number; y: number; width: number; height: number }) => void;
  liberatePageLayout: () => void;
  alignSelectedFreeNodes: (axis: AlignAxis, mode: AlignMode) => void;
  distributeSelectedFreeNodes: (axis: AlignAxis) => void;
  groupSelectedFreeNodes: () => void;
  ungroupSelectedNodes: () => void;
  bringNodeToFront: (id: NodeId) => void;
  calculateSmartGuides: (movingId: NodeId, newX: number, newY: number, width: number, height: number) => SmartGuide[];
  sendNodeToBack: (id: NodeId) => void;
  reorderChildren: (parentId: NodeId, newChildren: NodeId[]) => void;
  addNode: (node: { type: string; parentId: NodeId; props?: NodeProps }) => void;
  insertTree: (params: { tree: EditorTree; parentId: NodeId }) => void;
  replaceTree: (tree: EditorTree, label?: string) => void;
  duplicateSelected: () => void;
  removeNode: (id: NodeId) => void;
  removeNodes: (ids: NodeId[]) => void;
  toggleNodeHidden: (id: NodeId) => void;
  toggleNodeLocked: (id: NodeId) => void;
  toggleSelectedHidden: () => void;
  toggleSelectedLocked: () => void;
  updateGlobalTheme: (patch: Partial<GlobalTheme> | ((t: GlobalTheme) => void)) => void;
  updateSEO: (patch: Partial<SEOMetadata>) => void;
  execute: (label: string, recipe: (draft: Draft<EditorState>) => void) => void;

  // Modo editor
  editorMode: 'visual' | 'dev';
  setEditorMode: (mode: 'visual' | 'dev') => void;

  // Canvas grid
  canvasGridSize: CanvasGridSize;
  setCanvasGridSize: (size: CanvasGridSize) => void;

  // SEO panel
  seoOpen: boolean;
  setSeoOpen: (open: boolean) => void;

  // Style clipboard
  styleClipboard: NodeProps | null;
  copyNodeStyles: (id: NodeId) => void;
  pasteNodeStyles: (id: NodeId) => void;

  // Wrap in container
  wrapInContainer: (ids: NodeId[], layout: "flex" | "grid") => void;

  // Layers panel highlight
  layersHighlightId: NodeId | null;
  highlightInLayers: (id: NodeId) => void;
  clearLayersHighlight: () => void;

  // DIFM / Comentarios
  addComment: (x: number, y: number, text: string) => void;
  resolveComment: (id: string) => void;
  requestReview: () => Promise<void>;
  publishWebsite: () => Promise<void>;
  
  // Historial Acciones
  undo: () => void;
  redo: () => void;
  saveToLocalStorage: () => void;
  saveToServer: () => Promise<{ success: boolean; error?: string }>;
  loadFromLocalStorage: () => void;
  markSaving: () => void;
  markSaved: (revSaved: number) => void;
  markError: (message: string) => void;

  // Nodo utilidades
  duplicateNode: (id: NodeId) => void;
  copyNode: (id: NodeId) => void;
  pasteNodeAfter: (targetId: NodeId) => void;
  pasteNodeAt: (parentId: NodeId, point: { x: number; y: number }) => void;
  moveNodeUp: (id: NodeId) => void;
  moveNodeDown: (id: NodeId) => void;

  // Asset Picker Acciones
  openAssetPicker: (target: AssetPickerTarget) => void;
  closeAssetPicker: () => void;
  addAssetToLibrary: (asset: Omit<EditorAsset, "id" | "createdAt"> & Partial<Pick<EditorAsset, "id" | "createdAt">>) => EditorAsset;
  selectAsset: (url: string) => void;
  applyIAText: (nodeId: NodeId, newText: string) => void;
  commitTextEdit: (nodeId: NodeId, field: string, value: string) => void;
  improveTextWithIA: (nodeId: NodeId, currentText: string) => Promise<void>;
  generateSectionWithIA: (prompt: string) => Promise<void>;
}

// Constantes de diseño profesional
const GUIDE_THRESHOLD = 5; // Píxeles de proximidad para activar la guía
const ASSET_LIBRARY_LIMIT = 24;

// Generador de IDs más robusto para producción
const nid = (): string => 
  typeof window !== 'undefined' && window.crypto?.randomUUID ? `n_${window.crypto.randomUUID().slice(0, 8)}` : `n_${Math.random().toString(36).slice(2, 10)}`;
const cid = (): string => `c_${Math.random().toString(36).slice(2, 10)}`;
const gid = (): string =>
  typeof window !== "undefined" && window.crypto?.randomUUID
    ? `g_${window.crypto.randomUUID().slice(0, 8)}`
    : `g_${Math.random().toString(36).slice(2, 10)}`;
const aid = (): string =>
  typeof window !== "undefined" && window.crypto?.randomUUID
    ? `a_${window.crypto.randomUUID().slice(0, 8)}`
    : `a_${Math.random().toString(36).slice(2, 10)}`;

function assetStorageKey(websiteId: string | null) {
  return `orvenix_assets_${websiteId ?? "draft"}`;
}

function loadAssetLibrary(websiteId: string | null): EditorAsset[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(assetStorageKey(websiteId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((asset): asset is EditorAsset =>
        asset &&
        typeof asset.id === "string" &&
        typeof asset.url === "string" &&
        typeof asset.name === "string" &&
        asset.type === "image" &&
        typeof asset.createdAt === "string"
      )
      .slice(0, ASSET_LIBRARY_LIMIT);
  } catch (error) {
    editorWarn("[EditorStore] No se pudo cargar la libreria de assets", error);
    return [];
  }
}

function saveAssetLibrary(websiteId: string | null, assets: EditorAsset[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      assetStorageKey(websiteId),
      JSON.stringify(assets.slice(0, ASSET_LIBRARY_LIMIT))
    );
  } catch (error) {
    editorWarn("[EditorStore] No se pudo guardar la libreria de assets", error);
  }
}

function cloneTreeWithFreshIds(incomingTree: EditorTree): EditorTree {
  const idMap: Record<string, string> = {};
  Object.keys(incomingTree.nodes).forEach((oldId) => {
    idMap[oldId] = nid();
  });

  const nodes: EditorTree["nodes"] = {};
  Object.entries(incomingTree.nodes).forEach(([oldId, node]) => {
    const newId = idMap[oldId];
    nodes[newId] = {
      ...node,
      id: newId,
      children: node.children.map((childId) => idMap[childId]).filter(Boolean),
      props: { ...node.props },
      version: node.version ?? 1,
    };
  });

  return {
    rootId: idMap[incomingTree.rootId],
    nodes,
  };
}

function collectDescendants(tree: EditorTree, nodeId: NodeId, collected = new Set<NodeId>()) {
  const node = tree.nodes[nodeId];
  if (!node) return collected;

  for (const childId of node.children) {
    if (collected.has(childId)) continue;
    collected.add(childId);
    collectDescendants(tree, childId, collected);
  }

  return collected;
}

function createSubtree(tree: EditorTree, rootId: NodeId): EditorTree | null {
  const root = tree.nodes[rootId];
  if (!root) return null;

  const nodes: EditorTree["nodes"] = {};
  const copyRecursive = (nodeId: NodeId) => {
    const node = tree.nodes[nodeId];
    if (!node) return;
    nodes[nodeId] = {
      ...node,
      props: { ...node.props },
      children: [...node.children],
    };
    node.children.forEach(copyRecursive);
  };

  copyRecursive(rootId);
  return { rootId, nodes };
}

export const useEditorStore = create<EditorState>()(subscribeWithSelector((set, get) => ({
  websiteId: null,
  activePageSlug: "home",
  activePageName: "Inicio",
  availablePages: [],
  tree: { rootId: "root", nodes: { root: { id: "root", type: "section", props: {}, children: [], version: 1 } } },
  selectedId: null,
  selectedIds: [],
  editingNodeId: null,
  hoveredId: null,
  currentDevice: "desktop",
  isPreviewMode: false,
  isResponsivePreviewMode: false,
  isCommentMode: false,
  userRole: "client", // Por defecto entramos como cliente
  purchaseType: null,
  canvasZoom: 100,
  lastCanvasPoint: null,
  smartGuides: [],
  editorMode: 'visual',
  canvasGridSize: 24 as CanvasGridSize,
  seoOpen: false,
  styleClipboard: null,
  layersHighlightId: null,
  contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 },
  clipboardTree: null,
  assetPicker: { isOpen: false, target: null },
  assetLibrary: [],
  saveStatus: "idle",
  publishStatus: "idle",
  rev: 0,
  lastSavedRev: 0,
  lastError: null,
  undoStack: [],
  redoStack: [],
  isApplyingHistory: false,

  initialize: (
    id: string,
    tree: EditorTree,
    purchaseType: PurchaseType = null,
    pageContext?: { activePageSlug?: string; activePageName?: string; availablePages?: SitePageListItem[] }
  ) => {
    let safeTree: EditorTree;
    try {
      safeTree = validateTree(tree);
    } catch {
      safeTree = tree;
    }
    set({
      websiteId: id,
      activePageSlug: pageContext?.activePageSlug ?? "home",
      activePageName: pageContext?.activePageName ?? "Inicio",
      availablePages: pageContext?.availablePages ?? [],
      tree: safeTree,
      purchaseType,
      selectedId: null,
      selectedIds: [],
      editingNodeId: null,
      hoveredId: null,
      isPreviewMode: false,
      isCommentMode: false,
      smartGuides: [],
      contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 },
      assetLibrary: loadAssetLibrary(id),
      rev: 0,
      lastSavedRev: 0,
      lastError: null,
      saveStatus: "idle",
      publishStatus: "idle",
      undoStack: [],
      redoStack: [],
      isApplyingHistory: false,
    });
  },

  setWebsiteId: (id: string) => set({ websiteId: id, assetLibrary: loadAssetLibrary(id) }),

  setActivePageContext: ({ activePageSlug, activePageName, availablePages }) =>
    set({
      activePageSlug,
      activePageName,
      ...(availablePages ? { availablePages } : {}),
    }),

  setUserRole: (role: UserRole) => set({ userRole: role }),

  saveToLocalStorage: () => {
    const { tree, websiteId, activePageSlug } = get();
    if (!websiteId) return;
    const data = JSON.stringify({ tree, timestamp: Date.now() });
    localStorage.setItem(`orvenix_backup_${websiteId}:${activePageSlug}`, data);
    editorDebug("[EditorStore] Backup local guardado.");
  },

  saveToServer: async () => {
    const { tree, websiteId, activePageSlug, markSaving, markSaved, markError } = get();
    if (!websiteId || websiteId.startsWith("draft:")) return { success: false, error: "ID de borrador no válido para el servidor" };

    markSaving();
    try {
      const response = await fetch(`/api/editor/${websiteId}?page=${encodeURIComponent(activePageSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tree }),
      });

      if (!response.ok) throw new Error("Fallo al guardar en DB");
      
      markSaved(get().rev);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      markError(msg);
      return { success: false, error: msg };
    }
  },

  loadFromLocalStorage: () => {
    const { websiteId, activePageSlug } = get();
    if (!websiteId) return;
    const saved = localStorage.getItem(`orvenix_backup_${websiteId}:${activePageSlug}`);
    if (saved) {
      try {
        const { tree } = JSON.parse(saved);
        set({ tree, rev: get().rev + 1, saveStatus: "dirty" });
        editorDebug("[EditorStore] Backup local recuperado.");
      } catch (e) {
        editorError("[EditorStore] Error al cargar backup local", e);
      }
    }
  },

  select: (id: NodeId | null, options?: { additive?: boolean }) =>
    set((state) => {
      if (!id) return { selectedId: null, selectedIds: [], editingNodeId: null };
      if (!options?.additive) return { selectedId: id, selectedIds: [id] };

      const exists = state.selectedIds.includes(id);
      const selectedIds = exists
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id];

      return {
        selectedId: selectedIds[selectedIds.length - 1] ?? null,
        selectedIds,
        editingNodeId: state.editingNodeId && selectedIds.includes(state.editingNodeId) ? state.editingNodeId : null,
      };
    }),
  selectMany: (ids: NodeId[]) => {
    const selectedIds = Array.from(new Set(ids));
    set({
      selectedId: selectedIds[selectedIds.length - 1] ?? null,
      selectedIds,
      editingNodeId: null,
    });
  },

  selectNodesInRect: (rect) => {
    const { tree, currentDevice } = get();
    const ids: NodeId[] = [];

    // Lógica de intersección simple
    Object.values(tree.nodes).forEach((node) => {
      if (node.id === tree.rootId) return;
      
      const props = resolveResponsiveProps(node.props, currentDevice);
      if (props.positionMode !== "free") return;

      const nodeX = Number(props.x ?? 0);
      const nodeY = Number(props.y ?? 0);
      const nodeW = Number(props.width ?? 100);
      const nodeH = Number(props.height ?? 50);

      if (nodeX >= rect.x && nodeX + nodeW <= rect.x + rect.width &&
          nodeY >= rect.y && nodeY + nodeH <= rect.y + rect.height) {
        ids.push(node.id);
      }
    });
    get().selectMany(ids);
  },

  setEditingNode: (id: NodeId | null) => set({ editingNodeId: id }),
  hover: (id: NodeId | null) => set({ hoveredId: id }),
  setDevice: (device: DeviceMode) => set({ currentDevice: device }),
  copyDesktopLayoutToDevice: (device: Exclude<DeviceMode, "desktop">) =>
    get().execute(`copy-desktop-layout:${device}`, (draft) => {
      Object.values(draft.tree.nodes).forEach((node) => {
        const desktopPatch = pickResponsiveEditorProps(node.props);
        if (Object.keys(desktopPatch).length === 0) return;

        node.props = applyResponsivePatch(
          node.props,
          device,
          scaleResponsiveLayout(desktopPatch, device)
        );
        node.version = (node.version ?? 0) + 1;
      });

      draft.currentDevice = device;
      draft.selectedId = null;
      draft.selectedIds = [];
      draft.editingNodeId = null;
      draft.hoveredId = null;
      draft.smartGuides = [];
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    }),
  resetDeviceOverrides: (device: Exclude<DeviceMode, "desktop">) =>
    get().execute(`reset-device-overrides:${device}`, (draft) => {
      Object.values(draft.tree.nodes).forEach((node) => {
        if (!hasResponsiveDevicePatch(node.props, device)) return;
        node.props = removeResponsiveDevicePatch(node.props, device);
        node.version = (node.version ?? 0) + 1;
      });

      draft.currentDevice = device;
      draft.selectedId = null;
      draft.selectedIds = [];
      draft.editingNodeId = null;
      draft.hoveredId = null;
      draft.smartGuides = [];
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    }),
  setPreviewMode: (enabled: boolean) =>
    set({
      isPreviewMode: enabled,
      isResponsivePreviewMode: enabled ? get().isResponsivePreviewMode : false,
      isCommentMode: false,
      selectedId: null,
      selectedIds: [],
      editingNodeId: null,
      hoveredId: null,
      smartGuides: [],
      contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 },
    }),

  setResponsivePreviewMode: (enabled: boolean) =>
    set({
      isResponsivePreviewMode: enabled,
      isPreviewMode: enabled ? true : get().isPreviewMode,
      isCommentMode: false,
      selectedId: null,
      selectedIds: [],
      editingNodeId: null,
      hoveredId: null,
      smartGuides: [],
      contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 },
    }),

  setCommentMode: (enabled: boolean) =>
    set({
      isCommentMode: enabled,
      isPreviewMode: false,
      isResponsivePreviewMode: false,
      selectedId: null,
      selectedIds: [],
      editingNodeId: null,
      contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 },
    }),

  setCanvasZoom: (zoom: number) => set({ canvasZoom: zoom }),
  setLastCanvasPoint: (point) => set({ lastCanvasPoint: point }),
  setSmartGuides: (guides: SmartGuide[]) => set({ smartGuides: guides }),
  clearSmartGuides: () => set({ smartGuides: [] }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setCanvasGridSize: (size) => set({ canvasGridSize: size }),
  setSeoOpen: (open) => set({ seoOpen: open }),

  copyNodeStyles: (id) => {
    const node = get().tree.nodes[id];
    if (!node) return;
    const STYLE_KEYS = ["styleBackground", "styleOpacity", "stylePadding", "styleRadius", "styleBorderWidth", "styleBorderColor", "styleShadow", "customCss"];
    const styleProps = Object.fromEntries(
      Object.entries(node.props).filter(([k]) => STYLE_KEYS.includes(k))
    );
    set({ styleClipboard: styleProps });
  },

  pasteNodeStyles: (id) => {
    const { styleClipboard } = get();
    if (!styleClipboard || !id) return;
    get().execute(`paste-styles:${id}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (!node || node.locked) return;
      node.props = { ...node.props, ...styleClipboard };
      node.version = (node.version ?? 0) + 1;
    });
  },

  wrapInContainer: (ids, layout) => {
    if (ids.length === 0) return;
    const containerId = nid();
    get().execute(`wrap-in-${layout}`, (draft) => {
      const parent = Object.values(draft.tree.nodes).find((n) => ids.every((id) => n.children.includes(id)));
      if (!parent) return;

      const firstIndex = Math.min(...ids.map((id) => parent.children.indexOf(id)).filter((i) => i >= 0));
      const containerProps: NodeProps = layout === "grid"
        ? { display: "grid", maxWidth: "lg", paddingY: "md", paddingX: "md" }
        : { display: "flex", flexDirection: "column", maxWidth: "lg", paddingY: "md", paddingX: "md" };

      draft.tree.nodes[containerId] = {
        id: containerId, type: "section",
        props: containerProps, children: [...ids], version: 1,
      };
      ids.forEach((id) => {
        const idx = parent.children.indexOf(id);
        if (idx >= 0) parent.children.splice(idx, 1);
      });
      parent.children.splice(firstIndex, 0, containerId);
      draft.selectedId = containerId;
      draft.selectedIds = [containerId];
    });
  },

  highlightInLayers: (id) => set({ layersHighlightId: id }),
  clearLayersHighlight: () => set({ layersHighlightId: null }),
  openContextMenu: (nodeId: NodeId, position: { x: number; y: number }) =>
    set({ contextMenu: { isOpen: true, nodeId, x: position.x, y: position.y } }),
  closeContextMenu: () =>
    set({ contextMenu: { isOpen: false, nodeId: null, x: 0, y: 0 } }),

  // Sistema de ejecución de comandos con captura de parches
  execute: (label: string, recipe: (draft: Draft<EditorState>) => void) => {
    const currentState = get();
    const selectionBefore = currentState.selectedId;

    let patches: Patch[] = [];
    let inversePatches: Patch[] = [];

    const [nextState, nextPatches, nextInverse] = produceWithPatches<EditorState>(
      currentState,
      (draft: Draft<EditorState>) => {
        try {
          recipe(draft);
          validateTree(draft.tree);
        } catch (err) {
          editorError("[EditorStore] Operación abortada por validación fallida", err);
          return;
        }
        draft.rev += 1;
        draft.saveStatus = "dirty";
      }
    );

    patches = nextPatches;
    inversePatches = nextInverse;

    const entry: HistoryEntry = {
      patches,
      inversePatches,
      label,
      timestamp: Date.now(),
      selectionBefore,
      selectionAfter: nextState.selectedId,
    };

    set((state: EditorState) => {
      const last = state.undoStack[state.undoStack.length - 1];
      const newStack = shouldCoalesce(last, entry)
        ? [...state.undoStack.slice(0, -1), coalesce(last, entry)]
        : [...state.undoStack, entry].slice(-HISTORY_LIMIT);

      return {
        ...nextState,
        undoStack: newStack,
        redoStack: [], // Limpiar redo al hacer nueva acción
      };
    });

    // Auto-save en cada ejecución de comando (Nivel 1)
    // Usar debounce en producción para no saturar el disco
    get().saveToLocalStorage();
  },

  addComment: (x, y, text) => {
    get().execute("add-comment", (draft) => {
      if (!draft.tree.comments) draft.tree.comments = [];
      const id = cid();
      draft.tree.comments.push({
        id,
        x,
        y,
        text,
        author: "Cliente", // En el futuro usar datos de la sesión
        status: "open",
        createdAt: new Date().toISOString(),
      });
    });
  },

  resolveComment: (id) => {
    get().execute("resolve-comment", (draft) => {
      const comment = draft.tree.comments?.find((entry) => entry.id === id);
      if (comment) {
        comment.status = "resolved";
      }
    });
  },

  requestReview: async () => {
    const { websiteId, saveToServer } = get();
    if (!websiteId) return;

    // Primero nos aseguramos de que los cambios actuales se guarden
    await saveToServer();

    set({ publishStatus: "review" });
    // Aquí llamarías a una API que cambie el estado en la base de datos
    await fetch(`/api/editor/${websiteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "review" }),
    });
    editorDebug("[EditorStore] Revisión solicitada al equipo Orvenix.");
  },

  publishWebsite: async () => {
    const { websiteId, saveToServer } = get();
    if (!websiteId) return;

    await saveToServer();

    set({ publishStatus: "published" });
    await fetch(`/api/editor/${websiteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    editorDebug("[EditorStore] Sitio publicado oficialmente.");
  },

  updateNodeProps: (id: NodeId, props: NodeProps) => 
    get().execute(`edit-prop:${id}:${Object.keys(props)[0]}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (node) {
        if (node.locked) return;
        node.props = shouldStorePatchInDevice(props)
          ? applyResponsivePatch(node.props, draft.currentDevice, props)
          : { ...node.props, ...props };
        node.version = (node.version ?? 0) + 1;
      }
    }),

  moveNodeToPosition: (id: NodeId, x: number, y: number) =>
    get().execute(`move-free-node:${id}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (!node) return;
      node.props = applyResponsivePatch(node.props, draft.currentDevice, {
        positionMode: "free",
        x,
        y,
      });
      node.version = (node.version ?? 0) + 1;
    }),

  moveFreeNodesByDelta: (ids: NodeId[], deltaX: number, deltaY: number) =>
    get().execute(`move-free-nodes:${ids.join(",")}`, (draft) => {
      const uniqueIds = Array.from(new Set(ids));
      uniqueIds.forEach((id) => {
        const node = draft.tree.nodes[id];
        if (!node || node.locked) return;
        const resolvedProps = resolveResponsiveProps(node.props, draft.currentDevice);
        if (resolvedProps.positionMode !== "free") return;
        const currentX = Number(resolvedProps.x ?? 0);
        const currentY = Number(resolvedProps.y ?? 0);
        const currentW = Number(resolvedProps.width ?? 100);
        const currentH = Number(resolvedProps.height ?? 50);

        const nextX = Math.round(currentX + deltaX);
        const nextY = Math.round(currentY + deltaY);
        
        // Calcular guías inteligentes contra otros nodos (Nivel 2)
        draft.smartGuides = get().calculateSmartGuides(id, nextX, nextY, currentW, currentH);

        node.props = applyResponsivePatch(node.props, draft.currentDevice, {
          positionMode: "free",
          x: Math.max(0, nextX),
          y: Math.max(0, nextY),
        });
        node.version = (node.version ?? 0) + 1;
      });
    }),

  resizeFreeNode: (id, rect) =>
    get().execute(`resize-free-node:${id}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (!node || node.locked) return;
      node.props = applyResponsivePatch(node.props, draft.currentDevice, {
        positionMode: "free",
        x: Math.max(0, Math.round(rect.x)),
        y: Math.max(0, Math.round(rect.y)),
        width: Math.max(80, Math.round(rect.width)),
        height: Math.max(40, Math.round(rect.height)),
      });
      node.version = (node.version ?? 0) + 1;
    }),

  liberatePageLayout: () =>
    get().execute("liberate-page-layout", (draft) => {
      const root = draft.tree.nodes[draft.tree.rootId];
      if (!root) return;

      const columnGap = 32;
      const rowGap = 32;
      const canvasWidth = DEVICE_CANVAS_WIDTH[draft.currentDevice];
      const maxWidth = Math.max(280, canvasWidth - 96);
      let x = 48;
      let y = 48;
      let rowHeight = 0;

      root.children.forEach((nodeId, index) => {
        const node = draft.tree.nodes[nodeId];
        if (!node) return;

        const resolved = resolveResponsiveProps(node.props, draft.currentDevice);
        const fallback = getDefaultFreeNodeSize(node.type);
        const width = Math.min(
          maxWidth,
          Math.max(120, toFiniteNumberValue(resolved.width, fallback.width))
        );
        const height = Math.max(56, toFiniteNumberValue(resolved.height, fallback.height));

        if (x + width > canvasWidth - 48 && x > 48) {
          x = 48;
          y += rowHeight + rowGap;
          rowHeight = 0;
        }

        node.props = applyResponsivePatch(node.props, draft.currentDevice, {
          positionMode: "free",
          x,
          y,
          width,
          height,
          zIndex: toFiniteNumberValue(resolved.zIndex, index + 1),
          snapToGrid: resolved.snapToGrid ?? true,
          gridSize: toFiniteNumberValue(resolved.gridSize, 24),
        });
        node.version = (node.version ?? 0) + 1;

        x += width + columnGap;
        rowHeight = Math.max(rowHeight, height);
      });

      draft.selectedId = root.children[0] ?? null;
      draft.selectedIds = draft.selectedId ? [draft.selectedId] : [];
      draft.editingNodeId = null;
      draft.hoveredId = null;
      draft.smartGuides = [];
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    }),

  alignSelectedFreeNodes: (axis, mode) =>
    get().execute(`align-selected:${axis}:${mode}`, (draft) => {
      const rects = getSelectedFreeRects(draft);
      if (rects.length < 2) return;

      const bounds = getSelectionBounds(rects);
      rects.forEach((rect) => {
        const node = draft.tree.nodes[rect.id];
        if (!node || node.locked) return;

        const patch =
          axis === "horizontal"
            ? {
                x:
                  mode === "start"
                    ? bounds.left
                    : mode === "center"
                      ? bounds.centerX - rect.width / 2
                      : bounds.right - rect.width,
              }
            : {
                y:
                  mode === "start"
                    ? bounds.top
                    : mode === "center"
                      ? bounds.centerY - rect.height / 2
                      : bounds.bottom - rect.height,
              };

        node.props = applyResponsivePatch(node.props, draft.currentDevice, roundPositionPatch(patch));
        node.version = (node.version ?? 0) + 1;
      });
    }),

  distributeSelectedFreeNodes: (axis) =>
    get().execute(`distribute-selected:${axis}`, (draft) => {
      const rects = getSelectedFreeRects(draft);
      if (rects.length < 3) return;

      const sorted = [...rects].sort((a, b) =>
        axis === "horizontal" ? a.x - b.x : a.y - b.y
      );
      const bounds = getSelectionBounds(sorted);
      const totalSize = sorted.reduce(
        (total, rect) => total + (axis === "horizontal" ? rect.width : rect.height),
        0
      );
      const span = axis === "horizontal" ? bounds.right - bounds.left : bounds.bottom - bounds.top;
      const gap = (span - totalSize) / (sorted.length - 1);
      if (!Number.isFinite(gap)) return;

      let cursor = axis === "horizontal" ? bounds.left : bounds.top;
      sorted.forEach((rect) => {
        const node = draft.tree.nodes[rect.id];
        if (!node || node.locked) return;

        node.props = applyResponsivePatch(
          node.props,
          draft.currentDevice,
          roundPositionPatch(axis === "horizontal" ? { x: cursor } : { y: cursor })
        );
        node.version = (node.version ?? 0) + 1;
        cursor += (axis === "horizontal" ? rect.width : rect.height) + gap;
      });
    }),

  groupSelectedFreeNodes: () => {
    const { selectedIds, tree, currentDevice } = get();
    const ids = selectedIds.filter((id) => {
      const node = tree.nodes[id];
      const props = resolveResponsiveProps(node?.props, currentDevice);
      return id !== tree.rootId && node && !node.locked && props.positionMode === "free";
    });
    if (ids.length < 2) return;

    get().execute("group-selected-free-nodes", (draft) => {
      const groupId = gid();
      ids.forEach((id) => {
        const node = draft.tree.nodes[id];
        if (!node || node.locked) return;
        node.props = { ...node.props, groupId };
        node.version = (node.version ?? 0) + 1;
      });
      draft.selectedIds = ids;
      draft.selectedId = ids[ids.length - 1] ?? null;
    });
  },

  ungroupSelectedNodes: () => {
    const { selectedIds, tree } = get();
    const groupIds = new Set(
      selectedIds
        .map((id) => tree.nodes[id]?.props.groupId)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    );
    if (groupIds.size === 0) return;

    get().execute("ungroup-selected-nodes", (draft) => {
      Object.values(draft.tree.nodes).forEach((node) => {
        if (!node.props.groupId || !groupIds.has(String(node.props.groupId))) return;
        node.props = { ...node.props };
        delete node.props.groupId;
        node.version = (node.version ?? 0) + 1;
      });
    });
  },

  calculateSmartGuides: (movingId, newX, newY, movingW, movingH) => {
    const { tree, currentDevice } = get();
    const guides: SmartGuide[] = [];
    
    // Puntos de interés del nodo que se mueve
    const movingX = [newX, newX + movingW / 2, newX + movingW]; // Izquierda, Centro, Derecha
    const movingY = [newY, newY + movingH / 2, newY + movingH]; // Arriba, Medio, Abajo

    Object.values(tree.nodes).forEach(target => {
      if (target.id === movingId || target.id === tree.rootId) return;
      
      const tProps = resolveResponsiveProps(target.props, currentDevice);
      if (tProps.positionMode !== "free") return;

      const tx = Number(tProps.x ?? 0);
      const ty = Number(tProps.y ?? 0);
      const tw = Number(tProps.width ?? 100);
      const th = Number(tProps.height ?? 50);

      const targetX = [tx, tx + tw / 2, tx + tw];
      const targetY = [ty, ty + th / 2, ty + th];

      // Comprobar alineaciones verticales
      movingX.forEach(mx => {
        targetX.forEach(txPos => {
          if (Math.abs(mx - txPos) < GUIDE_THRESHOLD) {
            guides.push({ 
              type: "vertical", 
              x: txPos, 
              key: `v-${target.id}-${txPos}` 
            });
          }
        });
      });

      // Comprobar alineaciones horizontales
      movingY.forEach(my => {
        targetY.forEach(tyPos => {
          if (Math.abs(my - tyPos) < GUIDE_THRESHOLD) {
            guides.push({ 
              type: "horizontal", 
              y: tyPos, 
              key: `h-${target.id}-${tyPos}` 
            });
          }
        });
      });
    });

    return guides;
  },

  bringNodeToFront: (id: NodeId) =>
    get().execute(`bring-to-front:${id}`, (draft) => {
      if (draft.tree.nodes[id]?.locked) return;
      const parent = Object.values(draft.tree.nodes).find(n => n.children.includes(id));
      if (!parent) return;
      
      // En editores Pro, "Traer al frente" significa ser el último en el array de hijos
      const idx = parent.children.indexOf(id);
      parent.children.splice(idx, 1);
      parent.children.push(id);

      const node = draft.tree.nodes[id];
      const maxZIndex = parent.children.reduce((max, childId) => {
        const child = draft.tree.nodes[childId];
        const props = resolveResponsiveProps(child?.props, draft.currentDevice);
        const zIndex = Number(props.zIndex ?? 0);
        return Number.isFinite(zIndex) ? Math.max(max, zIndex) : max;
      }, 0);
      node.props = applyResponsivePatch(node.props, draft.currentDevice, { zIndex: maxZIndex + 1 });
      node.version = (node.version ?? 0) + 1;
    }),

  sendNodeToBack: (id: NodeId) =>
    get().execute(`send-to-back:${id}`, (draft) => {
      if (draft.tree.nodes[id]?.locked) return;
      const parent = Object.values(draft.tree.nodes).find(n => n.children.includes(id));
      if (!parent) return;
      
      // "Enviar al fondo" significa ser el primero en el array
      const idx = parent.children.indexOf(id);
      parent.children.splice(idx, 1);
      parent.children.unshift(id);

      const node = draft.tree.nodes[id];
      const minZIndex = parent.children.reduce((min, childId) => {
        const child = draft.tree.nodes[childId];
        const props = resolveResponsiveProps(child?.props, draft.currentDevice);
        const zIndex = Number(props.zIndex ?? 0);
        return Number.isFinite(zIndex) ? Math.min(min, zIndex) : min;
      }, 0);
      node.props = applyResponsivePatch(node.props, draft.currentDevice, { zIndex: minZIndex - 1 });
      node.version = (node.version ?? 0) + 1;
    }),

  reorderChildren: (parentId: NodeId, newChildren: NodeId[]) =>
    get().execute("reorder-layers", (draft) => {
      const parent = draft.tree.nodes[parentId];
      if (parent) parent.children = newChildren;
    }),

  addNode: ({ type, parentId, props = {} }: { type: string; parentId: NodeId; props?: NodeProps }) => {
    const newId = nid();
    const { props: normalizedProps, parentId: resolvedParentId } = normalizeInsertion({
      type, props, parentId, tree: get().tree,
    });
    get().execute(`add-node:${type}`, (draft) => {
      const parent = draft.tree.nodes[resolvedParentId];
      if (!parent) return;

      draft.tree.nodes[newId] = {
        id: newId,
        type,
        props: normalizedProps,
        children: [],
        version: 1,
      };
      parent.children.push(newId);
      draft.selectedId = newId;
      draft.selectedIds = [newId];
    });
  },

  insertTree: ({ tree: incomingTree, parentId }: { tree: EditorTree; parentId: NodeId }) => {
    const incomingRoot = incomingTree.nodes[incomingTree.rootId];
    const rootType = incomingRoot?.type ?? "";
    const { props: normalizedRootProps, parentId: resolvedParentId } = normalizeInsertion({
      type: rootType,
      props: incomingRoot?.props ?? {},
      parentId,
      tree: get().tree,
    });

    get().execute("insert-template", (draft) => {
      const parent = draft.tree.nodes[resolvedParentId];
      if (!parent) return;

      const clonedTree = cloneTreeWithFreshIds(incomingTree);
      const clonedRoot = clonedTree.nodes[clonedTree.rootId];
      if (!clonedRoot) return;
      clonedRoot.props = normalizedRootProps;
      Object.assign(draft.tree.nodes, clonedTree.nodes);

      parent.children.push(clonedTree.rootId);
      draft.selectedId = clonedTree.rootId;
      draft.selectedIds = [clonedTree.rootId];
    });
  },

  replaceTree: (incomingTree: EditorTree, label = "replace-template") => {
    get().execute(label, (draft) => {
      const clonedTree = cloneTreeWithFreshIds(incomingTree);
      const currentRoot = draft.tree.nodes[draft.tree.rootId];
      const incomingRoot = clonedTree.nodes[clonedTree.rootId];
      if (!currentRoot || !incomingRoot) return;

      const oldDescendants = collectDescendants(draft.tree, draft.tree.rootId);
      oldDescendants.forEach((nodeId) => {
        delete draft.tree.nodes[nodeId];
      });

      Object.entries(clonedTree.nodes).forEach(([nodeId, node]) => {
        if (nodeId === clonedTree.rootId) return;
        draft.tree.nodes[nodeId] = node;
      });

      currentRoot.type = incomingRoot.type;
      currentRoot.props = { ...incomingRoot.props };
      currentRoot.children = [...incomingRoot.children];
      currentRoot.version = incomingRoot.version ?? currentRoot.version ?? 1;
      draft.hoveredId = null;
      draft.selectedId = draft.tree.rootId;
      draft.selectedIds = [draft.tree.rootId];
    });
  },

  duplicateSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    
    get().execute("duplicate-selection", (draft) => {
      const newIds: NodeId[] = [];
      
      selectedIds.forEach(id => {
        if (id === draft.tree.rootId || draft.tree.nodes[id]?.locked) return;
        
        const idMap: Record<string, string> = {};
        const collectIds = (nodeId: string) => {
          idMap[nodeId] = nid();
          const n = draft.tree.nodes[nodeId];
          if (n) n.children.forEach(collectIds);
        };
        
        collectIds(id);
        Object.entries(idMap).forEach(([srcId, dstId]) => {
          const src = draft.tree.nodes[srcId];
          if (!src) return;
          draft.tree.nodes[dstId] = {
            ...src, id: dstId,
            children: src.children.map(c => idMap[c] ?? c),
            version: 1,
          };
        });

        const parent = Object.values(draft.tree.nodes).find(n => n.children.includes(id));
        if (parent) {
          parent.children.splice(parent.children.indexOf(id) + 1, 0, idMap[id]);
          newIds.push(idMap[id]);
        }
      });
      draft.selectedIds = newIds;
    });
  },

  /**
   * Limpia todas las selecciones actuales.
   */
  clearSelection: () => set({ 
    selectedId: null, 
    selectedIds: [], 
    editingNodeId: null 
  }),

  removeNode: (id: NodeId) => {
    const state = get();
    if (id === state.tree.rootId || state.tree.nodes[id]?.locked) return;

    get().execute(`remove-node:${id}`, (draft) => {
      const nodes = Object.values(draft.tree.nodes);
      const parent = nodes.find((n) => n.children.includes(id));
      if (parent) {
        parent.children = parent.children.filter((childId) => childId !== id);
      }

      const deleteRecursive = (nodeId: NodeId) => {
        const node = draft.tree.nodes[nodeId];
        if (!node) return;
        node.children.forEach(deleteRecursive);
        delete draft.tree.nodes[nodeId];
      };
      deleteRecursive(id);
      draft.selectedId = null;
      draft.selectedIds = [];
      draft.editingNodeId = null;
    });
  },

  removeNodes: (ids: NodeId[]) => {
    const state = get();
    const idsToRemove = Array.from(new Set(ids)).filter(
      (id) => id !== state.tree.rootId && !state.tree.nodes[id]?.locked
    );
    if (idsToRemove.length === 0) return;

    get().execute(`remove-nodes:${idsToRemove.join(",")}`, (draft) => {
      const removalSet = new Set(idsToRemove);
      const isDescendantOfRemoved = (nodeId: NodeId) => {
        for (const removedId of removalSet) {
          if (removedId === nodeId) continue;
          if (collectDescendants(draft.tree, removedId).has(nodeId)) return true;
        }
        return false;
      };

      const rootsToRemove = idsToRemove.filter((id) => !isDescendantOfRemoved(id));
      Object.values(draft.tree.nodes).forEach((node) => {
        node.children = node.children.filter((childId) => !rootsToRemove.includes(childId));
      });

      const deleteRecursive = (nodeId: NodeId) => {
        const node = draft.tree.nodes[nodeId];
        if (!node) return;
        node.children.forEach(deleteRecursive);
        delete draft.tree.nodes[nodeId];
      };

      rootsToRemove.forEach(deleteRecursive);
      draft.selectedId = null;
      draft.selectedIds = [];
      draft.editingNodeId = null;
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    });
  },

  toggleNodeHidden: (id: NodeId) => {
    const state = get();
    if (id === state.tree.rootId) return;

    get().execute(`toggle-hidden:${id}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (!node) return;
      node.hidden = !node.hidden;
      node.version = (node.version ?? 0) + 1;
      if (node.hidden && draft.editingNodeId === id) draft.editingNodeId = null;
    });
  },

  toggleNodeLocked: (id: NodeId) => {
    const state = get();
    if (id === state.tree.rootId) return;

    get().execute(`toggle-locked:${id}`, (draft) => {
      const node = draft.tree.nodes[id];
      if (!node) return;
      node.locked = !node.locked;
      node.version = (node.version ?? 0) + 1;
      if (node.locked && draft.editingNodeId === id) draft.editingNodeId = null;
    });
  },

  toggleSelectedHidden: () => {
    const { selectedIds, tree } = get();
    const ids = selectedIds.filter((id) => id !== tree.rootId && tree.nodes[id]);
    if (ids.length === 0) return;
    const shouldHide = ids.some((id) => !tree.nodes[id]?.hidden);

    get().execute("toggle-selected-hidden", (draft) => {
      ids.forEach((id) => {
        const node = draft.tree.nodes[id];
        if (!node) return;
        node.hidden = shouldHide;
        node.version = (node.version ?? 0) + 1;
      });
      if (shouldHide && draft.editingNodeId && ids.includes(draft.editingNodeId)) {
        draft.editingNodeId = null;
      }
    });
  },

  toggleSelectedLocked: () => {
    const { selectedIds, tree } = get();
    const ids = selectedIds.filter((id) => id !== tree.rootId && tree.nodes[id]);
    if (ids.length === 0) return;
    const shouldLock = ids.some((id) => !tree.nodes[id]?.locked);

    get().execute("toggle-selected-locked", (draft) => {
      ids.forEach((id) => {
        const node = draft.tree.nodes[id];
        if (!node) return;
        node.locked = shouldLock;
        node.version = (node.version ?? 0) + 1;
      });
      if (shouldLock && draft.editingNodeId && ids.includes(draft.editingNodeId)) {
        draft.editingNodeId = null;
      }
    });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    set((state: EditorState) => ({
      ...applyPatches(state, entry.inversePatches),
      undoStack: undoStack.slice(0, -1),
      redoStack: [entry, ...redoStack],
      selectedId: entry.selectionBefore,
      selectedIds: entry.selectionBefore ? [entry.selectionBefore] : [],
      editingNodeId: null,
    }));
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const entry = redoStack[0];
    set((state: EditorState) => ({
      ...applyPatches(state, entry.patches),
      undoStack: [...undoStack, entry],
      redoStack: redoStack.slice(1),
      selectedId: entry.selectionAfter,
      selectedIds: entry.selectionAfter ? [entry.selectionAfter] : [],
      editingNodeId: null,
    }));
  },

  markSaving: () => set({ saveStatus: "saving", lastError: null }),
  markSaved: (revSaved: number) => set((s: EditorState) => ({
    lastSavedRev: revSaved,
    saveStatus: s.rev > revSaved ? "dirty" : "saved",
  })),
  markError: (message: string) => set({ saveStatus: "error", lastError: message }),
  
  duplicateNode: (id: NodeId) => {
    const state = get();
    if (id === state.tree.rootId || state.tree.nodes[id]?.locked) return;
    get().execute("duplicate-node", (draft) => {
      const idMap: Record<string, string> = {};
      const collectIds = (nodeId: string) => {
        idMap[nodeId] = nid();
        const n = draft.tree.nodes[nodeId];
        if (n) n.children.forEach(collectIds);
      };
      collectIds(id);
      Object.entries(idMap).forEach(([srcId, dstId]) => {
        const src = draft.tree.nodes[srcId];
        if (!src) return;
        draft.tree.nodes[dstId] = {
          id: dstId,
          type: src.type,
          props: { ...src.props },
          children: src.children.map((c) => idMap[c] ?? c),
          version: 1,
        };
      });
      const parent = Object.values(draft.tree.nodes).find((n) =>
        n.children.includes(id)
      );
      if (parent) {
        const idx = parent.children.indexOf(id);
        parent.children.splice(idx + 1, 0, idMap[id]);
      }
      draft.selectedId = idMap[id];
      draft.selectedIds = [idMap[id]];
    });
  },

  copyNode: (id: NodeId) => {
    const state = get();
    if (id === state.tree.rootId) return;
    const clipboardTree = createSubtree(state.tree, id);
    if (clipboardTree) set({ clipboardTree });
  },

  pasteNodeAfter: (targetId: NodeId) => {
    const state = get();
    const clipboardTree = state.clipboardTree;
    if (!clipboardTree || targetId === state.tree.rootId) return;

    get().execute("paste-node", (draft) => {
      const target = draft.tree.nodes[targetId];
      if (!target) return;

      const parent = Object.values(draft.tree.nodes).find((n) =>
        n.children.includes(targetId)
      );
      if (!parent) return;

      const clonedTree = cloneTreeWithFreshIds(clipboardTree);
      const pastedRoot = clonedTree.nodes[clonedTree.rootId];
      if (!pastedRoot) return;

      if (pastedRoot.props.positionMode === "free") {
        pastedRoot.props = {
          ...pastedRoot.props,
          x: Number(pastedRoot.props.x ?? 0) + 24,
          y: Number(pastedRoot.props.y ?? 0) + 24,
        };
      }

      Object.assign(draft.tree.nodes, clonedTree.nodes);
      const targetIndex = parent.children.indexOf(targetId);
      parent.children.splice(targetIndex + 1, 0, clonedTree.rootId);
      draft.selectedId = clonedTree.rootId;
      draft.selectedIds = [clonedTree.rootId];
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    });
  },

  pasteNodeAt: (parentId: NodeId, point: { x: number; y: number }) => {
    const state = get();
    const clipboardTree = state.clipboardTree;
    if (!clipboardTree) return;

    get().execute("paste-node-at-canvas", (draft) => {
      const parent = draft.tree.nodes[parentId];
      if (!parent) return;

      const clonedTree = cloneTreeWithFreshIds(clipboardTree);
      const pastedRoot = clonedTree.nodes[clonedTree.rootId];
      if (!pastedRoot) return;

      const resolved = resolveResponsiveProps(pastedRoot.props, draft.currentDevice);
      const rawWidth = Number(resolved.width ?? 320);
      const rawHeight = Number(resolved.height ?? 120);
      const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 320;
      const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 120;
      const gridSize = Number(resolved.gridSize ?? 24);
      const snapToGrid = resolved.snapToGrid !== false;
      const rawX = point.x - width / 2;
      const rawY = point.y - height / 2;
      pastedRoot.props = applyResponsivePatch(pastedRoot.props, draft.currentDevice, {
        positionMode: "free",
        x: Math.max(0, snapToGrid ? Math.round(rawX / gridSize) * gridSize : Math.round(rawX)),
        y: Math.max(0, snapToGrid ? Math.round(rawY / gridSize) * gridSize : Math.round(rawY)),
        width,
        height,
        snapToGrid: resolved.snapToGrid ?? true,
        gridSize,
      });

      Object.assign(draft.tree.nodes, clonedTree.nodes);
      parent.children.push(clonedTree.rootId);
      draft.selectedId = clonedTree.rootId;
      draft.selectedIds = [clonedTree.rootId];
      draft.contextMenu = { isOpen: false, nodeId: null, x: 0, y: 0 };
    });
  },

  moveNodeUp: (id: NodeId) => {
    if (id === get().tree.rootId) return;
    get().execute("move-node", (draft) => {
      const parent = Object.values(draft.tree.nodes).find((n) =>
        n.children.includes(id)
      );
      if (!parent) return;
      const idx = parent.children.indexOf(id);
      if (idx <= 0) return;
      [parent.children[idx - 1], parent.children[idx]] = [
        parent.children[idx],
        parent.children[idx - 1],
      ];
    });
  },

  moveNodeDown: (id: NodeId) => {
    if (id === get().tree.rootId) return;
    get().execute("move-node", (draft) => {
      const parent = Object.values(draft.tree.nodes).find((n) =>
        n.children.includes(id)
      );
      if (!parent) return;
      const idx = parent.children.indexOf(id);
      if (idx >= parent.children.length - 1) return;
      [parent.children[idx], parent.children[idx + 1]] = [
        parent.children[idx + 1],
        parent.children[idx],
      ];
    });
  },

  openAssetPicker: (target: AssetPickerTarget) => set({ assetPicker: { isOpen: true, target } }),
  closeAssetPicker: () => set((state: EditorState) => ({
    assetPicker: { ...state.assetPicker, isOpen: false }
  })),

  addAssetToLibrary: (asset) => {
    const assetUrl = typeof asset.url === "string" ? asset.url : "";
    const normalized: EditorAsset = {
      id: asset.id ?? aid(),
      url: assetUrl,
      name: typeof asset.name === "string" ? asset.name : undefined,
      type: "image",
      source: typeof asset.source === "string" ? asset.source : undefined,
      createdAt: asset.createdAt ?? new Date().toISOString(),
    };

    set((state: EditorState) => {
      const nextAssets = [
        normalized,
        ...state.assetLibrary.filter((item) => item.url !== normalized.url),
      ].slice(0, ASSET_LIBRARY_LIMIT);

      saveAssetLibrary(state.websiteId, nextAssets);
      return { assetLibrary: nextAssets };
    });

    return normalized;
  },

  selectAsset: (url: string) => {
    const { assetPicker } = get();
    if (assetPicker.target?.nodeId && assetPicker.target.propKey) {
      get().updateNodeProps(assetPicker.target.nodeId, {
        [assetPicker.target.propKey]: url,
      });
    }
    get().closeAssetPicker();
  },

  updateGlobalTheme: (patch) => {
    get().execute("update-theme", (draft) => {
      if (!draft.tree.theme) {
        draft.tree.theme = {
          colors: {
            primary: "#6366f1",
            secondary: "#8b5cf6",
            background: "#ffffff",
            text: "#1e293b",
            accent: "#22c55e",
          },
          fontHeading: "system-ui, sans-serif",
          fontBody: "system-ui, sans-serif",
          spacing: {
            sectionX: "1.5rem",
            sectionY: "3rem",
            stack: "1.5rem",
          },
          radius: {
            card: "1rem",
            button: "999px",
          },
          shadow: {
            soft: "0 12px 32px rgba(15,23,42,0.08)",
            strong: "0 24px 60px rgba(15,23,42,0.18)",
          },
          motion: {
            duration: "240ms",
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        };
      }
      const theme = draft.tree.theme as GlobalTheme;
      if (typeof patch === "function") {
        patch(theme);
      } else {
        draft.tree.theme = { ...theme, ...patch };
      }
      draft.rev += 1;
    });
  },

  updateSEO: (patch) => {
    get().execute("update-seo", (draft) => {
      if (!draft.tree.seo) draft.tree.seo = { title: "", description: "", keywords: "", ogImage: "" };
      draft.tree.seo = { ...draft.tree.seo, ...patch };
    });
  },

  commitTextEdit: (nodeId: NodeId, field: string, value: string) => {
    const node = get().tree.nodes[nodeId];
    if (!node || node.props[field] === value) return;

    get().execute(`edit-prop:${nodeId}:${field}`, (draft) => {
      const n = draft.tree.nodes[nodeId];
      if (n) n.props[field] = value;
    });
  },

  applyIAText: (nodeId: NodeId, newText: string) => {
    get().updateNodeProps(nodeId, { text: newText });
  },

  improveTextWithIA: async (nodeId: NodeId, currentText: string) => {
    const chat = getOrvenixChat();
    if (!chat) return;

    const prompt = `Mejora este texto para que sea más profesional y persuasivo, manteniéndolo conciso: "${currentText}"`;
    
    // Pasamos el nodeId como contexto para que el evento de retorno sepa a quién actualizar
    chat.internalQuery(prompt, true, { targetNodeId: nodeId });
  },

  generateSectionWithIA: async (prompt: string) => {
    const chat = getOrvenixChat();
    if (!chat) return;
    // Instrucción interna para que la IA sepa que debe generar una estructura completa
    chat.internalQuery(`Genera una nueva sección completa para mi web sobre: ${prompt}`, true, { mode: 'generate-section' });
  },
})));

const DESKTOP_CANVAS_WIDTH = 1200;
const DEVICE_CANVAS_WIDTH: Record<DeviceMode, number> = {
  desktop: DESKTOP_CANVAS_WIDTH,
  lg: 1024,
  tablet: 768,
  sm: 640,
  mobile: 375,
};
export const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "1200px",
  lg: "1024px",
  tablet: "768px",
  sm: "640px",
  mobile: "375px",
};
const TARGET_CANVAS_WIDTH: Record<Exclude<DeviceMode, "desktop">, number> = {
  lg:     1024,
  tablet: 768,
  sm:     640,
  mobile: 375,
};

export const selectCanUndo = (state: EditorState) => state.undoStack.length > 0;
export const selectCanRedo = (state: EditorState) => state.redoStack.length > 0;
export const selectLastUndoLabel = (state: EditorState) =>
  state.undoStack[state.undoStack.length - 1]?.label ?? null;
export const selectLastRedoLabel = (state: EditorState) =>
  state.redoStack[0]?.label ?? null;
export const selectSaveStatus = (state: EditorState) => state.saveStatus;

function scaleResponsiveLayout(
  patch: NodeProps,
  device: Exclude<DeviceMode, "desktop">
): NodeProps {
  if (patch.positionMode !== "free") return patch;

  const scale = TARGET_CANVAS_WIDTH[device] / DESKTOP_CANVAS_WIDTH;
  const next = { ...patch };
  const width = toFiniteNumber(patch.width);
  const x = toFiniteNumber(patch.x);

  if (typeof x === "number") {
    next.x = Math.max(0, Math.round(x * scale));
  }

  if (typeof width === "number") {
    const maxWidth = TARGET_CANVAS_WIDTH[device] - 24;
    next.width = Math.max(80, Math.min(maxWidth, Math.round(width * scale)));
  }

  return next;
}

function toFiniteNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toFiniteNumberValue(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

type FreeNodeRect = {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  height: number;
};

function getSelectedFreeRects(draft: Draft<EditorState>): FreeNodeRect[] {
  return draft.selectedIds
    .map((id) => {
      const node = draft.tree.nodes[id];
      if (!node) return null;
      const props = resolveResponsiveProps(node.props, draft.currentDevice);
      if (props.positionMode !== "free") return null;

      return {
        id,
        x: toFiniteNumberValue(props.x, 0),
        y: toFiniteNumberValue(props.y, 0),
        width: Math.max(1, toFiniteNumberValue(props.width, 320)),
        height: Math.max(1, toFiniteNumberValue(props.height, 120)),
      };
    })
    .filter((rect): rect is FreeNodeRect => Boolean(rect));
}

function getSelectionBounds(rects: FreeNodeRect[]) {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    left,
    top,
    right,
    bottom,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
  };
}

function roundPositionPatch(patch: Pick<NodeProps, "x"> | Pick<NodeProps, "y">): NodeProps {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      key,
      Math.max(0, Math.round(toFiniteNumberValue(value, 0))),
    ])
  );
}

function getDefaultFreeNodeSize(type: string) {
  if (type === "heading") return { width: 560, height: 104 };
  if (type === "text") return { width: 480, height: 128 };
  if (type === "ctaButton") return { width: 240, height: 64 };
  if (type === "image") return { width: 440, height: 280 };
  if (type === "section") return { width: 760, height: 360 };
  if (type.includes("hero")) return { width: 960, height: 540 };
  if (type.includes("grid") || type.includes("services") || type.includes("testimonials")) {
    return { width: 900, height: 420 };
  }
  return { width: 460, height: 200 };
}
