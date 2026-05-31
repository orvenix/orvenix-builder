import React from 'react';
import Image from 'next/image';
import { useEditorStore } from "@/components/editor/store/useEditorStore";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

const mockProducts: Product[] = [
  { id: '1', name: 'Smartphone X', price: 699.99, imageUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Product1' },
  { id: '2', name: 'Laptop Pro', price: 1299.99, imageUrl: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Product2' },
  { id: '3', name: 'Smartwatch Z', price: 199.99, imageUrl: 'https://via.placeholder.com/150/3357FF/FFFFFF?text=Product3' },
  { id: '4', name: 'Headphones A', price: 99.99, imageUrl: 'https://via.placeholder.com/150/FF33F6/FFFFFF?text=Product4' },
];

interface ProductGridProps {
  columns?: number;
  category?: string; // En un escenario real, esto filtraría los productos
  showPrice?: boolean;
}

export function ProductGrid({ columns = 3, category = "all", showPrice = true }: ProductGridProps) {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const secondary = theme?.colors?.secondary ?? "#0f172a";
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const cardRadius = theme?.radius?.card ?? "1rem";
  const buttonRadius = theme?.radius?.button ?? "999px";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";

  // Ajustamos las clases de la grilla dinámicamente.
  // Nota: Tailwind necesita que las clases estén completas en el código fuente
  // para que las detecte. Para valores arbitrarios como `md:grid-cols-${columns}`,
  // a veces es necesario configurar el `safelist` en `tailwind.config.js`
  // o usar un objeto de mapeo si los valores son fijos.
  const gridColsClass =
    columns >= 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  // Aquí iría la lógica para filtrar `mockProducts` por `category`
  const filteredProducts = mockProducts; // Por ahora, no hay filtrado real

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" style={{ color: text }}>Catálogo de Productos</h2>
        {/* El selector de categoría en el componente se controlaría por la prop `category` */}
        <select
          value={category}
          onChange={() => {}}
          className="w-full p-2 sm:w-auto"
          style={{
            borderRadius: cardRadius,
            border: `1px solid ${primary}22`,
            background,
            color: text,
          }}
        >
          <option value="all">Todo</option>
          <option value="electronics">Electrónica</option>
          <option value="clothing">Ropa</option>
        </select>
      </div>
      <div className={`grid min-w-0 ${gridColsClass} gap-6`}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="min-w-0 overflow-hidden"
            style={{
              borderRadius: cardRadius,
              background,
              boxShadow: softShadow,
              border: `1px solid ${primary}16`,
            }}
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={300}
              height={192}
              unoptimized
              className="h-48 w-full object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold" style={{ color: text }}>{product.name}</h3>
              {showPrice && <p className="mt-1" style={{ color: `${text}99` }}>${product.price.toFixed(2)}</p>}
              <button
                className="mt-3 w-full px-3 py-2 text-white"
                style={{
                  borderRadius: buttonRadius,
                  background: secondary,
                }}
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Añadimos los defaults para que el editor sepa qué valores iniciales usar
ProductGrid.defaults = {
  columns: 3,
  category: "all",
  showPrice: true,
};
