"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Heart,
  Minus,
  Plus,
  Search,
  Star,
  ShoppingBag,
} from "lucide-react";
import {
  benefits,
  categories,
  collections,
  faqs,
  metrics,
  products,
  steps,
  testimonials,
  type Category,
} from "./data/catalog";

function formatCurrency(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export default function TiendaPage() {
  const [category, setCategory] = useState<Category>("Todo");
  const [cartCount, setCartCount] = useState(2);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onScroll = useCallback(() => {
    const total = document.body.scrollHeight - window.innerHeight;
    setScrollProgress(total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0);
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const filteredProducts = useMemo(
    () => products.filter((product) => category === "Todo" || product.category === category),
    [category]
  );

  const featuredProduct = products[0];
  const FeaturedIcon = featuredProduct.Icon;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 z-[60] h-[2px] bg-gradient-to-r from-cyan-500 to-slate-700 transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 0 ? 1 : 0 }} />
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex min-w-0 items-center gap-3" aria-label="Nordic Supply inicio">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
              <ShoppingBag size={19} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">NORDIC SUPPLY</span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Storefront premium
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 text-sm font-bold text-slate-600 lg:flex">
            {[["Colecciones","#colecciones"],["Productos","#productos"],["Checkout","#checkout"],["FAQ","#faq"]].map(([label,href]) => (
              <a key={label} href={href} className="relative px-3 py-2 hover:text-slate-950 transition-colors duration-200 group">
                {label}
                <span className="absolute bottom-0.5 left-3 right-3 h-[1.5px] rounded-full bg-slate-800 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buscar"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              aria-label="Carrito"
              className="relative grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
            >
              <ShoppingBag size={17} />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-slate-950">
                {cartCount}
              </span>
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 lg:hidden"
            >
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
            {[
              ["Colecciones", "#colecciones"],
              ["Productos", "#productos"],
              ["Checkout", "#checkout"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                {label}
                <ArrowRight size={15} />
              </a>
            ))}
          </nav>
        )}
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_520px] lg:py-18">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              Tienda online completa y lista para venta
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Una tienda profesional, modular y enfocada en conversión.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Storefront real para marcas que necesitan vender, presentar catálogo, comunicar confianza y llevar al cliente a un checkout claro desde cualquier dispositivo.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#productos"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
              >
                Ver catálogo
                <ArrowRight size={16} />
              </a>
              <a
                href="#checkout"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                Revisar checkout
              </a>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-2xl font-black text-slate-950">{metric.value}</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-950/10">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Producto destacado</span>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-500">
                  <Heart size={16} />
                </button>
              </div>

              <div className="grid gap-0 md:grid-cols-[1fr_0.9fr]">
                <div className="grid min-h-[320px] place-items-center bg-linear-to-br from-blue-50 via-white to-emerald-50 p-6">
                  <div className="relative grid h-56 w-56 place-items-center rounded-lg border border-white bg-white shadow-xl shadow-slate-950/10">
                    <div className="absolute left-5 top-5 h-11 w-11 rounded-lg bg-blue-100" />
                    <div className="absolute bottom-5 right-5 h-14 w-14 rounded-lg bg-emerald-100" />
                    <FeaturedIcon size={92} className="relative text-slate-900" strokeWidth={1.25} />
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-white p-5 md:border-l md:border-t-0">
                  <div className="mb-3 inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                    {featuredProduct.tag}
                  </div>
                  <h2 className="text-2xl font-black leading-tight">{featuredProduct.name}</h2>
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-amber-500">
                    <Star size={15} fill="currentColor" />
                    {featuredProduct.rating}
                    <span className="font-medium text-slate-400">({featuredProduct.reviews} reseñas)</span>
                  </div>
                  <div className="mt-5 flex items-end gap-3">
                    <span className="text-3xl font-black">{formatCurrency(featuredProduct.price)}</span>
                    <span className="pb-1 text-sm font-semibold text-slate-400 line-through">
                      {formatCurrency(featuredProduct.compareAt)}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Ficha preparada para galería, variantes, reseñas, garantía, precio comparativo y CTA directo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartCount((count) => count + 1)}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <Plus size={16} />
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="colecciones" className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Colecciones</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Rutas rápidas para comprar</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Cada colección funciona como bloque editable para campañas, temporadas, lanzamientos o categorías principales.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {collections.map(({ name, items, tone, icon: Icon }) => (
              <a key={name} href="#productos" className={`group rounded-lg p-5 transition hover:-translate-y-0.5 ${tone}`}>
                <div className="mb-8 flex items-center justify-between">
                  <Icon size={24} />
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </div>
                <h3 className="text-2xl font-black">{name}</h3>
                <p className="mt-2 text-sm font-semibold opacity-70">{items}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="productos" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Catálogo modular</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Productos listos para vender</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`h-10 shrink-0 rounded-lg px-3 text-sm font-black transition ${
                    category === item
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const Icon = product.Icon;
              return (
                <article key={product.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8">
                  <div className={`grid h-56 place-items-center ${product.bg}`}>
                    <div className="grid h-28 w-28 place-items-center rounded-lg bg-white shadow-lg shadow-slate-950/10" style={{ color: product.accent }}>
                      <Icon size={50} strokeWidth={1.35} />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: product.accent }}>
                          {product.category}
                        </div>
                        <h3 className="mt-2 min-h-12 text-lg font-black leading-6">{product.name}</h3>
                      </div>
                      <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-500">
                        <Heart size={15} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-amber-500">
                      <Star size={14} fill="currentColor" />
                      {product.rating}
                      <span className="font-medium text-slate-400">({product.reviews})</span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xl font-black">{formatCurrency(product.price)}</div>
                        <div className="text-xs font-semibold text-slate-400 line-through">{formatCurrency(product.compareAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCartCount((count) => count + 1)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <Plus size={15} />
                        Agregar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-px px-4 py-12 sm:px-6 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <Icon size={22} className="text-cyan-300" />
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="checkout" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Checkout</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
              Flujo de compra preparado para convertir y escalar.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              La página deja ordenado el camino completo: catálogo, carrito, confianza, datos de envío, pago y confirmación. Puedes conectar pasarela real o usarlo como catálogo con cierre asistido.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-lg font-black">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black">Resumen</h3>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">{cartCount} items</span>
            </div>

            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 border-t border-slate-200 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCartCount((count) => Math.max(0, count - 1))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
                  >
                    <Minus size={13} />
                  </button>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{product.name}</div>
                    <div className="text-xs font-semibold text-slate-400">{product.category}</div>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black">{formatCurrency(product.price)}</span>
              </div>
            ))}

            <div className="mt-2 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(8170)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-2xl font-black">
                <span>Total</span>
                <span>{formatCurrency(8170)}</span>
              </div>
            </div>

            <button type="button" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
              <CreditCard size={16} />
              Finalizar compra
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Check size={14} className="text-emerald-600" />
              Pago seguro, confirmación automática y soporte post-compra.
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Prueba social</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Diseñada para vender con confianza</h2>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              <Star size={16} fill="currentColor" />
              4.8 promedio en experiencia de compra
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-slate-600">{testimonial.text}</p>
                <div className="mt-5">
                  <div className="font-black">{testimonial.name}</div>
                  <div className="text-xs font-semibold text-slate-400">{testimonial.role}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">FAQ</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Preguntas antes de lanzar la tienda</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              La base sirve como página real para venta directa y también como punto de partida para integraciones más avanzadas.
            </p>
          </div>

          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
            {faqs.map(([question, answer], index) => (
              <div key={question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-black"
                >
                  {question}
                  <ChevronDown size={17} className={`shrink-0 transition ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Tienda lista para personalizar</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
              Usa esta página como storefront real y elimina las plantillas vacías.
            </h2>
          </div>
          <Link
            href="/templates/tienda"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
          >
            Activar esta tienda
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
