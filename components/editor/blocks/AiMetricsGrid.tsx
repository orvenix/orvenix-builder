import React from 'react';
import { TrendingUp, Users, Zap, Brain } from "lucide-react";

export function AiMetricsGrid({ showPredictions = true }) {
  const metrics = [
    { label: "Crecimiento IA", value: "+24.8%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Usuarios Activos", value: "12,842", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Latencia Media", value: "42ms", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
      {metrics.map((m, i) => (
        <div key={i} className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${m.bg} ${m.color} transition-colors group-hover:scale-110 duration-300`}>
              <m.icon className="w-6 h-6" />
            </div>
            {showPredictions && i === 0 && (
              <div className="flex items-center gap-1 text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg">
                <Brain className="w-3 h-3" /> PREDICTED
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-slate-500 mb-1 tracking-tight">{m.label}</p>
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{m.value}</h4>
          
          {/* Glassy decoration */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
        </div>
      ))}
    </div>
  );
}

AiMetricsGrid.defaults = { showPredictions: true };