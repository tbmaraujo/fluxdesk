
# Contexto do Projeto — Fluxdesk (Help Desk)

**Stack:** Laravel 11 + Inertia (React + TypeScript) + Tailwind + shadcn/ui + PostgreSQL + Redis  
**Filas/Jobs:** Laravel Queues (Redis) — `queue:work` (sem Octane e sem Horizon)  
**E-mail:** Mailgun  
**Autenticação:** Laravel Breeze/Fortify (se aplicável)  
**Build Frontend:** Vite + pnpm

---

## Requisitos
- PHP 8.3+ e Composer
- Node 20+ e **pnpm**
- PostgreSQL 13+
- Redis 6+

---

## Como rodar (local)
1. **Instalação**
   ```bash
   composer install
   pnpm install
   cp .env.example .env
   php artisan key:generate
   ```
2. **Banco de dados**
   ```bash
   php artisan migrate
   php artisan db:seed   # se aplicável
   ```
3. **Servidores (2 abas)**
   ```bash
   # Backend
   php artisan serve --host=127.0.0.1 --port=8000

   # Frontend
   pnpm dev
   ```
4. **Filas (recomendado)**
   ```bash
   php artisan queue:work
   # Em produção, executar via Supervisor/Systemd
   ```

---

## Scripts úteis
- **Backend**
  - `php artisan optimize:clear`
  - `php artisan migrate` / `php artisan migrate --force`
  - `php artisan queue:work`
  - `php artisan test`
- **Frontend**
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint` / `pnpm test`

Sugestão de `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

---

## Estrutura de pastas (padrão)
```
app/
  Actions/         # Casos de uso
  Services/        # Regras de domínio/integrações
  Http/
    Controllers/
    Requests/      # Form Requests (validação)
    Middleware/
  Models/
resources/
  js/
    Pages/         # Páginas Inertia
    Layouts/
    Components/
    lib/           # utilitários/SDKs front-end
routes/
  web.php
  api.php
```

---

## Convenções e qualidade
- **PHP (PSR-12)** com PHP-CS-Fixer  
  Regras: `array_syntax=short`, `ordered_imports=alpha`, `no_unused_imports`
- **JS/TS**: ESLint + Prettier (TypeScript-first)
- **Commits**: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)
- **UI**: shadcn/ui + Tailwind; componentes reutilizáveis em `resources/js/Components`
- **Acessibilidade**: seguir WAI-ARIA

---

## Regras de código
- **Controllers finos** (sem regra de negócio pesada)
- **Domínio** em **Actions** / **Services**
- **Validação** via **Form Requests**
- **Autorização** via **Policies/Gates**
- **Consultas**: evitar N+1 (eager loading); para consultas complexas, usar DTOs/Repositories
- **Inertia**: manter como **SPA** (não usar React Server Components)

---

## Ambiente & Mailgun
`.env` básico (exemplo):
```env
APP_ENV=local
APP_URL=http://127.0.0.1:8000

# DB
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fluxdesk
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Redis / Filas
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QUEUE_CONNECTION=redis

# E-mail — Mailgun
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@seu-dominio.com.br"
MAIL_FROM_NAME="Fluxdesk"

MAILGUN_DOMAIN=mg.seu-dominio.com.br
MAILGUN_SECRET=key-xxxxx
MAILGUN_SIGNING_KEY=xxxxx
MAILGUN_ENDPOINT=api.mailgun.net

# Reply-To com HMAC (evita loops)
REPLY_HMAC_SECRET=seu-secret-aleatorio
MAIL_REPLY_DOMAIN=tickets.fluxdesk.com.br
```

**Boas práticas de e-mail**
- Produção: domínio verificado no Mailgun, **SPF/DKIM/DMARC** corretos.
- Dev: adicione destinatários autorizados no sandbox do Mailgun.
- Envio **assíncrono** via fila (`queue:work`).  
- Monitorar **bounces/complaints** via webhook do Mailgun.

**Inbound (abrir chamados por e-mail)**:
- Mailgun **Routes** → POST para `/api/webhooks/mailgun-inbound`
- Processar a mensagem **assíncrona** (job), usando `Message-ID` para **idempotência**.
- Suporta identificação por: Reply-To HMAC, Threading headers, Subject [TKT-ID]

---

## Deploy (resumo)
```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
pnpm install --frozen-lockfile
pnpm build
php artisan config:cache && php artisan route:cache && php artisan view:cache
# Filas
# Supervisione queue workers com Supervisor/Systemd:
#   php artisan queue:work --sleep=1 --max-time=3600 --max-jobs=1000
```
- Defina variáveis **Mailgun** no ambiente.
- Healthchecks do app e verificação do **queue:work** ativo.
- Configure **Mailgun Routes** apontando para seu webhook.

---

## Observabilidade
- **Logs** (preferir JSON em prod) + níveis apropriados
- **Jobs falhos**: `failed_jobs` + alertas
- **Métricas** do servidor (CPU/memória/IO) e consumo de fila

---

## Tarefas comuns
- **Nova página**: rota → controller → `Page.tsx` em `resources/js/Pages/...` → layout
- **Form Inertia**: `@inertiajs/react` (`useForm`) + Form Request (backend)
- **Tabela**: DataTable (shadcn/ui) + paginação server-side (`LengthAwarePaginator`)

---

## O que **NUNCA** fazer
- ❌ Comitar `.env` ou segredos
- ❌ `php artisan migrate:fresh` em **produção**
- ❌ Lógica de negócio em Controllers/Views
- ❌ Enviar e-mails **síncronos** em rotas críticas

---

## Para o Agente (Cursor)
- Responder **em PT-BR**; nomes de código em **EN-US**.
- Antes de alterar arquivo, **exibir diff** resumido e justificativa.
- CRUDs: gerar **Migration + Model + Policy + Form Request + Controller + Page (Inertia) + Routes**.
- Usar **Redis queues** por padrão; se criar e-mails/notificações, **enfileirar**.
- Preferir componentes **reutilizáveis** do shadcn/ui e tipagem forte (TS).