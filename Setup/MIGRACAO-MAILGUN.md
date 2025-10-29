# 📧 Migração do Amazon SES para Mailgun

Guia completo para migrar do Amazon SES para o Mailgun no Fluxdesk.

---

## 🎯 Visão Geral

Esta migração substitui o Amazon SES pelo **Mailgun** para:
- ✉️ **Envio de e-mails** (notificações de tickets, respostas)
- 📨 **Recebimento de e-mails** (criar tickets via e-mail)

### ✅ O que foi alterado

1. ✅ **Pacote instalado:** `mailgun/mailgun-php` v4.3.5
2. ✅ **Configurações atualizadas:** `config/services.php`, `config/mail.php`
3. ✅ **Novo controller:** `MailgunInboundController` para webhooks
4. ✅ **Service adaptado:** `EmailInboundService` agora suporta Mailgun e SES
5. ✅ **Nova rota:** `/api/webhooks/mailgun-inbound`
6. ✅ **Rota SES mantida** para rollback se necessário

---

## 📋 Passo 1: Criar Conta no Mailgun

1. Acesse: https://www.mailgun.com/
2. Crie uma conta (plano gratuito: 5.000 e-mails/mês)
3. Verifique seu e-mail

---

## 🔧 Passo 2: Configurar Domínio no Mailgun

### 2.1. Adicionar Domínio de Envio

1. Acesse **Sending** → **Domains** → **Add New Domain**
2. Digite seu domínio: `seudominio.com.br`
3. Tipo: **EU (Europa)** ou **US (Estados Unidos)** - escolha a região mais próxima

### 2.2. Configurar DNS

O Mailgun fornecerá registros DNS para configurar. Adicione no seu provedor de DNS:

**Registros SPF/DKIM (para envio):**
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all

Type: TXT
Name: k1._domainkey
Value: [fornecido pelo Mailgun]

Type: CNAME
Name: email
Value: mailgun.org
```

**Registros MX (para recebimento):**
```
Type: MX
Priority: 10
Name: tickets
Value: mxa.mailgun.org

Type: MX
Priority: 10
Name: tickets
Value: mxb.mailgun.org
```

> ⚠️ **Importante:** Para receber e-mails em `tenant@tickets.fluxdesk.com.br`, configure o subdomínio `tickets.fluxdesk.com.br` como domínio separado no Mailgun.

### 2.3. Verificar Domínio

Aguarde a propagação DNS (pode levar até 48h) e clique em **Verify DNS Settings** no painel do Mailgun.

---

## 🔑 Passo 3: Obter Credenciais

### 3.1. API Key (para envio)

1. Acesse **Settings** → **API Keys**
2. Copie a **Private API key**
3. Guarde com segurança

### 3.2. Webhook Signing Key (para recebimento)

1. Acesse **Settings** → **Webhooks**
2. Copie o **HTTP webhook signing key**
3. Guarde com segurança

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

Edite seu arquivo `.env`:

```bash
# ===========================
# E-MAIL - MAILGUN
# ===========================
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@seudominio.com.br"
MAIL_FROM_NAME="Fluxdesk"

# Credenciais Mailgun
MAILGUN_DOMAIN=seudominio.com.br
MAILGUN_SECRET=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_ENDPOINT=api.mailgun.net

# Se você criou o domínio na região EU, use:
# MAILGUN_ENDPOINT=api.eu.mailgun.net

# Webhook Signing Key
# IMPORTANTE: Copie exatamente como aparece no painel do Mailgun
# Pode ou NÃO ter prefixo (depende de quando foi gerada)
# Exemplos válidos:
#   MAILGUN_WEBHOOK_SIGNING_KEY=4f574de5a76881e27f6d9b8c91e8347c
#   MAILGUN_WEBHOOK_SIGNING_KEY=key-1234567890abcdef1234567890abcdef
MAILGUN_WEBHOOK_SIGNING_KEY=sua-chave-aqui

# Domínio para recebimento de tickets
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br
```

### Limpar cache de configuração:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 🔗 Passo 5: Configurar Route no Mailgun (Recebimento)

Para receber e-mails e criar tickets automaticamente:

### 5.1. Criar Route

1. Acesse **Sending** → **Routes**
2. Clique em **Create Route**
3. Configure:

**Expression Type:** Match Recipient  
**Filter Expression:** 
```
match_recipient(".*@tickets.fluxdesk.com.br")
```

**Actions:**
- ✅ **Forward** → `https://seudominio.com/api/webhooks/mailgun-inbound`
- ✅ **Store** (opcional, para debug)
- ❌ **Stop** (desmarcar para permitir outras ações)

**Priority:** `0` (mais alta)  
**Description:** `Fluxdesk Inbound - Create Tickets`

4. Salve a route

### 5.2. Testar Webhook

O Mailgun enviará uma requisição POST para sua aplicação quando um e-mail for recebido.

**Formato do payload:**
```
POST /api/webhooks/mailgun-inbound
Content-Type: application/x-www-form-urlencoded

sender=cliente@exemplo.com
recipient=42262851012132@tickets.fluxdesk.com.br
subject=Preciso de ajuda
body-plain=Meu computador não liga...
body-html=<p>Meu computador não liga...</p>
Message-Id=<abc123@mailgun.org>
timestamp=1234567890
token=xyz789
signature=abc123def456...
```

---

## 🧪 Passo 6: Testar Envio de E-mails

### 6.1. Teste via Tinker

```bash
php artisan tinker
```

```php
Mail::raw('Teste de envio via Mailgun', function ($message) {
    $message->to('seu-email@exemplo.com')
            ->subject('Teste Mailgun');
});
```

Verifique o e-mail na caixa de entrada.

### 6.2. Logs do Mailgun

Acesse **Sending** → **Logs** para ver todos os e-mails enviados/recebidos.

---

## 📩 Passo 7: Testar Recebimento (Criar Ticket por E-mail)

1. Envie um e-mail para: `{tenant_id}@tickets.fluxdesk.com.br`
   - Ex: `42262851012132@tickets.fluxdesk.com.br`
2. Assunto: `Problema no sistema`
3. Corpo: `Não consigo acessar o painel`

### Verificar processamento:

```bash
# Ver logs da aplicação
php artisan pail

# Ver jobs na fila
php artisan queue:work --verbose

# Ver registros no banco
php artisan tinker
>>> \App\Models\TicketEmail::latest()->first();
>>> \App\Models\Ticket::latest()->first();
```

---

## 🔄 Passo 8: Rollback (Voltar para SES)

Se precisar voltar para o Amazon SES:

### 8.1. Atualizar `.env`

```bash
# Comentar Mailgun
# MAIL_MAILER=mailgun
# MAILGUN_DOMAIN=...
# MAILGUN_SECRET=...

# Descomentar SES
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-2
SES_REGION=us-east-2
```

### 8.2. Limpar cache

```bash
php artisan config:clear
php artisan cache:clear
```

### 8.3. Reconfigurar AWS SNS

Reative o webhook do SNS apontando para `/api/webhooks/ses-inbound`.

---

## 📊 Comparação: SES vs Mailgun

| Recurso | Amazon SES | Mailgun |
|---------|------------|---------|
| **Custo** | $0.10/1k enviados | $0.80/1k enviados (após free tier) |
| **Free Tier** | 62k/mês (EC2) | 5k/mês |
| **Envio** | ✅ | ✅ |
| **Recebimento** | ✅ SNS + S3 | ✅ Routes + Webhook |
| **Interface** | AWS Console | Dashboard próprio |
| **Logs** | CloudWatch | Dashboard próprio |
| **Validação** | Manual | Automática |
| **Suporte** | AWS Support | Mailgun Support |

---

## 🔒 Segurança

### Validação de Webhook

O `MailgunInboundController` valida automaticamente a assinatura HMAC SHA256 do webhook usando o `MAILGUN_WEBHOOK_SIGNING_KEY`.

**Como funciona:**
1. Mailgun envia: `timestamp`, `token`, `signature`
2. App calcula: `HMAC-SHA256(timestamp + token, signing_key)`
3. Compara com `signature` recebida
4. Rejeita se inválido ou timestamp > 5 minutos (previne replay attacks)

### IP Allowlist (opcional)

Você pode restringir o webhook apenas para IPs do Mailgun:

**IPs do Mailgun (US):**
```
69.72.32.0/24
69.72.33.0/24
69.72.34.0/24
69.72.35.0/24
69.72.36.0/24
```

Configure no seu firewall/nginx se necessário.

---

## 📝 Variáveis de Ambiente Completas

```bash
# Obrigatórias
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=seudominio.com.br
MAILGUN_SECRET=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Recomendadas
MAILGUN_ENDPOINT=api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@seudominio.com.br
MAIL_FROM_NAME=Fluxdesk
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br

# Opcionais (região EU)
# MAILGUN_ENDPOINT=api.eu.mailgun.net
```

---

## 🐛 Troubleshooting

### Erro: "Unauthorized - Invalid API Key"

✅ **Solução:** Verifique se `MAILGUN_SECRET` está correto e começa com `key-`.

### Erro: "Domain not found"

✅ **Solução:** Verifique se `MAILGUN_DOMAIN` está exatamente como no painel (sem `http://` ou trailing `/`).

### E-mails não chegam (envio)

1. ✅ Verifique os logs do Mailgun: **Sending** → **Logs**
2. ✅ Verifique o status do domínio: deve estar **Verified**
3. ✅ Verifique SPF/DKIM no DNS
4. ✅ Verifique se não caiu no spam

### E-mails não processam (recebimento)

1. ✅ Verifique se a Route está ativa
2. ✅ Verifique logs: `php artisan pail`
3. ✅ Verifique se o worker está rodando: `php artisan queue:work`
4. ✅ Teste o webhook manualmente com curl:

```bash
curl -X POST https://seudominio.com/api/webhooks/mailgun-inbound \
  -d "sender=teste@exemplo.com" \
  -d "recipient=123@tickets.fluxdesk.com.br" \
  -d "subject=Teste" \
  -d "body-plain=Testando..." \
  -d "Message-Id=<test@mailgun>" \
  -d "timestamp=$(date +%s)" \
  -d "token=abc123" \
  -d "signature=$(echo -n "$(date +%s)abc123" | openssl dgst -sha256 -hmac "your-signing-key" | awk '{print $2}')"
```

### Erro: "Invalid signature"

✅ **Solução:** Verifique se `MAILGUN_WEBHOOK_SIGNING_KEY` está correto. Obtenha em **Settings** → **Webhooks**.

---

## 📚 Referências

- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Mailgun API Reference](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview/)
- [Mailgun Routes](https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/)
- [Laravel Mail Documentation](https://laravel.com/docs/11.x/mail)

---

## ✅ Checklist de Migração

- [ ] Conta Mailgun criada
- [ ] Domínio adicionado e verificado
- [ ] DNS configurado (SPF, DKIM, MX)
- [ ] API Key obtida
- [ ] Webhook Signing Key obtida
- [ ] `.env` atualizado
- [ ] Config cache limpo
- [ ] Route criada no Mailgun
- [ ] Teste de envio realizado
- [ ] Teste de recebimento realizado
- [ ] Logs verificados
- [ ] Documentação atualizada para a equipe

---

## 🆘 Suporte

Se encontrar problemas:

1. ✅ Verifique os logs: `php artisan pail`
2. ✅ Verifique o Mailgun Dashboard: **Logs**
3. ✅ Consulte esta documentação
4. ✅ Contate o suporte do Mailgun: https://help.mailgun.com/

---

**Migração completa! 🎉**

Se precisar de ajuda, consulte a [documentação do Mailgun](https://documentation.mailgun.com/) ou os logs da aplicação.

