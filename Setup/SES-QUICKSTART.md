# 🚀 Amazon SES - Quick Start

Guia rápido para configurar o Amazon SES em 5 minutos.

---

## ⚡ Configuração Rápida

### 1️⃣ Configure as Credenciais no `.env`

```bash
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@seudominio.com"
MAIL_FROM_NAME="Sistema de Chamados"

AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_DEFAULT_REGION=us-east-1
```

### 2️⃣ Verifique o E-mail Remetente no AWS SES

1. Acesse: https://console.aws.amazon.com/ses/
2. **Verified identities** → **Create identity**
3. Selecione **Email address**
4. Digite o e-mail do `MAIL_FROM_ADDRESS`
5. Verifique o e-mail recebido na caixa de entrada

### 3️⃣ Teste o Envio

```bash
php artisan mail:test-ses seu@email.com
```

**Se ver ✅ "E-mail de teste enviado com sucesso!"**, está tudo funcionando!

---

## 📋 Checklist Mínimo

- [ ] Credenciais AWS no `.env`
- [ ] E-mail remetente verificado no SES
- [ ] Comando de teste executado
- [ ] E-mail de teste recebido

---

## 🔥 Produção

### Sair do Sandbox (Necessário!)

No **Sandbox**, você só pode enviar para e-mails verificados.

**Para enviar para qualquer destinatário:**
1. AWS Console → **SES** → **Account dashboard**
2. **Request production access**
3. Preencha:
   - Mail type: **Transactional**
   - Use case: "Sistema de gerenciamento de chamados com notificações"
4. Aguarde aprovação (24-48h)

### Verificar Domínio Completo

1. SES → **Verified identities** → **Create identity**
2. Selecione **Domain**
3. Digite: `seudominio.com`
4. Configure os registros DNS fornecidos

---

## ⚠️ Problemas Comuns

| Erro | Solução |
|------|---------|
| "Email address is not verified" | Verifique o e-mail no SES |
| "InvalidClientTokenId" | Credenciais AWS incorretas no `.env` |
| "MessageRejected" | Destinatário não verificado (Sandbox) |
| "Not authorized to perform: ses:SendEmail" | Adicione permissão `AmazonSESFullAccess` no IAM |

---

## 📚 Documentação Completa

Para configuração detalhada, veja:
- **Guia completo:** `Setup/AMAZON-SES-CONFIG.md`
- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/

---

## 💰 Custos

- **Primeiros 62.000 e-mails/mês:** GRÁTIS (via EC2)
- **Sem EC2:** $0.10 por 1.000 e-mails
- **Muito mais barato que:** SendGrid, Mailgun, Postmark

---

## 🎯 Próximos Passos

1. ✅ Configure o SES (este guia)
2. 📧 Implemente notificações de tickets
3. 📊 Monitore métricas no AWS Console
4. 🔒 Configure SPF, DKIM e DMARC

---

**Tempo estimado:** 5-10 minutos ⏱️  
**Última atualização:** Outubro 2025
