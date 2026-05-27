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
│       │   ├── components/  # Componentes reutilizables
│       │   └── lib/         # Cliente Medusa SDK
│       ├── .env.template
│       └── next.config.ts
├── .github/workflows/    # CI/CD
├── pnpm-workspace.yaml   # Monorepo
├── turbo.json            # Turborepo
└── package.json
```

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 10 (`npm install -g pnpm`)
- **PostgreSQL** >= 15 (recomendado: [Supabase](https://supabase.com) gratis)
- **Redis** (opcional, para produccion)

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
# Desde la raiz (ambos servicios)
pnpm dev

# O individualmente:
pnpm backend:dev    # Backend en :9000 + Admin en :9000/app
pnpm storefront:dev # Storefront en :8000
```

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
4. Configura el Webhook en el panel de MP apuntando a:
   `https://tu-backend.com/api/webhooks/mercadopago`

## Automatizacion SII Chile con n8n

El subscriber `order.placed` envia automaticamente cada orden nueva a un webhook de n8n.

### Flujo n8n recomendado:

1. **Webhook** recibe `POST` con datos de la orden
2. **HTTP Request** a API del SII para generar boleta electronica
3. **HTTP Request** callback a `/api/webhooks/n8n-status` con:
   - `order_id`: ID de la orden
   - `sii_status`: "exitoso" | "rechazado"
   - `boleta_url`: URL del PDF de la boleta
4. Medusa actualiza los metadatos de la orden con el link de la boleta

## Comandos utiles

```bash
pnpm dev              # Inicia backend + storefront
pnpm build            # Construye ambos proyectos
pnpm backend:dev      # Solo backend
pnpm storefront:dev   # Solo storefront
pnpm lint             # Lint de todos los proyectos
```

## Despliegue

### Storefront (Vercel)
```bash
# Conectar repo a Vercel, configurar env vars:
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://tu-backend.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_DEFAULT_REGION=mx
```

### Backend (Koyeb / Render)
```bash
# Usar el Dockerfile o deploy directo desde el repo
# Configurar DATABASE_URL apuntando a Supabase
# Configurar las demas variables de entorno
```

## Licencia

MIT
