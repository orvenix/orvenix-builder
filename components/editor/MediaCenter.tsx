"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useEditorStore } from "./store/useEditorStore";
import { X, Search, Image as ImageIcon, Upload, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorAsset } from "@/types/editor";

const UNSPLASH_ASSETS: EditorAsset[] = [
  {
    id: "unsplash-analytics",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    name: "Dashboard analytics",
    type: "image",
    source: "unsplash",
    createdAt: "2026-05-05T00:00:00.000Z",
  },
  {
    id: "unsplash-workspace",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    name: "Workspace digital",
    type: "image",
    source: "unsplash",
    createdAt: "2026-05-05T00:00:00.000Z",
  },
  {
    id: "unsplash-laptop",
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80",
    name: "Laptop profesional",
    type: "image",
    source: "unsplash",
    createdAt: "2026-05-05T00:00:00.000Z",
  },
  {
    id: "unsplash-team",
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    name: "Equipo creativo",
    type: "image",
    source: "unsplash",
    createdAt: "2026-05-05T00:00:00.000Z",
  },
];

export const MediaCenter = () => {
  const isOpen = useEditorStore((s) => s.assetPicker.isOpen);
  const assetLibrary = useEditorStore((s) => s.assetLibrary);
  const close = useEditorStore((s) => s.closeAssetPicker);
  const addAssetToLibrary = useEditorStore((s) => s.addAssetToLibrary);
  const selectAsset = useEditorStore((s) => s.selectAsset);
  const [tab, setTab] = useState<"library" | "unsplash">("library");
  const [query, setQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (!url) {
        setIsUploading(false);
        return;
      }
      const asset = addAssetToLibrary({
        url,
        name: file.name,
        type: "image",
        source: "upload",
      });
      selectAsset(asset.url);
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

  const handleSelectAsset = (asset: EditorAsset) => {
    if (asset.source === "unsplash") {
      addAssetToLibrary(asset);
    }
    selectAsset(asset.url);
  };

  if (!isOpen) return null;

  const assets = tab === "library" ? assetLibrary : UNSPLASH_ASSETS;
  const visibleAssets = query.trim()
    ? assets.filter((asset) =>
        asset.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : assets;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar Media Center"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />
      
      <div className="relative w-full max-w-4xl h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <ImageIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-none">Media Center</h2>
              <p className="text-xs text-slate-500 mt-1">Gestiona y selecciona tus archivos visuales</p>
            </div>
          </div>
          <button onClick={close} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 bg-slate-50/50 border-b border-slate-100">
          <TabButton active={tab === "library"} onClick={() => setTab("library")} icon={<Upload size={16} />} label="Librería" />
          <TabButton active={tab === "unsplash"} onClick={() => setTab("unsplash")} icon={<Globe size={16} />} label="Explorar Unsplash" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={query}
              placeholder={tab === "library" ? "Buscar en tus archivos..." : "Buscar fotos profesionales en Unsplash..."}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl outline-none transition-all text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {/* Upload Card */}
              <label className="relative aspect-[4/3] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group">
                <div className="p-3 bg-slate-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                  {isUploading ? (
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                  ) : (
                    <Upload size={24} className="text-slate-400 group-hover:text-indigo-600" />
                  )}
                </div>
                <div className="text-center">
                  <span className="block text-xs font-bold text-slate-600 group-hover:text-indigo-600">
                    {isUploading ? "Cargando imagen" : "Subir imagen"}
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, SVG, WEBP</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              {visibleAssets.length === 0 && (
                <div className="col-span-full flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-center">
                  <ImageIcon size={26} className="mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">
                    {tab === "library" ? "Tu libreria esta vacia" : "Sin resultados"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    {tab === "library"
                      ? "Sube una imagen para guardarla y reutilizarla en este sitio."
                      : "Prueba con otro termino de busqueda."}
                  </p>
                </div>
              )}

              {/* Assets */}
              {visibleAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="aspect-[4/3] relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={() => handleSelectAsset(asset)}
                >
                  <Image
                    src={asset.url}
                    alt={asset.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/40 transition-all flex items-center justify-center">
                    <div className="px-4 py-2 bg-white text-indigo-600 text-[11px] font-bold rounded-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-2xl">
                      Elegir imagen
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-2 pt-8">
                    <p className="truncate text-[11px] font-semibold text-white">{asset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
};

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-px",
      active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
    )}
  >
    {icon} {label}
  </button>
);
