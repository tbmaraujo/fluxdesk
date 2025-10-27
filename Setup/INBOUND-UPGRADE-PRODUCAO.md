# 🚀 Upgrade: Adicionar E-mail Inbound em Produção (Sistema Já Rodando)

Guia para adicionar o sistema de e-mail inbound em um sistema **já em produção** na AWS EC2.

---

## ✅ O que você já tem

- ✅ Sistema rodando na EC2
- ✅ `.env` configurado
- ✅ SES configurado (envio de e-mails)
- ✅ IAM Role configurada
- ✅ Redis rodando
- ✅ Workers de fila rodando

---

## 📋 O que precisa adicionar

### 1️⃣ Verificar Secret do Webhook

Você já tem um `SES_WEBHOOK_SECRET` configurado. Vamos usá-lo!

**No servidor (SSH):**

```bash
# Ver o secret atual
grep SES_WEBHOOK_SECRET /var/www/fluxdesk/.env

# Se NÃO tiver, gerar um novo
openssl rand -base64 32
```

✅ **Anote este secret** - você vai precisar dele.

---

## 2️⃣ Adicionar Variáveis ao .env (Produção)

**SSH na EC2:**

```bash
# Editar .env
sudo nano /var/www/fluxdesk/.env

# Adicionar estas linhas (se ainda não existirem):
```

Adicione ao final do arquivo:

```bash
# ================================================
# E-MAIL INBOUND (Recebimento de Tickets por E-mail)
# ================================================

# Secret do webhook (se já existe, mantenha o mesmo)
SES_WEBHOOK_SECRET=seu_secret_existente_aqui

# ARN do SNS Topic (você vai criar e preencher depois)
SES_SNS_TOPIC_ARN=

# Bucket S3 para armazenar e-mails recebidos
AWS_SES_S3_BUCKET=fluxdesk-tickets-emails-inbound

# Certifique-se que estas já existem (geralmente já estão configuradas):
# AWS_DEFAULT_REGION=us-east-2
# QUEUE_CONNECTION=redis
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

**Limpar cache:**

```bash
cd /var/www/fluxdesk
php artisan config:clear
php artisan cache:clear
```

---

## 3️⃣ Fazer Deploy do Código Atualizado

```bash
# SSH na EC2
cd /var/www/fluxdesk

# Fazer pull do código atualizado
git pull origin main

# Instalar dependências (caso necessário)
composer install --no-dev --optimize-autoloader

# Limpar caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Recompilar assets (se necessário)
npm run build

# Restart dos workers
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 4️⃣ Criar Bucket S3 para E-mails

### Via AWS Console:

1. Acesse [AWS S3 Console](https://console.aws.amazon.com/s3)
2. Região: **us-east-2** (mesma do seu sistema)
3. **Create bucket**
   - Nome: `fluxdesk-tickets-emails-inbound`
   - Região: `us-east-2`
   - **Desmarcar** "Block all public access"
   - Create bucket

4. **Adicionar Policy ao Bucket:**
   - Bucket → Permissions → Bucket Policy
   - Cole (substitua `SEU_AWS_ACCOUNT_ID`):

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
      "Resource": "arn:aws:s3:::fluxdesk-tickets-emails-inbound/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "SEU_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

### Via AWS CLI (alternativa):

```bash
# Criar bucket
aws s3 mb s3://fluxdesk-tickets-emails-inbound --region us-east-2

# Adicionar policy (crie o arquivo policy.json com o conteúdo acima)
aws s3api put-bucket-policy \
  --bucket fluxdesk-tickets-emails-inbound \
  --policy file://policy.json
```

---

## 5️⃣ Atualizar IAM Role (Adicionar Permissões S3)

Sua EC2 já tem uma IAM Role. Vamos apenas adicionar permissões para o bucket.

1. Acesse [AWS IAM Console](https://console.aws.amazon.com/iam)
2. **Roles** → Encontre a role da sua EC2 (ex: `FluxdeskEC2Role`)
3. **Add permissions** → **Attach policies**
4. Se quiser criar uma policy nova ou editar a existente:

**Adicione ao JSON da policy existente:**

```json
{
  "Sid": "AllowS3EmailStorage",
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::fluxdesk-tickets-emails-inbound",
    "arn:aws:s3:::fluxdesk-tickets-emails-inbound/*"
  ]
}
```

**Alternativa rápida:** Anexar a policy gerenciada `AmazonS3FullAccess` (não recomendado para produção, mas funciona)

---

## 6️⃣ Verificar Domínio no SES (se ainda não estiver)

### Verificar se o domínio já está no SES:

1. Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. Região: **us-east-2**
3. **Verified identities**

### Se `tickets.fluxdesk.com.br` NÃO estiver verificado:

1. **Create identity**
2. Tipo: **Domain**
3. Domain: `tickets.fluxdesk.com.br`
4. Easy DKIM: **Enabled**

### Configurar DNS (adicione no seu provedor):

```
# MX Record (para recebimento)
Type: MX
Priority: 10
Host: tickets.fluxdesk.com.br
Value: inbound-smtp.us-east-2.amazonses.com

# TXT (verificação)
Type: TXT
Host: _amazonses.tickets.fluxdesk.com.br
Value: [fornecido pelo SES]

# CNAME (DKIM - 3 registros)
Type: CNAME
Host: [fornecido]._domainkey.tickets.fluxdesk.com.br
Value: [fornecido].dkim.amazonses.com
(repetir para os 3 registros)
```

---

## 7️⃣ Criar SNS Topic

1. Acesse [AWS SNS Console](https://console.aws.amazon.com/sns)
2. Região: **us-east-2**
3. **Create topic**
   - Type: **Standard**
   - Name: `FluxdeskSES-Inbound-Emails`
   - Create topic

4. **COPIAR O ARN** do topic
   - Exemplo: `arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails`

5. **Adicionar ARN ao .env no servidor:**

```bash
# SSH na EC2
sudo nano /var/www/fluxdesk/.env

# Atualizar linha:
SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails

# Salvar e limpar cache
php artisan config:clear
```

---

## 8️⃣ Criar SNS Subscription

1. Na página do Topic, **Create subscription**
2. Configure:
   - Protocol: **HTTPS**
   - Endpoint: `https://seu-dominio.com/api/webhooks/ses-inbound`
     - **Importante:** Use o domínio real da sua aplicação
   - Enable raw message delivery: **DESABILITADO**
3. Create subscription

**Status:** Ficará "Pending confirmation"

4. **Aguardar confirmação automática:**

```bash
# SSH na EC2 - Ver logs
tail -f /var/www/fluxdesk/storage/logs/laravel.log | grep -i subscription

# Você verá:
# [2025-10-27 XX:XX:XX] production.INFO: Subscrição SNS confirmada com sucesso
```

5. **Recarregar página do SNS** - Status deve mudar para "Confirmed"

---

## 9️⃣ Criar Receipt Rule Set no SES

### Verificar se já existe Rule Set ativo:

1. SES Console → **Email receiving** → **Rule sets**
2. Se já houver um ativo, use-o. Senão, crie:

**Criar Rule Set:**

1. **Create rule set**
   - Name: `FluxdeskInboundRules`
2. **Set as active**

### Criar Rule:

1. No Rule Set, **Create rule**
2. **Step 1: Rule settings**
   - Name: `ProcessTicketEmails`
   - Status: **Enabled**
   - Next

3. **Step 2: Recipient conditions**
   - Add condition
   - Type: **Domain**
   - Value: `tickets.fluxdesk.com.br`
   - Next

4. **Step 3: Actions** (IMPORTANTE: nesta ordem!)

   **Ação 1 - S3:**
   - Add action: **Deliver to S3 bucket**
   - Bucket: `fluxdesk-tickets-emails-inbound`
   - Object key prefix: `inbound/`
   - Add action

   **Ação 2 - SNS:**
   - Add action: **Publish to SNS topic**
   - Topic: `FluxdeskSES-Inbound-Emails`
   - Encoding: UTF-8
   - Add action
   
   - Next

5. **Step 4: Review** → Create rule

---

## 🔟 Testar o Sistema

### Teste 1: Webhook está acessível?

```bash
# Do seu computador
curl -I https://seu-dominio.com/api/webhooks/ses-inbound

# Deve retornar: 200 ou 405 (normal - endpoint existe)
```

### Teste 2: Criar ticket via e-mail

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Teste de ticket via e-mail
Corpo: Este é um teste do sistema inbound em produção.
```

### Teste 3: Verificar logs na EC2

```bash
# SSH na EC2
tail -f /var/www/fluxdesk/storage/logs/laravel.log | grep -i email

# Você verá:
# Email enfileirado para processamento
# Processando e-mail recebido
# Ticket criado a partir de e-mail
```

### Teste 4: Verificar no banco

```bash
# SSH na EC2
php artisan tinker

>>> TicketEmail::latest()->first()
>>> Ticket::latest()->first()
```

---

## ✅ Checklist Completo

### Servidor (EC2):
- [ ] Código atualizado (`git pull`)
- [ ] Variáveis adicionadas ao `.env`
- [ ] Cache limpo (`config:clear`)
- [ ] Workers reiniciados

### AWS:
- [ ] Bucket S3 criado (`fluxdesk-tickets-emails-inbound`)
- [ ] Policy do bucket configurada
- [ ] IAM Role atualizada (permissões S3)
- [ ] Domínio SES verificado
- [ ] DNS configurado (MX + DKIM)
- [ ] SNS Topic criado
- [ ] ARN do Topic no `.env`
- [ ] SNS Subscription criada e confirmada
- [ ] Rule Set SES criado e ativo
- [ ] Rule configurada (domain + S3 + SNS)

### Testes:
- [ ] E-mail enviado para teste
- [ ] Logs mostram processamento
- [ ] Ticket criado no banco
- [ ] Notificações enviadas

---

## 🐛 Troubleshooting Rápido

### E-mail não chega

```bash
# Verificar DNS
dig MX tickets.fluxdesk.com.br

# Verificar logs do SES no CloudWatch
# AWS Console → CloudWatch → Logs
```

### Subscription não confirma

```bash
# Verificar se a URL é acessível
curl -I https://seu-dominio.com/api/webhooks/ses-inbound

# Ver logs da app
tail -f /var/www/fluxdesk/storage/logs/laravel.log | grep -i sns
```

### Worker não processa

```bash
# Verificar workers
sudo supervisorctl status fluxdesk-worker

# Restart
sudo supervisorctl restart fluxdesk-worker:*

# Ver logs do worker
tail -f /var/www/fluxdesk/storage/logs/worker.log
```

---

## 📊 Monitoramento

```bash
# Ver e-mails recebidos
php artisan tinker
>>> TicketEmail::whereDate('created_at', today())->count()

# Ver taxa de sucesso
>>> $total = TicketEmail::count()
>>> $success = TicketEmail::where('status', 'processed')->count()
>>> "Taxa: " . round(($success/$total)*100, 2) . "%"

# Jobs falhados
php artisan queue:failed
```

---

## 🎯 Resumo Rápido

**Tempo estimado:** 15-20 minutos

1. ✅ Adicionar variáveis ao `.env` (2 min)
2. ✅ Deploy do código (`git pull`) (2 min)
3. ✅ Criar bucket S3 (2 min)
4. ✅ Atualizar IAM Role (2 min)
5. ✅ Criar SNS Topic + Subscription (3 min)
6. ✅ Criar Rule Set no SES (5 min)
7. ✅ Testar com e-mail real (2 min)

---

## 📞 Documentação Adicional

- **Guia Completo:** `Setup/INBOUND-EMAIL-SETUP.md`
- **Referência Rápida:** `Setup/EMAIL-INBOUND-QUICKREF.md`
- **Checklist AWS:** `Setup/AWS-INBOUND-CHECKLIST.md`

---

**Sistema:** Fluxdesk em Produção  
**Data:** Outubro 2025  
**Status:** Pronto para upgrade

