# ORVENIX SUPER BUILDER
## Arquitectura objetivo, schema y orden de ejecucion

> Actualizado: 2026-05-24
> Objetivo: evolucionar Orvenix desde su builder actual hacia una plataforma multipagina, data-driven, comercial y exportable sin rehacer el producto desde cero.

---

## 1. Principio rector

No conviene reconstruir Orvenix. La estrategia correcta es:

1. Extraer dominios tecnicos claros de lo que ya existe.
2. Cambiar el modelo de datos para soportar paginas multiples y tema persistido.
3. Unificar editor, preview, publicado y export alrededor del mismo arbol.
4. Endurecer CMS, commerce, IA y runtime como plataformas internas.

Hoy Orvenix ya tiene base en:

- editor visual y export
- CMS basico
- ecommerce base
- billing
- IA
- runtime health y despliegue

El salto al Super Builder depende mas de modularizacion y modelo de datos que de crear features desde cero.

---

## 2. Mapa de dominios objetivo

### 2.1 Builder Core

Responsable de:

- arbol de nodos
- layout
- bindings
- tokens
- responsive engine
- interacciones
- compilacion/export

### 2.2 Content Platform

Responsable de:

- collections
- records
- relaciones
- filtros
- vistas
- workflow editorial

### 2.3 Commerce Platform

Responsable de:

- catalogo
- variantes
- inventario
- ordenes
- checkout
- suscripciones
- funnels
- experimentos

### 2.4 AI Platform

Responsable de:

- generacion de secciones/paginas
- sketch-to-layout
- mejoras SEO/WCAG/performance
- jobs auditables de IA

### 2.5 Site Runtime

Responsable de:

- render publico
- preview
- publicado
- export runtime
- cache/SSR/ISR

### 2.6 Platform Ops

Responsable de:

- auth
- billing
- health
- readiness
- webhooks
- admin

---

## 3. Estructura de carpetas objetivo

```text
app/
  (marketing)/
  (platform)/
  api/
    ai/
    billing/
    builder/
    cms/
    commerce/
    runtime/
    webhooks/

components/
  builder/
    canvas/
    inspector/
    layers/
    toolbar/
    bindings/
    interactions/
  cms/
  commerce/
  shared/

lib/
  builder-core/
    tree/
    compiler/
    layout/
    bindings/
    interactions/
    responsive/
    tokens/
    validation/
  content-platform/
    schema/
    records/
    queries/
    publishing/
  commerce-platform/
    catalog/
    checkout/
    subscriptions/
    funnels/
    experiments/
  ai-platform/
    prompts/
    transforms/
    optimizers/
    jobs/
  site-runtime/
    render/
    preview/
    publish/
    caching/
  platform-ops/
    auth/
    billing/
    health/
    readiness/
    webhooks/

store/
  builder/
  cms/
  commerce/
```

---

## 4. Mapeo desde el repo actual

### Builder Core

Mover o refactorizar desde:

- `lib/editorPersistence.ts`
- `lib/editor/layoutNormalizer.ts`
- `lib/editor/useBindingData.ts`
- `lib/export/serializeToHtml.ts`
- `lib/export/serializeToJsx.ts`
- `lib/export/validateHtmlExport.ts`
- `lib/starterTree.ts`
- `lib/editorWebs.ts`
- `store` del editor
- `components/editor/*`

### Content Platform

Mantener y endurecer:

- `app/dashboard/cms/*`
- `app/api/cms/*`
- `app/api/content/*`
- `Collection`
- `Record`

### Commerce Platform

Agrupar desde:

- `lib/checkout.ts`
- `lib/checkout-payment.ts`
- `lib/store-checkout-payment.ts`
- `lib/subscription-payment.ts`
- `lib/stripe-subscription-payment.ts`
- `lib/mercadopago.ts`
- `lib/stripe.ts`
- `lib/billing/route-logic.ts`

### AI Platform

Agrupar desde:

- `app/api/chat/*`
- `app/api/sketch-to-web/*`
- `lib/ai/*`
- `lib/intelligentTemplates.ts`
- `lib/chat-knowledge.ts`

### Site Runtime

Agrupar desde:

- `app/p/[id]`
- `app/preview/[id]`
- `lib/publishedSiteArtifacts.ts`
- `lib/siteContentStore.ts`

### Platform Ops

Ya existe bastante bien en:

- `app/admin/*`
- `app/api/admin/*`
- `app/api/billing/*`
- `app/api/health/*`
- `lib/runtime-health*.ts`
- `lib/production-readiness.ts`
- `lib/webhook*.ts`

---

## 5. Evolucion del schema Prisma

### 5.1 Cambio conceptual principal

Hoy:

- `EditorWebsite.tree` es el sitio completo

Objetivo:

- `EditorWebsite` pasa a ser el contenedor del sitio
- cada pagina vive en `SitePage.tree`
- el tema global vive en `SiteTheme.tokens`

Este es el cambio mas importante del Super Builder.

### 5.2 Nuevos modelos propuestos

```prisma
model SitePage {
  id         String        @id @default(cuid())
  siteId     String        @db.VarChar(64)
  name       String        @db.VarChar(191)
  slug       String        @db.VarChar(191)
  tree       Json
  seo        Json?
  isHome     Boolean       @default(false)
  published  Boolean       @default(false)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  site       EditorWebsite @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, slug])
  @@index([siteId])
  @@map("site_pages")
}
```

```prisma
model SiteTheme {
  id         String        @id @default(cuid())
  siteId     String        @unique @db.VarChar(64)
  tokens     Json
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  site       EditorWebsite @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@map("site_themes")
}
```

```prisma
model MediaAsset {
  id         String    @id @default(cuid())
  siteId     String?   @db.VarChar(64)
  userId     String?   @db.VarChar(191)
  kind       String    @db.VarChar(32)
  url        String    @db.VarChar(1024)
  alt        String?   @db.VarChar(255)
  width      Int?
  height     Int?
  metadata   Json?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([siteId])
  @@index([userId])
  @@map("media_assets")
}
```

```prisma
model Funnel {
  id         String   @id @default(cuid())
  siteId     String   @db.VarChar(64)
  name       String   @db.VarChar(191)
  slug       String   @db.VarChar(191)
  status     String   @default("draft") @db.VarChar(32)
  settings   Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([siteId, slug])
  @@index([siteId])
  @@map("funnels")
}
```

```prisma
model FunnelStep {
  id         String   @id @default(cuid())
  funnelId    String
  pageId      String?  @db.VarChar(191)
  kind        String   @db.VarChar(32)
  position    Int
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([funnelId])
  @@index([pageId])
  @@map("funnel_steps")
}
```

```prisma
model Experiment {
  id          String   @id @default(cuid())
  siteId      String   @db.VarChar(64)
  pageId      String?  @db.VarChar(191)
  funnelId    String?  @db.VarChar(191)
  name        String   @db.VarChar(191)
  status      String   @default("draft") @db.VarChar(32)
  target      String   @db.VarChar(64)
  trafficSplit Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([siteId])
  @@index([pageId])
  @@index([funnelId])
  @@map("experiments")
}
```

```prisma
model AiGenerationJob {
  id         String   @id @default(cuid())
  siteId     String?  @db.VarChar(64)
  pageId     String?  @db.VarChar(191)
  type       String   @db.VarChar(64)
  input      Json
  output     Json?
  status     String   @default("queued") @db.VarChar(32)
  error      String?  @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([siteId])
  @@index([pageId])
  @@index([status])
  @@map("ai_generation_jobs")
}
```

```prisma
model Automation {
  id          String   @id @default(cuid())
  siteId      String   @db.VarChar(64)
  name        String   @db.VarChar(191)
  triggerType String   @db.VarChar(64)
  actionGraph Json
  status      String   @default("draft") @db.VarChar(32)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([siteId])
  @@index([status])
  @@map("automations")
}
```

### 5.3 Ajustes recomendados sobre modelos actuales

#### EditorWebsite

- Mantener `tree` por compatibilidad temporal
- Marcarlo como legacy durante la transicion
- Agregar relacion:
  - `pages SitePage[]`
  - `theme SiteTheme?`

#### Collection / Record

Mantener como base actual, pero mas adelante:

- endurecer `fields` con schema tipado
- agregar relations explicitas
- agregar `status` por record si quieres workflows editoriales mas ricos

#### Product / Order

Ya son una muy buena base.

Pendientes futuros:

- `inventoryPolicy`
- `shippingProfile`
- `taxClass`
- `digitalFulfillment`
- `subscriptionProductConfig`

---

## 6. Orden de migracion recomendado

### Fase 1

Agregar:

- `SitePage`
- `SiteTheme`

Sin borrar nada existente.

### Fase 2

Cambiar editor/preview/publicado para leer:

- primero `SitePage`
- fallback a `EditorWebsite.tree`

### Fase 3

Migrar sitios existentes:

- crear `SitePage` home para cada sitio actual
- copiar ahi el `tree`

### Fase 4

Dejar `EditorWebsite.tree` solo como compatibilidad temporal.

### Fase 5

Quitar dependencia de `EditorWebsite.tree` cuando todo el runtime ya use `SitePage`.

---

## 7. Primer lote de refactor

### 7.1 Lote A — Multipagina

Objetivo:

- soportar varias paginas reales por sitio

Entregables:

- schema con `SitePage`
- helpers de acceso a pagina home
- preview por pagina
- publicado por pagina

Archivos a tocar primero:

- `prisma/editor.prisma`
- `lib/editor-db.ts`
- `lib/editorPersistence.ts`
- `app/editor/[id]/page.impl.tsx`
- `app/preview/[id]/*`
- `app/p/[id]/*`

### 7.2 Lote B — Tema persistido

Objetivo:

- sacar tokens del runtime suelto y persistirlos

Entregables:

- schema `SiteTheme`
- panel de tokens
- compiler que lea tokens persistidos

Archivos a tocar:

- `prisma/editor.prisma`
- `components/editor/GlobalStylesPanel.tsx`
- `lib/export/serializeToHtml.ts`
- `lib/export/serializeToJsx.ts`
- `lib/starterTree.ts`

### 7.3 Lote C — Builder Core explicito

Objetivo:

- separar dominio del editor de UI y store

Mover hacia:

- `lib/builder-core/tree`
- `lib/builder-core/layout`
- `lib/builder-core/bindings`
- `lib/builder-core/compiler`

No es un rewrite: es extraccion progresiva.

---

## 8. Roadmap por sprints

### Sprint 1-2

- agregar `SitePage`
- adaptar helpers de lectura/escritura
- introducir pagina home por sitio
- preview/publicado multipagina basico

### Sprint 3-4

- agregar `SiteTheme`
- persistir tokens
- usar tokens en export/preview/runtime

### Sprint 5-6

- extraer `builder-core`
- normalizar arbol y bindings
- desacoplar compiler/export del UI layer

### Sprint 7-8

- CMS relations
- workflows draft/review/publish
- vistas y filtros mas ricos

### Sprint 9-10

- `Funnel` + `FunnelStep`
- checkout funnel-aware
- primeras conversion rules

### Sprint 11-12

- `Experiment`
- A/B testing por pagina o funnel
- analytics de conversion

### Sprint 13-14

- `AiGenerationJob`
- prompt-to-section
- prompt-to-page
- fixes SEO/WCAG/performance sobre arbol editable

### Sprint 15-16

- `Automation`
- triggers de forms/checkout/CMS
- observabilidad y auditabilidad

---

## 9. Prioridades no negociables

1. `SitePage`
2. `SiteTheme`
3. `builder-core`
4. relaciones reales de CMS
5. `Funnel`
6. `Experiment`
7. `AiGenerationJob`

---

## 10. Que no conviene rehacer ahora

No rehacer en esta etapa:

- auth
- billing
- Stripe
- deploy
- runtime health

Esas capas ya existen y no son hoy el cuello de botella principal del Super Builder.

---

## 11. Criterio de exito

La evolucion va bien si Orvenix logra esto:

- un sitio puede tener muchas paginas reales
- el mismo arbol alimenta editor, preview, publicado y export
- el tema vive en datos, no solo en CSS
- el CMS puede relacionar contenido de forma fuerte
- commerce entiende funnels y experimentos
- la IA modifica estructuras reales del builder y deja trazabilidad

Cuando eso pase, Orvenix deja de ser "un editor con extras" y se convierte en una plataforma builder completa.
