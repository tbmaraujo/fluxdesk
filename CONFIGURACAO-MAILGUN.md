# 📧 Configuração do Mailgun - Fluxdesk

## 🎯 Visão Geral

O Fluxdesk usa **Mailgun** para:
- **Enviar** notificações de tickets criados
- **Receber** e-mails e criar tickets automaticamente

---

## 🔧 Configurações Obrigatórias no .env

### 1. Configurações de E-mail

```env
# Mail - Mailgun
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@tickets.fluxdesk.com.br"
MAIL_FROM_NAME="Fluxdesk"
```

**Importante:**
- `MAIL_FROM_ADDRESS` deve ser do domínio verificado no Mailgun
- Este é o e-mail que aparece como remetente nas notificações

---

### 2. Credenciais do Mailgun

```env
# Mailgun
MAILGUN_DOMAIN=tickets.fluxdesk.com.br
MAILGUN_SECRET=sua-api-key-aqui
MAILGUN_ENDPOINT=api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=sua-signing-key-aqui
```

**Onde encontrar:**

#### MAILGUN_DOMAIN
- Painel Mailgun → **Sending** → **Domains**
- Use o domínio verificado (ex: `tickets.fluxdesk.com.br`)

#### MAILGUN_SECRET
- Painel Mailgun → **Sending** → **Domain Settings** → **API Keys**
- Copie a **Private API key**

#### MAILGUN_WEBHOOK_SIGNING_KEY
- Painel Mailgun → **Sending** → **Webhooks**
- Copie a **HTTP webhook signing key**

---

## 📨 Como Funciona o Fluxo de E-mails

### Envio de Notificações (Outbound)

1. Cliente envia e-mail para: `1@tickets.fluxdesk.com.br`
2. Sistema cria ticket #47 no Tenant ID 1
3. Sistema envia notificação:
   - **De:** `noreply@tickets.fluxdesk.com.br`
   - **Para:** E-mail do cliente
   - **Assunto:** `[TKT-47] Título do ticket`
   - **Reply-To:** `1@tickets.fluxdesk.com.br` (para manter conversa no mesmo ticket)

### Recebimento de E-mails (Inbound)

1. Cliente envia e-mail para: `{TENANT_ID}@tickets.fluxdesk.com.br`
2. Mailgun recebe e encaminha para: `https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound`
3. Sistema identifica o tenant pelo ID no e-mail
4. Cria ticket ou adiciona resposta

**Formato do e-mail:**
- `1@tickets.fluxdesk.com.br` → Tenant ID 1
- `2@tickets.fluxdesk.com.br` → Tenant ID 2
- `1234@tickets.fluxdesk.com.br` → Tenant ID 1234

---

## 🔐 Configurar Route no Mailgun

### Passo 1: Acessar Mailgun
1. Entre em: https://app.mailgun.com
2. Vá em: **Sending** → **Routes**
3. Clique em: **Create Route**

### Passo 2: Configurar Route

**Expression Type:** `Match Recipient`

**Recipient:** Use uma das opções:

**Opção A: Capturar todos os e-mails do domínio** (recomendado)
```
.*@tickets\.fluxdesk\.com\.br
```

**Opção B: Capturar apenas IDs numéricos**
```
\d+@tickets\.fluxdesk\.com\.br
```

**Actions:**
```
☑ Forward to URL: https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound
☑ Store message (opcional - para debug)
```

**Priority:** `0` (mais alta)

**Description:** `Fluxdesk Inbound - Criar Tickets`

### Passo 3: Salvar e Testar

Clique em **Create Route**

---

## ✅ Verificar Configuração

### No Servidor

```bash
# Ver configurações atuais
cd /var/www/fluxdesk/current
php artisan tinker
```

```php
// Verificar configuração de e-mail
echo "Mailer: " . config('mail.default') . "\n";
echo "From: " . config('mail.from.address') . "\n";
echo "Mailgun Domain: " . config('services.mailgun.domain') . "\n";
echo "Mailgun Endpoint: " . config('services.mailgun.endpoint') . "\n";
```

---

## 🧪 Testar Envio de E-mail

```bash
php artisan tinker
```

```php
// Enviar e-mail de teste
\Illuminate\Support\Facades\Mail::raw('Teste de e-mail do Fluxdesk', function($message) {
    $message->to('seu-email@gmail.com')
            ->subject('Teste Mailgun - Fluxdesk');
});

echo "E-mail enviado! Verifique sua caixa de entrada.\n";
```

---

## 🧪 Testar Recebimento de E-mail

### Teste 1: Via Mailgun Test

1. Acesse: **Sending** → **Routes** → Sua route → **Test**
2. Preencha:
   ```
   To: 1@tickets.fluxdesk.com.br
   From: teste@example.com
   Subject: Teste de ticket
   Body: Corpo do teste
   ```
3. Clique em **Send Test**

### Teste 2: E-mail Real

Envie um e-mail do seu Gmail/Outlook:
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Meu primeiro ticket via e-mail
Corpo: Teste de criação de ticket
```

---

## 📊 Monitorar Logs

### Logs do Mailgun

Painel Mailgun → **Monitoring** → **Logs**

Filtre por:
- **Recipient:** `1@tickets.fluxdesk.com.br`
- **Status:** Delivered / Failed

### Logs do Laravel

```bash
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log | grep -i "mailgun\|email\|ticket"
```

**Logs esperados (sucesso):**
```
[INFO] Mailgun inbound recebido
[INFO] Tenant identificado por ID numérico (identifier: 1)
[INFO] Ticket criado a partir de e-mail (ticket_id: 47)
[INFO] Email ingerido e processado com sucesso
[INFO] Tentando enviar notificação de ticket criado
[INFO] Notificação de ticket criado enfileirada
```

---

## 🐛 Troubleshooting

### ❌ Erro: "MailgunTransportFactory not found"

**Causa:** Dependências do Mailgun não instaladas

**Solução:**
```bash
cd /var/www/fluxdesk/current
composer install --no-dev --optimize-autoloader
sudo supervisorctl restart fluxdesk-worker:*
```

### ❌ E-mail não chega

**Verificar:**
1. **Domínio verificado no Mailgun?**
   - Sending → Domains → Status deve estar "Active"
   
2. **DNS configurado?**
   - SPF, DKIM, CNAME devem estar corretos
   
3. **Route ativa?**
   - Sending → Routes → Deve ter priority 0 e estar ativa

4. **Logs do Mailgun:**
   - Monitoring → Logs → Ver se há erros

### ❌ Webhook não funciona

**Verificar:**
1. **URL acessível?**
   ```bash
   curl -X POST https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound \
     -F "sender=test@example.com" \
     -F "recipient=1@tickets.fluxdesk.com.br"
   ```

2. **Signing key correta?**
   - Verificar `MAILGUN_WEBHOOK_SIGNING_KEY` no `.env`

3. **Workers ativos?**
   ```bash
   sudo supervisorctl status fluxdesk-worker:*
   ```

### ❌ Reply-To com ID errado

**Causa:** Ticket criado no tenant errado

**Verificar:**
```bash
php artisan tinker
$ticket = \App\Models\Ticket::find(47);
echo "Tenant ID: {$ticket->tenant_id}\n";
echo "Reply-To: {$ticket->tenant_id}@tickets.fluxdesk.com.br\n";
```

Se o `tenant_id` estiver errado, verifique para qual e-mail o cliente enviou.

---

## 📋 Checklist de Configuração

### No Mailgun:
- [ ] Domínio `tickets.fluxdesk.com.br` verificado
- [ ] DNS (SPF, DKIM, CNAME) configurados
- [ ] Route criada com regex `.*@tickets\.fluxdesk\.com\.br`
- [ ] Forward URL: `https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound`
- [ ] Webhook signing key copiada

### No Servidor (.env):
- [ ] `MAIL_MAILER=mailgun`
- [ ] `MAIL_FROM_ADDRESS="noreply@tickets.fluxdesk.com.br"`
- [ ] `MAILGUN_DOMAIN=tickets.fluxdesk.com.br`
- [ ] `MAILGUN_SECRET=sua-api-key`
- [ ] `MAILGUN_WEBHOOK_SIGNING_KEY=sua-signing-key`

### No Servidor (Comandos):
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] `php artisan config:clear`
- [ ] `php artisan config:cache`
- [ ] `sudo supervisorctl restart fluxdesk-worker:*`

### Testes:
- [ ] Envio de e-mail de notificação funciona
- [ ] Recebimento de e-mail cria ticket
- [ ] Reply-To está correto (ID do tenant)
- [ ] Sem erros nos logs

---

## 📞 Suporte

Se os problemas persistirem:

1. **Logs completos:**
   ```bash
   tail -n 200 storage/logs/laravel.log
   ```

2. **Testar manualmente:**
   ```bash
   php artisan tinker
   \App\Models\Tenant::all(['id', 'name']);
   \App\Models\TenantEmailAddress::all(['id', 'tenant_id', 'email']);
   ```

3. **Verificar versão das dependências:**
   ```bash
   composer show symfony/mailgun-mailer
   composer show mailgun/mailgun-php
   ```

---

**Última atualização:** 29/10/2025

