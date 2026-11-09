# SONOM — Hybrid hosting (Vercel storefront + local Medusa + Cloudflare Tunnel)

## Arquitectura

```
Browser ──▶ https://sonom.cl            (Vercel / Next.js 15)
                │  server-side fetch
                ▼
           https://api.sonom.cl          (Cloudflare Tunnel)
                │
                ▼
           localhost:9000               (Medusa v2, esta máquina)
                │
                ├─▶ Supabase PostgreSQL (sesiones, pedidos, catálogo)
                ├─▶ Redis local (event bus, reintentos de webhooks)
                ├─▶ Mercado Pago API (preferencias, pagos, reembolsos)
                └─▶ Proveedor DTE (boletas electronicas SII)
```

- El **storefront** corre en Vercel. Nunca llama a `localhost`.
- El **backend** corre localmente y se expone sólo por el túnel.
- Mercado Pago entra por `https://api.sonom.cl`; el backend llama al proveedor
  DTE por HTTPS saliente (no requiere túnel).
- El navegador **no** necesita hablar con Medusa: todo el store usa server actions
  y `fetch` server-side con `x-publishable-api-key`.

---

## 1. Requisitos

| Herramienta | Versión | Uso |
| --- | --- | --- |
| Node.js | ≥ 20 | backend y scripts |
| pnpm | 10.x (`packageManager`) | monorepo |
| Docker Desktop | reciente | Redis local |
| cloudflared | reciente | túnel |
| Cuenta Cloudflare | — | DNS `sonom.cl` |
| Cuenta Vercel | — | storefront |
| Cuenta Mercado Pago | — | pagos |

---

## 2. Cloudflare Tunnel (una sola vez)

### 2.1 Login y creación

```powershell
cloudflared tunnel login
cloudflared tunnel create sonom-api
```

`tunnel create` imprime el UUID y escribe las credenciales en:

```
C:\Users\<TU-USUARIO>\.cloudflared\<UUID>.json
```

Guarda el UUID:

```powershell
cloudflared tunnel list
```

### 2.2 DNS

```powershell
cloudflared tunnel route dns sonom-api api.sonom.cl
```

Esto crea un registro `CNAME api → <UUID>.cfargotunnel.com` en la zona `sonom.cl`.

### 2.3 `config.yml`

Crea `C:\Users\<TU-USUARIO>\.cloudflared\config.yml`:

```yaml
tunnel: <UUID_DEL_TUNEL>
credentials-file: C:\Users\<TU-USUARIO>\.cloudflared\<UUID_DEL_TUNEL>.json

ingress:
  - hostname: api.sonom.cl
    service: http://localhost:9000
    originRequest:
      connectTimeout: 30s
  - service: http_status:404
```

> `api.sonom.cl` debe ser el mismo hostname que uses en
> `MERCADO_PAGO_NOTIFICATION_URL`, `MEDUSA_BACKEND_URL` y `NEXT_PUBLIC_MEDUSA_BACKEND_URL`.

### 2.4 Ejecución manual

```powershell
cloudflared tunnel run sonom-api
```

Verifica desde otra red (no localhost):

```powershell
curl.exe https://api.sonom.cl/health
```

Debe responder `OK`.

### 2.5 Instalar como servicio de Windows

El servicio corre como `LocalSystem`, por lo que **no** lee tu perfil de usuario.
En PowerShell **como Administrador**:

```powershell
mkdir C:\Cloudflared\bin
# copia cloudflared.exe a C:\Cloudflared\bin\
Set-Location C:\Cloudflared\bin
.\cloudflared.exe service install

mkdir C:\Windows\System32\config\systemprofile\.cloudflared
copy "$env:USERPROFILE\.cloudflared\cert.pem" "C:\Windows\System32\config\systemprofile\.cloudflared\cert.pem"
copy "$env:USERPROFILE\.cloudflared\<UUID>.json" "C:\Windows\System32\config\systemprofile\.cloudflared\<UUID>.json"
```

Crea `C:\Windows\System32\config\systemprofile\.cloudflared\config.yml`
usando `credentials-file` con esa ruta absoluta:

```yaml
tunnel: <UUID_DEL_TUNEL>
credentials-file: C:\Windows\System32\config\systemprofile\.cloudflared\<UUID_DEL_TUNEL>.json
logfile: C:\Cloudflared\cloudflared.log

ingress:
  - hostname: api.sonom.cl
    service: http://localhost:9000
    originRequest:
      connectTimeout: 30s
  - service: http_status:404
```

Valida y ajusta el registro (el servicio necesita `--config`):

```powershell
.\cloudflared.exe --config "C:\Windows\System32\config\systemprofile\.cloudflared\config.yml" tunnel ingress validate
```

En `regedit`, abre
`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Cloudflared` y edita
`ImagePath`:

```
C:\Cloudflared\bin\cloudflared.exe --config=C:\Windows\System32\config\systemprofile\.cloudflared\config.yml tunnel run
```

Arranca y verifica:

```powershell
sc start cloudflared
Get-Service cloudflared
```

Alternativa sin servicio (tarea al iniciar sesión):

```powershell
cloudflared --config "$env:USERPROFILE\.cloudflared\config.yml" tunnel run sonom-api
```

### 2.6 Cloudflare Access (opcional pero recomendado)

Si proteges `api.sonom.cl` con Access, **debes** permitir que Mercado Pago
entre al webhook. En **Zero Trust → Access → Applications** crea una
aplicación para `api.sonom.cl` con dos políticas:

1. **Bypass — Webhooks**
   - Action: `Bypass`
   - Include: `Everyone`
   - Path: `/webhooks/*`
2. **Service Auth — Store API**
   - Action: `Service Auth`
   - Include: `Service Token` → crea uno llamado `sonom-vercel`
   - Path: `/store/*` y `/auth/*`

Copia `CF-Access-Client-Id` y `CF-Access-Client-Secret` a Vercel
(`CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`).

Si tu panel de Access no ofrece políticas por path, crea **dos aplicaciones**:

1. `api.sonom.cl/webhooks` → `Bypass` / `Everyone`.
2. `api.sonom.cl` → `Service Auth` / service token `sonom-vercel`.

> El bypass de `/webhooks/*` es seguro porque la ruta de Mercado Pago valida
> firma criptográfica (`x-signature` + `x-request-id` + ventana de 300 s).

Si **no** usas Access, no configures los `CF_ACCESS_*` y no habrá cabeceras extra.

---

## 3. Backend local

### 3.1 Variables (`apps/backend/.env`)

```dotenv
NODE_ENV=development

DATABASE_URL=postgres://postgres:<PASSWORD>@db.<PROJECT-REF>.supabase.co:5432/postgres
DB_SSL=true
DATABASE_LOGGING=false

# Sólo orígenes del storefront. NUNCA la URL de Mercado Pago.
STORE_CORS=https://sonom.vercel.app,https://sonom.cl,https://www.sonom.cl,http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://api.sonom.cl
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://api.sonom.cl

# back_urls de Mercado Pago (NO es CORS)
STOREFRONT_URL=https://sonom.cl

# Déjalo vacío para que el script levante Redis en Docker.
REDIS_URL=

JWT_SECRET=<48+ caracteres aleatorios>
COOKIE_SECRET=<48+ caracteres aleatorios>

DISABLE_MEDUSA_ADMIN=false
ADMIN_BACKEND_URL=http://localhost:9000

MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=<secreto de firma de MP>
MERCADO_PAGO_NOTIFICATION_URL=https://api.sonom.cl/webhooks/mercadopago
MERCADO_PAGO_STATEMENT_DESCRIPTOR=SONOM

# Boleta electronica nativa (reemplaza n8n)
SII_ENABLED=true
SII_API_URL=https://api.tu-proveedor.cl/v1/boletas
SII_API_KEY=<api key del proveedor>
SII_API_KEY_HEADER=Authorization
SII_API_KEY_PREFIX=Bearer
SII_IDEMPOTENCY_HEADER=Idempotency-Key
SII_API_TIMEOUT_MS=15000
SII_API_MAX_ATTEMPTS=3
SII_DTE_TYPE=39

SII_EMISOR_RUT=<RUT emisor>
SII_EMISOR_RAZON_SOCIAL=<razon social>
SII_EMISOR_GIRO=<giro>
SII_EMISOR_ACTIVIDAD_ECONOMICA=<codigo actividad>
SII_EMISOR_DIRECCION=<direccion>
SII_EMISOR_COMUNA=<comuna>
SII_EMISOR_CIUDAD=<ciudad>
SII_EMISOR_EMAIL=<email>

SII_PRICES_INCLUDE_TAX=true
SII_IVA_RATE=0.19
SII_CONSUMIDOR_FINAL_RUT=66666666-6
SII_BOLETA_URL_TEMPLATE=

UPLOAD_DIR=uploads
```

Genera secretos:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Valores exactos de CORS:

- **`STORE_CORS`** = `https://sonom.vercel.app,https://sonom.cl,https://www.sonom.cl,http://localhost:8000`
- **`ADMIN_CORS`** = `http://localhost:5173,http://localhost:9000,https://api.sonom.cl`
- **`AUTH_CORS`** = `http://localhost:5173,http://localhost:9000,https://api.sonom.cl`

No agregues `https://api.sonom.cl` a `STORE_CORS`: el navegador no llama al
backend. Tampoco agregues las `back_urls` de Mercado Pago.

### 3.2 Mercado Pago

1. **Tus integraciones → Tu aplicación → Credenciales**: copia
   `MERCADO_PAGO_PUBLIC_KEY` y `MERCADO_PAGO_ACCESS_TOKEN`.
2. **Webhooks → Configurar notificaciones**:
   - URL: `https://api.sonom.cl/webhooks/mercadopago`
   - Evento: `payment`
3. Copia el **secreto de firma** a `MERCADO_PAGO_WEBHOOK_SECRET`.

Sin ese secreto el backend devuelve `500` en el webhook (falla cerrado).

### 3.3 Boleta electronica SII (nativa)

El subscriber `order.placed` emite la boleta directamente contra el proveedor
DTE. No hay n8n ni callback adicional.

1. Configura `SII_API_URL`, `SII_API_KEY` y los datos del emisor.
2. El service hace `POST` con `Idempotency-Key: <order_id>`.
3. El resultado queda en la orden:
   - `metadata.sii_status`: `emitida` | `pendiente` | `fallido`
   - `metadata.sii_folio`
   - `metadata.sii_boleta_url`
   - `metadata.sii_error` / `metadata.sii_attempts`

Si el proveedor devuelve solo el folio, define `SII_BOLETA_URL_TEMPLATE`, por
ejemplo `https://api.tu-proveedor.cl/boletas/{folio}/pdf`.

El payload DTE se construye en
`apps/backend/src/modules/sii-invoicing/service.ts` (`buildPayload`). Si tu
proveedor usa otros nombres de campo, ajusta solo ese metodo.

### 3.4 Arranque

```powershell
pnpm install
pnpm backend:seed        # sólo la primera vez / tras cambios de seed
pnpm hybrid              # Redis + Medusa + cloudflared
```

o:

```powershell
.\scripts\startup.ps1
# macOS/Linux:
./scripts/startup.sh
```

El script:

1. Usa `REDIS_URL` si existe; si no, levanta el contenedor `sonom-redis`.
2. Arranca `pnpm --filter @sonom/backend dev` en `:9000`.
3. Espera `http://127.0.0.1:9000/health`.
4. Arranca `cloudflared tunnel run sonom-api`.
5. Mata todo el árbol de procesos con `Ctrl+C`.

Variables opcionales del script:

| Variable | Default | Uso |
| --- | --- | --- |
| `PORT` | `9000` | puerto de Medusa |
| `CLOUDFLARE_TUNNEL_NAME` | `sonom-api` | nombre del túnel |
| `CLOUDFLARED_DISABLE` | `false` | `true` para no abrir el túnel |
| `REDIS_CONTAINER` | `sonom-redis` | nombre del contenedor |
| `REDIS_PORT` | `6379` | puerto local de Redis |
| `HEALTH_TIMEOUT_MS` | `180000` | espera máxima del health check |

---

## 4. Storefront en Vercel

### 4.1 Variables de entorno

| Variable | Valor | Entorno |
| --- | --- | --- |
| `MEDUSA_BACKEND_URL` | `https://api.sonom.cl` | Production + Preview |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://api.sonom.cl` | Production + Preview |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` | todos |
| `NEXT_PUBLIC_BASE_URL` | `https://sonom.cl` | Production |
| `NEXT_PUBLIC_DEFAULT_REGION` | `cl` | todos |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | `APP_USR-...` | todos |
| `CF_ACCESS_CLIENT_ID` | — | sólo si Access protege `/store/*` |
| `CF_ACCESS_CLIENT_SECRET` | — | sólo si Access protege `/store/*` |

`MEDUSA_BACKEND_URL` es server-only: evita que la URL del túnel se inline en el
bundle del cliente. `NEXT_PUBLIC_MEDUSA_BACKEND_URL` existe sólo por
compatibilidad; si no lo necesitas, elimínalo.

### 4.2 Preview deployments

`STORE_CORS` no admite comodines arbitrarios de Vercel. Opciones:

- Usa el dominio de producción para probar pagos.
- O agrega manualmente el dominio exacto del preview a `STORE_CORS` y reinicia
  Medusa (el backend no recarga `.env` en caliente).

### 4.3 Deploy

```powershell
git push origin master
```

Vercel construye `apps/storefront`. El backend **no** se despliega en Vercel.

---

## 5. Operación diaria

```powershell
# Estado del túnel
cloudflared tunnel info sonom-api

# Logs del backend
pnpm backend:dev

# Redis
docker ps --filter name=sonom-redis
docker logs sonom-redis --tail 50

# Reiniciar backend tras cambiar .env
# (detén pnpm hybrid y vuelve a ejecutarlo; Medusa no recarga env)

# Verificar webhook
curl.exe -i https://api.sonom.cl/health
```

Checklist mínima antes de vender:

- [ ] `curl.exe https://api.sonom.cl/health` → `OK`
- [ ] `pnpm backend:seed` sin errores
- [ ] Producto “Violeta Parra” en categoría `artistas-plasticos`
- [ ] Precio CLP visible en `/productos`
- [ ] Pago de prueba aprobado → pedido creado y carrito vaciado
- [ ] Webhook de MP con firma válida → `200`
- [ ] Webhook con firma inválida → `401`
- [ ] Pedido de prueba emite boleta y actualiza `metadata.sii_boleta_url`
- [ ] `metadata.sii_status` es `emitida` y `metadata.sii_folio` existe
- [ ] `DATABASE_LOGGING=false`

---

## 6. Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `CORS error` en el navegador | dominio no está en `STORE_CORS` | agrégalo y reinicia el backend |
| `502` en `api.sonom.cl` | túnel caído o backend apagado | `cloudflared tunnel run sonom-api` + `pnpm backend:dev` |
| `500 Webhook secret not configured` | falta `MERCADO_PAGO_WEBHOOK_SECRET` | créalo en MP y reinicia |
| `401 Invalid signature` | secreto incorrecto o body reserializado | usa el secreto de MP y el body crudo |
| Pedido creado sin pago aprobado | no debe ocurrir: `pending` mapea a `NOT_SUPPORTED` | revisa `getWebhookActionAndData` |
| Webhook reintenta infinitamente | el handler devuelve `5xx` | corrige el error; MP reintenta |
| `cloudflared` no encontrado | no está en PATH | instálalo o usa ruta absoluta |
| Redis no arranca | Docker apagado | abre Docker Desktop |
| Cambios de `.env` ignorados | Medusa no recarga env | reinicia `pnpm hybrid` |

---

## 7. Seguridad

- `STORE_CORS` sólo lista orígenes del storefront.
- El webhook de MP valida HMAC-SHA256 + `x-request-id` + ventana de 300 s.
- La emision DTE usa `Idempotency-Key` por orden y no reemite boletas ya
  marcadas como `emitida`.
- `SII_API_KEY` se envia solo al proveedor DTE por HTTPS saliente.
- `JWT_SECRET` / `COOKIE_SECRET` se validan al arrancar: en producción deben
  tener ≥ 32 caracteres y no ser `supersecret`.
- `DATABASE_LOGGING` es `false` por defecto.
- Cloudflare Access puede proteger el catálogo sin bloquear los webhooks.
- No subas `.env`, `.env.local` ni credenciales del túnel al repositorio.
