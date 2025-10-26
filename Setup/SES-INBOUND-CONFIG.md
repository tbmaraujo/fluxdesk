# 📨 Configuração do Amazon SES - Recebimento de E-mails

Este guia detalha como configurar o **Amazon SES** para **receber e-mails** e processar automaticamente como tickets ou respostas no Sistema de Chamados Sincro8 Tickets.

---

## 📋 Visão Geral do Fluxo

```
E-mail enviado para tenant_id@tickets.fluxdesk.com.br
         ↓
Amazon SES recebe o e-mail
         ↓
SES salva e-mail no S3 (opcional)
         ↓
SES publica notificação no SNS Topic
         ↓
SNS envia webhook para a aplicação Laravel
         ↓
Aplicação processa e-mail:
  - Extrai tenant_id do destinatário
  - Verifica se é novo ticket ou resposta ([TKT-XXXX])
  - Cria ticket ou adiciona resposta
  - Processa anexos
  - Envia notificações
```

---

## 🚀 Passo 1: Configurar Domínio no SES

### 1.1. Verificar Domínio de Recebimento

1. Acesse **AWS Console** → **Amazon SES** → **Verified identities**
2. Clique em **Create identity**
3. Selecione **Domain**
4. Digite o domínio: `tickets.fluxdesk.com.br`
5. **Configure os registros DNS:**

**Registros DNS necessários:**
```
Type: MX
Priority: 10
Name: @
Value: inbound-smtp.us-east-1.amazonaws.com

Type: TXT
Name: _amazonses.tickets.fluxdesk.com.br
Value: [valor fornecido pelo SES]

Type: CNAME (DKIM - 3 registros)
Name: [fornecido pelo SES]._domainkey.tickets.fluxdesk.com.br
Value: [fornecido pelo SES].dkim.amazonses.com
```

6. Aguarde a verificação DNS (pode levar até 72h)

---

## 📦 Passo 2: Criar Bucket S3 (Opcional mas Recomendado)

### 2.1. Criar Bucket

1. Acesse **AWS Console** → **S3**
2. Clique em **Create bucket**
3. Nome do bucket: `sincro8-tickets-emails-inbound`
4. Região: `us-east-1` (mesma do SES)
5. **Desabilite** "Block all public access"
6. Clique em **Create bucket**

### 2.2. Configurar Policy do Bucket

Adicione a seguinte policy ao bucket para permitir que o SES salve e-mails:

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
      "Resource": "arn:aws:s3:::sincro8-tickets-emails-inbound/*",
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

---

## 📢 Passo 3: Criar SNS Topic

### 3.1. Criar Topic

1. Acesse **AWS Console** → **SNS** → **Topics**
2. Clique em **Create topic**
3. Tipo: **Standard**
4. Nome: `SES-Inbound-Email-Notifications`
5. Clique em **Create topic**

### 3.2. Criar Subscription

1. Na página do Topic, clique em **Create subscription**
2. Protocolo: **HTTPS**
3. Endpoint: `https://seu-dominio.com/api/webhooks/ses/inbound`
4. **Enable raw message delivery:** DESABILITAR (deixar desligado)
5. Clique em **Create subscription**

**⚠️ IMPORTANTE:** A subscrição ficará como "Pending confirmation" até que sua aplicação confirme automaticamente.

---

## 🔧 Passo 4: Configurar Rule Set no SES

### 4.1. Criar Rule Set

1. Acesse **AWS Console** → **Amazon SES** → **Email receiving** → **Rule sets**
2. Clique em **Create rule set**
3. Nome: `InboundEmailRules`
4. Clique em **Create rule set**
5. **Ative o rule set** (Set as active)

### 4.2. Criar Rule

1. Dentro do rule set, clique em **Create rule**
2. Nome da rule: `ProcessTicketEmails`

**Step 1: Define rule settings**
- Nome: `ProcessTicketEmails`
- Status: **Enabled**

**Step 2: Add recipient condition**
- Tipo: **Domain**
- Valor: `tickets.fluxdesk.com.br`
- Isso captura TODOS os e-mails enviados para `*@tickets.fluxdesk.com.br`

**Step 3: Add actions**

Adicione 2 ações na seguinte ordem:

**Ação 1: S3 Action**
- Action: **Deliver to S3 bucket**
- S3 bucket: `sincro8-tickets-emails-inbound`
- Object key prefix: `inbound/` (opcional)
- Clique em **Add action**

**Ação 2: SNS Action**
- Action: **Publish to Amazon SNS topic**
- SNS topic: `SES-Inbound-Email-Notifications`
- Encoding: **UTF-8**
- Clique em **Add action**

**Step 4: Review**
- Revise as configurações e clique em **Create rule**

---

## 🔐 Passo 5: Configurar Permissões e Aplicação Laravel

### 5.1. Configurar Permissões AWS

**⚡ IMPORTANTE:** Para produção em EC2, use **IAM Role** em vez de Access Keys!

#### Opção A: IAM Role para EC2 (RECOMENDADO)

Se você já configurou a IAM Role conforme o guia [AMAZON-SES-CONFIG.md](AMAZON-SES-CONFIG.md), a mesma role deve incluir permissões para S3:

**Adicione à policy da role existente:**
```json
{
  "Sid": "AllowS3ForEmailStorage",
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::sincro8-tickets-emails-inbound",
    "arn:aws:s3:::sincro8-tickets-emails-inbound/*"
  ]
}
```

**Com IAM Role, o `.env` não precisa de credenciais:**
```bash
# Região AWS (NECESSÁRIO)
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound

# SES Inbound Configuration
SES_WEBHOOK_SECRET=gere-um-secret-seguro-com-openssl
AWS_SES_S3_BUCKET=sincro8-tickets-emails-inbound

# ⚠️ NÃO configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
# A IAM Role fornecerá automaticamente as credenciais via metadata service
```

#### Opção B: Access Keys (Apenas Desenvolvimento Local)

**⚠️ Use apenas em desenvolvimento local. NUNCA em produção!**

```bash
# AWS Credentials (APENAS DESENVOLVIMENTO LOCAL)
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound

# SES Inbound Configuration
SES_WEBHOOK_SECRET=gere-um-secret-seguro-com-openssl
AWS_SES_S3_BUCKET=sincro8-tickets-emails-inbound
```

### 5.2. Gerar Webhook Secret Seguro

Execute no terminal:

```bash
openssl rand -base64 32
```

Use o resultado como `SES_WEBHOOK_SECRET`.

**Exemplo:**
```bash
SES_WEBHOOK_SECRET=Kx2J9pQmR7fL4hW8vN3bY6zC5tA1sD0+
```

### 5.3. Configurar Disco S3 no Laravel

Se você usar IAM Role, o Laravel automaticamente detectará as credenciais. Caso contrário, certifique-se que `config/filesystems.php` está configurado:

```php
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
],
```

### 5.4. Adicionar Header de Segurança (Opcional)

Para maior segurança, configure o SNS para enviar um header customizado:

1. Na subscription do SNS, adicione:
   - **Delivery policy:** Adicione retry policy
   - **Filter policy:** (opcional)

2. No código do webhook, valide o header `X-Webhook-Secret`

---

## 📬 Passo 6: Testar o Sistema

### 6.1. Teste de Confirmação SNS

Quando você criar a subscription do SNS, o sistema **automaticamente confirmará** a subscrição ao receber a primeira notificação.

Verifique os logs:

```bash
tail -f storage/logs/laravel.log | grep "Subscrição SNS confirmada"
```

### 6.2. Teste de Criação de Ticket

Envie um e-mail de teste:

**Para:** `1@tickets.fluxdesk.com.br` (onde `1` é o tenant_id)  
**Assunto:** `Teste de criação de ticket via e-mail`  
**Corpo:** `Este é um teste de criação automática de ticket.`

**Resultado esperado:**
- ✅ Ticket criado com ID #XXX
- ✅ E-mail de confirmação enviado para o remetente
- ✅ Log no Laravel: "Ticket criado a partir de e-mail"

### 6.3. Teste de Resposta a Ticket

Envie uma resposta:

**Para:** `1@tickets.fluxdesk.com.br`  
**Assunto:** `Re: [TKT-123] Teste de criação de ticket via e-mail`  
**Corpo:** `Esta é uma resposta ao ticket 123.`

**Resultado esperado:**
- ✅ Resposta adicionada ao ticket #123
- ✅ E-mail de notificação enviado para o responsável
- ✅ Log no Laravel: "Resposta adicionada a ticket via e-mail"

---

## 🔍 Monitoramento e Logs

### Logs da Aplicação

```bash
# Ver logs em tempo real
tail -f storage/logs/laravel.log

# Filtrar apenas e-mails recebidos
grep "E-mail recebido via SES" storage/logs/laravel.log

# Filtrar erros de processamento
grep "Erro ao processar e-mail" storage/logs/laravel.log
```

### Monitorar no AWS CloudWatch

1. Acesse **AWS Console** → **CloudWatch** → **Logs**
2. Log group: `/aws/lambda/SESProcessor` (se usar Lambda)
3. Ou: Verifique métricas do SNS Topic

### Verificar Status das Subscriptions

```bash
aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:SES-Inbound-Email-Notifications
```

---

## 🐛 Troubleshooting

### ❌ E-mail não chega no sistema

**Possíveis causas:**

1. **DNS não configurado corretamente**
   - Verifique registro MX: `dig MX tickets.fluxdesk.com.br`
   - Deve apontar para: `inbound-smtp.us-east-1.amazonaws.com`

2. **Rule Set não ativo**
   - Vá em SES → Email receiving → Rule sets
   - Certifique-se que está marcado como "Active"

3. **Recipient condition incorreta**
   - Verifique se o domínio está correto na rule
   - Use `tickets.fluxdesk.com.br` (sem `@` ou `*`)

4. **Bucket S3 sem permissões**
   - Verifique a policy do bucket
   - SES precisa ter permissão `s3:PutObject`

---

### ❌ SNS Subscription não confirma

**Solução:**

1. Verifique se a URL do endpoint está acessível publicamente
2. Certifique-se que a rota está correta: `/api/webhooks/ses/inbound`
3. Verifique os logs da aplicação:
   ```bash
   grep "SubscriptionConfirmation" storage/logs/laravel.log
   ```
4. Se necessário, confirme manualmente:
   ```bash
   aws sns confirm-subscription --topic-arn ARN_DO_TOPIC --token TOKEN_RECEBIDO
   ```

---

### ❌ Erro "Tenant não encontrado"

**Causa:** O tenant_id extraído do e-mail não existe no banco.

**Solução:**
1. Verifique se o e-mail foi enviado para o formato correto: `NUMERO@tickets.fluxdesk.com.br`
2. Confirme que o tenant existe:
   ```sql
   SELECT id, name FROM tenants WHERE id = X;
   ```
3. Verifique os logs:
   ```bash
   grep "Tenant não encontrado" storage/logs/laravel.log
   ```

---

### ❌ Erro "Ticket não encontrado" ao responder

**Causa:** O ID do ticket no assunto `[TKT-XXX]` não existe ou pertence a outro tenant.

**Solução:**
1. Verifique se o ticket existe:
   ```sql
   SELECT id, tenant_id, title FROM tickets WHERE id = XXX;
   ```
2. Confirme que o tenant_id do e-mail corresponde ao tenant do ticket
3. Certifique-se que o formato do assunto está correto: `[TKT-123]`

---

### ❌ Anexos não são salvos

**Possíveis causas:**

1. **Storage não configurado**
   ```bash
   php artisan storage:link
   ```

2. **Permissões de escrita**
   ```bash
   chmod -R 775 storage/app/public/attachments
   ```

3. **Anexo muito grande**
   - Verifique limite no `php.ini`: `upload_max_filesize` e `post_max_size`

---

### ❌ Erro 401 "Unauthorized" no webhook

**Causa:** O secret do webhook está incorreto.

**Solução:**
1. Verifique se `SES_WEBHOOK_SECRET` está configurado no `.env`
2. Confirme que o SNS está enviando o header correto
3. Temporariamente, comente a validação do secret para debug:
   ```php
   // if ($webhookSecret !== config('services.ses.webhook_secret')) {
   //     return response()->json(['error' => 'Unauthorized'], 401);
   // }
   ```

---

## 📊 Métricas e Performance

### Métricas Importantes

1. **Taxa de processamento de e-mails**
   - Tempo médio de processamento: < 5 segundos
   - Taxa de sucesso: > 99%

2. **Monitorar no CloudWatch**
   - Invocações do SNS
   - Erros de entrega
   - Latência da aplicação

### Otimizações

1. **Usar filas para processamento assíncrono**
   ```php
   // No EmailInboundController
   dispatch(new ProcessInboundEmailJob($messageContent));
   ```

2. **Cache de tenants e clientes**
   ```php
   $tenant = Cache::remember("tenant.{$tenantId}", 3600, function() use ($tenantId) {
       return Tenant::find($tenantId);
   });
   ```

3. **Batch processing de anexos**
   - Processar anexos em background job
   - Evitar timeout em e-mails com muitos anexos

---

## 🔒 Segurança

### Boas Práticas

1. **Validar remetente**
   - Implementar SPF/DKIM checks
   - Bloquear domínios suspeitos

2. **Rate limiting**
   - Limitar número de tickets por IP/e-mail por hora
   - Prevenir spam e abuse

3. **Sanitizar conteúdo**
   - Remover scripts maliciosos do HTML
   - Validar anexos (tipo MIME, tamanho)

4. **Logs de auditoria**
   - Registrar todos os e-mails recebidos
   - Manter histórico de processamento

### Exemplo de Validação Adicional

```php
// No EmailInboundService
private function isValidSender(string $email): bool
{
    // Bloquear domínios temporários
    $blockedDomains = ['tempmail.com', '10minutemail.com'];
    $domain = substr(strrchr($email, "@"), 1);
    
    return !in_array($domain, $blockedDomains);
}
```

---

## 🎯 Fluxo Completo de Processamento

```
1. E-mail enviado: 1@tickets.fluxdesk.com.br
2. SES recebe e valida MX
3. SES salva no S3: s3://bucket/inbound/message-id
4. SES publica no SNS Topic
5. SNS envia POST para: /api/webhooks/ses/inbound
6. Controller valida webhook secret
7. Service extrai tenant_id (1)
8. Service valida tenant existe
9. Service busca e-mail do S3
10. EmailParser parseia MIME
11. Service verifica assunto:
    - Sem [TKT-XXX]: Cria novo ticket
    - Com [TKT-XXX]: Adiciona resposta
12. Service processa anexos
13. Service salva no banco
14. Service envia notificações
15. Retorna 200 OK ao SNS
```

---

## 📚 Estrutura de Arquivos

```
app/
├── Http/Controllers/Api/
│   └── EmailInboundController.php      # Webhook SNS
├── Services/
│   └── EmailInboundService.php         # Lógica de processamento
├── Helpers/
│   └── EmailParser.php                 # Parser de e-mails MIME
└── Mail/
    ├── TicketCreatedNotification.php   # Mailable novo ticket
    └── TicketReplyNotification.php     # Mailable resposta

resources/views/emails/tickets/
├── created.blade.php                   # Template novo ticket
└── reply.blade.php                     # Template resposta

routes/
└── api.php                             # Rota do webhook

config/
└── services.php                        # Config SES
```

---

## ✅ Checklist de Configuração

- [ ] Domínio verificado no SES
- [ ] Registros DNS configurados (MX, TXT, CNAME)
- [ ] Bucket S3 criado
- [ ] Policy do bucket S3 configurada
- [ ] SNS Topic criado
- [ ] SNS Subscription criada e confirmada
- [ ] Rule Set criado e ativo
- [ ] Rule configurada (recipient + S3 + SNS)
- [ ] Variáveis de ambiente no `.env`
- [ ] Secret do webhook configurado
- [ ] Storage link criado (`php artisan storage:link`)
- [ ] Teste de criação de ticket realizado
- [ ] Teste de resposta realizado
- [ ] Monitoramento configurado

---

## 💬 Suporte

Em caso de problemas:

1. **Verificar logs da aplicação:** `storage/logs/laravel.log`
2. **Verificar CloudWatch Logs** (AWS)
3. **Verificar status do SNS Subscription**
4. **Testar manualmente o webhook:** Envie POST para `/api/webhooks/ses/inbound`
5. **Consultar documentação AWS SES:** https://docs.aws.amazon.com/ses/

---

**Última atualização:** Outubro 2025  
**Sistema:** Sincro8 Tickets  
**Versão:** Laravel 12 + Amazon SES Inbound
