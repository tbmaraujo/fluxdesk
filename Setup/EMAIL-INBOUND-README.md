# 📧 Sistema de Abertura de Tickets por E-mail

Sistema completo para receber e-mails e criar/responder tickets automaticamente no Fluxdesk.

---

## 🎯 O que este sistema faz?

- ✉️ **Recebe e-mails** enviados para `{tenant_id}@tickets.fluxdesk.com.br`
- 🎫 **Cria tickets** automaticamente a partir de novos e-mails
- 💬 **Adiciona respostas** quando o assunto contém `[TKT-123]`
- 📎 **Processa anexos** automaticamente
- 👤 **Cria contatos** se não existirem
- 🔔 **Envia notificações** por e-mail
- ⚡ **Processamento assíncrono** via Redis queues
- 🔒 **Idempotente** (evita duplicação por Message-ID)

---

## 📚 Documentação

### 🚀 Para começar rapidamente:
- **[EMAIL-INBOUND-QUICKREF.md](EMAIL-INBOUND-QUICKREF.md)** - Referência rápida (comandos, formato de e-mails, troubleshooting)

### ☑️ Para configurar na AWS:
- **[AWS-INBOUND-CHECKLIST.md](AWS-INBOUND-CHECKLIST.md)** - Checklist completo passo a passo (S3, SES, SNS, IAM)

### 📖 Para entender em detalhes:
- **[INBOUND-EMAIL-SETUP.md](INBOUND-EMAIL-SETUP.md)** - Guia completo com todos os detalhes

### 🧪 Para testar localmente:
- **[test-email-webhook.sh](test-email-webhook.sh)** - Script de teste automatizado

---

## ⚡ Quick Start (5 minutos)

### 1. Configurar `.env`

```bash
# Gerar secret
openssl rand -base64 32

# Adicionar ao .env
SES_WEBHOOK_SECRET=seu_secret_gerado_aqui
AWS_SES_S3_BUCKET=fluxdesk-tickets-emails-inbound
AWS_DEFAULT_REGION=us-east-2
QUEUE_CONNECTION=redis
```

### 2. Iniciar Worker

```bash
# Terminal separado
php artisan queue:work --sleep=1 --tries=3
```

### 3. Testar Localmente

```bash
./Setup/test-email-webhook.sh 1 new
```

### 4. Configurar AWS

Siga o checklist: **[AWS-INBOUND-CHECKLIST.md](AWS-INBOUND-CHECKLIST.md)**

---

## 📬 Como Usar

### Criar novo ticket:

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Problema no sistema
Corpo: Descrição do problema
```

### Adicionar resposta:

```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Problema no sistema
Corpo: Resposta ao ticket
```

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│ Cliente envia   │
│ e-mail          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Amazon SES      │
│ (MX Record)     │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────┐  ┌─────────────┐
│ S3 Bucket   │  │ SNS Topic   │
│ (backup)    │  │             │
└─────────────┘  └──────┬──────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Webhook Laravel │
               │ (HTTPS)         │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Redis Queue     │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ EmailIngestJob  │
               │ (assíncrono)    │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ EmailInbound    │
               │ Service         │
               └────────┬────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌─────────────────┐
│ Criar Ticket    │         │ Adicionar Reply │
│ + Notificação   │         │ + Notificação   │
└─────────────────┘         └─────────────────┘
```

---

## 🔧 Componentes

### Backend

- **`SesInboundController`** - Recebe webhook do SNS
- **`EmailIngestJob`** - Processa e-mail de forma assíncrona
- **`EmailInboundService`** - Lógica de negócio (criar ticket/resposta)
- **`EmailParser`** - Parseia MIME e extrai conteúdo/anexos
- **`TicketEmail`** - Model para idempotência

### AWS

- **S3 Bucket** - Armazena e-mails completos
- **SES Domain** - Recebe e-mails (`*.tickets.fluxdesk.com.br`)
- **SES Rule Set** - Processa e-mails recebidos
- **SNS Topic** - Notifica a aplicação
- **IAM Role** - Permissões (produção)

---

## 📊 Status e Monitoramento

### Verificar e-mails recebidos:

```bash
php artisan tinker
>>> TicketEmail::latest()->take(10)->get(['from','subject','status'])
```

### Ver logs em tempo real:

```bash
tail -f storage/logs/laravel.log | grep -i email
```

### Monitorar filas:

```bash
php artisan queue:monitor redis
```

---

## 🐛 Problemas Comuns

| Problema | Solução Rápida | Guia Detalhado |
|----------|----------------|----------------|
| E-mail não chega | Verificar DNS MX | [Troubleshooting](INBOUND-EMAIL-SETUP.md#-5-troubleshooting) |
| Worker não processa | `php artisan queue:work` | [Quickref](EMAIL-INBOUND-QUICKREF.md#e-mail-fica-em-queued) |
| 401 Unauthorized | Verificar `SES_WEBHOOK_SECRET` | [Quickref](EMAIL-INBOUND-QUICKREF.md#webhook-retorna-401) |
| Tenant não encontrado | E-mail para tenant válido | [Quickref](EMAIL-INBOUND-QUICKREF.md#tenant-não-encontrado) |

---

## 📁 Estrutura de Arquivos

```
Setup/
├── EMAIL-INBOUND-README.md          # 👈 Este arquivo
├── EMAIL-INBOUND-QUICKREF.md        # Referência rápida
├── INBOUND-EMAIL-SETUP.md           # Guia completo
├── AWS-INBOUND-CHECKLIST.md         # Checklist AWS
└── test-email-webhook.sh            # Script de teste

app/
├── Http/Controllers/Webhook/
│   └── SesInboundController.php
├── Services/
│   └── EmailInboundService.php
├── Jobs/
│   └── EmailIngestJob.php
├── Helpers/
│   └── EmailParser.php
└── Models/
    └── TicketEmail.php

database/migrations/
└── 2025_10_25_171605_create_ticket_emails_table.php

routes/
└── api.php (webhook: /api/webhooks/ses-inbound)
```

---

## ✅ Checklist Rápido

### Desenvolvimento:
- [ ] Migration executada
- [ ] `.env` configurado (secret, bucket, region)
- [ ] Worker rodando (`queue:work`)
- [ ] Teste local OK

### Produção:
- [ ] Bucket S3 criado
- [ ] Domínio SES verificado
- [ ] DNS configurado (MX + DKIM)
- [ ] SNS Topic + Subscription
- [ ] Rule Set SES ativo
- [ ] IAM Role configurada
- [ ] HTTPS configurado
- [ ] Supervisor rodando workers
- [ ] Teste real OK

---

## 🎯 Próximos Passos

1. **Desenvolvimento:**
   - Configure `.env` e inicie o worker
   - Execute: `./Setup/test-email-webhook.sh 1 new`

2. **Produção:**
   - Siga: **[AWS-INBOUND-CHECKLIST.md](AWS-INBOUND-CHECKLIST.md)**
   - Teste com e-mail real

3. **Monitoramento:**
   - Configure alertas para jobs falhados
   - Monitore CloudWatch Logs
   - Acompanhe métricas do SNS

---

## 📞 Suporte

- **Referência Rápida:** [EMAIL-INBOUND-QUICKREF.md](EMAIL-INBOUND-QUICKREF.md)
- **Guia Completo:** [INBOUND-EMAIL-SETUP.md](INBOUND-EMAIL-SETUP.md)
- **Checklist AWS:** [AWS-INBOUND-CHECKLIST.md](AWS-INBOUND-CHECKLIST.md)
- **AWS SES Docs:** https://docs.aws.amazon.com/ses/

---

**Sistema:** Fluxdesk v1.0  
**Última atualização:** Outubro 2025  
**Status:** ✅ Pronto para uso

