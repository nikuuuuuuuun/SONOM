# Sonom - Ecommerce de Artesanias de Figuras Historicas

Tienda en linea especializada en artesanias de figuras de la historia cultural y artistica, construida con **MedusaJS** + **Next.js**.

## Arquitectura

```
sonom/
├── apps/
│   ├── backend/          # MedusaJS v2 (API + Admin Dashboard)
│   │   ├── src/
│   │   │   ├── api/         # Webhooks (Mercado Pago, n8n)
│   │   │   ├── subscribers/ # Eventos de dominio (order.placed)
│   │   │   ├── workflows/   # Workflows personalizados
│   │   │   └── scripts/     # Seed de datos
│   │   ├── medusa-config.ts
│   │   └── .env.template
│   └── storefront/       # Next.js 15 (App Router + Tailwind)
│       ├── src/
│       │   ├── app/         # Paginas (SSR/SSG)
│       │   ├── actions/     # Server actions (carrito, auth, checkout)
│       │   ├── components/  # Componentes reutilizables
│       │   └── lib/         # fetch nativo + helpers de catalogo
│       ├── .env.template
│       └── next.config.ts
├── docs/                 # Guias de despliegue
├── scripts/              # Runtime hibrido (Redis + Medusa + tunel)
├── .github/workflows/    # CI/CD
├── pnpm-workspace.yaml   # Monorepo
├── turbo.json            # Turborepo
└── package.json
```

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 10 (`npm install -g pnpm`)
- **PostgreSQL** >= 15 (recomendado: [Supabase](https://supabase.com) gratis)
- **Redis** (event bus y reintentos de webhooks)
- **cloudflared** (para exponer el backend local, ver `docs/hybrid-hosting.md`)

## Inicio Rapido

### 1. Clonar e instalar

```bash
pnpm install
```

### 2. Configurar variables de entorno

**Backend:**
```bash
cp apps/backend/.env.template apps/backend/.env
# Editar apps/backend/.env con tus credenciales
```

**Storefront:**
```bash
cp apps/storefront/.env.template apps/storefront/.env.local
# Editar apps/storefront/.env.local
```

### 3. Base de datos (Supabase)

1. Crea un proyecto gratis en [Supabase](https://supabase.com)
2. Ve a Project Settings > Database y copia la URI de conexion
3. Pegala en `apps/backend/.env` como `DATABASE_URL`

### 4. Migraciones y seed

```bash
cd apps/backend
pnpm medusa db:migrate
pnpm medusa exec ./src/scripts/seed.ts
pnpm medusa user -e admin@sonom.mx -p tu-contrasena
```

### 5. Iniciar en desarrollo

```bash
# Ambos servicios (sin tunel)
pnpm dev

# Runtime hibrido: Redis + Medusa + Cloudflare Tunnel
pnpm hybrid
# equivalente:
./scripts/startup.sh        # macOS / Linux
.\scripts\startup.ps1       # Windows

# O individualmente:
pnpm backend:dev    # Backend en :9000 + Admin en :9000/app
pnpm storefront:dev # Storefront en :8000
```

Guia completa de despliegue hibrido: **[docs/hybrid-hosting.md](docs/hybrid-hosting.md)**.

## Servicios "Always Free"

| Servicio | Uso | Plan Gratuito |
|---|---|---|
| **Supabase** | Base de datos PostgreSQL | 500 MB, 2 proyectos |
| **Vercel** | Storefront Next.js | 100 GB/hora, builds ilimitados |
| **Koyeb / Render** | Backend MedusaJS | 1 vCPU, 512 MB RAM |
| **n8n (self-hosted)** | Automatizacion SII | Ilimitado (tu VPS) |
| **Oracle Cloud** | VPS para n8n + Redis | 4 OCPU, 24 GB RAM (siempre gratis) |

## Integracion de Pagos: Mercado Pago

1. Registrate en [Mercado Pago Developers](https://www.mercadopago.com/developers)
2. Crea una aplicacion y obtén tus credenciales
3. Configura en `.env`:
   - `MERCADO_PAGO_PUBLIC_KEY` (frontend)
   - `MERCADO_PAGO_ACCESS_TOKEN` (backend)
   - `MERCADO_PAGO_WEBHOOK_SECRET` (firma del webhook)
   - `MERCADO_PAGO_NOTIFICATION_URL` (URL publica del tunel)
4. Configura el Webhook en el panel de MP apuntando a:
   `https://api.tu-dominio.cl/webhooks/mercadopago`

## Automatizacion SII Chile con n8n

El subscriber `order.placed` envia automaticamente cada orden nueva a un webhook de n8n.

### Flujo n8n recomendado:

1. **Webhook** recibe `POST` con datos de la orden
2. **HTTP Request** a API del SII para generar boleta electronica
3. **HTTP Request** callback a `https://api.tu-dominio.cl/webhooks/n8n-status` con:
   - Headers `x-sonom-timestamp` y `x-sonom-signature`
     (`HMAC-SHA256(secret, "<timestamp>.<order_id>.<sii_status>.<boleta_url>")`)
   - `order_id`: ID de la orden
   - `sii_status`: "exitoso" | "fallido" | "pendiente"
   - `boleta_url`: URL del PDF de la boleta
4. Medusa actualiza los metadatos de la orden con el link de la boleta

El subscriber `order.placed` firma el body saliente con los mismos headers
(`HMAC-SHA256(secret, "<timestamp>.<body-crudo>")`).

## Comandos utiles

```bash
pnpm dev              # Inicia backend + storefront
pnpm build            # Construye ambos proyectos
pnpm backend:dev      # Solo backend
pnpm storefront:dev   # Solo storefront
pnpm hybrid           # Redis + backend + tunel
pnpm backend:seed     # Seed idempotente
pnpm lint             # Lint de todos los proyectos
```

## Despliegue (hibrido)

Produccion recomendada para SONOM:

- **Storefront** en Vercel (`sonom.cl`).
- **Backend Medusa** local, expuesto con **Cloudflare Tunnel** (`api.sonom.cl`).
- **Redis** local o gestionado para el event bus.

```bash
# Vercel (Project Settings > Environment Variables)
MEDUSA_BACKEND_URL=https://api.sonom.cl
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.sonom.cl
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=https://sonom.cl
NEXT_PUBLIC_DEFAULT_REGION=cl
```

El backend local se arranca con `pnpm hybrid`. Los pasos exactos de
`cloudflared tunnel login/create/route dns/run`, el `config.yml`, el servicio de
Windows, Cloudflare Access y la matriz completa de variables estan en
**[docs/hybrid-hosting.md](docs/hybrid-hosting.md)**.

> El backend tambien puede desplegarse en Koyeb/Render usando
> `Dockerfile.backend`; en ese caso omite el tunel y apunta
> `MEDUSA_BACKEND_URL` a la URL publica del servicio.

## Licencia

MIT
