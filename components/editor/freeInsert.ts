import type { NodeProps } from "@/types/editor";

export function getDefaultFreeBlockSize(type: string) {
  if (type === "heading") return { width: 520, height: 96 };
  if (type === "text") return { width: 460, height: 120 };
  if (type === "ctaButton") return { width: 220, height: 64 };
  if (type === "image") return { width: 420, height: 260 };
  if (type === "section") return { width: 760, height: 360 };
  if (type.includes("hero")) return { width: 920, height: 520 };
  if (type.includes("grid") || type.includes("services") || type.includes("testimonials")) {
    return { width: 900, height: 420 };
  }
  return { width: 420, height: 180 };
}

export function getFreeInsertProps(
  type: string,
  point: { x: number; y: number } | null,
  options: { centerY?: boolean } = {}
): NodeProps {
  const size = getDefaultFreeBlockSize(type);
  const origin = point ?? { x: 96 + Math.random() * 96, y: 96 + Math.random() * 96 };
  const gridSize = 24;
  const yOffset = options.centerY ? size.height / 2 : 32;

  return {
    positionMode: "free",
    x: Math.max(0, Math.round((origin.x - size.width / 2) / gridSize) * gridSize),
    y: Math.max(0, Math.round((origin.y - yOffset) / gridSize) * gridSize),
    width: size.width,
    height: size.height,
    snapToGrid: true,
    gridSize,
  };
}
