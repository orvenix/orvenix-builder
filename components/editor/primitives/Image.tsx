"use client";

import NextImage from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { BlockComponentProps } from "@/types/editor";

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  positionMode?: "flow" | "free";
}

const OBJECT_FIT = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
} as const;

export function Image({
  id,
  src,
  alt,
  width,
  height,
  objectFit = "cover",
  positionMode = "flow",
}: BlockComponentProps<ImageProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isReading, setIsReading] = useState(false);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const isSelected = selectedId === id;

  const updateImageFromFile = (file: File) => {
    if (!id || !file.type.startsWith("image/")) return;
    setIsReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateNodeProps(id, {
        src: String(reader.result ?? src),
        alt: alt || file.name.replace(/\.[^.]+$/, ""),
      });
      setIsReading(false);
    };
    reader.onerror = () => setIsReading(false);
    reader.readAsDataURL(file);
  };
  const isFree = positionMode === "free";
  const imageWidth = typeof width === "number" && width > 0 ? width : 800;
  const imageHeight = typeof height === "number" && height > 0 ? height : 400;

  return (
    <div className={isFree ? "relative h-full w-full" : "relative"}>
      <NextImage
        src={src}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        unoptimized
        onDoubleClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className={`${isFree ? "h-full" : "h-auto"} w-full ${OBJECT_FIT[objectFit]}`}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) updateImageFromFile(file);
          event.currentTarget.value = "";
        }}
      />

      {isSelected && (
        <button
          type="button"
          disabled={isReading}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
          className="absolute left-3 top-3 z-20 flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-slate-950/78 px-3 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-900 disabled:opacity-60"
        >
          {isReading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          Cambiar imagen
        </button>
      )}
    </div>
  );
}

Image.defaults = {
  src: "https://via.placeholder.com/800x400?text=Imagen+de+ejemplo",
  alt: "Descripción de la imagen",
  objectFit: "cover" as const,
} satisfies ImageProps;
