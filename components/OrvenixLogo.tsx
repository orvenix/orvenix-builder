import Image from "next/image";

/** Calcula los 6 vértices de un hexágono regular "punta-arriba". */
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function hexVerts(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

interface IconProps {
  size?: number;
  className?: string;
}

interface BrandProps {
  iconSize?: number;
  textSize?: "sm" | "base" | "lg" | "xl";
  className?: string;
}

const BRAND_HEIGHTS = { sm: 32, base: 38, lg: 46, xl: 54 };
const BRAND_ASPECT_RATIO = 1558 / 500;

// ── Icono hexagonal solo (equivale a logo2.png) ──────────────────────────────
export function OrvenixIcon({ size = 28, className }: IconProps) {
  const CX = 83.5, CY = 83.5, R = 67;
  const SW = R / 14;       // stroke width proporcional
  const dotR = SW * 0.85;
  const verts = hexVerts(CX, CY, R);

  return (
    <svg
      viewBox="0 0 167 167"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`orvenix-logo-mark ${className ?? ""}`}
      aria-label="Orvenix"
    >
      <defs>
        <linearGradient id="orv-icon-g" x1="0" y1="0" x2="167" y2="167" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00c8ea" />
          <stop offset="55%"  stopColor="#009dcc" />
          <stop offset="100%" stopColor="#1a4a94" />
        </linearGradient>
      </defs>
      <g stroke="url(#orv-icon-g)" strokeLinecap="round" strokeLinejoin="round">
        {/* Hexágono exterior */}
        <polygon points={hexPoints(CX, CY, R)} strokeWidth={SW} fill="none" />
        {/* Diámetros (líneas que cruzan el centro) */}
        <line x1={verts[0].x.toFixed(2)} y1={verts[0].y.toFixed(2)} x2={verts[3].x.toFixed(2)} y2={verts[3].y.toFixed(2)} strokeWidth={SW * 0.82} />
        <line x1={verts[1].x.toFixed(2)} y1={verts[1].y.toFixed(2)} x2={verts[4].x.toFixed(2)} y2={verts[4].y.toFixed(2)} strokeWidth={SW * 0.82} />
        <line x1={verts[2].x.toFixed(2)} y1={verts[2].y.toFixed(2)} x2={verts[5].x.toFixed(2)} y2={verts[5].y.toFixed(2)} strokeWidth={SW * 0.82} />
        {/* Hexágono intermedio */}
        <polygon points={hexPoints(CX, CY, R * 0.625)} strokeWidth={SW * 0.82} fill="none" />
        {/* Hexágono interior */}
        <polygon points={hexPoints(CX, CY, R * 0.315)} strokeWidth={SW * 0.72} fill="none" />
        {/* Puntos en los 6 vértices exteriores */}
        {verts.map((v, i) => (
          <circle key={i} cx={v.x.toFixed(2)} cy={v.y.toFixed(2)} r={dotR.toFixed(2)} fill="url(#orv-icon-g)" stroke="none" />
        ))}
      </g>
    </svg>
  );
}

export function OrvenixBrand({ iconSize = 28, textSize = "base", className }: BrandProps) {
  const h = Math.max(iconSize, BRAND_HEIGHTS[textSize]);
  const renderW = Math.round(h * BRAND_ASPECT_RATIO);

  return (
    <div className={`orvenix-brand flex items-center ${className ?? ""}`}>
      <Image
        src="/img/logo-main.png"
        alt="Orvenix"
        width={renderW}
        height={h}
        className="orvenix-brand-image"
        priority
      />
    </div>
  );
}
