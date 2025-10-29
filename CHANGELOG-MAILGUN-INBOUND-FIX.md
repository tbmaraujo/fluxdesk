# Changelog: Correção do Sistema Mailgun Inbound

**Data:** 29/10/2025  
**Issue:** E-mails inbound não criam tickets novos (HTTP 200 `no_ticket_match`)

---

## 🎯 Objetivo

Permitir que e-mails enviados para `identificador@tickets.fluxdesk.com.br` criem **novos tickets** automaticamente, identificando o tenant pelo local-part (slug, email_code ou ID).

---

## ✅ Alterações Implementadas

### 1. **Config: Signing Key com Fallback** (`config/services.php`)

**Motivo:** A chave de assinatura do webhook estava usando apenas `MAILGUN_WEBHOOK_SIGNING_KEY`, mas a variável recomendada é `MAILGUN_SIGNING_KEY`.

**Alteração:**
```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
    // Webhook signing key (ordem: SIGNING_KEY -> WEBHOOK_SIGNING_KEY -> SECRET como fallback)
    'signing_key' => env('MAILGUN_SIGNING_KEY', env('MAILGUN_WEBHOOK_SIGNING_KEY', env('MAILGUN_SECRET'))),
    // Manter retrocompatibilidade
    'webhook_signing_key' => env('MAILGUN_WEBHOOK_SIGNING_KEY'),
],
```

**Benefício:** Ordem de prioridade clara e fallback automático.

---

### 2. **Middleware: Usar `signing_key`** (`app/Http/Middleware/VerifyMailgunSignature.php`)

**Motivo:** Atualizar o middleware para usar a nova configuração `signing_key`.

**Alteração:**
```php
// Preferir signing_key (com fallback) ao invés de webhook_signing_key
$signingKey = config('services.mailgun.signing_key') ?: config('services.mailgun.webhook_signing_key');
```

**Benefício:** Consistência com a configuração.

---

### 3. **Migration: Adicionar `email_code` aos Tenants** (`2025_10_29_161336_add_email_code_to_tenants_table.php`)

**Motivo:** Permitir que cada tenant tenha um código único para receber e-mails (além do slug).

**Alteração:**
```php
Schema::table('tenants', function (Blueprint $table) {
    $table->string('email_code')->nullable()->unique()->after('slug');
});
```

**Exemplo de uso:**
- Tenant com `email_code = '42262851012132'` recebe e-mails em `42262851012132@tickets.fluxdesk.com.br`

---

### 4. **Model: Adicionar `email_code` ao Fillable** (`app/Models/Tenant.php`)

**Motivo:** Permitir mass assignment do campo `email_code`.

**Alteração:**
```php
protected $fillable = [
    'name',
    'cnpj',
    'slug',
    'email_code',  // ← novo
    'domain',
    'data',
    'is_active',
];
```

---

### 5. **Controller: Mapear Tenant e Criar Novos Tickets** (`app/Http/Controllers/Api/MailgunInboundController.php`)

**Motivo:** O controller só tratava **respostas** a tickets existentes. Agora também cria **novos tickets**.

**Alterações principais:**

#### a) Novo método de identificação (prioridade 0)

```php
// 0. Tentativa: Novo ticket por local-part@tickets.fluxdesk.com.br
$tenant = $this->extractTenantFromRecipient($request);
if ($tenant) {
    return $this->queueNewTicket($tenant, $request);
}
```

#### b) Método `extractTenantFromRecipient()`

Extrai o `local-part` do recipient e busca tenant por:
1. `slug` = local-part
2. `email_code` = local-part
3. `id` = local-part (se for numérico)

**Suporta múltiplas fontes:**
- Campo `recipient`
- Campo `to`
- Header `To` dentro de `message-headers` (JSON)

#### c) Método `queueNewTicket()`

Enfileira a criação do ticket via `EmailIngestJob` com:
- `ticketId = null` (indica novo ticket)
- `tenantSlug = tenant.slug`
- Idempotência via `Message-ID`

**Benefício:** Suporte completo a criação de tickets por e-mail.

---

### 6. **Scripts de Teste**

#### a) `test-mailgun-new-ticket.sh`

Testa a criação de um **novo ticket**.

**Uso:**
```bash
bash test-mailgun-new-ticket.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound 42262851012132
```

**Resposta esperada:**
```json
{"ok":true,"tenant_id":1,"message_id":"test-new-ticket-...","action":"new_ticket"}
```

#### b) `test-mailgun-reply.sh`

Testa a **resposta** a um ticket existente (Reply-To HMAC).

**Uso:**
```bash
bash test-mailgun-reply.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound acme 123
```

**Resposta esperada:**
```json
{"ok":true,"ticket_id":123,"message_id":"test-reply-..."}
```

---

### 7. **Documentação** (`MAILGUN-INBOUND-README.md`)

Guia completo com:
- Variáveis de ambiente
- Como funciona (fluxo completo)
- Configuração do tenant
- Testes manuais
- Troubleshooting

---

## 🔧 Como Usar

### 1. Rodar a Migration

```bash
php artisan migrate
```

### 2. Configurar Tenant

**Opção A: Via Tinker**
```bash
php artisan tinker

$tenant = App\Models\Tenant::find(1);
$tenant->email_code = '42262851012132';
$tenant->save();
```

**Opção B: Via Seeder/Migration**
```php
use App\Models\Tenant;

Tenant::create([
    'name' => 'Acme Corp',
    'slug' => 'acme',
    'email_code' => '42262851012132',  // opcional
    'domain' => 'acme.fluxdesk.com.br',
    'is_active' => true,
]);
```

### 3. Configurar `.env`

```env
# Preferencial
MAILGUN_SIGNING_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OU (alternativa)
MAILGUN_WEBHOOK_SIGNING_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Secret para Reply-To HMAC
REPLY_HMAC_SECRET=algum-secret-longo-e-aleatorio-aqui
```

### 4. Testar

**Local:**
```bash
# Terminal 1
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2
php artisan queue:work

# Terminal 3
bash test-mailgun-new-ticket.sh .env http://127.0.0.1:8000/api/webhooks/mailgun-inbound acme
```

**Produção:**
```bash
bash test-mailgun-new-ticket.sh /var/www/fluxdesk/current/.env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound 42262851012132
```

---

## 🎉 Resultados Esperados

### Antes (problema)

```bash
$ bash test-mailgun-inbound3.sh ...
HTTP/2 200
{"status":"ignored","reason":"no_ticket_match"}
```

### Depois (corrigido)

```bash
$ bash test-mailgun-new-ticket.sh ...
HTTP/2 200
{"ok":true,"tenant_id":1,"message_id":"test-new-ticket-1234567890","action":"new_ticket"}
```

---

## 📝 Arquivos Alterados

```
config/services.php                                          (modificado)
app/Http/Middleware/VerifyMailgunSignature.php              (modificado)
database/migrations/2025_10_29_161336_add_email_code_...php  (criado)
app/Models/Tenant.php                                        (modificado)
app/Http/Controllers/Api/MailgunInboundController.php       (modificado)
test-mailgun-new-ticket.sh                                   (criado)
test-mailgun-reply.sh                                        (criado)
MAILGUN-INBOUND-README.md                                    (criado)
CHANGELOG-MAILGUN-INBOUND-FIX.md                             (criado)
```

---

## ⚠️ Notas Importantes

1. **Não quebra a lógica existente:** Respostas via Reply-To HMAC, threading e subject continuam funcionando.
2. **Idempotência garantida:** `Message-ID` é usado para evitar duplicatas (cache de 48h).
3. **Segurança:** Validação de assinatura HMAC SHA256 obrigatória.
4. **Logs claros:** Todas as tentativas são logadas com contexto completo.
5. **PSR-12 compliant:** Código formatado conforme padrões do projeto.

---

## 🚀 Deploy

```bash
# Pull do código
git pull origin main

# Instalar dependências
composer install --no-dev --optimize-autoloader

# Rodar migrations
php artisan migrate --force

# Limpar cache
php artisan config:clear
php artisan route:clear

# Reiniciar workers
sudo systemctl restart fluxdesk-queue
```

---

## 📊 Próximos Passos (Opcional)

1. **UI para gerenciar `email_code`** dos tenants
2. **Webhook de fallback** para e-mails não mapeados (notificar admin)
3. **Metrics/Dashboard** de e-mails recebidos por tenant
4. **Auto-assign** de tickets criados por e-mail para grupo padrão

---

**Autor:** Cursor AI  
**Revisão:** Thiago  
**Status:** ✅ Completo

