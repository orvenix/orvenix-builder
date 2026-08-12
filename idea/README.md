# Sitio Orvenix — estructura Next.js (App Router)

## Estilo visual

Paleta cálida y amigable, pensada para verse profesional y moderna sin caer
en lo futurista: fondo color papel, tarjetas blancas con sombra suave,
acentos coral y verde-azulado, tipografía redondeada (Sora para títulos,
Inter para texto). Nada de fondos oscuros, glow neón ni efectos de vidrio.

## Qué incluye

```
reference-app/
  layout.tsx          Layout raíz: fuentes (next/font), metadata, <html>/<body>
  globals.css           Tokens de color, tipografía y utilidades visuales de marca
  page.tsx               Inicio: hero, características, precios, testimonios, FAQ, CTA
  nosotros/
    page.tsx              Página "Nosotros": misión, visión, valores, estadísticas

components/
  Navbar.tsx              Barra de navegación (client component, menú móvil)
  Footer.tsx                Pie de página, columnas generadas desde content.ts
  BlockCanvasMockup.tsx      Mockup animado del editor de bloques (hero)
  FaqAccordion.tsx            Acordeón de preguntas frecuentes (client component)
  FeatureIcon.tsx               Helper que mapea nombres de icono a lucide-react

lib/
  content.ts                    TODO el texto del sitio: navegación, botones,
                                 CTAs, footer e intros de cada sección, además
                                 de precios, features, testimonios, FAQ, etc.
```

## Qué es editable y dónde

**Todo el contenido de texto** — sin excepción — vive en `lib/content.ts`:

- `BRAND` — nombre y descripción de la marca
- `NAV_LINKS` / `NAVBAR` — links del menú, texto de "Iniciar sesión" y del botón principal
- `HERO` — textos del encabezado principal
- `FEATURES_INTRO` / `FEATURES` — introducción y tarjetas de características
- `PRICING_INTRO` / `PRICING` / `PRICING_BADGE_LABEL` — introducción, planes y etiqueta de "Más elegido"
- `TESTIMONIALS_INTRO` / `TESTIMONIALS` — introducción y citas de clientes
- `FAQ_INTRO` / `FAQ` — introducción y preguntas frecuentes
- `CTA_HOME` / `CTA_ABOUT` — banners de llamado a la acción de cada página
- `FOOTER_COLUMNS` / `FOOTER_BOTTOM_NOTE` — columnas y links del pie de página
- `ABOUT_HEADER` / `ABOUT_MISSION_VISION` / `STATS` / `VALUES_INTRO` / `VALUES` — página Nosotros

**El estilo visual** (colores, sombras, radios de borde) vive en
`reference-app/globals.css`, dentro del bloque `:root`. Cambiar un color ahí lo
actualiza en todo el sitio.

## Pasos para integrarlo a tu proyecto Orvenix

1. Copia las carpetas ``reference-app/`, `components/` y `lib/` dentro de tu proyecto
   Next.js (fusiona con lo que ya tengas; no sobrescribas tu `layout.tsx` o
   `globals.css` actuales sin revisar antes).
2. Instala el ícono set si no lo tienes:
   ```bash
   npm install lucide-react
   ```
3. Verifica que tu `tsconfig.json` tenga el alias `@/*` apuntando a la raíz
   del proyecto (lo trae `create-next-app` por default):
   ```json
   "paths": { "@/*": ["./*"] }
   ```
4. Corre `npm run dev` y visita `/` y `/nosotros`.

## Agregar más páginas

Para agregar otra página (por ejemplo `/contacto` o `/precios` como página
propia), crea `reference-app/contacto/page.tsx` siguiendo el mismo patrón que
`app/nosotros/page.tsx`: importa `Navbar` y `Footer`, y agrega el contenido
nuevo a `lib/content.ts` si quieres mantenerlo editable desde un solo lugar.
No olvides añadir el link correspondiente en `NAV_LINKS` y, si aplica, en
`FOOTER_COLUMNS` dentro de `lib/content.ts`.


## Nota Orvenix:

La carpeta de paginas vive como `reference-app/` para que este ejemplo sirva como referencia visual sin que Next.js lo compile como rutas reales de la plataforma principal.
