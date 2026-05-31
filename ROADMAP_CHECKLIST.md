# ORVENIX — ROADMAP Y AUDITORIA DE AVANCE
## Hacia el Super Builder | Estado real del proyecto

> Actualizado: 2026-05-26  
> Stack actual: Next.js 16.2.4 + React 19 + Prisma 7 + MySQL/MariaDB + Stripe + MercadoPago + Anthropic + Monaco

---

## Leyenda De Estado Auditada

- `[x]` Terminado real y localizado en el workspace
- `[~]` Parcial o implementado solo a nivel tecnico, pero sin validacion completa
- `[ ]` No encontrado o no verificado
- `[!]` Marcado anteriormente con demasiado optimismo o inconsistente con el repo

## Correccion Ejecutiva 2026-05-18

- El proyecto **si es usable** y tiene base fuerte en monetizacion, editor, CMS, export e IA.
- El roadmap original **sobreestima tests, build/lint verificados, migraciones aplicadas y algunos cierres de produccion**.
- Tambien **subestima** partes del editor ya presentes: `NodeAnimation`, `AnimationsPanel`, Dev Mode con Monaco, parser CSS seguro, computed styles y autocomplete Tailwind variables.
- A partir de esta auditoria, lo correcto es trabajar con tres categorias:
  - terminado real
  - parcial pero funcional
  - pendiente real de validacion o implementacion

---

## Estado Tecnico

- [x] Build productivo verificado limpio en este workspace con `npm run build` sobre `next build --webpack`
- [x] Lint global verificado limpio en este workspace con `npm run lint`
- [x] Typecheck de app verificado limpio con `npm run typecheck` (`next typegen` + `tsc -p tsconfig.typecheck.json --noEmit`)
- [~] Reducir warnings y errores runtime detectados en auditoria
- [x] Next.js 16 usa `proxy.ts` en lugar de `middleware.ts`
- [x] Deploy preparado con `vercel.json`
- [!] Migraciones Prisma versionadas y verificadas en el repo actual
- [x] Fuente Prisma restaurada en `prisma/editor.prisma`
- [x] Scripts base de Prisma restaurados: `seed`, `billing:sync-mp-plans`, `migrate:contacts`

### Hallazgos de auditoria 2026-05-18

- La documentacion y los scripts apuntaban a `prisma/` pero esa carpeta no existia en el workspace.
- El schema fuente fue restaurado en `prisma/editor.prisma` a partir del cliente generado actual.
- El modo archivo no cubria billing basico; se amplio soporte para `plan`, `subscription` y `webhookEvent`.
- `npm run test:unit` quedo verde en este workspace: 12/12 pruebas pasando.
- `npm run lint` quedo verde en este workspace.
- `npm run typecheck` quedo verde en este workspace tras separar `tsconfig.typecheck.json`, agregar augment de `next-auth` y alinear tipos del editor.
- Se acoto el escaneo de Tailwind v4 en `app/globals.css` con `source(none)` + `@source` para reducir costo de compilacion.
- `package.json` ya deja `build` y `vercel-build` sobre `next build --webpack`; `build:turbo` queda solo para pruebas puntuales del bundler.
- Queda pendiente verificar `build` completo y una corrida limpia de CI local.

### Revalidacion local 2026-05-21

- `npm run test:unit` se re-ejecuto hoy en este workspace y quedo verde nuevamente: 12/12 pruebas pasando.
- Se encontro y limpio un lock huerfano en `.next/lock`; ya no bloquea falsamente nuevos builds.
- `npm run build` se relanzo hoy con `next build --webpack`, ya arranca limpio y avanza hasta `Creating an optimized production build ...`, pero no cerro dentro de `180s`; se mantiene como **no confirmado**.
- `npm run typecheck` se lanzo hoy y `next typegen` termino correctamente, pero el proceso completo no cerro dentro de la ventana observada; se mantiene el ultimo estado confirmado hasta repetirlo con timeout/control de proceso.
- `npm run lint` se relanzo hoy, pero no devolvio salida final dentro de la ventana observada; no se degrada el estado previo verificado, aunque conviene repetirlo con timeout para dejar evidencia fresca.
- El volumen actual del App Router ayuda a explicar tiempos altos de validacion/compilacion: `164` paginas `page.tsx`, `48` endpoints `route.ts` y `233` archivos clave de routing (`page/route/layout/loading/default`).
- Se agregaron scripts particionados `lint:editor`, `lint:marketing` y `lint:platform` para aislar hotspots del workspace.
- `npm run lint:editor` cerro limpio el 2026-05-21 dentro de `90s`; sirve como validacion local util para el flujo del editor mientras el lint global sigue siendo pesado.
- Se refino mas el particionado con `lint:webs`, `lint:marketing-core`, `lint:api` y `lint:platform-pages`.
- `npm run lint:api` y `npm run lint:platform-pages` cerraron limpios el 2026-05-21 dentro de `90s`.
- `npm run lint:webs` siguio sin cerrar dentro de `90s`; `app/webs` queda identificado como el hotspot principal del lint actual.
- `npm run lint:webs-shared` cerro limpio el 2026-05-21 dentro de `60s`; el costo principal no parece estar en `_shared`, `components/ui` ni `components/theme`.
- Incluso verticales individuales representativas de `app/webs` (`abogados`, `hotel`, `finanzas`) superaron `45s`; conviene trabajar `webs` con `npm run lint:webs-vertical -- app/webs/<vertical>` y ventanas de tiempo mas amplias.
- Se inicio refactor de hotspots grandes en `app/webs`: el catalogo de `/webs` se movio a `app/webs/catalog.ts` y los datos estaticos de `/webs/tienda` a `app/webs/tienda/data/catalog.ts`.
- `eslint` dirigido sobre `app/webs/page.tsx`, `app/webs/catalog.ts`, `app/webs/tienda/page.tsx` y `app/webs/tienda/data/catalog.ts` quedo limpio el 2026-05-21.

### Revalidacion local 2026-05-22

- `npm run test:unit` se relanzo tras reforzar validaciones de runtime/public URLs y quedo verde nuevamente: `12/12` pruebas pasando.
- `npm run lint` cerro limpio hoy en este workspace; el cuello principal confirmado era tiempo de ejecucion, no errores de ESLint.
- `npm run build` cerro completo hoy con `next build --webpack`.
- Evidencia fresca del build completo:
  - `Compiled successfully` en `5.5min`
  - `Finished TypeScript` en `3.1min`
  - `Generating static pages` completo: `188/188`
  - `Finalizing page optimization` y `Collecting build traces` completados
- El build global actual recorre el pipeline completo y lista al final `188` rutas App Router junto con `Proxy (Middleware)`.
- Se reforzo `lib/runtime-health-core.ts` para advertir desalineacion entre `AUTH_URL`, `NEXTAUTH_URL` y `NEXT_PUBLIC_API_URL`, y tambien para alertar si alguna URL publica queda en `http` durante produccion.

### Revalidacion local 2026-05-24

- `Stripe` quedo validado localmente para suscripciones nuevas: compra mensual, webhook, activacion, cancelacion y persistencia de `cancel_at_period_end` al recargar dashboard.
- `proxy.ts` ya excluye `app/api/billing/stripe-webhook`, eliminando el `307` que bloqueaba webhooks locales.
- El flujo de reactivacion ahora es consistente: si la suscripcion esta cancelada pero sigue vigente hasta fin de periodo, `/precios` deriva a reactivar desde dashboard y no intenta crear una suscripcion duplicada.
- Se restauro `public/manifest.json`, eliminando el `404` visible del home.
- Se hizo una pasada fuerte de consistencia visual en `admin`, `dashboard` y `editor/web studio`, reduciendo verdes/indigos ajenos a marca y mejorando contraste en `light-mode`.
- Se versiono una baseline Prisma inicial en `prisma/migrations/20260524_000000_baseline` y se documento una ruta real de despliegue de schema con `npm run prisma:deploy-schema`.
- Se valido localmente el flujo de baseline Prisma sobre una base existente: `prisma migrate resolve --applied 20260524_000000_baseline` seguido de `npm run prisma:deploy-schema` quedo en verde.

### Revalidacion local 2026-05-26

- `SB3 builder-core` avanzo de forma fuerte durante esta tanda: preview, publicado, export y publicacion estatica ya comparten mas infraestructura real en torno a contexto runtime, compiler y serializers.
- El circuito de export ahora tiene capas puras separadas en `builder-core/compiler` para:
  - `document`
  - `exportCss`
  - `exportNodes`
  - `exportStyle`
  - `exportModels`
  - `exportMarkup`
  - `exportTraversal`
  - `exportDocument`
  - `exportNextScaffold`
  - `exportTemplates`
  - `exportRenderers`
- `serializeToHtml` y `serializeToJsx` quedaron mucho mas delgados y ya delegan gran parte de su logica al compiler compartido.
- `npm run test:unit` se relanzo varias veces durante esta tanda y cerro verde al final con `27/27` pruebas pasando.
- Se agrego cobertura especifica para compiler/export en:
  - `compiler-export-models`
  - `compiler-export-markup`
  - `compiler-export-traversal`
  - `compiler-export-document`
  - `compiler-export-next-scaffold`
  - `compiler-export-templates`
  - `compiler-export-renderers`
- `eslint` dirigido sobre cada slice nuevo de `builder-core/compiler` quedo limpio.

---

# Resumen De Avance

| Fase | Avance real | Estado |
|------|-------------|--------|
| A — Monetizacion real | 96% | Stripe local validado para alta/cancelacion; faltan pruebas publicas y tienda con MP |
| B — Canvas profesional | 85% | Mejor de lo estimado: responsive, animaciones y dev mode ya existen; el frente estructural del builder-core ya esta mucho mas limpio |
| C — CMS + Commerce | 71% | Base funcional, checkout tienda implementado, falta prueba real y variantes avanzadas |
| D — IA + Export limpio | 74% | IA/export/auditoria existen y el compiler/export ya quedo mucho mas modular dentro de `builder-core` |
| Limpieza + Deploy | 79% | Mejoro bastante la consistencia visual y el runtime, y la baseline Prisma ya fue validada localmente; faltan validaciones publicas y el primer deploy real |
| **TOTAL** | **83%** | Proyecto usable, monetizable con Stripe y con un core del builder mucho mas limpio, pero aun no production-ready |

## Auditoria Ejecutiva 2026-05-20

### Verde — Listo o muy solido

- Editor visual base, canvas, responsive contract, snap guides y modo visual/dev operativos
- IA de generacion cerrada: secciones, mejora de copy, historial, regeneracion, pagina completa y sketch-to-web
- Auditoria SEO + WCAG + performance integrada al flujo de publicar con auto-fix basico
- Export static + Next.js funcional, con assets copiados, soporte para bloques complejos y validacion HTML local
- Guards de plan, dashboard de billing, pricing dinamico y panel admin de configuracion ya implementados

### Amarillo — Funciona, pero falta validar o endurecer

- Checkout de suscripcion con Stripe y MercadoPago: la logica existe, faltan pruebas end-to-end reales
- Webhooks de pago: ya registran y actualizan estado, pero falta validacion publica real en ambos proveedores
- CMS visual: CRUD y bindings basicos listos, faltan field builder completo, relaciones y robustez visual
- Commerce core: carrito y checkout existen, pero faltan pruebas reales, variantes avanzadas y operacion de stock/email
- Deploy: `vercel.json`, build y health endpoint listos, pero faltan variables reales, aplicar schema productivo real y verificacion desde dominio publico

### Rojo — Pendiente critico o bloqueante de salida

- Falta validar el primer deploy real de la baseline Prisma en entorno publico y luego continuar ya sobre migraciones incrementales
- Falta cerrar la validacion productiva de pagos, cancelaciones y webhooks antes de considerar produccion real
- Funnels basicos no estan iniciados y no forman parte del MVP productivo todavia
- Persisten pendientes operativos de produccion: `NEXTAUTH_URL`, variables reales en Vercel, primer `resolve/deploy` real de Prisma y pruebas desde dominio real

### Prioridad Recomendada

1. Produccion y billing real: Stripe, MercadoPago, webhooks, cancelacion y health desde dominio publico
2. Calidad global: cerrar `build`, mantener lint/tests verdes y reducir warnings residuales
3. Commerce/CMS operativo: pruebas reales de checkout tienda, email transaccional y cierre de relaciones/validaciones
4. UX avanzada no bloqueante: keyframes visuales, context menu reutilizable, componentes de usuario y funnels

### Estado Ejecutivo

- Avance total auditado del roadmap: ~82%
- Fase mas solida hoy: monetizacion con Stripe para suscripciones nuevas + base del editor
- Riesgo principal actual: validacion real de produccion y cierre operativo, no ausencia de features
- Recomendacion: tratar el proyecto como "feature-complete en gran parte, internamente usable y ya validado localmente en Stripe, pero no todavia production-ready"

---

# FASE A — MONETIZACION REAL CON STRIPE + MERCADOPAGO

> Nota: Stripe queda como pasarela oficial para suscripciones nuevas cuando exista `STRIPE_SECRET_KEY` + `STRIPE_PRICE_*`. MercadoPago se mantiene para pagos unicos, tienda y flujos existentes, no como alta nueva de suscripciones recurrentes.

## A1. Schema De Planes Y Suscripciones

- [x] Modelo `Plan` en Prisma
- [x] Modelo `Subscription` en Prisma
- [x] Relacion `User.subscription`
- [!] Migracion aplicada: `add_plans_subscriptions`
- [x] Campos Stripe en `Plan` y `Subscription`
- [!] Migracion `add_stripe_billing_fields`
- [x] Modelo `WebhookEvent` para auditoria de webhooks
- [x] Seed de planes: `prisma/seed-plans.mjs`
- [x] Script `npm run seed`
- [~] Planes activos leidos desde DB

## A2. MercadoPago SDK Y Planes Recurrentes

- [x] Dependencia `mercadopago`
- [x] Cliente/helper en `lib/mercadopago.ts`
- [x] Helper Stripe REST en `lib/stripe.ts` sin hardcodear secrets
- [x] Creacion de preferencias de pago para templates/sitios
- [x] Creacion de suscripciones recurrentes con PreApproval
- [x] Creacion de Checkout Sessions Stripe en modo subscription
- [x] Script `npm run billing:sync-mp-plans`
- [~] Dry-run de sincronizacion de planes MercadoPago
- [x] Crear Price IDs reales en Stripe y guardarlos en `STRIPE_PRICE_*` o DB
- [x] Auditoria de `.env.local` sin exponer secretos: claves base de Stripe y MercadoPago presentes
- [~] Sincronizacion de planes MP validada a nivel tecnico/local; ya no es critica para suscripciones nuevas
- [~] IDs `mpPlanIdMonth` y `mpPlanIdYear` gestionados localmente; queda validacion solo si MP seguira vivo para flujos legacy

## A3. Checkout De Suscripcion

- [x] Endpoint `POST /api/billing/subscribe`
- [x] Validacion de plan, intervalo, sesion y email
- [x] Stripe Checkout como pasarela preferida si esta configurada
- [x] Manejo de errores de MercadoPago
- [x] Manejo de errores de Stripe
- [x] Bloqueo de suscripcion duplicada activa
- [x] Botones de pricing conectados al checkout
- [x] Redireccion a registro si no hay sesion
- [!] Probar flujo completo con cuenta real/sandbox de MercadoPago para suscripciones nuevas
- [x] Probar flujo completo con Stripe test mode
- [x] Confirmar comportamiento de retorno despues del pago aprobado

## A4. Webhooks De Pago

- [x] Endpoint `app/api/checkout/webhook/route.ts`
- [x] Endpoint `app/api/billing/stripe-webhook/route.ts`
- [x] Procesamiento de pagos normales
- [x] Procesamiento de suscripciones PreApproval
- [x] Procesamiento de `checkout.session.completed` y eventos de suscripcion Stripe
- [x] `lib/subscription-payment.ts` actualiza `Subscription`
- [x] `lib/stripe-subscription-payment.ts` actualiza `Subscription`
- [x] Verificacion de firma Stripe con `STRIPE_WEBHOOK_SECRET`
- [ ] Verificar webhook en ambiente publico con Stripe
- [ ] Verificar webhook en ambiente publico con MercadoPago
- [x] Registrar eventos recibidos de forma auditable
- [x] Vista admin `/admin/webhooks` con eventos recientes
- [~] Probar estados: `authorized`, `pending`, `paused`, `cancelled`

## A5. Autorizacion Por Plan

- [x] `lib/plan-guard.ts`
- [x] Guard server-side en `app/editor/[id]/page.impl.tsx`
- [x] Templates preview permitidos sin plan
- [x] Redireccion a `/precios?upgrade=editor`
- [x] `GET /api/billing/status`
- [x] Hook cliente `hooks/useSubscription.ts`
- [x] CTA de upgrade en `EditorHeader`
- [x] Panel de plan/uso en dashboard
- [x] Aplicar limites de plan en creacion de sitios desde todos los entrypoints
- [x] Aplicar limites de ecommerce/export/AI donde corresponda

## A6. Gestion De Suscripcion

- [x] `POST /api/billing/cancel`
- [x] Cancelacion robusta e idempotente
- [x] Manejo de `MP_NOT_CONFIGURED` y `MP_CANCEL_FAILED`
- [x] Cancelacion Stripe con `cancel_at_period_end`
- [x] Manejo de `STRIPE_NOT_CONFIGURED` y `STRIPE_CANCEL_FAILED`
- [x] Stripe Customer Portal para facturacion autoservicio
- [x] Checklist admin `/admin/billing` para configuracion de pasarelas
- [x] `/admin/billing` detecta mezcla `test/live` en Stripe y URLs base desalineadas
- [x] Boton de cancelar en dashboard
- [x] Boton cambiar plan hacia `/precios`
- [ ] Flujo real de cambio de plan
- [x] Mostrar estado pendiente/pausado con mensajes especificos
- [~] Auditoria actual de credenciales: sin faltantes base; queda alinear `NEXTAUTH_URL` a `https`
- [~] Confirmar cancelacion real con Stripe y MercadoPago sandbox/productivo

## A7. Pagina `/precios` Dinamica

---

# EVOLUCION AL SUPER BUILDER

> Esta seccion no reemplaza el roadmap actual de salida/produccion. Define la evolucion estructural posterior para convertir Orvenix en un builder multipagina, data-driven, comercial y exportable.

## SB1. Multipagina Real

- [x] Introducir modelo `SitePage`
- [x] Mantener compatibilidad temporal con `EditorWebsite.tree`
- [x] Crear helpers de lectura/escritura por pagina
- [x] Preview multipagina
- [x] Publicado multipagina
- [x] Export multipagina

## SB2. Tema Persistido

- [x] Introducir modelo `SiteTheme`
- [x] Persistir tokens de color, tipografia, spacing y motion
- [x] Leer tokens desde editor, preview y export
- [~] Dejar de depender de tokens solo en runtime CSS

## SB3. Extraccion De `builder-core`

- [~] Extraer arbol de nodos a `lib/builder-core/tree`
- [~] Extraer layout y normalizacion a `lib/builder-core/layout`
- [~] Extraer bindings a `lib/builder-core/bindings`
- [~] Extraer compilacion/export a `lib/builder-core/compiler`
- [~] Reducir acoplamiento entre UI del editor, store y export
  - preview y rutas publicas ya consumen un `siteRuntimeContext` unificado para pagina, tema y navegacion
  - export y publicacion estatica multipagina ya resuelven paginas desde el mismo contexto compartido
  - helpers puros de runtime para viewport, tema y free-layout ya viven en `lib/builder-core/runtime/rendering.ts`
  - defaults SEO/theme y tokens del documento ya se movieron a `lib/builder-core/compiler/document.ts`
  - render HTML puro y estilos del documento ya viven en `lib/builder-core/compiler/html.ts`
  - CSS base compartido de export HTML/Next ya se centralizo en `lib/builder-core/compiler/exportCss.ts`
  - navegacion exportada, enlaces internos y metadatos de bloques complejos ya se centralizaron en `lib/builder-core/compiler/exportNodes.ts`
  - estilos inline compartidos para export HTML/JSX ya viven en `lib/builder-core/compiler/exportStyle.ts`
  - modelos compartidos de layout, heading, texto, botones, imagenes y placeholders ya viven en `lib/builder-core/compiler/exportModels.ts`
  - markup compartido de navegacion exportada y placeholders complejos ya vive en `lib/builder-core/compiler/exportMarkup.ts`
  - traversal compartido de export para recursion, indentacion y filtrado de nodos ya vive en `lib/builder-core/compiler/exportTraversal.ts`
  - normalizacion compartida de SEO/documento para export HTML y Next ya vive en `lib/builder-core/compiler/exportDocument.ts`
  - scaffold compartido de export Next (`package.json`, `next.config`, `README`) ya vive en `lib/builder-core/compiler/exportNextScaffold.ts`
  - templates compartidos de documento HTML y page/layout Next ya viven en `lib/builder-core/compiler/exportTemplates.ts`
  - renderers finales por tipo de nodo para export HTML/JSX ya viven en `lib/builder-core/compiler/exportRenderers.ts`
  - los serializers publicos `lib/export/serializeToHtml` y `lib/export/serializeToJsx` ya funcionan como wrappers del pipeline compartido en `lib/builder-core/compiler/exportPipelines.ts`

## SB4. CMS Pro

- [~] Relaciones reales entre collections
- [~] Workflow draft/review/publish
- [~] Filtros, vistas y consultas mas ricas
- [~] Binding visual de datos mas fuerte en el canvas

## SB5. Commerce Pro

- [~] Modelo `Funnel`
- [~] Modelo `FunnelStep`
- [~] Checkout aware de funnel
- [~] Variantes/inventario mas robustos
  - señales de stock bajo y agotado en dashboard de tienda
  - filtros operativos por busqueda, estado, stock y orden
- [~] Primeras reglas nativas de conversion
  - success/pending/failure ya respetan pasos reales del funnel si tienen pagina asociada
  - tracking basico de vistas/pasos/checkouts por funnel
  - tasas simples view->checkout, checkout->venta y view->venta en dashboard

## SB6. Experimentacion

- [~] Modelo `Experiment`
- [~] A/B testing por pagina o funnel
  - variante `B` ya puede apuntar a una pagina o funnel distinto sin abrir otra migracion
  - ya se pueden crear y editar experimentos desde el dashboard de tienda
  - la variante asignada ya persiste por visitante usando cookie server-side
- [~] Split de trafico configurable
- [~] Lectura de resultados en analytics

## SB7. IA Operativa Sobre El Builder

- [~] Modelo `AiGenerationJob`
- [~] Prompt-to-section sobre arbol editable
- [~] Prompt-to-page sobre arbol editable
- [~] Sketch-to-layout auditado y persistido
- [~] Fixes SEO/WCAG/performance con trazabilidad
  - el panel SEO ya puede aplicar correcciones automáticas registrando `AiGenerationJob`

## SB8. Automatizaciones

- [~] Modelo `Automation`
- [~] Triggers desde forms, checkout y CMS
- [~] Graph de acciones configurable
  - cada automatización ya puede encadenar varias acciones desde el dashboard
- [~] Estado draft/active/paused para automatizaciones
  - dashboard inicial en tienda para crear, activar, pausar y borrar reglas simples
- [~] Condiciones simples por trigger
  - checkout, contacto y CMS ya pueden filtrar por campo + operador + valor antes de ejecutar acciones
- [~] Historial de ejecuciones
  - la pestaña de automatizaciones ya muestra ejecuciones recientes con estado, trigger y hora
- [~] Mas acciones utiles
  - ya pueden cambiar estado de pedido y workflow CMS, ademas de notas, tags y email
  - ya pueden enviar email al contacto y cambiar el servicio del lead para seguimiento comercial

## SB9. Orden Recomendado

- [~] Prioridad visible del Super Builder
  - admin y `/estado` ya muestran avance, bloque activo y siguiente recomendado

1. `SitePage`
2. `SiteTheme`
3. `builder-core`
4. `CMS relations`
5. `Funnel`
6. `Experiment`
7. `AiGenerationJob`
8. `Automation`

## SB10. Documento De Referencia

- [x] Blueprint tecnico creado en `docs/super-builder-architecture.md`

## SB11. Primer Lote Ejecutable

- [x] Documento operativo de fase 1 creado en `docs/super-builder-phase-1-execution.md`
- [x] Agregar `SitePage` y `SiteTheme` al schema Prisma
- [x] Crear helpers `listSitePages`, `getResolvedSitePage`, `ensureHomePage` y `getResolvedSiteTheme`
- [x] Introducir `lib/builder-core/*` con reexports compatibles
- [x] Adaptar editor a pagina activa `home` sin romper sitios legacy
- [x] Adaptar preview/publicado/export a `resolved tree`
- [x] Selector de paginas con crear/renombrar/cambiar slug
- [x] Publicacion publica por `slug` en `/p/[id]/[slug]`
- [x] Enlaces internos entre paginas con `page:slug`
- [x] Bloque de navegacion automatica conectado a `SitePage`
- [x] Export multipagina real en `static` y `nextjs`
- [x] Publicacion estatica multipagina con artefactos por `slug`
- [x] Persistir `SiteTheme` al guardar y resolverlo en editor/preview/publicado/export

- [x] Lee planes activos desde DB
- [x] Toggle mensual/anual
- [x] CTA conectado a checkout real
- [x] Maneja planes sin Stripe/MercadoPago configurado
- [x] Muestra “Plan actual” si el usuario ya tiene suscripcion activa
- [x] Mostrar feedback visual de errores sin `alert`
- [x] Mostrar estado “pendiente de pago” si existe suscripcion pending

**Estado Fase A:** 96%  
**Bloqueante restante:** webhook publico Stripe, tienda con MercadoPago, cambio de plan real y alinear `NEXTAUTH_URL` con el origen `https`.

---

# FASE B — CANVAS PROFESIONAL

## B1. Layout Normalization Engine

- [x] Editor visual operativo con canvas y nodos
- [x] Drag/posicionamiento libre existente
- [x] Estado Zustand del editor existente
- [x] Crear `lib/editor/layoutNormalizer.ts`
- [x] Detectar layout padre: flex/column/grid/absolute
- [x] Normalizar drop segun contexto
- [x] Integrar normalizador antes de insertar nodos
- [x] Lista `LOCKED_BLOCKS`
- [x] Tests unitarios del normalizador

## B2. Responsive Contract System

- [x] Device modes actuales: desktop/tablet/mobile
- [x] `components/editor/responsive.ts`
- [x] Props responsive por device usando `props.responsive`
- [x] `DynamicRenderer` resuelve props responsive
- [x] Inspector usa props resueltas
- [x] Expandir a 5 breakpoints: base/sm/md/lg/xl
- [x] Definir tipo formal `ResponsiveContract`
- [x] Migrar nodos existentes a contrato estable
- [x] Preview simultaneo mobile/tablet/desktop
- [x] Indicador claro de herencia por breakpoint

## B3. Smart Snap Guides

- [x] `@dnd-kit/utilities` instalado
- [x] Alineacion/distribucion de nodos libres en toolbar
- [x] Agrupar/desagrupar seleccion
- [x] Guias visuales durante drag
- [x] Distancias numericas entre elementos
- [x] Snap magnetico
- [x] `Shift+drag` para modo libre
- [x] Grid configurable 8/16/24/off

## B4. Modo Visual / Dev

- [x] `@monaco-editor/react` instalado
- [x] Estado `editorMode`
- [x] Toggle Visual/Dev en `EditorOpsBar`
- [x] Shortcut `Ctrl+Shift+D`
- [x] `DevModePanel` con Monaco lazy loaded
- [x] Edicion CSS con debounce
- [x] Copiar/restablecer CSS
- [x] Parser CSS mas seguro
- [x] Autocomplete Tailwind
- [x] Panel de computed styles completo
- [~] Prueba de bundle para confirmar que Monaco no carga en modo visual inicial

## B5. Timeline De Animaciones

- [x] `MotionWrapper` existente
- [x] Props de motion basicas en nodos
- [x] Tipo formal `NodeAnimation`
- [x] `AnimationsPanel`
- [x] Preview onLoad/onScroll/onClick/onHover
- [x] Exportar keyframes CSS
- [ ] Editor visual de keyframes

## B6. Context Menu Enriquecido

- [x] Context menu/editor ops existentes
- [x] Acciones de lock/hide/group/ungroup
- [ ] Convertir a componente reutilizable
- [ ] Guardar componentes de usuario
- [ ] Copiar/pegar estilos
- [ ] Wrap en Flex/Grid
- [ ] Buscar/resaltar en Layers

**Estado Fase B:** 81%  
**Bloqueante restante:** tests del normalizador + pulido UX responsive.

---

# FASE C — CMS VISUAL + COMMERCE

## C1. CMS Visual

- [x] Modelos `Collection` y `Record`
- [x] Migracion `add_cms_collections`
- [x] API colecciones: GET/POST
- [x] API coleccion por slug: GET/PATCH/DELETE
- [x] API records: GET/POST
- [x] API record por id: GET/PATCH/DELETE
- [x] Dashboard CMS por sitio
- [x] Tabla/lista de records
- [x] Data binding basico con `_bindings`
- [x] `BindModePanel`
- [x] `DynamicRenderer` resuelve bindings
- [ ] Field builder completo con validaciones
- [x] Importacion CSV con preview/mapping
- [ ] Virtualizacion para +500 records
- [ ] Relaciones/media/rich text completas
- [ ] Overlay visual robusto para nodos con binding

## C2. Commerce Core

- [x] Modelos `Product`, `ProductVariant`, `Order`
- [x] Migracion `add_ecommerce`
- [x] APIs de productos
- [x] APIs de pedidos
- [x] Dashboard store por sitio
- [x] Crear producto rapido
- [x] Activar/desactivar producto
- [x] Listar pedidos y marcar como enviado
- [x] Bloques `CartDrawer`, `CartButton`, `ProductCard`
- [ ] Variants editor avanzado
- [x] Checkout carrito end-to-end con MercadoPago
- [ ] Probar checkout de tienda con MercadoPago sandbox/productivo
- [ ] Crear productos/precios en MercadoPago al crear producto
- [ ] Alertas de bajo stock
- [ ] Email de confirmacion real con Resend
- [ ] Product detail block completo

## C3. Funnels Basicos

- [ ] Instalar/usar ReactFlow
- [ ] Modelos `Funnel` y `FunnelStep`
- [~] Dashboard de funnels
- [ ] Editor visual de funnel
- [ ] Metricas por nodo
- [ ] A/B testing basico

**Estado Fase C:** 71%  
**Bloqueante restante:** prueba real checkout tienda + variantes + funnels.

---

# FASE D — IA AVANZADA + EXPORT LIMPIO

## D1. Generacion Por IA

- [x] `app/actions/ai.ts`
- [x] Anthropic SDK instalado
- [x] Generacion de secciones con Claude cuando hay API key
- [x] Fallback local si no hay API key
- [x] Validacion de arbol con `validateTree`
- [x] Mejora de copy seleccionado
- [x] `AiAssistantPanel`
- [x] Preview mini-canvas antes de insertar
- [x] Regenerar/editar prompt con historial
- [x] Generacion de pagina completa
- [x] Mas ejemplos few-shot y schema mas estricto

## D2. Auditoria SEO + WCAG

- [x] `lib/audit/seoAudit.ts`
- [x] `lib/audit/wcagAudit.ts`
- [x] Score SEO
- [x] Score WCAG
- [x] Checks de H1, meta title/description, alt, contraste basico
- [x] `performanceAudit.ts`
- [x] Integrar auditoria visual completa en `SEOPanel`
- [x] Auto-fix desde UI
- [x] Ejecutar auditoria al publicar
- [x] Bloquear/confirmar publicacion con errores criticos

## D3. Sketch-to-Web

- [x] Endpoint `app/api/sketch-to-web/route.ts`
- [x] Dropzone de imagen/PDF en AI panel
- [x] Vision con Claude
- [x] Preview antes de insertar
- [x] Slider fidelidad vs design system

## D4. Export Limpio

- [x] `archiver` instalado
- [x] `app/api/editor/[id]/export/route.ts`
- [x] Export static: `index.html` + `styles.css`
- [x] Export Next.js: `app/page.tsx`, layout, globals, package, config
- [x] README dentro del ZIP
- [x] Export menu en editor
- [x] Export dropdown en dashboard
- [x] Optimizar/copiar assets al ZIP
- [x] Soporte completo para bloques complejos sin imports rotos
- [x] Export HTML semantico mas completo
- [x] Validacion W3C automatica
- [ ] Deploy 1-click a Vercel

**Estado Fase D:** 68%  
**Bloqueante restante:** sketch-to-web + auditoria integrada + export semantico/validado.

---

# LIMPIEZA TECNICA Y DEPLOY

## L1. Legacy

- [x] No existe directorio `admin/` legacy PHP
- [x] No existe `backend/server.js`
- [x] No existe `server.js` raiz
- [x] No existe `.htaccess`
- [x] No existe `public/sw.js`
- [x] `middleware.ts` eliminado
- [ ] Revisar si `proxy.ts` debe conservarse: actualmente necesario para Next 16 auth/proxy
- [ ] Limpiar logs locales: `next-dev*.log`, `chrome-dom*.log`

## L2. Contactos A Prisma

- [x] Modelo `Contact`
- [x] Migracion `add_contacts`
- [x] Script `prisma/migrate-contacts.mjs`
- [x] Script `npm run migrate:contacts`
- [x] API contacto escribe usando Prisma con fallback CSV
- [x] Admin contactos lee desde Prisma con fallback CSV
- [ ] Quitar fallback CSV cuando produccion este verificada

## L3. Deploy

- [x] `vercel.json`
- [x] Script `vercel-build`
- [x] Scripts `prisma:generate`, `prisma:migrate:deploy` y `prisma:deploy-schema`
- [x] `PRODUCCION.md` actualizado
- [x] `/api/health`
- [x] `/api/health` incluye estado de billing sin exponer secretos
- [x] `public/manifest.json` restaurado
- [ ] Configurar variables reales en Vercel
- [x] Versionar baseline de `prisma/migrations`
- [x] Aplicar baseline local con `prisma migrate resolve --applied 20260524_000000_baseline` sobre base existente
- [x] Validar localmente `npm run prisma:deploy-schema`
- [ ] Aplicar baseline real con `prisma migrate resolve --applied 20260524_000000_baseline` donde la base productiva ya exista
- [ ] Aplicar schema productivo con `npm run prisma:deploy-schema`
- [ ] Verificar `/api/health` desde dominio productivo
- [ ] Probar webhooks MercadoPago desde dominio publico

## L4. Calidad

- [x] Build pasa
- [x] Lint pasa
- [ ] Resolver 60 warnings de lint
- [~] Reducir suppressions y deuda puntual de lint en editor y `app/webs`
  - Ya se limpiaron suppressions verificadas en `Canvas`, `Image`, `FieldResolver`, `ProductGrid` y en paginas `finanzas`, `fotografia`, `barberia`, `hotel`, `rrhh`, `viajes`, `gimnasio`, `contabilidad`, `transporte`, `seguros`, `abogados`, `notaria`, `inmobiliaria`, `arquitectura`
  - Tambien se centralizaron logs del editor en un helper y se removieron `console.*` directos en `ConstructorSourceBootstrap`, `DynamicRenderer`, `FreePositionRndEditor` y `useEditorStore`
  - Tambien se centralizaron logs server-side de pagos/suscripciones en un helper y se removieron `console.*` directos en `checkout-payment`, `store-checkout-payment`, `subscription-payment` y `stripe-subscription-payment`
  - Tambien se migraron logs de `email`, `editRequests` y `webhook-event-service` al helper server-side para reducir ruido operativo repetido
  - Tambien se migraron logs de `app/api/auth/*` y `app/api/checkout/*` al helper server-side, dejando esas rutas sin `console.*` directos
  - Tambien se migraron logs de `app/api/editor/*`, `app/api/billing/*` y `app/api/store/*`; el barrido de `app/api` + `lib` ya solo deja `console.*` dentro del helper central
- [x] Agregar tests unitarios para guards, serializers y audit
- [~] Tests unitarios para billing/Stripe helpers y logica de rutas ya existen; revalidados localmente el 2026-05-21 con `12/12` en verde; falta ampliar cobertura E2E/webhooks
- [~] Smoke tests base para rutas criticas ya cubren `health/runtime`; falta ampliar a flujos de producto
- [x] Documentar variables `.env` requeridas
- [x] El panel admin de billing ya expone advertencias de consistencia para credenciales y origen publico
- [~] Auditoria visual fuerte en admin/dashboard/editor ya corrigio varios desfaces de marca; faltan pantallas secundarias del ecosistema

**Estado Limpieza + Deploy:** 74%

---

# Pendientes Criticos Ordenados

1. **Probar MercadoPago end-to-end**
   - Ya no bloquea suscripciones nuevas, pero sigue importando para tienda y flujos legacy.

2. **Confirmar webhooks en entorno publico**
   - Necesario para activar/renovar/cancelar suscripciones correctamente.

3. **Probar checkout de tienda con MercadoPago**
   - La integracion tecnica ya existe; falta prueba real sandbox/productiva desde carrito.

4. **Export HTML semantico y validado**
   - El ZIP ya copia assets y evita imports rotos; falta mejorar semantica y validacion W3C.

5. **Integrar auditoria SEO/WCAG al flujo de publicar**
   - Ya hay motor, falta hacerlo parte de la UX.

6. **Reducir warnings y suppressions restantes**
   - Ya se limpio deuda puntual en editor, pagos y varias paginas visuales, pero falta una pasada amplia del repo.

7. **Alinear configuracion final de auth/billing**
   - Corregir `NEXTAUTH_URL` a `https://orvenix.com.mx` y revalidar `/admin/billing`.

8. **Cerrar consistencia visual restante**
   - Quedan pantallas secundarias por unificar (`store`, `cms`, bloques demo y algunas vistas admin/dashboard`).

---

# Definicion De “Listo Para Produccion”

- [x] Build y lint pasan sin errores
- [ ] Warnings de lint reducidos a menos de 10
- [ ] Variables de produccion configuradas en Vercel
- [ ] `NEXTAUTH_URL` alineado a `https://orvenix.com.mx`
- [ ] Migrations aplicadas en DB productiva
- [ ] Planes MercadoPago reales sincronizados
- [ ] Pago de suscripcion probado
- [ ] Webhook de suscripcion probado
- [ ] Cancelacion probada
- [ ] Crear sitio respeta limite de plan
- [ ] Editor no permite features fuera de plan
- [ ] Export funciona para sitio real con imagenes
- [ ] CMS CRUD probado
- [ ] Store CRUD probado
- [ ] Checkout tienda probado
- [ ] `/api/health` OK desde dominio real
