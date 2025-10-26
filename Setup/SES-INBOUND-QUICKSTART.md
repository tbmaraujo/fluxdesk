# 🚀 SES Inbound - Quick Start

Guia rápido para configurar recebimento de e-mails e criação automática de tickets.

---

## ⚡ Configuração em 10 Minutos

### 1️⃣ Verificar Domínio no SES

1. AWS Console → **SES** → **Verified identities** → **Create identity**
2. Tipo: **Domain**
3. Domínio: `tickets.fluxdesk.com.br`
4. Configure DNS:
   ```
   MX (Priority 10): inbound-smtp.us-east-1.amazonaws.com
   TXT: [valor do SES para verificação]
   3x CNAME: [registros DKIM do SES]
   ```

### 2️⃣ Criar Bucket S3

1. AWS Console → **S3** → **Create bucket**
2. Nome: `sincro8-tickets-emails-inbound`
3. Região: `us-east-1`
4. Adicionar Policy:
   ```json
   {
     "Statement": [{
       "Effect": "Allow",
       "Principal": {"Service": "ses.amazonaws.com"},
       "Action": "s3:PutObject",
       "Resource": "arn:aws:s3:::sincro8-tickets-emails-inbound/*"
     }]
   }
   ```

### 3️⃣ Criar SNS Topic e Subscription

1. AWS Console → **SNS** → **Create topic**
2. Nome: `SES-Inbound-Email-Notifications`
3. **Create subscription:**
   - Protocol: **HTTPS**
   - Endpoint: `https://seu-dominio.com/api/webhooks/ses/inbound`

### 4️⃣ Criar Rule Set no SES

1. SES → **Email receiving** → **Rule sets** → **Create rule set**
2. Nome: `InboundEmailRules`
3. **Set as active**
4. **Create rule:**
   - Nome: `ProcessTicketEmails`
   - Recipient: `tickets.fluxdesk.com.br` (domínio)
   - Actions:
     1. **S3:** bucket `sincro8-tickets-emails-inbound`
     2. **SNS:** topic `SES-Inbound-Email-Notifications`

### 5️⃣ Configurar `.env`

```bash
# Gerar secret
openssl rand -base64 32

# Adicionar ao .env
SES_WEBHOOK_SECRET=seu-secret-gerado-aqui
AWS_SES_S3_BUCKET=sincro8-tickets-emails-inbound
```

### 6️⃣ Testar

**Criar novo ticket:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Teste de ticket
Corpo: Criando ticket via e-mail
```

**Adicionar resposta:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Teste de ticket
Corpo: Esta é uma resposta
```

---

## 📋 Checklist Rápido

- [ ] Domínio verificado no SES
- [ ] DNS configurado (MX + DKIM)
- [ ] Bucket S3 criado com policy
- [ ] SNS Topic + Subscription criados
- [ ] Rule Set ativo no SES
- [ ] `.env` configurado
- [ ] Teste de criação OK
- [ ] Teste de resposta OK

---

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| E-mail não chega | Verificar DNS MX e Rule Set ativo |
| Subscription pending | Aguardar confirmação automática nos logs |
| 401 Unauthorized | Verificar `SES_WEBHOOK_SECRET` |
| Tenant não encontrado | E-mail enviado para tenant_id incorreto |

---

## 📊 Formato de E-mail

**Novo Ticket:**
- Para: `{tenant_id}@tickets.fluxdesk.com.br`
- Assunto: Qualquer texto (sem `[TKT-XXX]`)

**Resposta:**
- Para: `{tenant_id}@tickets.fluxdesk.com.br`
- Assunto: Deve conter `[TKT-XXX]`

---

## 📚 Documentação Completa

Para configuração detalhada, veja:
- **Guia completo:** `Setup/SES-INBOUND-CONFIG.md`
- **AWS SES Docs:** https://docs.aws.amazon.com/ses/

---

**Tempo estimado:** 10-15 minutos ⏱️  
**Última atualização:** Outubro 2025
