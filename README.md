# Orvenix

Aplicación Next.js 16 para el sitio público de Orvenix, dashboard privado, editor visual y APIs internas.

## Requisitos

- Node.js 20+
- npm
- MySQL/MariaDB accesible desde `DATABASE_URL`

## Variables de entorno

Usa `.env.example` como plantilla y configura al menos:

- `DATABASE_URL`
- `ORVENIX_STORAGE_MODE` (`prisma` para MySQL/MariaDB, `file` para modo local simple)
- `AUTH_SECRET` o `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_URL`
- `NEXT_PUBLIC_API_URL`
- `ORVENIX_ADMIN_EMAILS`
- `ANTHROPIC_API_KEY` si vas a usar el chat

### Pagos y suscripciones

Stripe es la pasarela preferida para suscripciones nuevas. MercadoPago queda como respaldo y para flujos existentes.

Variables Stripe:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

STRIPE_PRICE_STARTER_MONTH="price_..."
STRIPE_PRICE_STARTER_YEAR="price_..."
STRIPE_PRICE_PRO_MONTH="price_..."
STRIPE_PRICE_PRO_YEAR="price_..."
STRIPE_PRICE_COMMERCE_MONTH="price_..."
STRIPE_PRICE_COMMERCE_YEAR="price_..."
```

Webhook Stripe:

- URL: `https://tu-dominio.com/api/billing/stripe-webhook`
- Eventos:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Variables MercadoPago:

```env
MP_ACCESS_TOKEN="APP_USR-..."
MP_PUBLIC_KEY="APP_USR-..."
MP_SANDBOX="false"
```

Webhook MercadoPago:

- URL: `https://tu-dominio.com/api/checkout/webhook`
- Eventos: pagos y suscripciones/preapproval.

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate:deploy
```

La app local corre en `http://127.0.0.1:3000`.

Antes de correr migraciones, confirma que MySQL/MariaDB este escuchando en el host y puerto de `DATABASE_URL`.
En desarrollo actual, `DATABASE_URL` apunta a `localhost:3306`; si la DB no esta levantada, Prisma devuelve errores de conexion/pool timeout.

## Migraciones

Para preparar una base de datos nueva o actualizar producción:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed
```

La auditoría de webhooks usa la tabla `webhook_events` y se puede revisar desde `/admin/webhooks`.
La configuración de pasarelas se puede revisar sin exponer secretos en `/admin/billing` y también aparece resumida en `/api/health`.

## Estado actual

- El frontend público compila y responde en producción.
- Los flujos de auth, dashboard y editor requieren una base de datos real.
- El checkout de suscripciones usa Stripe si están configurados `STRIPE_SECRET_KEY` y los `STRIPE_PRICE_*`; si no, intenta MercadoPago.
- Los webhooks de Stripe/MercadoPago quedan auditados en `/admin/webhooks`.
- El chat de IA requiere `ANTHROPIC_API_KEY`.
