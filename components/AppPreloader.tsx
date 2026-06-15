import { OrvenixBrand } from "@/components/OrvenixLogo";

export function AppPreloader() {
  return (
    <main className="app-preloader" aria-label="Cargando Orvenix">
      <div className="app-preloader__ambient" aria-hidden="true" />
      <section className="app-preloader__panel" aria-live="polite" aria-busy="true">
        <div className="app-preloader__mark-wrap">
          <span className="app-preloader__ring" aria-hidden="true" />
          <OrvenixBrand iconSize={54} textSize="xl" className="app-preloader__brand" />
        </div>
        <div className="app-preloader__bar" aria-hidden="true">
          <span />
        </div>
        <p className="app-preloader__text">Preparando tu espacio de trabajo</p>
      </section>
    </main>
  );
}
