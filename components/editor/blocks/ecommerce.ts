import type { SettingsField, EditorBlockDefinition } from "@/types/editor";
import { CartDrawer } from "./store/CartDrawer";
import { CartButton } from "./store/CartButton";
import { ProductCard } from "./store/ProductCard";

/**
 * Definiciones de bloques específicos para el nicho de E-commerce.
 * Estas se importarán en tu registry.ts principal.
 */
export const ecommerceBlockDefinitions = {
  "ec-stats-bar": {
    label: "Barra de Estadísticas",
    icon: "BarChart3",
    category: "ecommerce",
    description: "Muestra métricas clave de la tienda (Ventas, Visitas, etc.)",
    settings: [
      {
        kind: "color",
        key: "accentColor",
        label: "Color de Acento",
        presets: ["#f59e0b", "#10b981", "#6366f1"],
      },
      // La propiedad `showLiveStatus` de tu definición original
      // parece ser más adecuada para el `StoreTopSlot` en `EcommercePage`,
      // no directamente para `StatsBar`. Si necesitas que sea editable,
      // `StoreTopSlot` podría ser su propio bloque o parte de un bloque
      // de "Encabezado de Tienda" más grande.
    ] as SettingsField[],
  },
  "ec-product-grid": {
    label: "Grilla de Productos",
    icon: "Package",
    category: "ecommerce",
    description: "Muestra el catálogo de productos con filtros.",
    settings: [
      {
        kind: "number",
        key: "columns",
        label: "Columnas",
        min: 1,
        max: 4,
      },
      {
        kind: "select",
        key: "category",
        label: "Categoría inicial",
        options: [
          { label: "Todo", value: "all" },
          { label: "Electrónica", value: "electronics" },
          { label: "Ropa", value: "clothing" },
        ],
      },
      {
        kind: "toggle",
        key: "showPrice",
        label: "Mostrar Precios",
      }
    ] as SettingsField[],
  }
};

export const EC_CATEGORY = {
  key: "ecommerce",
  label: "E-commerce",
  icon: "ShoppingBag"
};

const COLOR_PRESETS = ["#00b5f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444"] as const;

/** Bloques de tienda con componentes React reales */
export const storeBlockDefinitions: Record<string, Omit<EditorBlockDefinition, "type">> = {
  "store-cart-drawer": {
    label: "Carrito lateral",
    icon: "ShoppingCart",
    category: "ecommerce",
    description: "Drawer lateral que muestra los items del carrito con qty y checkout",
    component: CartDrawer,
    defaults: { accentColor: "#00b5f6", checkoutLabel: "Ir a pagar", funnelStep: "checkout" },
    settings: [
      { kind: "color", key: "accentColor", label: "Color acento", presets: [...COLOR_PRESETS] },
      { kind: "text",  key: "checkoutLabel", label: "Texto botón checkout" },
      { kind: "text",  key: "funnelId", label: "Funnel ID (opcional)" },
      {
        kind: "select",
        key: "funnelStep",
        label: "Paso del funnel",
        options: [
          { label: "Landing", value: "landing" },
          { label: "Checkout", value: "checkout" },
          { label: "Upsell", value: "upsell" },
          { label: "Downsell", value: "downsell" },
          { label: "Thank you", value: "thankyou" },
        ],
      },
    ] as SettingsField[],
  },
  "store-cart-button": {
    label: "Botón del carrito",
    icon: "ShoppingBag",
    category: "ecommerce",
    description: "Botón flotante que abre el carrito lateral y muestra el contador de items",
    component: CartButton,
    defaults: { accentColor: "#00b5f6", label: "Carrito" },
    settings: [
      { kind: "color", key: "accentColor", label: "Color acento", presets: [...COLOR_PRESETS] },
      { kind: "text",  key: "label", label: "Etiqueta" },
    ] as SettingsField[],
  },
  "store-product-card": {
    label: "Tarjeta de Producto",
    icon: "Package",
    category: "ecommerce",
    description: "Card individual de producto con imagen, precio, variante y botón de carrito",
    component: ProductCard,
    defaults: {
      productName:     "Producto",
      variantName:     "Talla única",
      priceMxn:        29900,
      accentColor:     "#00b5f6",
    },
    settings: [
      { kind: "text",   key: "productName",    label: "Nombre del producto" },
      { kind: "text",   key: "variantName",     label: "Variante" },
      { kind: "number", key: "priceMxn",        label: "Precio (centavos MXN)", min: 0, step: 100 },
      { kind: "number", key: "comparePriceMxn", label: "Precio anterior (centavos)", min: 0, step: 100 },
      { kind: "image",  key: "imageUrl",        label: "Imagen del producto" },
      { kind: "text",   key: "badge",           label: "Badge (ej: Nuevo, Oferta)" },
      { kind: "color",  key: "accentColor",     label: "Color acento", presets: [...COLOR_PRESETS] },
    ] as SettingsField[],
  },
};
