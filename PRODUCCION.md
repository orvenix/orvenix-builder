# Guía de Deploy — Orvenix en producción

## Requisitos del servidor

- **OS**: Ubuntu 22.04 LTS (recomendado)
- **RAM**: 2 GB mínimo (4 GB recomendado)
- **Node.js**: v20 LTS o superior
- **PM2**: `npm install -g pm2`
- **Nginx**: `apt install nginx`
- **Certbot**: para SSL gratuito con Let's Encrypt

---

## Paso 1 — Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Paso 2 — Subir el proyecto

```bash
# Opción A: Git clone (recomendado)
git clone https://github.com/tu-usuario/orvenix.git /var/www/orvenix
cd /var/www/orvenix

# Opción B: rsync desde tu máquina local
rsync -avz --exclude node_modules --exclude .next --exclude data \
  ./ usuario@IP_SERVIDOR:/var/www/orvenix/
```

---

## Paso 3 — Variables de entorno

```bash
cd /var/www/orvenix

# Copiar la plantilla
cp .env.example .env.local

# Editar con tus valores reales
nano .env.local
```

### Variables críticas a configurar:

| Variable | Valor en producción |
|----------|---------------------|
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://orvenix.com.mx` |
| `AUTH_URL` | `https://orvenix.com.mx` |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_SECRET` | Mismo valor que AUTH_SECRET |
| `ORVENIX_ADMIN_EMAILS` | `tu@email.com` |
| `RESEND_API_KEY` | Desde dashboard.resend.com |
| `RESEND_FROM` | `Orvenix <hola@orvenix.com.mx>` |
| `ANTHROPIC_API_KEY` | Desde console.anthropic.com |
| `ORVENIX_STORAGE_MODE` | `prisma` |
| `DATABASE_URL` | Base MySQL/MariaDB real |
| `NEXT_PUBLIC_API_URL` | `https://orvenix.com.mx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` o `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_live_...` o `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_STARTER_MONTH` | `price_...` recurrente |
| `STRIPE_PRICE_STARTER_YEAR` | `price_...` recurrente |
| `STRIPE_PRICE_PRO_MONTH` | `price_...` recurrente |
| `STRIPE_PRICE_PRO_YEAR` | `price_...` recurrente |
| `STRIPE_PRICE_COMMERCE_MONTH` | `price_...` recurrente |
| `STRIPE_PRICE_COMMERCE_YEAR` | `price_...` recurrente |
| `MP_ACCESS_TOKEN` | Solo si usarás checkout tienda con MercadoPago |
| `MP_PUBLIC_KEY` | Solo si usarás checkout tienda con MercadoPago |
| `MP_SANDBOX` | `false` en producción |

### Generar AUTH_SECRET:
```bash
openssl rand -hex 32
```

---

## Paso 4 — Instalar dependencias y compilar

```bash
cd /var/www/orvenix

# Instalar dependencias
npm install --production=false

# Regenerar cliente Prisma
npm run prisma:generate

# Si la base ya existia antes de versionar migraciones, marca la baseline una sola vez
npm run prisma:resolve-baseline

# Aplicar esquema Prisma productivo
npm run prisma:deploy-schema

# Compilar Next.js
npm run build
```

> Si la base es completamente nueva, omite `npm run prisma:resolve-baseline`.
> El build debe completarse sin errores. La cifra exacta de rutas puede variar con el App Router actual.

---

## Paso 5 — Directorios de datos

```bash
# Crear directorios con los permisos correctos
mkdir -p /var/www/orvenix/data
mkdir -p /var/www/orvenix/sistema

# El proceso Node necesita escribir en estos dirs
chown -R www-data:www-data /var/www/orvenix/data /var/www/orvenix/sistema
# O si PM2 corre con tu usuario:
chown -R $USER:$USER /var/www/orvenix/data /var/www/orvenix/sistema
```

---

## Paso 6 — Iniciar con PM2

```bash
cd /var/www/orvenix

# Iniciar la app
pm2 start ecosystem.config.cjs

# Ver logs en tiempo real
pm2 logs orvenix

# Guardar configuración para reiniciar con el servidor
pm2 save
pm2 startup  # Sigue las instrucciones que imprime
```

### Comandos PM2 útiles:

```bash
pm2 status          # Estado de todos los procesos
pm2 restart orvenix # Reiniciar sin downtime
pm2 reload orvenix  # Reload con zero downtime (recomendado)
pm2 logs orvenix    # Ver logs en vivo
pm2 monit           # Monitor visual
```

---

## Paso 7 — Configurar Nginx

```bash
# Copiar configuración
sudo cp /var/www/orvenix/nginx.conf /etc/nginx/sites-available/orvenix

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/orvenix /etc/nginx/sites-enabled/

# Deshabilitar el sitio default si existe
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Iniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Paso 8 — SSL con Let's Encrypt

```bash
# Obtener certificado (Certbot modifica nginx.conf automáticamente)
sudo certbot --nginx -d orvenix.com.mx -d www.orvenix.com.mx

# Verificar auto-renovación
sudo certbot renew --dry-run
```

---

## Paso 9 — DNS

Configura en tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.):

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `A` | `@` | `IP_DE_TU_SERVIDOR` | 300 |
| `A` | `www` | `IP_DE_TU_SERVIDOR` | 300 |

---

## Paso 10 — Verificar deploy

```bash
# Health check
curl https://orvenix.com.mx/api/health

# Esperado: {"status":"operational",...}
```

Visita:
- `https://orvenix.com.mx` — Home marketing
- `https://orvenix.com.mx/login` — Login
- `https://orvenix.com.mx/dashboard` — Panel privado
- `https://orvenix.com.mx/admin` — Panel admin (requiere rol ADMIN)
- `https://orvenix.com.mx/api/health` — Estado del sistema

---

## Deploy en servidor Node

El proyecto se opera como una app Next.js en servidor Node. La build productiva usa:

```bash
npm run build
npm run start
```

Recomendacion actual:

- `Stripe` = suscripciones nuevas
- `MercadoPago` = tienda / pagos únicos
- no usar MercadoPago como alta nueva de suscripciones recurrentes

Variables necesarias en el servidor:

| Variable | Valor recomendado |
|----------|-------------------|
| `ORVENIX_STORAGE_MODE` | `prisma` |
| `DATABASE_URL` | MySQL/MariaDB accesible desde el servidor |
| `NEXTAUTH_URL` | `https://orvenix.com.mx` o dominio real |
| `AUTH_URL` | Mismo dominio |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Secret real de 32 bytes |
| `ORVENIX_ADMIN_EMAILS` | Correos admin separados por coma |
| `MP_ACCESS_TOKEN` | Token MercadoPago producción para tienda |
| `MP_PUBLIC_KEY` | Public key MercadoPago para tienda |
| `MP_SANDBOX` | `false` en producción |
| `ANTHROPIC_API_KEY` | Opcional, activa IA real |
| `RESEND_API_KEY` / `RESEND_FROM` | Opcional, emails transaccionales |

Nota importante del workspace actual:

- el repo ya incluye una baseline inicial en `prisma/migrations/20260524_000000_baseline`
- `npm run prisma:deploy-schema` usa `migrate deploy` cuando detecta migraciones versionadas
- si tu base ya existia antes de versionar migraciones, necesitas marcar esa baseline una sola vez con `prisma migrate resolve --applied ...`
- la deuda real pendiente ya no es “crear baseline”, sino validar el primer deploy publico y seguir despues con migraciones incrementales normales

Si tu base productiva ya existe y fue creada antes de versionar migraciones, marca la baseline una sola vez antes del primer `deploy`:

```bash
npm run prisma:resolve-baseline
```

Despues de eso, `npm run prisma:deploy-schema` ya puede continuar normalmente con `migrate deploy`.

## Checklist rápida de salida pública

1. Configura en servidor o en tu servidor:
   - `NEXTAUTH_URL`
   - `AUTH_URL`
   - `NEXT_PUBLIC_API_URL`
   - todos al mismo origen `https://...`
2. Si la base ya existía:
   - `npm run prisma:resolve-baseline`
3. Aplica schema:
   - `npm run prisma:deploy-schema`
4. Compila:
   - `npm run build`
5. Valida runtime:
   - `curl https://TU_DOMINIO/api/health`
   - revisa `https://TU_DOMINIO/estado`
   - revisa `https://TU_DOMINIO/admin/billing`
6. Valida Stripe público:
   - alta de suscripción
   - webhook
   - cancelación
   - reactivación
7. Si usarás tienda con MercadoPago:
   - checkout real
   - orden creada
   - webhook recibido

Despues del deploy verifica:

```bash
curl https://TU_DOMINIO/api/health
```

Y revisa tambien:

- `https://TU_DOMINIO/admin/billing`
- `https://TU_DOMINIO/estado`

Si usarás tienda con MercadoPago, valida checkout real, ordenes y webhooks públicos desde dominio real.

---

## Paso 11 — Configurar Resend (emails)

1. Crea cuenta en [resend.com](https://resend.com)
2. Agrega y verifica tu dominio: `Dashboard → Domains → Add Domain → orvenix.com.mx`
3. Añade los registros DNS que Resend te indica (TXT + MX)
4. Crea una API key: `Dashboard → API Keys → Create API Key`
5. Pon la key en `RESEND_API_KEY` en `.env.local`

**Test de email:**
```bash
# Registra una cuenta de prueba y verifica que llegue el email de bienvenida
curl -X POST https://orvenix.com.mx/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@tudominio.com","password":"test1234"}'
```

---

## Actualizaciones futuras

```bash
cd /var/www/orvenix

# 1. Obtener cambios
git pull origin main

# 2. Instalar nuevas deps si las hay
npm install --strict-ssl=false

# 3. Regenerar Prisma si cambió el schema
npx prisma generate --schema=prisma/editor.prisma

# 4. Compilar
npm run build

# 5. Reiniciar sin downtime
pm2 reload orvenix
```

---

## Solución de problemas comunes

### La app no arranca (PM2)
```bash
pm2 logs orvenix --lines 50
# Buscar el error específico en los logs
```

### Error de permisos en /data o /sistema
```bash
chmod -R 755 /var/www/orvenix/data
chmod -R 755 /var/www/orvenix/sistema
```

### Nginx 502 Bad Gateway
```bash
# Verificar que PM2 esté corriendo
pm2 status
# Si está detenido:
pm2 restart orvenix
```

### Prisma no conecta a MariaDB
```bash
# Probar conexión directa
mysql -u orvenix_user -p -h localhost orvenix_saas
# Verificar que DATABASE_URL sea correcta en .env.local
```

### Error NEXTAUTH_URL
- Asegúrate de que `NEXTAUTH_URL` sea exactamente `https://orvenix.com.mx` (sin trailing slash)
- Debe coincidir con el dominio en el navegador

---

## Checklist final antes de abrir al público

- [ ] Build exitoso (`npm run build` sin errores)
- [ ] PM2 corriendo (`pm2 status` → online)
- [ ] HTTPS activo (candado en el navegador)
- [ ] Variables de entorno configuradas
- [ ] Email de bienvenida llegando al registrarse
- [ ] Login/registro funcionando
- [ ] Dashboard cargando
- [ ] Admin panel accessible con rol ADMIN
- [ ] `/api/health` retorna `"status":"operational"`
- [ ] Resend con dominio verificado
- [ ] Backups de `/data` y `/sistema` configurados
