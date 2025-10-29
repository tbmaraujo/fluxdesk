# 🔐 Sistema de Reply-To com HMAC - Fluxdesk

## 📋 Visão Geral

Sistema seguro de identificação de respostas de tickets via e-mail usando HMAC (Hash-based Message Authentication Code) no endereço Reply-To.

### Benefícios:
- ✅ **Seguro**: HMAC impede falsificação de respostas
- ✅ **Idempotente**: Message-ID previne duplicatas
- ✅ **Sem loops**: Respostas diretas não geram notificações
- ✅ **Fallback robusto**: 3 métodos de identificação

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env`:

```env
# Reply-To HMAC (gere uma string aleatória forte)
REPLY_HMAC_SECRET=sua-string-secreta-muito-forte-aqui
MAIL_REPLY_DOMAIN=tickets.fluxdesk.com.br

# Mailgun (já existentes)
MAILGUN_DOMAIN=tickets.fluxdesk.com.br
MAILGUN_SECRET=key-xxxxx
MAILGUN_WEBHOOK_SIGNING_KEY=whsec_xxxxx
```

**Gerar REPLY_HMAC_SECRET:**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 2. Migrar Banco de Dados

```bash
php artisan migrate
```

**Migrações criadas:**
- `ticket_notifications` - Registra e-mails enviados para threading
- `replies.external_message_id` - Idempotência de respostas

---

## 📧 Formato do Reply-To

### Estrutura

```
reply+tkt.{tenantSlug}.{ticketId}.{hmac}@tickets.fluxdesk.com.br
```

### Exemplo Real

Ticket #47 do tenant "sincro8":
```
reply+tkt.sincro8.47.a1b2c3d4e5@tickets.fluxdesk.com.br
```

### Componentes

- **tenantSlug**: slug do tenant (ex: "sincro8")
- **ticketId**: ID do ticket (ex: 47)
- **hmac**: 10 caracteres do hash HMAC SHA256

### Cálculo do HMAC

```php
$secret = config('services.reply.hmac_secret');
$data = "{$slug}|{$ticketId}"; // Ex: "sincro8|47"
$fullHash = hash_hmac('sha256', $data, $secret);
$hmac = substr($fullHash, 10, 10); // Caracteres 11-20
```

---

## 🔄 Fluxo de Funcionamento

### Envio de Notificação

1. Sistema cria/atualiza ticket
2. Envia e-mail para cliente
3. **Reply-To**: `reply+tkt.{slug}.{id}.{hmac}@domain`
4. Registra em `ticket_notifications`:
   - message_id (do e-mail enviado)
   - reply_to
   - tenant_slug
   - ticket_id

### Cliente Responde

1. Cliente clica em "Responder"
2. E-mail vai para: `reply+tkt.sincro8.47.abc123@tickets.fluxdesk.com.br`
3. Mailgun recebe e encaminha para webhook

### Processamento da Resposta

**Prioridade de Identificação:**

#### 1️⃣ Reply-To com HMAC (Prioritário)

```
reply+tkt.sincro8.47.abc123@tickets.fluxdesk.com.br
```

- Extrai: slug=sincro8, ticketId=47, hmac=abc123
- Valida HMAC com secret
- ✅ Se válido: processa diretamente
- ❌ Se inválido: tenta próximo método

#### 2️⃣ Threading Headers (Fallback)

```
In-Reply-To: <abc123@mail.gmail.com>
References: <xyz789@tickets.fluxdesk.com.br> <abc123@mail.gmail.com>
```

- Busca em `ticket_notifications.message_id`
- Se encontrar: usa ticket_id associado

#### 3️⃣ Subject com [TKT-ID] (Último Recurso)

```
Re: [TKT-47] Computador não funciona
```

- Extrai ID do padrão `[TKT-(\d+)]`
- Busca ticket no banco

#### ❌ Nenhum Método Funcionou

- Retorna HTTP 200 com `{status: 'ignored'}`
- Log warning para investigação

---

## 🔐 Segurança

### Validação de Assinatura Mailgun

Middleware `VerifyMailgunSignature` valida:

1. **Timestamp**: Máximo 5 minutos de diferença
2. **Token**: Token único do Mailgun
3. **Signature**: HMAC SHA256 do timestamp+token

```php
$expected = hash_hmac('sha256', $timestamp . $token, $signingKey);
if (!hash_equals($expected, $signature)) {
    return 401;
}
```

### HMAC do Reply-To

- **Secret forte**: 32+ bytes aleatórios
- **Hash SHA256**: Seguro contra colisão
- **Parte do hash**: Usa apenas caracteres 11-20
- **Validação constante**: `hash_equals()` previne timing attacks

### Idempotência

- **Cache**: Message-ID em cache Redis (48h)
- **Banco**: `external_message_id` único em replies
- **Resposta**: Sempre 200 (mesmo duplicatas)

---

## 🚀 Configurar Mailgun Route

### No Painel Mailgun

1. Acesse: **Sending** → **Routes**
2. Clique em: **Create Route**

### Configuração

**Expression Type:** `Match Recipient`

**Recipient:**
```regex
.*@tickets\.fluxdesk\.com\.br
```

**Actions:**
```
☑ Forward: https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound
☑ Stop (importante - previne processamento adicional)
```

**Priority:** `0` (mais alta)

**Description:** `Fluxdesk Inbound - Tickets e Respostas`

### ⚠️ Importante

- **NÃO habilite Webhooks (Events)** para o mesmo endpoint
- Use **apenas Routes** para evitar duplicação
- **Stop action** é essencial para não processar múltiplas vezes

---

## 🧪 Testes

### 1. Teste de Envio (Reply-To)

```bash
php artisan tinker
```

```php
// Criar ticket de teste
$ticket = \App\Models\Ticket::find(1);

// Enviar notificação
\Illuminate\Support\Facades\Mail::to('seu-email@gmail.com')
    ->send(new \App\Mail\TicketCreatedNotification($ticket));

echo "Verifique o Reply-To no e-mail recebido\n";
```

**Resultado esperado:**
- E-mail recebido com Reply-To: `reply+tkt.{slug}.{id}.{hmac}@tickets.fluxdesk.com.br`

### 2. Teste de Resposta (Via curl)

```bash
curl -X POST https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound \
  -F "sender=cliente@example.com" \
  -F "recipient=reply+tkt.sincro8.47.abc123def4@tickets.fluxdesk.com.br" \
  -F "subject=Re: [TKT-47] Teste" \
  -F "body-plain=Minha resposta ao ticket" \
  -F "stripped-text=Minha resposta ao ticket" \
  -F "Message-Id=<unique-test-$(date +%s)@example.com>" \
  -F "timestamp=$(date +%s)" \
  -F "token=test-token-$(date +%s)" \
  -F "signature=test-signature"
```

**Nota:** Precisa da assinatura válida do Mailgun em produção.

### 3. Teste Real

1. Criar ticket no sistema
2. Sistema envia notificação para seu e-mail
3. Clicar em "Responder" no cliente de e-mail
4. Escrever resposta e enviar
5. Verificar no painel se a resposta apareceu

### 4. Teste de Idempotência

Enviar o mesmo Message-ID duas vezes:

```bash
# Primeira vez - processa
curl -X POST ... -F "Message-Id=<test-123@example.com>"

# Segunda vez - ignora (duplicate)
curl -X POST ... -F "Message-Id=<test-123@example.com>"
```

**Resultado esperado:**
- Primeira: `{ok: true}`
- Segunda: `{status: 'duplicate'}`

### 5. Teste de Threading

```bash
# Buscar notification
php artisan tinker
$notification = \App\Models\TicketNotification::latest()->first();
echo "Message-ID: {$notification->message_id}\n";

# Responder usando In-Reply-To
curl -X POST ... \
  -F "In-Reply-To=<{$notification->message_id}>"
```

---

## 📊 Monitoramento

### Logs

```bash
tail -f storage/logs/laravel.log | grep -i "reply\|hmac\|inbound"
```

**Logs importantes:**

```
[INFO] Ticket identificado por Reply-To HMAC
[INFO] Resposta direta processada via Reply-To HMAC
[INFO] Ticket identificado por threading headers
[INFO] Ticket identificado por subject
[WARNING] HMAC inválido no Reply-To
[WARNING] Inbound sem mapeamento de ticket
```

### Queries Úteis

```bash
php artisan tinker
```

```php
// Notificações recentes
\App\Models\TicketNotification::orderBy('sent_at', 'desc')->take(10)->get();

// Respostas via e-mail
\App\Models\Reply::whereNotNull('external_message_id')
    ->orderBy('created_at', 'desc')
    ->take(10)
    ->get(['id', 'ticket_id', 'external_message_id', 'created_at']);

// Verificar duplicatas (cache)
\Illuminate\Support\Facades\Cache::get('mg:msg:' . sha1('message-id'));
```

---

## 🐛 Troubleshooting

### ❌ Reply-To não tem HMAC

**Causa:** `REPLY_HMAC_SECRET` não configurado

**Solução:**
```bash
# Gerar secret
php -r "echo bin2hex(random_bytes(32));"

# Adicionar ao .env
echo "REPLY_HMAC_SECRET=valor-gerado" >> .env

# Recarregar config
php artisan config:clear
php artisan config:cache
```

### ❌ HMAC inválido

**Causas possíveis:**
1. Secret diferente entre envio e validação
2. Formato do Reply-To alterado manualmente
3. Ticket/tenant alterado após envio

**Verificar:**
```php
$ticket = \App\Models\Ticket::find(47);
$slug = $ticket->tenant->slug;
$secret = config('services.reply.hmac_secret');
$hmac = substr(hash_hmac('sha256', "{$slug}|47", $secret), 10, 10);
echo "HMAC esperado: {$hmac}\n";
```

### ❌ Respostas não aparecem

**Verificar:**

1. **Workers ativos?**
   ```bash
   sudo supervisorctl status fluxdesk-worker:*
   ```

2. **Job falhou?**
   ```bash
   php artisan queue:failed
   ```

3. **Logs de erro?**
   ```bash
   tail -n 100 storage/logs/laravel.log
   ```

### ❌ Duplicatas mesmo com idempotência

**Causas:**
1. Redis não funcionando (cache voltou para file)
2. Message-ID vazio/diferente

**Verificar:**
```bash
redis-cli ping  # Deve retornar PONG
php artisan tinker
config('cache.default');  # Deve ser 'redis'
```

### ❌ Loops de notificação

**Causa:** `processDirectReply()` está enviando notificações

**Solução:** O método já está configurado para NÃO enviar. Verifique customizações.

---

## 📈 Estatísticas

### Eficácia dos Métodos

```php
// Ver quantas respostas foram identificadas por cada método
$logs = \Illuminate\Support\Facades\DB::table('replies')
    ->whereNotNull('external_message_id')
    ->count();

echo "Total de respostas via e-mail: {$logs}\n";
```

### Taxa de Sucesso

```php
// Notificações enviadas vs respostas recebidas
$sent = \App\Models\TicketNotification::count();
$replied = \App\Models\Reply::whereNotNull('external_message_id')->count();
$rate = $replied > 0 ? round(($replied / $sent) * 100, 2) : 0;

echo "Notificações: {$sent}\n";
echo "Respostas: {$replied}\n";
echo "Taxa de resposta: {$rate}%\n";
```

---

## 🔄 Migração Gradual

Se você já tem o sistema em produção:

1. ✅ Deploy do código novo
2. ✅ Configurar `REPLY_HMAC_SECRET`
3. ✅ Rodar migrations
4. ✅ Novos e-mails usarão Reply-To com HMAC
5. ✅ E-mails antigos continuam funcionando (fallback)

**Não há breaking changes!** O sistema mantém compatibilidade com os métodos antigos.

---

## 📚 Referências

- [Mailgun Routes Documentation](https://documentation.mailgun.com/en/latest/api-routes.html)
- [Mailgun Webhooks Signature](https://documentation.mailgun.com/en/latest/api-webhooks.html#webhook-signature-verification)
- [RFC 2822 - Message Format](https://tools.ietf.org/html/rfc2822)
- [HMAC RFC 2104](https://tools.ietf.org/html/rfc2104)

---

**Data de Implementação:** 29/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Production Ready

