"use client";

import React from "react";
import Image from "next/image";
import { 
  Plus, 
  Globe, 
  Clock, 
  MessageSquare, 
  MoreVertical, 
  Settings,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_PROJECTS = [
  {
    id: "site_1",
    name: "Studio Ramírez · Arquitectura",
    status: "published",
    url: "studioramirez.orvenix.io",
    lastEdit: "Hace 2 horas",
    pendingComments: 0,
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80"
  },
  {
    id: "site_2",
    name: "Bufete Morales & Asociados",
    status: "review",
    url: "morales-law.orvenix.io",
    lastEdit: "Ayer",
    pendingComments: 3,
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80"
  },
  {
    id: "site_3",
    name: "E-commerce Minimalista",
    status: "draft",
    url: "draft-7721.orvenix.io",
    lastEdit: "Hace 5 días",
    pendingComments: 0,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"
  }
];

export const ProjectDashboard = () => {
  return (
    <div className="min-h-screen bg-[#070b12] text-white p-8">
      {/* Top Bar Dashboard */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Mis Proyectos</h1>
          <p className="text-slate-500 text-sm">Gestiona tus sitios web y solicitudes de soporte técnico.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          <Plus size={20} /> Nuevo Proyecto
        </button>
      </div>

      {/* Project Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_PROJECTS.map((project) => (
          <div 
            key={project.id} 
            className="group relative bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] overflow-hidden hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-black/40"
          >
            {/* Preview Image */}
            <div className="aspect-video relative overflow-hidden">
              <Image
                src={project.thumbnail}
                alt={project.name}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#070b12] to-transparent opacity-80" />
              
              {/* Status Badge */}
              <div className="absolute top-5 left-5">
                <StatusBadge status={project.status} />
              </div>

              {/* DIFM Badge */}
              {project.pendingComments > 0 && (
                <div className="absolute top-5 right-5 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 animate-bounce">
                  <MessageSquare size={12} fill="currentColor" /> {project.pendingComments} AJUSTES DIFM
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-7">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                <button className="text-slate-500 hover:text-white transition-colors"><MoreVertical size={20} /></button>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-8">
                <span className="flex items-center gap-1.5"><Globe size={14} /> {project.url}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {project.lastEdit}</span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-bold transition-all border border-white/5 flex items-center justify-center gap-2">
                  <Settings size={14} /> Configurar
                </button>
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold transition-all hover:bg-indigo-500 shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2">
                  <Layout size={14} /> Editar Sitio
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Tarjeta de Acción: Crear Nuevo Proyecto */}
        <div className="group relative bg-white/[0.01] border-2 border-dashed border-white/10 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all duration-500 flex flex-col items-center justify-center p-12 min-h-[400px] cursor-pointer">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-500">
            <Plus size={40} className="text-slate-600 group-hover:text-indigo-400" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-xl text-slate-400 mb-2 group-hover:text-white transition-colors">Nuevo Proyecto</h3>
            <p className="text-sm text-slate-600 max-w-[200px] mx-auto group-hover:text-slate-400 transition-colors">
              Inicia un lienzo en blanco o usa el asistente de IA para comenzar.
            </p>
          </div>
          {/* Efecto de resplandor Glass */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
               style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
        </div>

      </div>
    </div>
  );
};

type ProjectStatus = "published" | "review" | "draft";

const STATUS_CONFIGS: Record<ProjectStatus, { label: string; color: string }> = {
  published: { label: "Publicado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
  review: { label: "En Revisión (DIFM)", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
  draft: { label: "Borrador", color: "bg-slate-500/20 text-slate-400 border-slate-500/20" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const key = status in STATUS_CONFIGS ? (status as ProjectStatus) : "draft";
  const config = STATUS_CONFIGS[key];
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", config.color)}>
      {config.label}
    </span>
  );
};
