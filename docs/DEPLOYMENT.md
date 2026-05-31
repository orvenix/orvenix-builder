# Despliegue de Orvenix

## Estado actual

La app ya compila y arranca en producción con:

- `npm run build`
- `npm run start`

También funciona login, dashboard y admin con almacenamiento local por archivo.

## Modo recomendado para este proyecto hoy

### Opción 1: `ORVENIX_STORAGE_MODE="file"`

Úsalo si quieres levantar Orvenix ya mismo sin MariaDB.

Características:

- Guarda usuarios, sitios y tickets en `data/runtime-store.json`
- Ideal para desarrollo y servidores Node con disco persistente
- No recomendado para plataformas serverless efímeras

Variables mínimas:

```env
NODE_ENV=production
ORVENIX_STORAGE_MODE=file
NEXTAUTH_URL=https://tu-dominio.com
AUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-seguro
AUTH_SECRET=tu-secret-seguro
ORVENIX_ADMIN_EMAILS=tu-correo@dominio.com
NEXT_PUBLIC_API_URL=https://tu-dominio.com
ANTHROPIC_API_KEY=
```

## Despliegue en servidor Node

1. Instala dependencias: `npm install`
2. Configura `.env.local` o variables de entorno del servidor
3. Compila: `npm run build`
4. Arranca: `npm run start`

## Con PM2

Ya existe [ecosystem.config.cjs](/c:/Users/nv_on/OneDrive/Escritorio/ORVENIX/ecosystem.config.cjs:1).

Comandos:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

## Trabajar en servidor real sin afectar producción

Sí. La forma segura es montar un entorno `staging` separado del sitio principal.

Recomendación:

- Producción sigue en `orvenix.com.mx`
- Staging vive en un subdominio aparte, por ejemplo `staging.orvenix.com.mx`
- Staging corre en otro proceso PM2 y otro puerto interno
- Staging usa sus propias variables de entorno
- Staging debe usar almacenamiento separado del principal

### Configuración sugerida

Ya existe un archivo dedicado: [ecosystem.staging.config.cjs](/c:/Users/nv_on/OneDrive/Escritorio/ORVENIX/ecosystem.staging.config.cjs:1)

Usa:

```bash
npm run build
pm2 start ecosystem.staging.config.cjs
pm2 save
```

Ese proceso arranca como:

- app PM2: `orvenix-staging`
- puerto interno: `3001`
- script: `npm run start:staging`

### Variables mínimas para staging

```env
NODE_ENV=production
ORVENIX_STORAGE_MODE=file
NEXTAUTH_URL=https://staging.tu-dominio.com
AUTH_URL=https://staging.tu-dominio.com
NEXTAUTH_SECRET=staging-secret-distinto
AUTH_SECRET=staging-secret-distinto
ORVENIX_ADMIN_EMAILS=tu-correo@dominio.com
NEXT_PUBLIC_API_URL=https://staging.tu-dominio.com
ANTHROPIC_API_KEY=
```

### Importante

- No compartas `runtime-store.json` entre producción y staging
- No reutilices los mismos secretos de auth entre ambos entornos
- No apuntes staging al mismo dominio público que producción
- Si luego usas Prisma/MariaDB, crea una base separada solo para staging

### Flujo recomendado

1. Subimos cambios a staging
2. Probamos login, dashboard, editor y plantillas
3. Validamos `/api/health` y `/estado`
4. Solo cuando esté estable, replicamos a producción

## Verificaciones útiles

- Salud general: `/api/health`
- Panel de estado: `/estado`
- Login: `/login`
- Dashboard: `/dashboard`
- Admin: `/admin`

## Si después quieres volver a MariaDB/Prisma

Usa:

```env
ORVENIX_STORAGE_MODE=prisma
DATABASE_URL=mysql://usuario:password@host:3306/base
```

Y luego ejecuta la preparación de esquema correspondiente antes de abrir tráfico real.
