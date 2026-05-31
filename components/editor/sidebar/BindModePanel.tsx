"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { getBlockDefinition } from "@/blocks/registry";
import { Link2, Link2Off, Database, ChevronDown, X, Rows3 } from "lucide-react";
import type { DataBinding, SettingsField } from "@/types/editor";
import { getRelationRecordLabel } from "@/lib/cms/schema";
import type { CmsFieldDef } from "@/lib/cms/schema";

interface CollectionInfo {
  id: string;
  name: string;
  slug: string;
  fields: CmsFieldDef[];
}

interface CollectionRecordPreview {
  id: string;
  data: Record<string, unknown>;
  workflowStatus?: "draft" | "review" | "published";
}

interface Props {
  siteId: string;
}

// Props de nodo que tienen sentido bindear (texto, imagen, número, etc.)
const BINDABLE_PROP_TYPES = new Set(["text", "textarea", "number", "image", "color"]);

// Type guard: descarta GroupDef que no tiene key
function isBindableField(f: SettingsField): f is Extract<SettingsField, { key: string }> {
  return "key" in f && BINDABLE_PROP_TYPES.has(f.kind);
}

export function BindModePanel({ siteId }: Props) {
  const selectedId    = useEditorStore((s) => s.selectedId);
  const node          = useEditorStore((s) => s.selectedId ? s.tree.nodes[s.selectedId] : null);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);

  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar colecciones del sitio
  useEffect(() => {
    if (!siteId) return;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/cms/${siteId}/collections`)
      .then((r) => r.json())
      .then((data: { collections?: CollectionInfo[] }) => {
        setCollections(data.collections ?? []);
      })
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  const currentBindings = useMemo(() => (node?.props._bindings ?? {}) as Record<string, DataBinding>, [node?.props._bindings]);

  const bind = useCallback((propKey: string, binding: DataBinding) => {
    if (!selectedId) return;
    const next = { ...currentBindings, [propKey]: binding };
    updateNodeProps(selectedId, { _bindings: next });
  }, [selectedId, currentBindings, updateNodeProps]);

  const unbind = useCallback((propKey: string) => {
    if (!selectedId) return;
    const next = { ...currentBindings };
    delete next[propKey];
    updateNodeProps(selectedId, { _bindings: Object.keys(next).length > 0 ? next : undefined });
  }, [selectedId, currentBindings, updateNodeProps]);

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#00b5f6]/10 border border-[#00b5f6]/20 grid place-items-center">
          <Link2 size={18} className="text-[#00b5f6]/60" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-45">
          Selecciona un bloque para vincular sus propiedades a datos del CMS
        </p>
      </div>
    );
  }

  const def = getBlockDefinition(node.type);
  // Filtrar solo campos que tienen sentido bindear (excluye GroupDef sin key)
  const bindableFields = (def?.settings ?? []).flatMap((f) => {
    if (f.kind === "group") return f.fields.filter(isBindableField);
    return isBindableField(f) ? [f] : [];
  });

  return (
    <div className="flex flex-col gap-0 overflow-auto">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Link2 size={12} className="text-[#00b5f6]" />
          <span className="text-[11px] font-semibold text-slate-300">
            Datos vinculados — {node.displayName ?? node.type}
          </span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          Conecta props del bloque a campos de tus colecciones CMS
        </p>
      </div>

      {/* Sin colecciones */}
      {!loading && collections.length === 0 && (
        <div className="px-3 py-6 text-center">
          <Database size={24} className="mx-auto mb-2 text-slate-700" />
          <p className="text-xs text-slate-600">
            Este sitio no tiene colecciones aún.{" "}
            <a href={`/dashboard/cms/${siteId}`} target="_blank" rel="noreferrer"
              className="text-[#00b5f6] hover:underline">Crear una</a>
          </p>
        </div>
      )}

      {/* Sin campos bindeables en este bloque */}
      {!loading && collections.length > 0 && bindableFields.length === 0 && (
        <div className="px-3 py-6 text-center">
          <p className="text-xs text-slate-600">Este bloque no tiene propiedades vinculables.</p>
        </div>
      )}

      {/* Lista de props bindeables */}
      {collections.length > 0 && bindableFields.length > 0 && (
        <div className="divide-y divide-white/4">
          {bindableFields.map((field) => {
            const bound = currentBindings[field.key];
            const boundCol = bound ? collections.find((c) => c.slug === bound.collectionSlug) : null;
            const boundField = boundCol?.fields.find((f) => f.slug === bound?.fieldSlug);
            const recordStatus = bound?.recordStatus ?? "all";

            return (
              <div key={field.key} className="px-3 py-2.5">
                {/* Nombre de la prop */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-400">{field.label}</span>
                  <span className="text-[9px] font-mono text-slate-700 bg-white/3 px-1.5 py-0.5 rounded">
                    {field.key}
                  </span>
                </div>

                {bound ? (
                  /* Binding activo */
                  <div className="flex items-center gap-2 rounded-lg bg-[#00b5f6]/8 border border-[#00b5f6]/20 px-2.5 py-1.5">
                    <Link2 size={10} className="text-[#00b5f6] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#00b5f6] font-semibold truncate">
                        {boundCol?.name ?? bound.collectionSlug}
                        <span className="text-slate-500 font-normal"> → </span>
                        {bound.recordId ? <span className="text-slate-300">#{bound.recordId.slice(0, 8)} → </span> : null}
                        {boundField?.name ?? bound.fieldSlug}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Estado: {recordStatus}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Desvincular"
                      onClick={() => unbind(field.key)}
                      className="shrink-0 grid h-5 w-5 place-items-center rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  /* Selector de binding */
                  <BindSelector
                    siteId={siteId}
                    collections={collections}
                    onBind={(binding) => bind(field.key, binding)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen de bindings activos */}
      {Object.keys(currentBindings).length > 0 && (
        <div className="px-3 py-2 border-t border-white/5 mt-auto">
          <p className="text-[10px] text-emerald-400/70">
            ✓ {Object.keys(currentBindings).length} {Object.keys(currentBindings).length === 1 ? "prop vinculada" : "props vinculadas"} — los datos se resolverán al publicar
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Selector de colección + campo ───────────────────────────────────────────

function BindSelector({
  siteId,
  collections,
  onBind,
}: {
  siteId: string;
  collections: CollectionInfo[];
  onBind: (binding: DataBinding) => void;
}) {
  const [colSlug, setColSlug] = useState("");
  const [recordStatus, setRecordStatus] = useState<NonNullable<DataBinding["recordStatus"]>>("all");
  const [recordId, setRecordId] = useState("");
  const [records, setRecords] = useState<CollectionRecordPreview[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const selectedCol = collections.find((c) => c.slug === colSlug);

  useEffect(() => {
    if (!colSlug) return;

    const params = new URLSearchParams({
      limit: "50",
      sort: "createdAt_desc",
    });
    if (recordStatus !== "all") params.set("status", recordStatus);

    fetch(`/api/cms/${siteId}/collections/${colSlug}/records?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { records?: CollectionRecordPreview[] }) => {
        setRecords(data.records ?? []);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false));
  }, [colSlug, recordStatus, siteId]);

  return (
    <div className="grid gap-1.5">
      {/* Selector de colección */}
      <div className="relative">
        <select
          aria-label="Seleccionar colección CMS"
          value={colSlug}
          onChange={(e) => {
            setLoadingRecords(true);
            setColSlug(e.target.value);
            setRecords([]);
            setRecordId("");
          }}
          className="w-full h-7 appearance-none rounded-lg bg-white/4 border border-white/[0.07] px-2 pr-6 text-[11px] text-slate-400 focus:outline-none focus:border-[#00b5f6]/40 cursor-pointer"
        >
          <option value="">Colección...</option>
          {collections.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-600" />
      </div>

      {selectedCol && (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="relative">
            <select
              aria-label="Filtrar records por estado"
              value={recordStatus}
              onChange={(e) => {
                setLoadingRecords(true);
                setRecordStatus(e.target.value as NonNullable<DataBinding["recordStatus"]>);
                setRecords([]);
                setRecordId("");
              }}
              className="w-full h-7 appearance-none rounded-lg bg-white/4 border border-white/[0.07] px-2 pr-6 text-[11px] text-slate-400 focus:outline-none focus:border-[#00b5f6]/40 cursor-pointer"
            >
              <option value="all">Estado: todos</option>
              <option value="draft">Solo draft</option>
              <option value="review">Solo review</option>
              <option value="published">Solo published</option>
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
          <div className="relative">
            <select
              aria-label="Seleccionar record CMS"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              className="w-full h-7 appearance-none rounded-lg bg-white/4 border border-white/[0.07] px-2 pr-6 text-[11px] text-slate-400 focus:outline-none focus:border-[#00b5f6]/40 cursor-pointer"
            >
              <option value="">{loadingRecords ? "Cargando records..." : "Primer record disponible"}</option>
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {getRelationRecordLabel(selectedCol.fields, record, undefined)}
                </option>
              ))}
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
        </div>
      )}

      {/* Selector de campo */}
      {selectedCol && (
        <div className="relative">
          <select
            aria-label="Seleccionar campo de la colección"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              onBind({
                collectionSlug: colSlug,
                fieldSlug: e.target.value,
                recordId: recordId || undefined,
                recordStatus,
              });
            }}
            className="w-full h-7 appearance-none rounded-lg bg-white/4 border border-white/[0.07] px-2 pr-6 text-[11px] text-slate-400 focus:outline-none focus:border-[#00b5f6]/40 cursor-pointer"
          >
            <option value="">Campo...</option>
            {selectedCol.fields.map((f) => (
              <option key={f.id} value={f.slug}>{f.name}</option>
            ))}
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-600" />
        </div>
      )}

      {!colSlug && (
        <div className="flex items-center gap-1 text-[10px] text-slate-700">
          <Link2Off size={12} className="shrink-0" />
          Elige una colección para comenzar
        </div>
      )}

      {selectedCol && (
        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <Rows3 size={10} className="shrink-0" />
          {recordId ? "Binding a record especifico" : "Binding al primer record que cumpla el filtro"}
        </div>
      )}
    </div>
  );
}
