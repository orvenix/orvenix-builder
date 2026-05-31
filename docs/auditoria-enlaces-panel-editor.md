# Auditoria de enlaces del panel privado al editor

Fecha: 2026-05-17

## Resumen

El acceso principal del panel privado al editor apunta a la ruta correcta: `/editor/{site.id}`. La ruta existe tanto dentro del grupo protegido como en la implementacion compartida del editor, y valida permisos antes de cargar sitios reales.

Se corrigio el punto mas probable de falla en la navegacion del panel: los enlaces internos hacia el editor estaban usando `<a href>`, lo que fuerza una recarga completa. Ahora usan `Link` de Next.js en `app/dashboard/page.impl.tsx` para conservar la navegacion del App Router y reducir problemas de sesion/hidratacion al entrar al editor desde el panel.

## Estado de rutas probadas

Estas pruebas se hicieron contra `http://127.0.0.1:3000` en modo desarrollo.

| Ruta | Estado | Resultado esperado |
| --- | --- | --- |
| `/` | 200 | Correcto |
| `/dashboard` | 307 a `/login?callbackUrl=/dashboard` | Correcto sin sesion |
| `/editor/tienda` | 200 | Correcto, editor demo publico |
| `/templates` | 200 | Correcto |
| `/webs` | 200 | Correcto |
| `/constructor` | 200 | Correcto |
| `/dashboard/afiliados` | 307 a login | Correcto sin sesion |
| `/dashboard/analiticas/site_fake` | 307 a `/login?callbackUrl=/dashboard` | Correcto sin sesion |
| `/dashboard/recibo/site_fake` | 307 a `/login?callbackUrl=/dashboard` | Correcto sin sesion |

## Enlaces del panel privado

| Origen | Destino | Estado |
| --- | --- | --- |
| Navegacion principal | `/` | Correcto |
| Navegacion principal | `/dashboard/afiliados` | Correcto, protegido |
| Navegacion principal | `/webs` | Correcto |
| Navegacion principal | `/api/auth/signout` | Funcional, aunque se recomienda migrar a `signOut()` para mejor UX |
| Cabecera del dashboard | `/constructor` | Correcto |
| Cabecera del dashboard | `/templates` | Correcto |
| Estado vacio del dashboard | `/editor/landing`, `/editor/finance`, `/editor/crm` | Correcto para demos del editor |
| Tarjeta de sitio | `/editor/${site.id}` | Corregido a `Link` |
| Tarjeta de sitio publicado | `/p/${site.id}` | Correcto si el sitio esta publicado |
| Tarjeta de sitio publicado | `/dashboard/analiticas/${site.id}` | Correcto si el sitio esta publicado |
| Tarjeta de sitio | `/dashboard/recibo/${site.id}` | Correcto |
| Solicitudes de edicion | `/editor/${request.siteId}` | Corregido a `Link` |
| Alerta de checkout | `/editor/${checkoutSiteId}` | Corregido a `Link` |

## Validacion de permisos del editor

La implementacion de `/editor/[id]` distingue dos casos:

| Tipo de id | Requisito | Estado |
| --- | --- | --- |
| Demo, por ejemplo `tienda`, `landing`, `finance`, `crm` | No requiere sesion | Correcto |
| Sitio real, por ejemplo `/editor/${site.id}` | Requiere sesion y permiso de propietario o ADMIN | Correcto |

El panel carga sus sitios con `getSitesForRole(session.user.id, role)`, y el editor valida con `canManageSite(id, session.user.id, role)`. Por diseno, un usuario CLIENT solo puede abrir el editor de sitios cuyo `userId` coincida con su cuenta.

## Posibles causas si aun no abre desde el panel

1. Host distinto entre sesion y navegador local. El entorno usa `NEXTAUTH_URL=http://127.0.0.1:3000`; conviene entrar siempre por `http://127.0.0.1:3000/dashboard`, no mezclar con `localhost:3000`.
2. El sitio puede no estar asignado al usuario. Si un sitio real tiene `userId` vacio o pertenece a otro usuario, el panel podria mostrarlo por algun flujo, pero el editor respondera `notFound()` para usuarios sin permiso.
3. La sesion puede estar caducada. Sin sesion, el panel redirige a login y el editor real tambien debe exigir autenticacion.
4. El overlay de desarrollo de Next puede ocultar la causa real. Ya se agrego un silenciador acotado para el error interno conocido de `next-devtools` relacionado con `page.tsx`.

## Hallazgos no bloqueantes

Se encontraron placeholders en `app/portafolio/page.tsx` con `href: '#'`. No afectan el acceso del panel al editor, pero conviene reemplazarlos por rutas reales o marcarlos como contenido pendiente.

## Verificacion tecnica

- `npm.cmd run lint` termina sin errores.
- Persisten advertencias existentes de imports no usados y uso de `<img>` en otras paginas.
- El servidor responde `200 OK` en `/editor/tienda`.
- Las rutas privadas redirigen a login cuando no hay sesion, que es el comportamiento esperado.

## Recomendaciones

1. Probar desde `http://127.0.0.1:3000/dashboard` con una sesion real.
2. Tomar un `site.id` visible en el panel y abrir directamente `/editor/{site.id}` con la misma sesion.
3. Si devuelve 404 o no carga, revisar que ese sitio tenga `userId` asociado al usuario conectado, salvo que la cuenta sea ADMIN.
4. Reemplazar los enlaces `#` del portafolio por destinos reales cuando se cierre esa seccion.
