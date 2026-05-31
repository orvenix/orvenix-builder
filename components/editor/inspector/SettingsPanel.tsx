"use client";

import { useCallback, useState } from "react";
import * as Icons from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { getBlockDefinition } from "@/blocks/registry";
import {
  DEVICE_TO_BREAKPOINT,
  getBreakpointInheritanceSources,
  hasResponsiveDevicePatch,
  resolveResponsiveProps,
} from "@/components/editor/responsive";
import type { AssetPickerTarget, GroupDef, NodeId, SettingsField } from "@/types/editor";
import { FieldResolver } from "./FieldResolver";
import { DevModePanel } from "./DevModePanel";

const CATEGORY_COLORS: Record<string, string> = {
  layout:       "#64748b",
  content:      "#3b82f6",
  action:       "#8b5cf6",
  ecommerce:    "#f59e0b",
  analytics:    "#7c3aed",
  crm:          "#2563eb",
  productivity: "#10b981",
  marketing:    "#ec4899",
  enterprise:   "#06b6d4",
  finance:      "#10b981",
  hr:           "#f97316",
  devops:       "#06b6d4",
};

const MOTION_SETTINGS: SettingsField[] = [
  {
    kind: "group",
    label: "Animacion",
    fields: [
      {
        kind: "select",
        key: "motionAnimation",
        label: "Entrada",
        help: "Como aparece el bloque al cargarse.",
        options: [
          { value: "none", label: "Sin animacion" },
          { value: "fade", label: "Desvanecer" },
          { value: "fade-up", label: "Subir suave" },
          { value: "fade-down", label: "Bajar suave" },
          { value: "slide-left", label: "Desde izquierda" },
          { value: "slide-right", label: "Desde derecha" },
          { value: "scale", label: "Escala suave" },
        ],
      },
      {
        kind: "select",
        key: "motionTransition",
        label: "Interaccion",
        help: "Transicion suave al pasar el cursor.",
        options: [
          { value: "none", label: "Sin hover" },
          { value: "soft", label: "Suave" },
          { value: "lift", label: "Elevar" },
          { value: "scale", label: "Acercar" },
          { value: "glow", label: "Resplandor" },
        ],
      },
      {
        kind: "select",
        key: "motionEasing",
        label: "Curva",
        options: [
          { value: "smooth", label: "Suave" },
          { value: "gentle", label: "Gentil" },
          { value: "snappy", label: "Rapida" },
        ],
      },
      {
        kind: "number",
        key: "motionDuration",
        label: "Duracion",
        min: 120,
        max: 2400,
        step: 40,
        suffix: "ms",
      },
      {
        kind: "number",
        key: "motionDelay",
        label: "Retraso",
        min: 0,
        max: 2000,
        step: 40,
        suffix: "ms",
      },
    ],
  },
];

const POSITION_SETTINGS: SettingsField[] = [
  {
    kind: "group",
    label: "Posicion",
    fields: [
      {
        kind: "select",
        key: "positionMode",
        label: "Modo",
        help: "Libre permite mover el bloque a cualquier coordenada dentro del canvas.",
        options: [
          { value: "flow", label: "Flujo normal" },
          { value: "free", label: "Libre X/Y" },
        ],
      },
      {
        kind: "number",
        key: "x",
        label: "X",
        min: 0,
        max: 4000,
        step: 1,
        suffix: "px",
      },
      {
        kind: "number",
        key: "y",
        label: "Y",
        min: 0,
        max: 4000,
        step: 1,
        suffix: "px",
      },
      {
        kind: "number",
        key: "width",
        label: "Ancho",
        min: 80,
        max: 2400,
        step: 8,
        suffix: "px",
      },
      {
        kind: "number",
        key: "height",
        label: "Alto fijo",
        min: 0,
        max: 2400,
        step: 8,
        suffix: "px",
      },
      {
        kind: "number",
        key: "zIndex",
        label: "Capa",
        min: 0,
        max: 999,
        step: 1,
      },
      {
        kind: "toggle",
        key: "snapToGrid",
        label: "Ajustar a grid",
        help: "Encaja el bloque en la cuadricula al soltarlo.",
      },
      {
        kind: "number",
        key: "gridSize",
        label: "Tamano grid",
        min: 4,
        max: 96,
        step: 4,
        suffix: "px",
      },
    ],
  },
];

const STYLE_SETTINGS: SettingsField[] = [
  {
    kind: "group",
    label: "Diseno",
    fields: [
      {
        kind: "color",
        key: "styleBackground",
        label: "Fondo",
        help: "Color visual del contenedor del bloque.",
        presets: ["#ffffff", "#f8fafc", "#111827", "#2563eb", "#10b981", "#f59e0b", "#ec4899"],
      },
      {
        kind: "number",
        key: "styleOpacity",
        label: "Opacidad",
        min: 0,
        max: 100,
        step: 5,
        suffix: "%",
      },
      {
        kind: "number",
        key: "stylePadding",
        label: "Relleno",
        min: 0,
        max: 96,
        step: 4,
        suffix: "px",
      },
      {
        kind: "number",
        key: "styleRadius",
        label: "Radio",
        min: 0,
        max: 64,
        step: 2,
        suffix: "px",
      },
      {
        kind: "number",
        key: "styleBorderWidth",
        label: "Borde",
        min: 0,
        max: 12,
        step: 1,
        suffix: "px",
      },
      {
        kind: "color",
        key: "styleBorderColor",
        label: "Color borde",
        presets: ["#e2e8f0", "#94a3b8", "#111827", "#2563eb", "#10b981", "#f59e0b", "#ec4899"],
      },
      {
        kind: "select",
        key: "styleShadow",
        label: "Sombra",
        options: [
          { value: "none", label: "Sin sombra" },
          { value: "soft", label: "Suave" },
          { value: "medium", label: "Media" },
          { value: "strong", label: "Fuerte" },
          { value: "glow", label: "Glow" },
        ],
      },
    ],
  },
];

export function SettingsPanel() {
  const selectedId      = useEditorStore((s) => s.selectedId);
  const editorMode      = useEditorStore((s) => s.editorMode);
  const node            = useEditorStore((s) => s.selectedId ? s.tree.nodes[s.selectedId] : null);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const currentDevice   = useEditorStore((s) => s.currentDevice);
  const removeNode      = useEditorStore((s) => s.removeNode);
  const duplicateNode   = useEditorStore((s) => s.duplicateNode);
  const moveNodeUp      = useEditorStore((s) => s.moveNodeUp);
  const moveNodeDown    = useEditorStore((s) => s.moveNodeDown);
  const openAssetPicker = useEditorStore((s) => s.openAssetPicker);
  const tree            = useEditorStore((s) => s.tree);
  const rootId          = useEditorStore((s) => s.tree.rootId);

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      updateNodeProps(selectedId, { [key]: value });
    },
    [selectedId, updateNodeProps]
  );

  if (!selectedId || !node) return <EmptyState />;

  const def = getBlockDefinition(node.type);
  if (!def) return <UnknownBlockState type={node.type} />;

  const isRoot       = selectedId === rootId;
  const mergedProps  = {
    motionAnimation: "none",
    motionTransition: "none",
    motionEasing: "smooth",
    motionDuration: 560,
    motionDelay: 0,
    positionMode: "flow",
    x: 0,
    y: 0,
    width: 320,
    height: 0,
    zIndex: 1,
    snapToGrid: true,
    gridSize: 24,
    styleBackground: "",
    styleOpacity: 100,
    stylePadding: 0,
    styleRadius: 0,
    styleBorderWidth: 0,
    styleBorderColor: "#e2e8f0",
    styleShadow: "none",
    ...def.defaults,
    ...resolveResponsiveProps(node.props, currentDevice),
  };
  const hasDeviceOverrides =
    currentDevice !== "desktop" && hasResponsiveDevicePatch(node.props, currentDevice);
  const inheritedBreakpoints = getBreakpointInheritanceSources(node.props, currentDevice)
    .filter((bp) => bp !== DEVICE_TO_BREAKPOINT[currentDevice]);
  const currentBreakpoint = DEVICE_TO_BREAKPOINT[currentDevice];
  const parent       = Object.values(tree.nodes).find((n) => n.children.includes(selectedId));
  const siblings     = parent?.children ?? [];
  const siblingIndex = siblings.indexOf(selectedId);
  const canMoveUp    = siblingIndex > 0;
  const canMoveDown  = siblingIndex >= 0 && siblingIndex < siblings.length - 1;
  const accentColor  = CATEGORY_COLORS[def.category] ?? "#6366f1";

  // Modo Dev — reemplaza el inspector completo con Monaco
  if (editorMode === "dev") {
    return (
      <aside
        className="flex h-full w-72 shrink-0 flex-col border-l border-white/5 xl:w-80"
        style={{ background: "linear-gradient(180deg, #0a0f1c 0%, #080c18 100%)" }}
      >
        <DevModePanel />
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col border-l border-white/[0.05] editor-anim-slide-left editor-scrollbar xl:w-80"
      style={{ background: "linear-gradient(180deg, #0a0f1c 0%, #080c18 100%)" }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/[0.05]"
        style={{ background: "linear-gradient(180deg, #0d1220 0%, #0a0f1c 100%)" }}>

        {/* Category accent line */}
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${accentColor}80, ${accentColor}20, transparent)` }} />

        <div className="px-4 pt-4 pb-3">
          {/* Block identity */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Icon with category glow */}
              <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}08 100%)`,
                  border: `1px solid ${accentColor}30`,
                  boxShadow: `0 0 12px ${accentColor}15`,
                }}>
                <BlockIcon name={def.icon} size={14} color={accentColor} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate leading-tight">{def.label}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                  <span className="text-[10px] text-slate-500 capitalize">{def.category}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[10px] font-mono text-slate-700">#{selectedId.slice(-5)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-0.5 shrink-0">
              <PanelBtn disabled={isRoot || !canMoveUp} title="Subir" onClick={() => moveNodeUp(selectedId)}>
                <Icons.ChevronUp size={12} />
              </PanelBtn>
              <PanelBtn disabled={isRoot || !canMoveDown} title="Bajar" onClick={() => moveNodeDown(selectedId)}>
                <Icons.ChevronDown size={12} />
              </PanelBtn>
              <PanelBtn disabled={isRoot} title="Duplicar (⌘D)" onClick={() => duplicateNode(selectedId)}>
                <Icons.Copy size={12} />
              </PanelBtn>
              <PanelBtn disabled={isRoot} title="Eliminar (Del)" onClick={() => removeNode(selectedId)} variant="danger">
                <Icons.Trash2 size={12} />
              </PanelBtn>
            </div>
          </div>

          {/* Meta pills row */}
          <div className="grid grid-cols-3 gap-1.5">
            <MetaPill label="Tipo" value={node.type} icon="Tag" />
            <MetaPill label="Props" value={String(Object.keys(mergedProps).length)} icon="Sliders" />
            <MetaPill label="Hijos" value={String(node.children.length)} icon="GitBranch" />
          </div>

          {currentDevice !== "desktop" && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-sky-400/15 bg-sky-400/8 px-2.5 py-2">
              <Icons.Smartphone size={12} className="text-sky-300" />
              <span className="min-w-0 flex-1 text-[10px] leading-tight text-sky-100/75">
                Posicion, diseno y animacion se guardan para {currentBreakpoint}
                {inheritedBreakpoints.length > 0 ? `; hereda de ${inheritedBreakpoints.join(", ")}` : ""}.
              </span>
              <span className="rounded bg-sky-300/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-200">
                {hasDeviceOverrides ? "Override" : "Base"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings body ── */}
      <div className="flex-1 overflow-y-auto editor-scrollbar">
        {[...def.settings, ...(!isRoot ? STYLE_SETTINGS : []), ...(!isRoot ? POSITION_SETTINGS : []), ...MOTION_SETTINGS].length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <div className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] grid place-items-center mb-3">
              <Icons.Sliders size={16} className="text-slate-600" />
            </div>
            <div className="text-xs text-slate-500">Este bloque no tiene propiedades editables</div>
          </div>
        ) : (
          <FieldList
            fields={[...def.settings, ...(!isRoot ? STYLE_SETTINGS : []), ...(!isRoot ? POSITION_SETTINGS : []), ...MOTION_SETTINGS]}
            values={mergedProps}
            onChange={handleChange}
            nodeId={selectedId}
            onOpenAssetPicker={openAssetPicker}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-white/[0.05] px-4 py-2.5 flex items-center gap-2">
        <Icons.Info size={11} className="text-slate-700 shrink-0" />
        <span className="text-[10px] text-slate-700">Los cambios se guardan automáticamente</span>
      </div>
    </aside>
  );
}

// ── FieldList ──────────────────────────────────────────────────

function FieldList({
  fields, values, onChange, nodeId, onOpenAssetPicker,
}: {
  fields: SettingsField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  nodeId: NodeId;
  onOpenAssetPicker: (target: AssetPickerTarget) => void;
}) {
  return (
    <div className="divide-y divide-white/[0.04]">
      {fields.map((field, idx) => {
        if (field.kind === "group") {
          return (
            <CollapsibleGroup
              key={`group-${idx}`}
              group={field as GroupDef}
              values={values}
              onChange={onChange}
              nodeId={nodeId}
              onOpenAssetPicker={onOpenAssetPicker}
              defaultOpen={idx === 0}
            />
          );
        }
        return (
          <div key={field.key} className="px-4 py-3.5">
              <FieldResolver
                field={field}
                value={values[field.key]}
                onChange={(v) => onChange(field.key, v)}
                nodeId={nodeId}
                propKey={field.key}
                onOpenAssetPicker={onOpenAssetPicker}
              />
          </div>
        );
      })}
    </div>
  );
}

function CollapsibleGroup({
  group, values, onChange, nodeId, onOpenAssetPicker, defaultOpen,
}: {
  group: GroupDef;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  nodeId: NodeId;
  onOpenAssetPicker: (target: AssetPickerTarget) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/[0.02] group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 group-hover:text-slate-300 transition-colors">
            {group.label}
          </span>
        </div>
        <Icons.ChevronDown
          size={11}
          className={`text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3.5 px-4 pb-4 editor-anim-fade-up">
          {group.fields.map((field) => {
            if (field.kind === "group") return null;
            return (
              <FieldResolver
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => onChange(field.key, v)}
                nodeId={nodeId}
                propKey={field.key}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── States ────────────────────────────────────────────────────

function EmptyState() {
  const tree  = useEditorStore((s) => s.tree);
  const nodes = Object.values(tree.nodes);
  const editable  = nodes.filter((n) => n.id !== tree.rootId).length;
  const headings  = nodes.filter((n) => n.type === "heading").length;
  const images    = nodes.filter((n) => n.type === "image").length;
  const hasIssues = editable === 0 || headings === 0;

  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col border-l border-white/[0.05] xl:w-80 editor-scrollbar"
      style={{ background: "linear-gradient(180deg, #0a0f1c 0%, #080c18 100%)" }}
    >
      {/* Header bar */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.05] flex items-center gap-2"
        style={{ background: "#0d1220" }}>
        <span className="text-[11px] font-semibold text-slate-400">Inspector</span>
      </div>

      {/* Empty state body */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <div className="relative mb-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-slate-600">
            <Icons.MousePointer2 size={20} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 grid place-items-center editor-status-dot-live">
            <Icons.Crosshair size={8} className="text-indigo-400" />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-200 mb-1">Inspector vacío</div>
        <div className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
          Selecciona un bloque en el canvas para editar sus propiedades
        </div>

        {/* Document health */}
        <div className="mt-6 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${hasIssues ? "bg-amber-400 editor-status-dot-live" : "bg-emerald-400"}`} />
            <span className="text-[11px] font-semibold text-slate-300">Salud del documento</span>
          </div>
          <div className="space-y-1.5">
            <HealthRow label="Bloques editables" value={editable} ok={editable > 0} />
            <HealthRow label="Jerarquía de títulos" value={headings} ok={headings > 0} />
            <HealthRow label="Recursos visuales" value={images} ok={images > 0} />
          </div>
        </div>

        {/* Shortcuts hint */}
        <div className="mt-4 w-full rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left">
          <div className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Atajos</div>
          {[
            ["⌘Z / ⌘Y", "Deshacer / Rehacer"],
            ["Del", "Eliminar bloque"],
            ["⌘D", "Duplicar bloque"],
            ["⌘K", "Paleta de comandos"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between py-1 border-t border-white/[0.04] first:border-t-0">
              <span className="text-[10px] text-slate-500">{desc}</span>
              <kbd className="text-[9px] font-mono text-slate-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">{key}</kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.05] px-4 py-2.5 flex items-center gap-2">
        <Icons.Info size={11} className="text-slate-700 shrink-0" />
        <span className="text-[10px] text-slate-700">Orvenix Editor Pro · v2.0</span>
      </div>
    </aside>
  );
}

function UnknownBlockState({ type }: { type: string }) {
  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col items-center justify-center border-l border-white/[0.05] px-6 text-center xl:w-80"
      style={{ background: "#080c18" }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 mb-3">
        <Icons.AlertTriangle size={18} />
      </div>
      <div className="text-sm font-bold text-slate-200">Bloque desconocido</div>
      <code className="mt-1 text-[11px] text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">{type}</code>
    </aside>
  );
}

// ── Utilities ─────────────────────────────────────────────────

function BlockIcon({ name, size, color }: { name: string; size: number; color?: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name];
  return Icon ? <Icon size={size} color={color} /> : null;
}

function PanelBtn({
  children, onClick, title, disabled, variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  const base = "grid h-7 w-7 place-items-center rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-25";
  const tone = variant === "danger"
    ? "text-slate-500 hover:bg-red-500/10 hover:text-red-400"
    : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-100";
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${base} ${tone}`}>
      {children}
    </button>
  );
}

function MetaPill({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const Icon = icon ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon] : null;
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={8} />}
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">{label}</span>
      </div>
      <div className="truncate text-[11px] font-semibold text-slate-300">{value}</div>
    </div>
  );
}

function HealthRow({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.04] pt-1.5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-1 h-1 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${ok ? "text-emerald-400" : "text-amber-400"}`}>{value}</span>
    </div>
  );
}
