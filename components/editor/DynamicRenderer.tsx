"use client";

import { memo } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { getBlockDefinition } from "@/components/editor/blocks/registry";
import { editorError } from "@/components/editor/logger";
import { EditableNode } from "./EditableNode";
import { MotionWrapper, splitMotionProps } from "./MotionWrapper";
import { getEditorVisualStyle, resolveResponsiveProps } from "@/components/editor/responsive";
import {
  getRuntimeFreePositionStyle,
  getRuntimePreviewMinHeight,
  getRuntimeThemeStyleVars,
} from "@/lib/builder-core/runtime/rendering";
import { useResolvedBindings } from "@/lib/editor/useBindingData";
import type { DataBinding, DeviceMode, EditorNode, NodeId } from "@/types/editor";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface DynamicRendererProps {
  nodeId?: NodeId;
  mode?: "edit" | "preview";
  deviceOverride?: DeviceMode;
}

/**
 * Renderizador del editor. Suscripción GRANULAR por nodo:
 * cada instancia solo se re-renderiza cuando cambian sus propias props,
 * no cuando cambia cualquier otro nodo del árbol.
 */
export const DynamicRenderer = memo(function DynamicRenderer({
  nodeId,
  mode = "edit",
  deviceOverride,
}: DynamicRendererProps) {
  const rootId = useEditorStore((s) => s.tree?.rootId ?? "root");
  const id = nodeId ?? rootId;

  // ✅ Suscripción granular: solo este nodo, no el árbol completo
  const node = useEditorStore((s) => s.tree.nodes[id] as EditorNode | undefined);
  const storeDevice = useEditorStore((s) => s.currentDevice);
  const currentDevice = deviceOverride ?? storeDevice;
  const editingNodeId = useEditorStore((s) => s.editingNodeId);
  const tree = useEditorStore((s) => s.tree);
  const websiteId = useEditorStore((s) => s.websiteId);
  const definition = node ? getBlockDefinition(node.type) : null;
  const resolvedProps = node ? resolveResponsiveProps(node.props, currentDevice) : {};
  const { _bindings, ...resolvedPropsClean } = resolvedProps as typeof resolvedProps & { _bindings?: Record<string, DataBinding> };
  const mergedPropsBase = definition ? { ...definition.defaults, ...resolvedPropsClean } : resolvedPropsClean;

  // Resolver bindings CMS → valores reales (preview del primer record)
  const mergedProps = useResolvedBindings(websiteId, _bindings, mergedPropsBase);

  if (!node || node.hidden) return null;

  const isEditing = editingNodeId === id;

  if (!definition) {
    if (process.env.NODE_ENV !== "production") {
      editorError(`[DynamicRenderer] Bloque "${node.type}" no registrado.`);
    }
    // Fallback: renderizar como contenedor genérico
    return <div className="border border-dashed border-red-300 p-4">Bloque no registrado: {node.type}</div>;
  }

  const Component = definition.component as React.ComponentType<{
    children?: React.ReactNode;
    id?: string;
    [key: string]: unknown;
  }>;
  const { blockProps, motionProps } = splitMotionProps({ ...mergedProps, isEditing, siteId: websiteId });
  const isRoot = id === rootId;
  const shouldHoistFreeChildren = isRoot;
  const flowChildIds = shouldHoistFreeChildren
    ? node.children.filter((childId) => {
        const child = tree.nodes[childId];
        return resolveResponsiveProps(child?.props, currentDevice).positionMode !== "free";
      })
    : node.children;
  const freeChildIds = shouldHoistFreeChildren
    ? node.children.filter((childId) => {
        const child = tree.nodes[childId];
        return resolveResponsiveProps(child?.props, currentDevice).positionMode === "free";
      })
    : [];

  const children =
    flowChildIds.length > 0
      ? flowChildIds.map((childId) => (
          <DynamicRenderer key={childId} nodeId={childId} mode={mode} deviceOverride={deviceOverride} />
        ))
      : null;

  const content = (
    <MotionWrapper {...motionProps}>
      <Component {...blockProps} id={id}>
        {children}
      </Component>
    </MotionWrapper>
  );

  // Construir variables CSS basadas en el tema global
  const themeStyles = getRuntimeThemeStyleVars(tree.theme);

  // Root con contexto de drag-and-drop
if (isRoot && mode === "edit") {
  const editMinHeight = getRuntimePreviewMinHeight(tree, currentDevice, resolveResponsiveProps);
  return (
    <div
      className="editor-render-scope relative w-full min-w-0"
      style={{ ...themeStyles, minHeight: editMinHeight }}
    >
      {/* Solo los hijos en flujo participan del sortable vertical */}
      <SortableContext
        items={flowChildIds}
        strategy={verticalListSortingStrategy}
      >
        {content}
      </SortableContext>
      {freeChildIds.map((childId) => (
        <DynamicRenderer key={childId} nodeId={childId} mode={mode} deviceOverride={deviceOverride} />
      ))}
    </div>
  );
}

if (isRoot) {
  return (
    <div
      className="editor-render-scope relative w-full min-w-0"
      style={{ 
        ...themeStyles,
        minHeight: getRuntimePreviewMinHeight(tree, currentDevice, resolveResponsiveProps)
      }}
    >
      {content}
      {freeChildIds.map((childId) => (
        <DynamicRenderer key={childId} nodeId={childId} mode={mode} deviceOverride={deviceOverride} />
      ))}
    </div>
  );
}

if (mode === "edit" && id !== rootId) {
  return <EditableNode id={id}>{content}</EditableNode>;
}

if (mode === "preview" && resolvedProps.positionMode === "free") {
  return (
    <div
      style={getRuntimeFreePositionStyle(resolvedProps, getEditorVisualStyle(resolvedProps))}
    >
      {content}
    </div>
  );
}

return content;
});
