"use client";

import React from "react";
import { useEditorStore } from "./store/useEditorStore";
import {
  Monitor,
  Laptop,
  Tablet,
  TabletSmartphone,
  Smartphone,
  Sparkles,
  Eye,
  EyeOff,
  CloudCheck,
  MessageSquare,
  ShieldCheck,
  CloudUpload,
  AlertCircle,
  Download,
  Rocket,
  ChevronLeft,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckoutRegistrationFlow } from "@/hooks/useCheckoutRegistrationFlow";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

export const EditorHeader = () => {
  const {
    currentDevice,
    setDevice,
    isPreviewMode,
    setPreviewMode,
    isCommentMode,
    setCommentMode,
    userRole,
    setUserRole,
    purchaseType,
    tree,
    saveStatus,
    websiteId,
    publishStatus,
    requestReview,
    publishWebsite,
  } = useEditorStore();

  const { startCheckout, isCheckingSession } = useCheckoutRegistrationFlow();
  const { isActive, usage } = useSubscription();
  const generateSectionIA = useEditorStore((s) => s.generateSectionWithIA);
  const isDraft = websiteId?.startsWith("draft:");
  const canExportCode = (purchaseType === "buy" || userRole === "admin") && !isDraft;
  const reachedWebsiteLimit =
    userRole !== "admin" &&
    isActive &&
    usage !== null &&
    usage.websitesLimit < 9999 &&
    usage.websitesUsed >= usage.websitesLimit;

  const handleExportCode = async () => {
    const { generateHtml } = await import("@/components/editor/html-generator");
    const htmlContent = generateHtml(tree, tree.theme, tree.seo);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${websiteId || "orvenix-site"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="editor-header h-14 border-b border-white/[0.08] bg-[color:var(--bg)] flex items-center justify-between px-4 z-[100] relative">

      {/* ── IZQUIERDA: volver + estado + rol ── */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="editor-back-btn group flex items-center gap-1.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 hover:-translate-x-0.5"
        >
          <ChevronLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        </Link>

        <div className="h-4 w-px bg-white/[0.08]" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white truncate max-w-[140px]">
            {websiteId?.replace("draft:", "Borrador: ") || "Proyecto Nuevo"}
          </span>
          <SaveStatusBadge status={saveStatus} />
        </div>

        <div className="h-4 w-px bg-white/[0.08]" />

        {/* Role toggle mejorado */}
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
            userRole === "admin"
              ? "bg-[rgba(0,181,246,0.14)] text-[color:var(--accent)] border border-[rgba(0,181,246,0.32)] shadow-[0_0_12px_rgba(0,181,246,0.16)]"
              : "bg-white/[0.05] text-slate-500 border border-white/[0.06] hover:border-white/[0.12]"
          )}
          onClick={() => setUserRole(userRole === "admin" ? "client" : "admin")}
        >
          <ShieldCheck size={11} />
          {userRole}
        </button>
      </div>

      {/* ── CENTRO: AI button + Device toggle ── */}
      <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
        {/* AI button — borde giratorio */}
        {!isPreviewMode && (
          <button
            type="button"
            onClick={() => generateSectionIA("una sección de servicios moderna")}
            className="editor-ai-btn hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 relative"
          >
            {/* Borde rotatorio con cónico */}
            <span className="editor-ai-ring" aria-hidden="true" />
            <span className="editor-ai-inner" aria-hidden="true" />
            <Sparkles size={13} className="text-[color:var(--accent)] relative z-10" />
            <span className="text-[color:var(--accent)] relative z-10">Generar con IA</span>
          </button>
        )}

        {/* Device toggle con pill deslizante */}
        <div className="editor-device-toggle relative flex items-center bg-white/[0.05] p-1 rounded-xl border border-white/[0.06]">
          {/* Pill activo */}
          <span
            className="editor-device-pill"
            style={{
              transform: `translateX(${
                currentDevice === "desktop" ? "0%" :
                currentDevice === "lg"      ? "100%" :
                currentDevice === "tablet"  ? "200%" :
                currentDevice === "sm"      ? "300%" :
                "400%"
              })`,
            }}
          />
          <DeviceBtn active={currentDevice === "desktop"} onClick={() => setDevice("desktop")} icon={<Monitor size={15} />} label="Desktop" />
          <DeviceBtn active={currentDevice === "lg"}      onClick={() => setDevice("lg")}      icon={<Laptop size={15} />} label="Laptop" />
          <DeviceBtn active={currentDevice === "tablet"}  onClick={() => setDevice("tablet")}  icon={<Tablet size={15} />}  label="Tablet" />
          <DeviceBtn active={currentDevice === "sm"}      onClick={() => setDevice("sm")}      icon={<TabletSmartphone size={15} />} label="Mobile L" />
          <DeviceBtn active={currentDevice === "mobile"}  onClick={() => setDevice("mobile")}  icon={<Smartphone size={15} />} label="Mobile" />
        </div>
      </div>

      {/* ── DERECHA: export + settings + feedback + preview + publish ── */}
      <div className="flex items-center gap-2">
        {reachedWebsiteLimit && (
          <Link
            href="/precios?upgrade=websites&callbackUrl=/dashboard"
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-300/[0.12]"
            title="Has alcanzado el límite de sitios de tu plan"
          >
            <AlertCircle size={14} />
            Upgrade
          </Link>
        )}

        {canExportCode && !isDraft && (
          <button
            type="button"
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 hover:scale-110 active:scale-95"
            title="Descargar código fuente"
            onClick={handleExportCode}
          >
            <Download size={17} />
          </button>
        )}

        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 hover:scale-110 hover:rotate-[20deg] active:scale-95"
          title="Configuración del Sitio"
        >
          <Settings size={17} />
        </button>

        <button
          type="button"
          onClick={() => setCommentMode(!isCommentMode)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300",
            isCommentMode
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
              : "text-slate-500 hover:text-white hover:bg-white/[0.06] border border-transparent"
          )}
          title="Modo Feedback"
        >
          <MessageSquare size={15} />
          <span className="hidden lg:inline">Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setPreviewMode(!isPreviewMode)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95",
            isPreviewMode
              ? "bg-[color:var(--accent-2)] text-white shadow-lg shadow-[rgba(0,131,179,0.25)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
          )}
        >
          {isPreviewMode ? <EyeOff size={15} /> : <Eye size={15} />}
          {isPreviewMode ? "Salir" : "Preview"}
        </button>

        {/* Publish — shimmer al hover */}
        {isDraft ? (
          <button
            type="button"
            onClick={() => startCheckout({ action: "rent" })}
            disabled={isCheckingSession}
            className="editor-publish-btn editor-publish-draft relative overflow-hidden px-5 py-2 rounded-xl text-sm font-black transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50"
          >
            <span className="editor-publish-shimmer" aria-hidden="true" />
            <span className="relative z-10">{isCheckingSession ? "Procesando..." : "Publicar Sitio"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={userRole === "admin" ? publishWebsite : requestReview}
            disabled={publishStatus === "published" && userRole === "client"}
            className={cn(
              "editor-publish-btn relative overflow-hidden flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all duration-300 hover:scale-[1.03] active:scale-95",
              userRole === "admin"
                ? "bg-[color:var(--accent)] text-[#112540] hover:bg-[#00c7ff] shadow-lg shadow-[rgba(0,181,246,0.28)]"
                : "bg-white text-slate-950 hover:bg-[#e8f7ff]"
            )}
          >
            <span className="editor-publish-shimmer" aria-hidden="true" />
            <Rocket size={15} className="relative z-10" />
            <span className="relative z-10">
              {userRole === "admin" ? "Publicar" : "Solicitar Revisión"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

/* ── Sub-components ── */

type DeviceBtnProps = { active: boolean; onClick: () => void; icon: React.ReactNode; label: string };

const DeviceBtn = ({ active, onClick, icon, label }: DeviceBtnProps) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={cn(
      "relative z-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center w-8 h-8",
      active ? "text-[color:var(--accent)]" : "text-slate-500 hover:text-slate-200"
    )}
  >
    {icon}
  </button>
);

const SaveStatusBadge = ({ status }: { status: string }) => {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold animate-pulse">
        <CloudUpload size={11} /> Guardando...
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold">
        <AlertCircle size={11} /> Error
      </span>
    );
  if (status === "dirty")
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
        <CloudUpload size={11} /> Sin guardar
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-[color:var(--accent)] font-semibold">
      <CloudCheck size={11} /> Guardado
    </span>
  );
};
