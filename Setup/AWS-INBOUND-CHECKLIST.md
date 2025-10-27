# ☑️ Checklist de Configuração AWS para E-mail Inbound

Siga este guia passo a passo para configurar o recebimento de e-mails no Fluxdesk.

---

## 📋 Pré-requisitos

- [ ] Acesso ao AWS Console
- [ ] Domínio configurado (ex: `tickets.fluxdesk.com.br`)
- [ ] Acesso ao DNS do domínio
- [ ] Application rodando e acessível via HTTPS

---

## 1️⃣ Criar Bucket S3

**Tempo estimado:** 3 minutos

### Passos:

1. [ ] Acesse [AWS S3 Console](https://console.aws.amazon.com/s3)
2. [ ] Clique em **"Create bucket"**
3. [ ] Configure:
   - **Bucket name:** `fluxdesk-emails-inbound`
   - **AWS Region:** `us-east-2` (Ohio) - mesma região do SES
   - **Block Public Access:** DESMARQUE todas as opções
   - **Bucket Versioning:** Disabled
   - **Encryption:** Amazon S3 managed keys (SSE-S3)
4. [ ] Clique em **"Create bucket"**
5. [ ] Acesse o bucket criado → **Permissions** → **Bucket Policy**
6. [ ] Cole esta policy (substitua `SEU_AWS_ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::fluxdesk-emails-inbound/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "SEU_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

7. [ ] Clique em **"Save changes"**

**✓ Verificação:**
```bash
aws s3 ls s3://fluxdesk-emails-inbound
```

---

## 2️⃣ Verificar Domínio no SES

**Tempo estimado:** 5 minutos (+ tempo de propagação DNS)

### Passos:

1. [ ] Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. [ ] **Certifique-se** de estar na região **us-east-2** (Ohio)
3. [ ] No menu lateral, clique em **"Verified identities"**
4. [ ] Clique em **"Create identity"**
5. [ ] Configure:
   - **Identity type:** Domain
   - **Domain:** `tickets.fluxdesk.com.br`
   - **Advanced DKIM settings:** Easy DKIM (recomendado)
   - **DKIM signing key length:** RSA_2048_BIT
6. [ ] Clique em **"Create identity"**

### Configurar DNS:

A AWS vai mostrar os registros DNS necessários. Configure no seu provedor de DNS:

#### MX Record (Recebimento):
```
Type: MX
Priority: 10
Host: tickets.fluxdesk.com.br (ou @, dependendo do provedor)
Value: inbound-smtp.us-east-2.amazonses.com
TTL: 3600
```

#### TXT Record (Verificação):
```
Type: TXT
Host: _amazonses.tickets.fluxdesk.com.br
Value: [copie o valor fornecido pelo SES]
TTL: 3600
```

#### CNAME Records (DKIM - 3 registros):
```
Type: CNAME
Host: [valor1]._domainkey.tickets.fluxdesk.com.br
Value: [valor1].dkim.amazonses.com
TTL: 3600

Type: CNAME
Host: [valor2]._domainkey.tickets.fluxdesk.com.br
Value: [valor2].dkim.amazonses.com
TTL: 3600

Type: CNAME
Host: [valor3]._domainkey.tickets.fluxdesk.com.br
Value: [valor3].dkim.amazonses.com
TTL: 3600
```

7. [ ] Aguarde a verificação (pode levar até 72h, geralmente 10-30 min)

**✓ Verificação:**
```bash
# Verificar MX
dig MX tickets.fluxdesk.com.br

# Deve retornar:
# tickets.fluxdesk.com.br. 3600 IN MX 10 inbound-smtp.us-east-2.amazonses.com.

# Verificar TXT
dig TXT _amazonses.tickets.fluxdesk.com.br

# Verificar DKIM
dig CNAME [valor1]._domainkey.tickets.fluxdesk.com.br
```

---

## 3️⃣ Criar SNS Topic

**Tempo estimado:** 2 minutos

### Passos:

1. [ ] Acesse [AWS SNS Console](https://console.aws.amazon.com/sns)
2. [ ] **Certifique-se** de estar na região **us-east-2** (Ohio)
3. [ ] No menu lateral, clique em **"Topics"**
4. [ ] Clique em **"Create topic"**
5. [ ] Configure:
   - **Type:** Standard
   - **Name:** `FluxdeskSES-Inbound-Emails`
   - **Display name:** (opcional)
6. [ ] Clique em **"Create topic"**
7. [ ] **COPIE O ARN** do topic criado

**Exemplo de ARN:**
```
arn:aws:sns:us-east-2:123456789012:FluxdeskSES-Inbound-Emails
```

8. [ ] Cole este ARN no seu `.env`:
```bash
SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-2:123456789012:FluxdeskSES-Inbound-Emails
```

**✓ Verificação:**
```bash
aws sns list-topics --region us-east-2 | grep FluxdeskSES
```

---

## 4️⃣ Criar SNS Subscription

**Tempo estimado:** 2 minutos

### Passos:

1. [ ] Na página do Topic criado, clique em **"Create subscription"**
2. [ ] Configure:
   - **Protocol:** HTTPS
   - **Endpoint:** `https://seu-dominio.com/api/webhooks/ses/inbound`
   - **Enable raw message delivery:** DESABILITADO (deixe desmarcado!)
3. [ ] Clique em **"Create subscription"**

**Status inicial:** "Pending confirmation"

4. [ ] Aguarde a confirmação automática (feita pela aplicação)
5. [ ] Verifique os logs da aplicação:

```bash
tail -f storage/logs/laravel.log | grep -i subscription
```

Você deve ver:
```
[2025-10-27 12:34:56] local.INFO: Subscrição SNS confirmada com sucesso
```

6. [ ] Recarregue a página do SNS e verifique se o status mudou para **"Confirmed"**

**✓ Verificação:**
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-2:123456789012:FluxdeskSES-Inbound-Emails \
  --region us-east-2
```

---

## 5️⃣ Criar Receipt Rule Set no SES

**Tempo estimado:** 5 minutos

### Criar Rule Set:

1. [ ] Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. [ ] No menu lateral, clique em **"Email receiving"** → **"Rule sets"**
3. [ ] Se já houver um Rule Set ativo, pule para "Criar Rule" abaixo
4. [ ] Se não houver Rule Set, clique em **"Create rule set"**
5. [ ] Configure:
   - **Rule set name:** `FluxdeskInboundRules`
6. [ ] Clique em **"Create rule set"**
7. [ ] **IMPORTANTE:** Clique em **"Set as active"** para ativar o Rule Set

### Criar Rule:

1. [ ] Dentro do Rule Set ativo, clique em **"Create rule"**
2. [ ] **Step 1: Define rule settings**
   - **Rule name:** `ProcessTicketEmails`
   - **Status:** Enabled
   - Clique em **"Next"**

3. [ ] **Step 2: Add recipient conditions**
   - Clique em **"Add new recipient condition"**
   - **Condition type:** Domain
   - **Value:** `tickets.fluxdesk.com.br`
   - Clique em **"Next"**

4. [ ] **Step 3: Add actions** (IMPORTANTE: na ordem!)

   **Ação 1 - S3:**
   - [ ] Clique em **"Add new action"**
   - [ ] Selecione **"Deliver to Amazon S3 bucket"**
   - **S3 bucket:** `fluxdesk-emails-inbound`
   - **Object key prefix:** `inbound/` (opcional)
   - Clique em **"Add action"**

   **Ação 2 - SNS:**
   - [ ] Clique em **"Add new action"**
   - [ ] Selecione **"Publish to Amazon SNS topic"**
   - **SNS topic:** `FluxdeskSES-Inbound-Emails`
   - **Encoding:** UTF-8
   - Clique em **"Add action"**
   
   - Clique em **"Next"**

5. [ ] **Step 4: Review and create**
   - Revise todas as configurações
   - Clique em **"Create rule"**

**✓ Verificação:**
- [ ] Rule Set está com status "Active"
- [ ] Rule aparece na lista com status "Enabled"
- [ ] Duas ações configuradas: S3 e SNS (nessa ordem)

---

## 6️⃣ Configurar IAM Permissions (Produção EC2)

**Tempo estimado:** 5 minutos

⚠️ **IMPORTANTE:** Em produção, use IAM Role na EC2 em vez de Access Keys!

### Criar IAM Policy:

1. [ ] Acesse [AWS IAM Console](https://console.aws.amazon.com/iam)
2. [ ] No menu lateral, clique em **"Policies"** → **"Create policy"**
3. [ ] Selecione a aba **"JSON"**
4. [ ] Cole esta policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESSend",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowS3EmailStorage",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::fluxdesk-emails-inbound",
        "arn:aws:s3:::fluxdesk-emails-inbound/*"
      ]
    }
  ]
}
```

5. [ ] Clique em **"Next: Tags"** (pule)
6. [ ] Clique em **"Next: Review"**
7. [ ] Configure:
   - **Name:** `FluxdeskSESAndS3Policy`
   - **Description:** Allow SES send and S3 email storage
8. [ ] Clique em **"Create policy"**

### Criar/Atualizar IAM Role:

1. [ ] No IAM Console, clique em **"Roles"** → **"Create role"**
2. [ ] Configure:
   - **Trusted entity type:** AWS service
   - **Use case:** EC2
3. [ ] Clique em **"Next"**
4. [ ] Selecione a policy **`FluxdeskSESAndS3Policy`** criada acima
5. [ ] Clique em **"Next"**
6. [ ] Configure:
   - **Role name:** `FluxdeskEC2Role`
7. [ ] Clique em **"Create role"**

### Anexar Role à EC2:

1. [ ] Acesse [EC2 Console](https://console.aws.amazon.com/ec2)
2. [ ] Selecione sua instância
3. [ ] Clique em **"Actions"** → **"Security"** → **"Modify IAM role"**
4. [ ] Selecione **`FluxdeskEC2Role`**
5. [ ] Clique em **"Update IAM role"**

### Atualizar `.env` (Produção):

```bash
# REMOVA as chaves (IAM Role fornecerá automaticamente)
# AWS_ACCESS_KEY_ID=  ❌ REMOVER
# AWS_SECRET_ACCESS_KEY=  ❌ REMOVER

# Mantenha apenas:
AWS_DEFAULT_REGION=us-east-2
AWS_BUCKET=fluxdesk-emails-inbound
AWS_SES_S3_BUCKET=fluxdesk-emails-inbound

SES_WEBHOOK_SECRET=seu_secret_aqui
SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-2:123456789012:FluxdeskSES-Inbound-Emails
```

6. [ ] Restart da aplicação:
```bash
php artisan config:clear
sudo supervisorctl restart all
```

**✓ Verificação:**
```bash
# SSH na EC2
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/FluxdeskEC2Role | jq .
# Deve retornar credenciais temporárias
```

---

## 7️⃣ Testar Configuração

**Tempo estimado:** 5 minutos

### Teste 1: Criar Novo Ticket

1. [ ] Envie um e-mail para `1@tickets.fluxdesk.com.br`:

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Teste de criação de ticket
Corpo: Este é um teste do sistema de e-mail inbound.
```

2. [ ] Verifique os logs da aplicação (30 segundos):

```bash
tail -f storage/logs/laravel.log | grep -i "email"
```

**Resultado esperado:**
```
[2025-10-27 12:34:56] local.INFO: Email enfileirado para processamento
[2025-10-27 12:34:57] local.INFO: Processando e-mail recebido
[2025-10-27 12:34:58] local.INFO: Ticket criado a partir de e-mail {"ticket_id":123}
```

3. [ ] Verifique no banco:

```bash
php artisan tinker
>>> Ticket::latest()->first()
>>> TicketEmail::latest()->first()
```

### Teste 2: Adicionar Resposta

1. [ ] Crie um ticket manualmente e anote o ID (ex: 123)
2. [ ] Envie um e-mail para `1@tickets.fluxdesk.com.br`:

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Teste de criação de ticket
Corpo: Esta é uma resposta ao ticket.
```

3. [ ] Verifique os logs:

```bash
tail -f storage/logs/laravel.log | grep -i "resposta"
```

**Resultado esperado:**
```
[2025-10-27 12:36:01] local.INFO: Resposta adicionada a ticket via e-mail {"ticket_id":123,"reply_id":45}
```

4. [ ] Verifique no banco:

```bash
php artisan tinker
>>> Reply::latest()->first()
```

### Teste 3: Webhook Local (Desenvolvimento)

```bash
cd /home/thiago/Projetos/fludesk
./Setup/test-email-webhook.sh 1 new
```

**Resultado esperado:**
```
✓ Webhook aceito com sucesso!
```

---

## ✅ Checklist Final

### Configuração AWS:
- [ ] Bucket S3 criado e com policy configurada
- [ ] Domínio verificado no SES (status: Verified)
- [ ] Registros DNS configurados (MX + DKIM)
- [ ] SNS Topic criado
- [ ] SNS Subscription confirmada (status: Confirmed)
- [ ] Rule Set SES criado e ativo
- [ ] Rule criada com 2 ações (S3 + SNS)
- [ ] IAM Role configurada e anexada à EC2 (produção)

### Configuração Aplicação:
- [ ] Migration executada (`ticket_emails`)
- [ ] Variáveis `.env` configuradas
- [ ] Secret gerado e configurado
- [ ] Worker de filas rodando (`queue:work`)
- [ ] Supervisor configurado (produção)
- [ ] HTTPS configurado (necessário para SNS webhook)

### Testes:
- [ ] Teste de criação de ticket via e-mail OK
- [ ] Teste de resposta via e-mail OK
- [ ] Teste de webhook local OK
- [ ] Logs sem erros
- [ ] Monitoramento ativo

---

## 📊 Monitoramento Contínuo

### Logs a monitorar:

```bash
# Logs da aplicação
tail -f storage/logs/laravel.log | grep -E "email|ticket|reply"

# Filas
php artisan queue:monitor redis

# Jobs falhados
php artisan queue:failed
```

### Métricas AWS:

1. [ ] **CloudWatch → Logs → SES:** Recebimento de e-mails
2. [ ] **CloudWatch → Logs → SNS:** Mensagens publicadas
3. [ ] **S3 → Bucket → Objects:** E-mails salvos em `inbound/`

---

## 🐛 Troubleshooting Rápido

| Sintoma | Solução |
|---------|---------|
| E-mail não chega | Verificar DNS MX e Rule Set ativo |
| Subscription pending | Verificar logs da app e URL acessível |
| 401 Unauthorized | Verificar `SES_WEBHOOK_SECRET` |
| Tenant não encontrado | E-mail enviado para tenant_id incorreto |
| Worker não processa | Verificar `php artisan queue:work` rodando |
| Erro S3 Access Denied | Verificar IAM Role e policy do bucket |

---

## 📚 Recursos

- **Guia completo:** `Setup/INBOUND-EMAIL-SETUP.md`
- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/
- **Script de teste:** `Setup/test-email-webhook.sh`

---

**Tempo total estimado:** 20-30 minutos  
**Última atualização:** Outubro 2025

