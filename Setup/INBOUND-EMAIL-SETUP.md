# 📧 Configuração de Abertura de Tickets por E-mail

Guia completo para configurar o recebimento de e-mails e criação automática de tickets no Fluxdesk.

---

## 🎯 Visão Geral

O sistema permite:
- ✉️ **Criar tickets** enviando e-mail para `{tenant_id}@tickets.fluxdesk.com.br`
- 💬 **Adicionar respostas** usando o formato `[TKT-123]` no assunto
- 📎 **Processar anexos** automaticamente
- 👤 **Criar contatos** automaticamente se não existirem

---

## 🔧 1. Configuração Local (Desenvolvimento)

### 1.1. Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# SES Inbound Configuration
SES_WEBHOOK_SECRET=LLtC0ZrotUnA9KspRKKkgjlTJT1RjiuAG7DZ9Q1MXRg=
SES_SNS_TOPIC_ARN=
AWS_SES_S3_BUCKET=fluxdesk-tickets-emails-inbound

# AWS (Desenvolvimento - use suas credenciais)
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_DEFAULT_REGION=us-east-2
AWS_BUCKET=fluxdesk-tickets-emails-inbound

# Redis Queue (certifique-se que está configurado)
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 1.2. Iniciar Worker de Filas

O processamento de e-mails é **assíncrono**. Você precisa ter o worker rodando:

```bash
# Terminal separado
php artisan queue:work --sleep=1 --tries=3
```

### 1.3. Verificar Configuração

```bash
# Verificar se a migration foi executada
php artisan migrate:status | grep ticket_emails

# Testar conexão com Redis
php artisan tinker
>>> Redis::ping()
# Deve retornar: "+PONG"

# Verificar AWS credentials (opcional)
php artisan tinker
>>> config('services.ses')
```

---

## ☁️ 2. Configuração AWS (Produção)

### 2.1. Criar Bucket S3

1. Acesse **AWS Console** → **S3** → **Create bucket**
2. Nome: `fluxdesk-tickets-emails-inbound`
3. Região: `us-east-2` (mesma do SES)
4. **Bloquear acesso público:** DESABILITADO (apenas para o SES)

**Adicionar Policy ao Bucket:**

Vá em **Permissions** → **Bucket Policy** e adicione:

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

**Substitua:** `SEU_AWS_ACCOUNT_ID` pelo seu Account ID da AWS.

### 2.2. Verificar Domínio no SES

1. Acesse **AWS Console** → **SES** → **Verified identities**
2. Clique em **Create identity**
3. Tipo: **Domain**
4. Domínio: `tickets.fluxdesk.com.br`
5. **Easy DKIM:** Habilitado

**Configure os registros DNS no seu provedor:**

```
Tipo: MX
Priority: 10
Host: tickets.fluxdesk.com.br (ou @)
Value: inbound-smtp.us-east-2.amazonses.com

Tipo: TXT
Host: _amazonses.tickets.fluxdesk.com.br
Value: [valor fornecido pelo SES]

Tipo: CNAME (3 registros DKIM)
Host: [fornecido pelo SES]._domainkey.tickets.fluxdesk.com.br
Value: [fornecido pelo SES].dkim.amazonses.com
```

⚠️ **IMPORTANTE:** Use `us-east-2` (sua região) no registro MX, não `us-east-1`!

**Aguarde a verificação DNS** (pode levar até 72h, geralmente 10-30 minutos).

### 2.3. Criar SNS Topic

1. Acesse **AWS Console** → **SNS** → **Topics**
2. Clique em **Create topic**
3. Tipo: **Standard**
4. Nome: `FluxdeskSES-Inbound-Emails`
5. Clique em **Create topic**
6. **Copie o ARN** do topic (ex: `arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails`)

### 2.4. Criar SNS Subscription

1. Na página do Topic, clique em **Create subscription**
2. Protocolo: **HTTPS**
3. Endpoint: `https://seu-dominio.com/api/webhooks/ses-inbound`
4. **Enable raw message delivery:** DESABILITADO (deixar desmarcado)
5. Clique em **Create subscription**

**Status:** Ficará como "Pending confirmation" até receber o primeiro e-mail.

### 2.5. Criar Rule Set no SES

1. Acesse **AWS Console** → **SES** → **Email receiving** → **Rule sets**
2. Se já houver um Rule Set ativo, use-o. Caso contrário:
   - Clique em **Create rule set**
   - Nome: `FluxdeskInboundRules`
   - **Set as active** (ativar)

### 2.6. Criar Rule

1. Dentro do Rule Set, clique em **Create rule**
2. **Nome da rule:** `ProcessTicketEmails`

**Step 1: Define rule settings**
- Status: **Enabled**

**Step 2: Add recipient condition**
- Tipo: **Domain**
- Valor: `tickets.fluxdesk.com.br`

Isso captura **todos** os e-mails enviados para `*@tickets.fluxdesk.com.br`.

**Step 3: Add actions (na ordem!)**

**Ação 1: S3 Action**
- Action: **Deliver to S3 bucket**
- S3 bucket: `fluxdesk-tickets-emails-inbound`
- Object key prefix: `inbound/` (opcional)

**Ação 2: SNS Action**
- Action: **Publish to Amazon SNS topic**
- SNS topic: `FluxdeskSES-Inbound-Emails`
- Encoding: **UTF-8**

**Step 4: Review**
- Revise e clique em **Create rule**

### 2.7. Configurar IAM Role (Produção EC2)

Se você está rodando na EC2, **NÃO use Access Keys**. Configure uma IAM Role:

**Permissões necessárias:**

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
        "arn:aws:s3:::fluxdesk-tickets-emails-inbound",
        "arn:aws:s3:::fluxdesk-tickets-emails-inbound/*"
      ]
    }
  ]
}
```

**Anexe esta role à instância EC2** e remova as chaves do `.env`:

```bash
# .env em produção (EC2 com IAM Role)
# ⚠️ NÃO configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION=us-east-2
AWS_BUCKET=fluxdesk-tickets-emails-inbound
AWS_SES_S3_BUCKET=fluxdesk-tickets-emails-inbound

SES_WEBHOOK_SECRET=seu_secret_seguro_aqui
SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails
```

---

## 🧪 3. Testar o Sistema

### 3.1. Teste Local (Webhook Direto)

Você pode testar localmente sem AWS usando este script:

```bash
curl -X POST http://localhost:8000/api/webhooks/ses-inbound \
  -H "Content-Type: application/json" \
  -H "X-SES-Secret: LLtC0ZrotUnA9KspRKKkgjlTJT1RjiuAG7DZ9Q1MXRg=" \
  -d '{
    "message_id": "test-' $(date +%s) '",
    "from": "cliente@example.com",
    "to": "1@tickets.fluxdesk.com.br",
    "subject": "Teste de ticket via email",
    "body_text": "Este é um teste de criação de ticket.",
    "mail": {
      "source": "cliente@example.com",
      "destination": ["1@tickets.fluxdesk.com.br"],
      "messageId": "test-' $(date +%s) '",
      "commonHeaders": {
        "subject": "Teste de ticket via email"
      }
    }
  }'
```

**Verificar logs:**

```bash
tail -f storage/logs/laravel.log | grep -i email
```

### 3.2. Teste Produção (E-mail Real)

**Criar novo ticket:**

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Problema no sistema
Corpo: Estou tendo problemas para acessar o sistema.
```

**Adicionar resposta a ticket existente:**

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Problema no sistema
Corpo: Consegui resolver o problema, obrigado!
```

**Verificar processamento:**

```bash
# Ver e-mails recebidos
tail -f storage/logs/laravel.log | grep "Email enfileirado"

# Ver processamento
tail -f storage/logs/laravel.log | grep "Ticket criado"

# Ver erros
tail -f storage/logs/laravel.log | grep "Erro ao processar"
```

---

## 📊 4. Monitoramento

### 4.1. Verificar Status da Fila

```bash
# Ver jobs na fila
php artisan queue:monitor redis

# Ver jobs falhados
php artisan queue:failed
```

### 4.2. Verificar E-mails Recebidos

```bash
# Via Tinker
php artisan tinker
>>> TicketEmail::latest()->take(10)->get(['id', 'from', 'subject', 'status', 'created_at'])
```

### 4.3. Logs do AWS CloudWatch

- **SNS Topic:** Métricas de mensagens publicadas/entregues
- **SES:** Logs de recebimento de e-mails
- **S3:** Verificar se os e-mails estão sendo salvos

---

## 🐛 5. Troubleshooting

### ❌ E-mail não chega no sistema

**Verificar:**

1. **DNS configurado corretamente:**
   ```bash
   dig MX tickets.fluxdesk.com.br
   # Deve retornar: inbound-smtp.us-east-2.amazonses.com
   ```

2. **Rule Set está ativo:**
   - SES → Email receiving → Rule sets
   - Deve estar marcado como "Active"

3. **Logs do SES:**
   - CloudWatch → Logs
   - Buscar por erros de recebimento

### ❌ SNS Subscription não confirma

**Solução:**

1. Verifique se a URL é acessível:
   ```bash
   curl -I https://seu-dominio.com/api/webhooks/ses-inbound
   ```

2. Verifique os logs da aplicação:
   ```bash
   grep "SubscriptionConfirmation" storage/logs/laravel.log
   ```

3. A confirmação é automática. Se não funcionar, confirme manualmente:
   ```bash
   # Pegue o SubscribeURL dos logs e acesse no navegador
   ```

### ❌ Erro "Tenant não encontrado"

**Causa:** O tenant_id extraído do e-mail não existe.

**Verificar:**

```sql
SELECT id, name FROM tenants;
```

Envie o e-mail para um tenant_id válido (ex: `1@tickets.fluxdesk.com.br`).

### ❌ Worker de filas não está rodando

**Sintoma:** E-mails ficam no status `queued` indefinidamente.

**Solução:**

```bash
# Verificar processos
ps aux | grep "queue:work"

# Iniciar worker
php artisan queue:work --sleep=1 --tries=3

# Em produção, use Supervisor
sudo supervisorctl restart laravel-worker:*
```

### ❌ Erro 401 "Unauthorized"

**Causa:** Secret do webhook incorreto.

**Verificar:**

```bash
# No .env
echo $SES_WEBHOOK_SECRET

# No config
php artisan tinker
>>> config('services.ses.webhook_secret')
```

Se estiver diferente, corrija o `.env` e execute:

```bash
php artisan config:clear
```

### ❌ Anexos não são salvos

**Verificar permissões:**

```bash
chmod -R 775 storage/app/public/attachments
php artisan storage:link
```

---

## 📝 6. Formato dos E-mails

### Criar Novo Ticket

```
Para: {tenant_id}@tickets.fluxdesk.com.br
Assunto: Qualquer texto (SEM [TKT-XXX])
Corpo: Descrição do problema
Anexos: Suportados
```

**Exemplo:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Erro ao fazer login
Corpo: Não consigo acessar o sistema, aparece erro 500.
```

### Adicionar Resposta

```
Para: {tenant_id}@tickets.fluxdesk.com.br
Assunto: DEVE conter [TKT-{ID}]
Corpo: Resposta ao ticket
Anexos: Suportados
```

**Exemplo:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Erro ao fazer login
Corpo: Consegui resolver limpando o cache do navegador.
```

---

## ⚙️ 7. Configuração de Produção

### 7.1. Supervisor para Queue Worker

Crie o arquivo `/etc/supervisor/conf.d/fluxdesk-worker.conf`:

```ini
[program:fluxdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/fluxdesk/artisan queue:work redis --sleep=1 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/fluxdesk/storage/logs/worker.log
stopwaitsecs=3600
```

**Ativar:**

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fluxdesk-worker:*
```

### 7.2. Monitoramento de Filas

Adicione ao cron para alertas de jobs falhados:

```bash
# Editar crontab
crontab -e

# Adicionar
*/5 * * * * cd /var/www/fluxdesk && php artisan queue:monitor redis --max=100 || echo "Queue alert" | mail -s "Fluxdesk Queue Alert" admin@fluxdesk.com.br
```

---

## 🎯 Checklist Final

- [ ] Migration `ticket_emails` executada
- [ ] Variáveis `.env` configuradas
- [ ] Secret gerado (`openssl rand -base64 32`)
- [ ] Worker de filas rodando (`queue:work`)
- [ ] Bucket S3 criado com policy
- [ ] Domínio verificado no SES
- [ ] DNS configurado (MX + DKIM)
- [ ] SNS Topic criado
- [ ] SNS Subscription criada (HTTPS)
- [ ] Rule Set SES ativo
- [ ] Rule criada (domain + S3 + SNS)
- [ ] IAM Role configurada (produção)
- [ ] Teste de criação de ticket OK
- [ ] Teste de resposta OK
- [ ] Supervisor configurado (produção)
- [ ] Monitoramento ativo

---

## 📚 Recursos Adicionais

- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/
- **Laravel Queues:** https://laravel.com/docs/11.x/queues
- **Documentação completa:** `Setup/SES-INBOUND-CONFIG.md`

---

**Tempo estimado de configuração:** 15-30 minutos  
**Última atualização:** Outubro 2025  
**Sistema:** Fluxdesk v1.0

