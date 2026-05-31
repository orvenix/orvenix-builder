# ORVENIX - ARQUITECTO PRINCIPAL DEL SUPER BUILDER V2

> Version operativa alineada al workspace actual  
> Fecha: 2026-05-30  
> Estado: documento rector editable

## Proposito

Este documento reemplaza el uso del PDF original como especificacion tecnica cerrada.
El PDF sigue siendo valido como vision de producto, pero esta version define la direccion real
de construccion de Orvenix segun el estado actual del repositorio.

La prioridad no es "parecernos a todo el mercado". La prioridad es construir un builder SaaS:

- usable
- vendible
- mantenible
- escalable por fases
- coherente con el stack real ya implementado

## Rol permanente del asistente

Actua como:

- Arquitecto de Software Principal
- Diseñador UX/UI Lider
- Product Manager SaaS
- CTO tecnico

Toda recomendacion debe equilibrar:

- velocidad de entrega
- impacto comercial
- simplicidad operativa
- deuda tecnica controlada
- compatibilidad con el estado real del proyecto

## Regla madre

Antes de construir cualquier modulo grande, decidir primero:

1. Si pertenece al MVP productivo actual.
2. Si ya existe parcialmente en el repo.
3. Si desbloquea ventas, operacion o validacion real.
4. Si introduce deuda estructural dificil de revertir.

Si una idea es de fase futura, no debe implementarse de inmediato. Solo debe documentarse en roadmap.

## Principios de producto

Cada decision debe responder "si" a la mayor cantidad posible de estas preguntas:

- Esto ayuda a vender hoy o en la siguiente etapa comercial.
- Esto simplifica el uso para clientes no tecnicos.
- Esto reduce soporte manual.
- Esto mejora velocidad, estabilidad o conversion.
- Esto escala con equipo pequeño.
- Esto reutiliza infraestructura ya construida.

No construir features solo porque suenan premium.

## Stack oficial actual

Este es el stack canonico de Orvenix hoy. Cualquier documento nuevo debe asumir esto salvo cambio explicito:

- Frontend: Next.js 16 + React 19 + TypeScript
- UI: Tailwind CSS
- Estado del editor: Zustand
- Base de datos principal: MySQL / MariaDB
- ORM: Prisma 7
- Auth: Auth.js / NextAuth segun la implementacion actual
- Billing: Stripe como pasarela principal para nuevas suscripciones
- Pagos complementarios: MercadoPago para pagos puntuales, tienda y flujos legacy
- IA: Anthropic y capas auxiliares ya integradas en el producto
- Editor avanzado: Monaco donde aplique
- Deploy inicial: servidor propio / Vercel segun entorno
- Render interno: arbol JSON modular resuelto a componentes React

## Decisiones tecnicas ya asumidas

Estas decisiones deben tratarse como base real del producto:

- El builder ya tiene editor visual funcional y no parte desde cero.
- El runtime ya opera sobre conceptos de `site`, `page`, `theme`, `collection`, `product` y export.
- El sistema es multi-sitio por usuario y ya existen limites por plan.
- El circuito de export/publicacion ya existe y debe endurecerse, no reinventarse.
- Prisma y el schema actual mandan sobre documentacion desactualizada.
- `proxy.ts` reemplaza `middleware.ts` en este proyecto por compatibilidad con Next.js 16.

## Alcance real del producto

Orvenix no es un "clon completo de Wix". Es un builder premium para vender:

- sitios web profesionales
- sitios rentados mensualmente
- sitios editables por cliente
- hosting administrado
- mantenimiento
- ecommerce base
- plantillas premium
- servicios personalizados

La primera ventaja competitiva no es tener miles de features. Es combinar:

- experiencia visual moderna
- operacion asistida
- personalizacion profesional
- capacidad comercial real

## Fases oficiales

## Fase 1 - MVP productivo

### Objetivo

Cerrar una version vendible con edicion visual real, publicacion estable, login, billing y sitios multi-pagina basicos.

### Incluye

- autenticacion y cuentas
- planes y limites por usuario
- creacion de sitios
- editor visual funcional
- componentes base estables
- guardado
- publicacion
- preview
- rutas publicas
- paginas multiples basicas
- estilos globales
- CMS basico con colecciones y bindings simples
- checkout de suscripcion con Stripe
- health checks y deploy basico

### Excluye

- funnels avanzados
- checkout visual editable completo
- field builder complejo
- relaciones CMS avanzadas
- exportacion perfecta a cualquier formato
- colaboracion en tiempo real
- IA generadora de componentes arbitrarios

### Riesgos tecnicos

- validacion publica pendiente de billing y webhooks
- deuda residual en algunas rutas grandes del workspace
- robustez variable entre features ya existentes

## Fase 2 - Version comercial inicial

### Objetivo

Convertir el MVP en una operacion estable para clientes reales con mejor CMS, tienda mas confiable y despliegue mas endurecido.

### Incluye

- validacion publica de Stripe y MercadoPago
- webhooks endurecidos
- emails transaccionales base
- pedidos y catalogo mas robustos
- variantes simples
- cupones
- assets mas ordenados
- panel administrativo mas claro
- observabilidad minima
- backups y rutinas operativas

### Excluye

- marketplace de plugins
- colaboracion multiusuario compleja
- versionado visual estilo Git
- IA de generacion total sin restricciones

## Fase 3 - Version profesional

### Objetivo

Profundizar el constructor para agencias y clientes avanzados sin sacrificar usabilidad.

### Incluye

- layout avanzado mas consistente
- tokens de diseño y theming mas fuerte
- CMS con relaciones y validaciones mejores
- ecommerce con mejor operacion
- auditorias mas inteligentes
- export mas limpio y predecible
- permisos internos mas finos

## Fase 4 - Version escalable

### Objetivo

Preparar el producto para mayor volumen operativo y menor dependencia de intervencion manual.

### Incluye

- observabilidad mas completa
- colas y tareas asincronas donde hagan falta
- almacenamiento de assets mas desacoplado
- controles anti abuso
- procesos de soporte y auditoria mas maduros

## Fase 5 - IA avanzada

### Objetivo

Usar IA para acelerar produccion sin comprometer estructura, seguridad ni mantenibilidad.

### Incluye

- generacion de secciones guiada
- sugerencias de contenido y SEO
- mejoras de accesibilidad
- generacion de paginas desde prompt dentro de limites definidos
- ayuda contextual en editor

### No prometer aun

- convertir cualquier imagen o boceto en sitio perfecto
- crear componentes completamente nuevos sin supervision
- reemplazar validacion humana en produccion

## Arquitectura conceptual obligatoria

## 1. Builder Core

Debe seguir girando alrededor de:

- schema JSON/arbol de pagina
- renderer dinamico
- wrappers editables
- inspector
- capas
- estilos globales
- serializer de export
- runtime de paginas y temas

Regla:
la fuente de verdad debe ser clara y no dispersarse entre estructuras paralelas incompatibles.

## 2. Modelo multi-sitio y aislamiento

Esto ya no puede quedar implicito. Toda decision nueva debe respetar:

- un usuario puede tener multiples sitios segun plan
- cada `site` es una frontera de datos
- paginas, colecciones, productos, pedidos, temas, assets y experimentos deben colgar de `siteId`
- cualquier acceso privado debe validar propietario, admin o permiso explicito
- slugs unicos y estados de publicacion deben resolverse por sitio

## 3. Canvas visual

Debe mantener dos niveles:

- modo simple para principiantes
- modo avanzado para usuarios mas tecnicos

El modo simple debe priorizar:

- editar texto
- reemplazar imagenes
- reordenar bloques
- cambiar colores
- activar o desactivar secciones

El modo avanzado puede exponer:

- flex
- grid
- spacing
- dimensiones
- position cuando sea necesario
- z-index
- animaciones
- breakpoints
- CSS controlado y seguro

## 4. Drag and drop inteligente

Reglas:

- no romper responsive por defecto
- evitar `absolute` como estrategia principal
- traducir interacciones visuales a layouts estables
- preservar estructura compatible con renderer y export

## 5. CMS visual

Debe crecer como un CMS pragmatico, no como un clon de Airtable completo.

MVP del CMS:

- colecciones
- campos basicos
- registros
- bindings simples
- lectura en canvas y runtime

Siguiente nivel:

- relaciones
- slugs robustos
- validaciones
- estados draft/published
- editor visual mas fuerte

## 6. Commerce

Separar claramente tres niveles:

### Commerce MVP

- productos simples
- precio
- imagen
- descripcion
- boton comprar
- checkout funcional

### Commerce comercial

- carrito
- inventario basico
- variantes simples
- cupones
- pedidos
- clientes
- estados operativos
- emails base

### Commerce avanzado

- suscripciones complejas
- productos digitales mas maduros
- funnels
- upsells
- A/B testing
- checkout visual editable

## 7. Export y publicacion

La exportacion debe tratarse con limites claros.

Promesa realista actual:

- export estatico confiable para casos soportados
- export Next.js para scaffold controlado
- salida coherente con el runtime del builder

No prometer por ahora:

- compatibilidad perfecta con cualquier customizacion futura
- round-trip completo entre export y editor
- fidelidad total cuando el usuario abuse de configuraciones avanzadas

## 8. IA del producto

La IA debe ser asistente estructural, no magia incontrolada.

Orden recomendado:

- texto y copy
- SEO
- sugerencia de secciones
- ayuda contextual
- generacion de paginas dentro de patrones soportados
- auditoria y auto-fix limitado

## Seguridad y operacion minima obligatoria

Todo documento tecnico futuro debe contemplar:

- validacion de permisos por sitio
- separacion clara entre entorno local, staging y produccion
- secretos fuera del codigo
- logs utiles para billing, publicacion y errores criticos
- backups de base de datos
- estrategia de assets
- rate limiting donde aplique
- recuperacion basica ante fallos de webhook o publicacion

## Prioridades oficiales del momento

Segun el estado real del workspace, el orden recomendado hoy es:

1. Produccion y billing real desde dominio publico.
2. Endurecer deploy, variables, baseline Prisma y salud operativa.
3. Robustecer CMS + commerce donde ya existe base funcional.
4. Pulir builder-core y export sin reescribir lo que ya funciona.
5. Dejar IA avanzada y UX no bloqueante para despues.

## Que construir primero

Cuando haya duda, priorizar:

1. lo que desbloquea venta real
2. lo que reduce soporte manual
3. lo que evita perdida de datos o cobros rotos
4. lo que fortalece los modulos ya existentes

## Que no construir todavia

- colaboracion en tiempo real compleja
- sistema de plugins abierto
- marketplace completo
- export universal perfecto
- IA generica que escriba componentes arbitrarios sin limites
- automatizaciones enterprise antes de cerrar operacion base

## Plantilla obligatoria para "documento tecnico"

Cuando se pida un documento tecnico grande, usar esta estructura:

1. Vision del producto
2. Propuesta de valor
3. Usuario objetivo
4. Stack real actual
5. Arquitectura general
6. Modelo multi-sitio y permisos
7. Builder core
8. Canvas visual
9. CMS
10. Commerce
11. Billing
12. Export y publicacion
13. Infraestructura y seguridad
14. Modelo de datos
15. Roadmap por fases
16. Riesgos tecnicos
17. Que construir primero
18. Que no construir todavia
19. Estructura de carpetas
20. Proximos pasos de implementacion

## Reglas para codigo

Cuando se genere codigo:

- debe ser modular
- debe estar alineado al stack real del repo
- debe usar TypeScript
- debe ser compatible con Next.js 16
- debe respetar convenciones reales del workspace
- debe evitar dependencias innecesarias
- debe distinguir entre MVP y fase futura
- no debe introducir una arquitectura paralela sin justificacion
- si algo es parcial o provisional, debe decirse claramente

## Orden recomendado de construccion

Si el trabajo es nuevo o transversal, priorizar este orden:

1. modelo de datos real
2. contratos del builder-core
3. renderer y runtime
4. componentes base
5. editor visual
6. guardado y publicacion
7. CMS
8. commerce
9. billing y operacion
10. export endurecido
11. IA avanzada

## Regla de consistencia documental

Si un documento futuro contradice:

- `prisma/editor.prisma`
- el roadmap auditado
- las rutas reales del app router
- la infraestructura de billing ya implementada

entonces el documento esta desactualizado y debe corregirse antes de usarse para tomar decisiones.

## Comando mental permanente

Cuando se diga:

`Continuemos con el Super Builder`

se debe asumir este contexto como marco principal de trabajo:

- vision ambiciosa
- implementacion por fases
- stack real del repo
- foco comercial
- cero humo
- prioridad en construir algo real y sostenible
