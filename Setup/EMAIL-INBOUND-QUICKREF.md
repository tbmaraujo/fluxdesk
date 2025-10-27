# 📧 E-mail Inbound - Referência Rápida

Guia de referência rápida para o sistema de abertura de tickets por e-mail.

---

## 🚀 Como Funciona

```
Cliente envia e-mail
    ↓
Amazon SES recebe (MX record)
    ↓
SES salva no S3
    ↓
SES publica no SNS Topic
    ↓
SNS chama webhook Laravel
    ↓
Job assíncrono processa
    ↓
Ticket/Resposta criado(a)
    ↓
Notificações enviadas
```

---

## 📬 Formato de E-mails

### Criar Novo Ticket

```
Para: {tenant_id}@tickets.fluxdesk.com.br
Assunto: [Qualquer texto SEM [TKT-XXX]]
Corpo: Descrição do problema
Anexos: ✅ Suportados
```

**Exemplo:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Problema no sistema de login
Corpo: Não consigo acessar o sistema. Aparece erro 500.
```

**Resultado:**
- ✅ Novo ticket criado
- ✅ Contato criado automaticamente (se não existir)
- ✅ E-mail de confirmação enviado ao solicitante
- ✅ Anexos salvos

---

### Adicionar Resposta a Ticket

```
Para: {tenant_id}@tickets.fluxdesk.com.br
Assunto: [DEVE conter [TKT-{ID}]]
Corpo: Resposta ao ticket
Anexos: ✅ Suportados
```

**Exemplo:**
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Problema no sistema de login
Corpo: Consegui resolver limpando o cache do navegador.
```

**Resultado:**
- ✅ Resposta adicionada ao ticket #123
- ✅ Status do ticket atualizado (OPEN → IN_PROGRESS)
- ✅ Notificação enviada ao responsável
- ✅ Anexos salvos

---

## ⚙️ Variáveis de Ambiente

```bash
# Secret do webhook (gere com: openssl rand -base64 32)
SES_WEBHOOK_SECRET=seu_secret_aqui

# ARN do SNS Topic
SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails

# Bucket S3 para armazenar e-mails
AWS_SES_S3_BUCKET=fluxdesk-emails-inbound

# Região AWS
AWS_DEFAULT_REGION=us-east-2
AWS_BUCKET=fluxdesk-emails-inbound

# Queue (obrigatório)
QUEUE_CONNECTION=redis
```

---

## 🧪 Testes

### Teste Local (Script)

```bash
# Novo ticket
./Setup/test-email-webhook.sh 1 new

# Resposta (ticket #123)
./Setup/test-email-webhook.sh 1 reply 123
```

### Teste com cURL

```bash
curl -X POST http://localhost:8000/api/webhooks/ses/inbound \
  -H "Content-Type: application/json" \
  -H "X-SES-Secret: seu_secret_aqui" \
  -d '{
    "message_id": "test-123",
    "from": "cliente@example.com",
    "to": "1@tickets.fluxdesk.com.br",
    "subject": "Teste de ticket"
  }'
```

### Teste Real (Produção)

```bash
# Enviar e-mail real
echo "Teste de ticket via e-mail" | mail -s "Problema de teste" 1@tickets.fluxdesk.com.br
```

---

## 📊 Monitoramento

### Verificar Logs

```bash
# Todos os logs de e-mail
tail -f storage/logs/laravel.log | grep -i email

# Apenas criação de tickets
tail -f storage/logs/laravel.log | grep "Ticket criado"

# Apenas respostas
tail -f storage/logs/laravel.log | grep "Resposta adicionada"

# Erros
tail -f storage/logs/laravel.log | grep -i "erro"
```

### Verificar Filas

```bash
# Status da fila
php artisan queue:monitor redis

# Jobs falhados
php artisan queue:failed

# Reprocessar job falhado
php artisan queue:retry {id}

# Reprocessar todos
php artisan queue:retry all
```

### Verificar no Banco

```bash
php artisan tinker

# E-mails recebidos (últimos 10)
>>> TicketEmail::latest()->take(10)->get(['id','from','subject','status','created_at'])

# E-mail específico
>>> TicketEmail::where('message_id', 'test-123')->first()

# Tickets criados hoje
>>> Ticket::whereDate('created_at', today())->count()

# Últimas respostas
>>> Reply::latest()->take(5)->get()
```

---

## 🐛 Troubleshooting

### E-mail não chega

**Verificar DNS:**
```bash
dig MX tickets.fluxdesk.com.br
# Deve retornar: inbound-smtp.us-east-2.amazonses.com
```

**Verificar SES Rule Set:**
1. AWS SES → Email receiving → Rule sets
2. Verificar se está "Active"

**Verificar logs do SES:**
- CloudWatch → Logs → SES

---

### Webhook retorna 401

**Verificar secret:**
```bash
php artisan tinker
>>> config('services.ses.webhook_secret')
```

**Limpar cache:**
```bash
php artisan config:clear
```

---

### E-mail fica em "queued"

**Verificar worker:**
```bash
# Verificar se está rodando
ps aux | grep "queue:work"

# Iniciar worker
php artisan queue:work --sleep=1 --tries=3
```

**Em produção (Supervisor):**
```bash
sudo supervisorctl status fluxdesk-worker
sudo supervisorctl restart fluxdesk-worker:*
```

---

### Tenant não encontrado

**Erro:**
```
Tenant não encontrado: 999
```

**Solução:**
```bash
# Verificar tenants existentes
php artisan tinker
>>> Tenant::pluck('id', 'name')

# Enviar para tenant válido
Para: 1@tickets.fluxdesk.com.br
```

---

### Ticket não encontrado

**Erro:**
```
Ticket não encontrado: 123 no tenant: 1
```

**Solução:**
```bash
# Verificar se ticket existe
php artisan tinker
>>> Ticket::find(123)

# Verificar tenant do ticket
>>> Ticket::find(123)->tenant_id
```

---

### SNS Subscription pending

**Verificar URL acessível:**
```bash
curl -I https://seu-dominio.com/api/webhooks/ses/inbound
# Deve retornar: HTTP/2 200
```

**Verificar logs:**
```bash
grep "SubscriptionConfirmation" storage/logs/laravel.log
```

**Confirmar manualmente:**
1. AWS SNS → Topics → Subscriptions
2. Copiar o "SubscribeURL"
3. Acessar no navegador

---

## 🔧 Comandos Úteis

### Worker de Filas

```bash
# Iniciar worker (desenvolvimento)
php artisan queue:work --sleep=1 --tries=3

# Iniciar worker (produção)
php artisan queue:work --sleep=1 --tries=3 --max-time=3600

# Worker específico
php artisan queue:work redis --queue=emails,default

# Stop gracefully
php artisan queue:restart
```

### Limpar Filas

```bash
# Limpar todas as filas
php artisan queue:flush

# Limpar jobs falhados
php artisan queue:flush --failed
```

### Reprocessar E-mails

```bash
# Buscar e-mails falhados
php artisan tinker
>>> $failed = TicketEmail::where('status', 'failed')->get()

# Marcar para reprocessar
>>> $failed->each->update(['status' => 'queued'])

# Enfileirar novamente
>>> $failed->each(function($email) {
...   dispatch(new \App\Jobs\EmailIngestJob(
...     $email->message_id,
...     $email->from,
...     $email->subject,
...     $email->to,
...     $email->s3_object_key,
...     json_decode($email->raw, true)
...   ));
... })
```

---

## 📁 Arquivos Importantes

```
app/
├── Http/Controllers/Webhook/
│   └── SesInboundController.php     # Webhook handler
├── Services/
│   └── EmailInboundService.php       # Lógica de processamento
├── Jobs/
│   └── EmailIngestJob.php            # Job assíncrono
├── Helpers/
│   └── EmailParser.php               # Parser MIME
└── Models/
    └── TicketEmail.php               # Model idempotência

routes/
└── api.php                           # Rota do webhook

config/
└── services.php                      # Config SES

database/migrations/
└── 2025_10_25_171605_create_ticket_emails_table.php

Setup/
├── INBOUND-EMAIL-SETUP.md            # Guia completo
├── AWS-INBOUND-CHECKLIST.md          # Checklist AWS
├── test-email-webhook.sh             # Script de teste
└── EMAIL-INBOUND-QUICKREF.md         # Este arquivo
```

---

## 🎯 Estatísticas

### Visualizar Métricas

```bash
php artisan tinker

# Total de e-mails recebidos
>>> TicketEmail::count()

# E-mails processados hoje
>>> TicketEmail::where('status', 'processed')->whereDate('created_at', today())->count()

# Taxa de sucesso
>>> $total = TicketEmail::count()
>>> $success = TicketEmail::where('status', 'processed')->count()
>>> round(($success / $total) * 100, 2) . '%'

# Tempo médio de processamento
>>> TicketEmail::where('status', 'processed')
...   ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, received_at, updated_at)) as avg_time')
...   ->first()->avg_time
```

---

## 🔐 Segurança

### Boas Práticas

- ✅ Usar HTTPS para webhook
- ✅ Validar secret do webhook
- ✅ Verificar TopicArn do SNS
- ✅ Usar IAM Role em vez de Access Keys (produção)
- ✅ Sanitizar conteúdo HTML de e-mails
- ✅ Validar tamanho de anexos
- ✅ Implementar rate limiting (futuro)

### Rate Limiting (Futuro)

```php
// Em SesInboundController
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::attempt(
    'ses-webhook:' . $request->ip(),
    $perMinute = 60,
    function() { /* processar */ }
);
```

---

## 📞 Suporte

- **Guia completo:** `Setup/INBOUND-EMAIL-SETUP.md`
- **Checklist AWS:** `Setup/AWS-INBOUND-CHECKLIST.md`
- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/
- **Laravel Queues:** https://laravel.com/docs/11.x/queues

---

**Última atualização:** Outubro 2025  
**Versão:** 1.0

