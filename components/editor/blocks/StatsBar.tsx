import { ShoppingBag, Users, DollarSign } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

interface StatsBarProps {
  accentColor?: string;
}

export function StatsBar({ accentColor = "#f59e0b" }: StatsBarProps) {
  const theme = useEditorStore((s) => s.tree.theme);
  // Usamos un estilo inline para el color del icono para que sea dinámico.
  // En un proyecto real con Tailwind, podrías mapear colores predefinidos
  // o usar un enfoque más avanzado si necesitas clases dinámicas completas.
  const iconStyle = { color: accentColor || theme?.colors?.accent || "#f59e0b" };
  const cardStyle: React.CSSProperties = {
    background: theme?.colors?.background ?? "#ffffff",
    color: theme?.colors?.text ?? "#1e293b",
    border: `1px solid ${(theme?.colors?.primary ?? "#6366f1")}18`,
    borderRadius: theme?.radius?.card ?? "1rem",
    boxShadow: theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)",
  };
  const mutedColor = `${theme?.colors?.text ?? "#1e293b"}99`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: mutedColor }}>Ventas hoy</span>
          <ShoppingBag className="w-5 h-5" style={iconStyle} />
        </div>
        <div className="text-2xl font-bold mt-2">$1,234</div>
        <div className="text-xs mt-1" style={{ color: mutedColor }}>
          <span className="text-emerald-500">+12%</span> respecto a ayer
        </div>
      </div>
      <div className="p-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: mutedColor }}>Visitantes</span>
          <Users className="w-5 h-5" style={iconStyle} />
        </div>
        <div className="text-2xl font-bold mt-2">5,678</div>
        <div className="text-xs mt-1" style={{ color: mutedColor }}>
          <span className="text-red-500">-5%</span> respecto a la semana pasada
        </div>
      </div>
      <div className="p-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: mutedColor }}>Ingresos netos</span>
          <DollarSign className="w-5 h-5" style={iconStyle} />
        </div>
        <div className="text-2xl font-bold mt-2">$9,876</div>
        <div className="text-xs mt-1" style={{ color: mutedColor }}>
          <span className="text-emerald-500">+8%</span> este mes
        </div>
      </div>
    </div>
  );
}

// Añadimos los defaults para que el editor sepa qué valores iniciales usar
StatsBar.defaults = {
  accentColor: "#f59e0b",
};
