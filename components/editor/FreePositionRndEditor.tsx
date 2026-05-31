"use client";

import { useState } from "react";
import { Rnd } from "react-rnd";

type CanvasElement = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

type GuideLine =
  | { type: "vertical"; x: number; key: string }
  | { type: "horizontal"; y: number; key: string };

const INITIAL_ELEMENTS: CanvasElement[] = [
  {
    id: "headline",
    label: "Texto principal",
    x: 80,
    y: 72,
    width: 280,
    height: 72,
    zIndex: 1,
  },
  {
    id: "button",
    label: "Boton CTA",
    x: 420,
    y: 220,
    width: 180,
    height: 56,
    zIndex: 2,
  },
  {
    id: "image",
    label: "Imagen",
    x: 760,
    y: 120,
    width: 280,
    height: 180,
    zIndex: 3,
  },
];

const ACTIVE_Z_INDEX = 999;
const GUIDE_THRESHOLD = 6;

export function FreePositionRndEditor() {
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);

  const selectedSet = new Set(selectedIds);

  const selectElement = (id: string, multi: boolean) => {
    setActiveId(id);
    setSelectedIds((current) => {
      if (!multi) return [id];
      return current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id];
    });
  };

  const bringToFront = (id: string) => {
    setActiveId(id);
    setElements((current) =>
      current.map((item) =>
        item.id === id ? { ...item, zIndex: ACTIVE_Z_INDEX } : item
      )
    );
  };

  return (
    <div className="w-full overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-6">
      <div
        className="relative h-[720px] w-[1200px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onMouseDown={() => {
          setSelectedIds([]);
          setActiveId(null);
          setGuides([]);
        }}
      >
        {guides.map((guide) =>
          guide.type === "vertical" ? (
            <div
              key={guide.key}
              className="pointer-events-none absolute top-0 h-full w-px bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.65)]"
              style={{ left: guide.x, zIndex: 1000 }}
            />
          ) : (
            <div
              key={guide.key}
              className="pointer-events-none absolute left-0 h-px w-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.65)]"
              style={{ top: guide.y, zIndex: 1000 }}
            />
          )
        )}

        {elements.map((element) => (
          <Rnd
            key={element.id}
            bounds="parent"
            position={{ x: element.x, y: element.y }}
            size={{ width: element.width, height: element.height }}
            dragGrid={[24, 24]}
            resizeGrid={[24, 24]}
            style={{
              zIndex: activeId === element.id ? ACTIVE_Z_INDEX : element.zIndex,
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              selectElement(element.id, event.shiftKey || event.ctrlKey || event.metaKey);
              bringToFront(element.id);
            }}
            onDrag={(event, data) => {
              const deltaX = data.x - element.x;
              const deltaY = data.y - element.y;
              const movingIds = selectedSet.has(element.id) ? selectedIds : [element.id];
              const movingElements = elements
                .filter((item) => movingIds.includes(item.id))
                .map((item) =>
                  item.id === element.id
                    ? { ...item, x: data.x, y: data.y }
                    : { ...item, x: item.x + deltaX, y: item.y + deltaY }
                );

              setGuides(getSmartGuides(movingElements, elements, movingIds));
            }}
            onDragStop={(_, data) => {
              const deltaX = data.x - element.x;
              const deltaY = data.y - element.y;
              const movingIds = selectedSet.has(element.id) ? selectedIds : [element.id];
              setElements((current) =>
                current.map((item) =>
                  movingIds.includes(item.id)
                    ? {
                        ...item,
                        x: item.id === element.id ? data.x : item.x + deltaX,
                        y: item.id === element.id ? data.y : item.y + deltaY,
                        zIndex: item.id === element.id ? ACTIVE_Z_INDEX : item.zIndex,
                      }
                    : item
                )
              );
              setGuides([]);
            }}
            onResizeStop={(_, __, ref, ___, position) => {
              setElements((current) =>
                current.map((item) =>
                  item.id === element.id
                    ? {
                        ...item,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        x: position.x,
                        y: position.y,
                      }
                    : item
                )
              );
            }}
            className={`flex items-center justify-center rounded-md border text-sm font-semibold shadow-sm ${
              selectedSet.has(element.id)
                ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 ring-2 ring-fuchsia-300"
                : "border-indigo-400 bg-indigo-50 text-indigo-700"
            }`}
          >
            {element.label}
          </Rnd>
        ))}
      </div>
    </div>
  );
}

function getSmartGuides(
  movingElements: CanvasElement[],
  allElements: CanvasElement[],
  movingIds: string[]
) {
  const nextGuides: GuideLine[] = [];
  const staticElements = allElements.filter((item) => !movingIds.includes(item.id));

  for (const moving of movingElements) {
    const movingXPoints = [
      { value: moving.x, key: "left" },
      { value: moving.x + moving.width / 2, key: "center-x" },
      { value: moving.x + moving.width, key: "right" },
    ];
    const movingYPoints = [
      { value: moving.y, key: "top" },
      { value: moving.y + moving.height / 2, key: "center-y" },
      { value: moving.y + moving.height, key: "bottom" },
    ];

    for (const target of staticElements) {
      const targetXPoints = [
        { value: target.x, key: "left" },
        { value: target.x + target.width / 2, key: "center-x" },
        { value: target.x + target.width, key: "right" },
      ];
      const targetYPoints = [
        { value: target.y, key: "top" },
        { value: target.y + target.height / 2, key: "center-y" },
        { value: target.y + target.height, key: "bottom" },
      ];

      for (const source of movingXPoints) {
        for (const destination of targetXPoints) {
          if (Math.abs(source.value - destination.value) <= GUIDE_THRESHOLD) {
            nextGuides.push({
              type: "vertical",
              x: destination.value,
              key: `v-${moving.id}-${target.id}-${source.key}-${destination.key}`,
            });
          }
        }
      }

      for (const source of movingYPoints) {
        for (const destination of targetYPoints) {
          if (Math.abs(source.value - destination.value) <= GUIDE_THRESHOLD) {
            nextGuides.push({
              type: "horizontal",
              y: destination.value,
              key: `h-${moving.id}-${target.id}-${source.key}-${destination.key}`,
            });
          }
        }
      }
    }
  }

  return nextGuides;
}
