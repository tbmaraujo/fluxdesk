# Mailgun Inbound Email — Guia Completo

Este documento descreve a configuração e uso do sistema de e-mails inbound via **Mailgun Routes** no Fluxdesk.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Funciona](#como-funciona)
- [Configuração do Tenant](#configuração-do-tenant)
- [Testes Manuais](#testes-manuais)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O Fluxdesk suporta recebimento de e-mails via Mailgun para:

1. **Criar novos tickets** via e-mail para endereços como:
   - `slug@tickets.fluxdesk.com.br`
   - `email_code@tickets.fluxdesk.com.br`
   - `id_numerico@tickets.fluxdesk.com.br`

2. **Responder a tickets existentes** via Reply-To com HMAC:
   - `reply+tkt.{slug}.{ticket_id}.{hmac}@tickets.fluxdesk.com.br`

3. **Fallbacks** para identificação de ticket:
   - Threading headers (`In-Reply-To`, `References`)
   - Subject com `[TKT-123]`

---

## Variáveis de Ambiente

Configure estas variáveis no `.env`:

### Mailgun

```env
# Obrigatórias
MAILGUN_DOMAIN=mg.fluxdesk.com.br
MAILGUN_SECRET=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Signing Key (RECOMENDADO)
# Esta é a chave específica para validação de webhooks do Mailgun
MAILGUN_SIGNING_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OU (alternativa, mesma chave)
MAILGUN_WEBHOOK_SIGNING_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Endpoint (padrão: api.mailgun.net)
MAILGUN_ENDPOINT=api.mailgun.net
```

**⚠️ Importante:**
- `MAILGUN_SIGNING_KEY` é a **chave preferencial** para validação de webhooks
- `MAILGUN_WEBHOOK_SIGNING_KEY` é aceita como alternativa
- `MAILGUN_SECRET` é usado como **fallback** se as anteriores não estiverem definidas
- Em produção, **sempre** configure `MAILGUN_SIGNING_KEY` com a chave de webhook do Mailgun

### Reply-To HMAC

```env
# Secret para gerar HMAC nos endereços de Reply-To
REPLY_HMAC_SECRET=algum-secret-longo-e-aleatorio-aqui

# Domínio para Reply-To (padrão: tickets.fluxdesk.com.br)
MAIL_REPLY_DOMAIN=tickets.fluxdesk.com.br
```

### E-mail (envio)

```env
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@fluxdesk.com.br"
MAIL_FROM_NAME="Fluxdesk"
```

---

## Como Funciona

### 1. Criação de Novos Tickets

Quando um e-mail chega para `local-part@tickets.fluxdesk.com.br`, o sistema:

1. **Extrai o local-part** (parte antes do `@`)
2. **Identifica o tenant** por (em ordem):
   - `tenants.slug` = local-part
   - `tenants.email_code` = local-part
   - `tenants.id` = local-part (se for numérico)
3. **Enfileira** a criação do ticket via `EmailIngestJob`
4. **Retorna** HTTP 200 com `{"ok": true, "action": "new_ticket"}`

**Exemplos:**
- `acme@tickets.fluxdesk.com.br` → busca tenant com `slug='acme'`
- `42262851012132@tickets.fluxdesk.com.br` → busca por `email_code` ou `id`

### 2. Resposta a Tickets Existentes

Quando um e-mail chega para `reply+tkt.{slug}.{id}.{hmac}@tickets.fluxdesk.com.br`:

1. **Valida o HMAC** (hash gerado com `REPLY_HMAC_SECRET`)
2. **Identifica o ticket** pelo ID
3. **Enfileira** a resposta via `EmailIngestJob`
4. **Retorna** HTTP 200 com `{"ok": true, "ticket_id": 123}`

### 3. Fallbacks

Se não for possível identificar por Reply-To, o sistema tenta:

1. **Threading headers**: `In-Reply-To` e `References`
2. **Subject parsing**: `[TKT-123]` ou `[TICKET-123]`

Se nenhum método funcionar, retorna HTTP 200 com:
```json
{"status": "ignored", "reason": "no_ticket_match"}
```

---

## Configuração do Tenant

### Adicionar `email_code` ao Tenant

Rode a migration:

```bash
php artisan migrate
```

Isso adiciona a coluna `email_code` à tabela `tenants`:

```php
Schema::table('tenants', function (Blueprint $table) {
    $table->string('email_code')->nullable()->unique()->after('slug');
});
```

### Configurar Tenant via Console/UI

1. **Via tinker:**

```bash
php artisan tinker

$tenant = App\Models\Tenant::find(1);
$tenant->email_code = '42262851012132'; // ou qualquer código único
$tenant->save();
```

2. **Via seed/migration:**

```php
use App\Models\Tenant;

Tenant::create([
    'name' => 'Acme Corp',
    'slug' => 'acme',
    'email_code' => '42262851012132',
    'domain' => 'acme.fluxdesk.com.br',
    'is_active' => true,
]);
```

---

## Testes Manuais

### Teste 1: Criar Novo Ticket

```bash
bash test-mailgun-new-ticket.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound 42262851012132
```

**Resposta esperada:**
```
HTTP/2 200
{"ok":true,"tenant_id":1,"message_id":"test-new-ticket-...","action":"new_ticket"}
```

### Teste 2: Responder a Ticket Existente

```bash
bash test-mailgun-reply.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound acme 123
```

**Resposta esperada:**
```
HTTP/2 200
{"ok":true,"ticket_id":123,"message_id":"test-reply-..."}
```

### Teste 3: Local (dev)

```bash
# Subir servidores
php artisan serve --host=127.0.0.1 --port=8000
php artisan queue:work

# Em outra aba
bash test-mailgun-new-ticket.sh .env http://127.0.0.1:8000/api/webhooks/mailgun-inbound myslug
```

---

## Troubleshooting

### ❌ HTTP 401 - Invalid signature

**Causa:** Signing key incorreta ou ausente.

**Solução:**
1. Verifique se `MAILGUN_SIGNING_KEY` está configurado no `.env`
2. Confirme que a chave está correta no painel do Mailgun
3. Limpe o cache: `php artisan config:clear`

### ❌ HTTP 200 - `{"status":"ignored","reason":"no_tenant_match"}`

**Causa:** Tenant não encontrado.

**Solução:**
1. Verifique se o tenant existe e está ativo:
   ```bash
   php artisan tinker
   App\Models\Tenant::where('slug', 'acme')->first()
   ```
2. Confirme que `email_code` ou `slug` está configurado
3. Verifique os logs:
   ```bash
   tail -f storage/logs/laravel.log | grep "Inbound sem tenant"
   ```

### ❌ HTTP 200 - `{"status":"ignored","reason":"no_ticket_match"}`

**Causa:** E-mail não mapeou para nenhum ticket existente e não é para criação de novo ticket.

**Solução:**
1. Verifique se o recipient está no formato correto:
   - Novo ticket: `slug@tickets.fluxdesk.com.br`
   - Resposta: `reply+tkt.slug.123.hmac@tickets.fluxdesk.com.br`

### ❌ HTTP 200 - `{"status":"duplicate","message_id":"..."}`

**Causa:** E-mail já foi processado (idempotência).

**Solução:** Isso é **esperado** e correto. O sistema evita processar o mesmo e-mail duas vezes.

### 🔍 Verificar Logs

```bash
# Logs gerais
tail -f storage/logs/laravel.log

# Filtrar por Mailgun
tail -f storage/logs/laravel.log | grep -i mailgun

# Filtrar por tenant
tail -f storage/logs/laravel.log | grep "Tenant identificado"
```

### 🔧 Testar Signing Key

```bash
cd /home/thiago/Projetos/fludesk
php -r "require 'vendor/autoload.php'; \$app=require 'bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo 'SIGNING_KEY: ' . config('services.mailgun.signing_key') . PHP_EOL;"
```

---

## Configuração do Mailgun Routes

No painel do Mailgun, configure:

1. **Route 1: Criar novos tickets**
   - **Expression:** `match_recipient(".*@tickets.fluxdesk.com.br")`
   - **Actions:** `forward("https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound")`
   - **Priority:** 0

2. **Route 2: Catch-all (opcional)**
   - **Expression:** `catch_all()`
   - **Actions:** `forward("https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound")`
   - **Priority:** 100

---

## Segurança

✅ **Validação de assinatura obrigatória** (HMAC SHA256)  
✅ **Idempotência** via `Message-ID` (cache 48h)  
✅ **Rate limiting** via middleware  
✅ **Logs** de todas as tentativas  
✅ **Replay attack protection** (timestamp ± 5 minutos)

---

## Fluxo Completo

```
E-mail → Mailgun → Route → Webhook (valida assinatura)
                              ↓
                    MailgunInboundController
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
           Novo Ticket            Resposta Ticket
              (tenant)             (Reply-To HMAC)
                    ↓                   ↓
              EmailIngestJob      EmailIngestJob
                    ↓                   ↓
        EmailInboundService    EmailInboundService
                    ↓                   ↓
            Ticket criado         Reply adicionada
```

---

## Suporte

Para problemas, verifique:
1. Logs (`storage/logs/laravel.log`)
2. Fila (`php artisan queue:failed`)
3. Redis (`redis-cli monitor`)

Em caso de dúvidas, consulte a documentação do Mailgun:
- [Mailgun Routes](https://documentation.mailgun.com/en/latest/user_manual.html#routes)
- [Webhook Signing](https://documentation.mailgun.com/en/latest/user_manual.html#webhooks-1)

