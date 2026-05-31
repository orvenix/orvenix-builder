# ORVENIX SUPER BUILDER
## Fase 1 ejecutable: multipagina, tema persistido y extraccion inicial de `builder-core`

> Actualizado: 2026-05-24  
> Alcance: primer lote tecnico para evolucionar el builder sin romper el producto actual

---

## 1. Objetivo de esta fase

El primer salto real del Super Builder no debe empezar por IA, funnels ni rediseno del editor.  
Debe empezar por cambiar la base del producto de:

- `un sitio = un tree`

a:

- `un sitio = muchas paginas + un tema + un runtime comun`

La meta de esta fase es habilitar eso con cambios **aditivos**, compatibles con el editor actual.

---

## 2. Principios de implementacion

### 2.1 No romper el sitio actual

Mientras exista codigo que dependa de `EditorWebsite.tree`, ese campo debe seguir vivo.

Compatibilidad temporal:

- si el sitio todavia no tiene `SitePage`, editor/preview/publicado leen `EditorWebsite.tree`
- si el sitio ya tiene `SitePage`, el sistema usa `SitePage.tree`
- al guardar por primera vez bajo el modo multipagina, se crea una pagina `home`

### 2.2 Cambios aditivos primero

Esta fase:

- agrega tablas nuevas
- agrega helpers nuevos
- introduce un `builder-core` inicial

Esta fase no:

- reescribe billing
- reescribe auth
- elimina `EditorWebsite.tree`
- rompe preview/export actuales

---

## 3. Schema Prisma exacto recomendado

### 3.1 Nuevos modelos

```prisma
model SitePage {
  id          String        @id @default(cuid())
  siteId       String        @db.VarChar(64)
  name         String        @db.VarChar(191)
  slug         String        @db.VarChar(191)
  tree         Json
  seo          Json?
  isHome       Boolean       @default(false)
  published    Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  site         EditorWebsite @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, slug])
  @@index([siteId])
  @@index([siteId, published])
  @@map("site_pages")
}
```

```prisma
model SiteTheme {
  id          String        @id @default(cuid())
  siteId       String        @unique @db.VarChar(64)
  tokens       Json
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  site         EditorWebsite @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@map("site_themes")
}
```

### 3.2 Relaciones nuevas en `EditorWebsite`

Agregar:

```prisma
pages  SitePage[]
theme  SiteTheme?
```

### 3.3 No tocar aun

No mover en esta fase:

- `Collection`
- `Record`
- `Product`
- `Order`
- `Plan`
- `Subscription`

Eso mantiene el riesgo bajo y evita mezclar multipagina con commerce/billing.

---

## 4. Estrategia de migracion de datos

### 4.1 Estado inicial

Hoy cada `EditorWebsite` guarda:

- `tree`
- `published`
- metadata del sitio

### 4.2 Migracion segura

Regla:

- crear `SitePage` solo cuando haga falta

Flujo:

1. Crear tablas `site_pages` y `site_themes`
2. Agregar helper `ensureHomePage(siteId)`
3. Cuando el editor abra un sitio sin paginas:
   - leer `EditorWebsite.tree`
   - crear `SitePage` con:
     - `name = "Inicio"`
     - `slug = "home"`
     - `isHome = true`
     - `published = EditorWebsite.published`
     - `tree = EditorWebsite.tree`
4. Guardar cambios nuevos ya sobre `SitePage.tree`
5. Mantener sincronizacion temporal opcional hacia `EditorWebsite.tree` como fallback

### 4.3 Criterio para retirar `EditorWebsite.tree`

Solo despues de:

- editor multipagina estable
- preview multipagina estable
- publicado multipagina estable
- export multipagina estable

---

## 5. Primer lote de carpetas y archivos

Esta es la extraccion inicial sugerida, sin mover todavia toda la UI.

### 5.1 Nuevo dominio `builder-core`

Crear:

```text
lib/builder-core/
  tree/
    starterTree.ts
    sitePages.ts
    pageTree.ts
  layout/
    layoutNormalizer.ts
  bindings/
    useBindingData.ts
  compiler/
    serializeToHtml.ts
    serializeToJsx.ts
    validateHtmlExport.ts
  persistence/
    editorPersistence.ts
```

### 5.2 Regla de migracion

En el primer lote no se mueven todos los consumidores.  
Se crean wrappers/reexports para empezar a reducir acoplamiento.

Ejemplo:

- `lib/starterTree.ts` pasa a reexportar desde `lib/builder-core/tree/starterTree`
- `lib/editor/layoutNormalizer.ts` pasa a reexportar desde `lib/builder-core/layout/layoutNormalizer`
- `lib/editor/useBindingData.ts` pasa a reexportar desde `lib/builder-core/bindings/useBindingData`
- `lib/editorPersistence.ts` pasa a reexportar desde `lib/builder-core/persistence/editorPersistence`

Esto permite migrar imports poco a poco.

---

## 6. Archivos concretos a tocar en la primera implementacion

### 6.1 Prisma

- `prisma/editor.prisma`
- nueva baseline incremental o migracion aditiva

### 6.2 Persistencia y acceso a sitio/paginas

- `lib/editor-db.ts`
- `lib/editorPersistence.ts`
- `lib/builder-core/tree/sitePages.ts` nuevo
- `lib/builder-core/tree/pageTree.ts` nuevo

### 6.3 Editor

- `app/editor/[id]/page.impl.tsx`
- `components/editor/store/useEditorStore.ts`
- `components/editor/EditorHeader.tsx`
- `components/editor/sidebar/LayersPanel.tsx`

Objetivo de este lote:

- el editor sigue abriendo el sitio
- pero ya conoce una pagina activa
- aunque inicialmente solo exista `home`

### 6.4 Preview y publicado

- `app/preview/[id]/page.impl.tsx`
- rutas publicas del runtime del sitio
- exportadores HTML/JSX

Objetivo:

- preview/render usan el mismo resolved tree
- primero intentan `SitePage`
- si no existe, caen a `EditorWebsite.tree`

---

## 7. Contratos nuevos que conviene introducir

### 7.1 `ResolvedSitePage`

```ts
type ResolvedSitePage = {
  siteId: string
  pageId: string | null
  name: string
  slug: string
  tree: unknown
  isHome: boolean
  published: boolean
  source: "site-page" | "legacy-site-tree"
}
```

### 7.2 `ResolvedSiteTheme`

```ts
type ResolvedSiteTheme = {
  siteId: string
  tokens: Record<string, unknown>
  source: "site-theme" | "runtime-defaults"
}
```

Estos contratos son mas importantes que el UI en esta fase, porque desacoplan runtime/editor del origen real de datos.

---

## 8. Orden de implementacion recomendado

### Paso 1

Agregar `SitePage` y `SiteTheme` al schema.

### Paso 2

Crear helpers:

- `listSitePages(siteId)`
- `getResolvedSitePage(siteId, slug?)`
- `ensureHomePage(siteId)`
- `getResolvedSiteTheme(siteId)`

### Paso 3

Crear `lib/builder-core/*` y empezar con reexports.

### Paso 4

Adaptar editor para trabajar con pagina activa `home`.

### Paso 5

Adaptar preview/publicado/export para resolver la pagina antes del tree.

### Paso 6

Agregar selector de paginas en el editor.

No antes.

---

## 9. Definition of done de la fase 1

La fase 1 queda realmente terminada cuando:

- un sitio nuevo puede tener varias paginas
- un sitio viejo abre sin romperse
- existe una pagina `home` resuelta automaticamente
- preview y publicado usan el mismo resolved tree
- export puede sacar al menos `home` y una pagina secundaria
- el tema global vive en `SiteTheme.tokens`
- `EditorWebsite.tree` sigue solo como compatibilidad temporal

---

## 10. Riesgos a evitar

- mezclar esta fase con funnels o A/B testing
- mezclar esta fase con reescritura del UI del editor
- tocar billing/auth en el mismo lote
- intentar retirar `EditorWebsite.tree` demasiado pronto
- mover demasiados imports en una sola PR

---

## 11. Recomendacion ejecutiva

El siguiente sprint tecnico del producto deberia declararse asi:

> "Multipagina compatible con legacy + tema persistido + builder-core inicial"

No como:

> "redisenar el editor" o "hacer IA mas avanzada"

Ese enfoque te desbloquea casi todo lo demas sin pagar deuda innecesaria.
