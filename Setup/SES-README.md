# 📧 Amazon SES - Documentação Completa

Guia central para configuração de envio e recebimento de e-mails usando Amazon SES no Sistema de Chamados Sincro8 Tickets.

---

## 📚 Índice de Documentação

### 🚀 Quick Starts (5-10 minutos)

1. **[SES-QUICKSTART.md](SES-QUICKSTART.md)**
   - Configuração rápida de **envio** de e-mails
   - Teste do sistema em 5 minutos
   - Ideal para começar rapidamente

2. **[SES-INBOUND-QUICKSTART.md](SES-INBOUND-QUICKSTART.md)**
   - Configuração rápida de **recebimento** de e-mails
   - Criação automática de tickets via e-mail
   - Ideal para testes iniciais

### 📖 Guias Completos

1. **[IAM-ROLES-GUIDE.md](IAM-ROLES-GUIDE.md)** 🔒 **IMPORTANTE**
   - **IAM Roles para EC2** (Instance Profiles)
   - Por que usar em vez de Access Keys
   - Configuração passo a passo
   - Segurança em produção
   - **Leia antes de configurar produção!**

2. **[AMAZON-SES-CONFIG.md](AMAZON-SES-CONFIG.md)**
   - Configuração completa de **envio** de e-mails
   - IAM Roles vs Access Keys
   - Verificação de domínio
   - Troubleshooting detalhado
   - Integração com filas e notificações

3. **[SES-INBOUND-CONFIG.md](SES-INBOUND-CONFIG.md)**
   - Configuração completa de **recebimento** de e-mails
   - SNS, S3, Rule Sets
   - IAM Roles para S3
   - Parser de e-mails MIME
   - Troubleshooting avançado

---

## 🎯 Casos de Uso

### 📤 Envio de E-mails

**Funcionalidades implementadas:**
- ✅ Notificação de ticket criado
- ✅ Notificação de nova resposta
- ✅ Notificação de atribuição de ticket
- ✅ Templates HTML profissionais
- ✅ Suporte a filas (queue)

**Documentação:** [AMAZON-SES-CONFIG.md](AMAZON-SES-CONFIG.md)

---

### 📥 Recebimento de E-mails

**Funcionalidades implementadas:**
- ✅ Criação automática de tickets via e-mail
- ✅ Adicionar respostas respondendo e-mails
- ✅ Processamento de anexos
- ✅ Extração automática de tenant_id
- ✅ Parser MIME completo
- ✅ Identificação de solicitantes

**Documentação:** [SES-INBOUND-CONFIG.md](SES-INBOUND-CONFIG.md)

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────┐
│         ENVIO DE E-MAILS (OUTBOUND)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Ticket criado no sistema                   │
│  2. Sistema envia e-mail via SES               │
│  3. Cliente recebe notificação                 │
│  4. E-mail contém [TKT-XXX] no assunto        │
│                                                 │
└─────────────────────────────────────────────────┘
                        ↓
                        ↓ Cliente responde
                        ↓
┌─────────────────────────────────────────────────┐
│       RECEBIMENTO DE E-MAILS (INBOUND)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. SES recebe e-mail do cliente               │
│  2. SNS notifica aplicação via webhook         │
│  3. Sistema processa e-mail:                   │
│     - Extrai tenant_id do destinatário         │
│     - Detecta [TKT-XXX] no assunto            │
│     - Adiciona resposta ao ticket              │
│  4. Sistema envia confirmação                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ Arquitetura do Sistema

### Componentes Backend

```
app/
├── Http/Controllers/Api/
│   └── EmailInboundController.php      # Webhook SNS
│
├── Services/
│   └── EmailInboundService.php         # Lógica de processamento
│
├── Helpers/
│   └── EmailParser.php                 # Parser MIME de e-mails
│
└── Mail/
    ├── TestEmail.php                   # E-mail de teste
    ├── TicketCreatedNotification.php   # Novo ticket
    └── TicketReplyNotification.php     # Nova resposta
```

### Componentes AWS

```
┌─────────────┐
│   Amazon    │
│     SES     │──────┐
│  (Sending)  │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│   Amazon    │      │
│     SES     │      │
│ (Receiving) │──────┤
└─────────────┘      │
        │            │
        ↓            │
┌─────────────┐      │
│     S3      │      │
│   Bucket    │      │
└─────────────┘      │
        │            │
        ↓            │
┌─────────────┐      │
│     SNS     │      │
│    Topic    │      │
└─────────────┘      │
        │            │
        ↓            │
┌─────────────────────────┐
│   Laravel Application   │
│   /api/webhooks/ses/    │
└─────────────────────────┘
```

---

## 🚦 Status de Configuração

Use este checklist para acompanhar sua configuração:

### Envio de E-mails (Outbound)

- [ ] SDK da AWS instalado
- [ ] Credenciais AWS configuradas
- [ ] E-mail remetente verificado
- [ ] Domínio verificado (produção)
- [ ] SPF/DKIM configurados
- [ ] Teste de envio realizado
- [ ] Saída do Sandbox solicitada (produção)

### Recebimento de E-mails (Inbound)

- [ ] Domínio de recebimento verificado
- [ ] DNS MX configurado
- [ ] Bucket S3 criado e configurado
- [ ] SNS Topic criado
- [ ] SNS Subscription confirmada
- [ ] Rule Set criado e ativo
- [ ] Webhook secret configurado
- [ ] Teste de criação de ticket OK
- [ ] Teste de resposta OK

---

## 🔧 Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# ============================================
# Amazon SES - Envio e Recebimento
# ============================================

# Mailer Configuration
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@seudominio.com"
MAIL_FROM_NAME="Sistema de Chamados"

# AWS Credentials
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound

# SES Inbound Configuration
SES_WEBHOOK_SECRET=seu-secret-seguro-aqui
AWS_SES_S3_BUCKET=${AWS_BUCKET}

# Optional: SES Configuration Set
# AWS_SES_CONFIGURATION_SET=nome-do-set
```

---

## 🧪 Testes

### Teste de Envio

```bash
# Enviar e-mail de teste
php artisan mail:test-ses seu@email.com
```

**Resultado esperado:**
```
✅ E-mail de teste enviado com sucesso!
📬 Verifique a caixa de entrada de: seu@email.com
```

---

### Teste de Recebimento

**1. Criar Novo Ticket:**
```
Enviar e-mail para: 1@tickets.fluxdesk.com.br
Assunto: Teste de criação automática
Corpo: Este é um teste
```

**Resultado esperado:**
- Ticket criado no sistema
- E-mail de confirmação recebido
- Log: "Ticket criado a partir de e-mail"

**2. Adicionar Resposta:**
```
Enviar e-mail para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Teste de criação automática
Corpo: Esta é uma resposta
```

**Resultado esperado:**
- Resposta adicionada ao ticket #123
- Notificação enviada ao responsável
- Log: "Resposta adicionada a ticket via e-mail"

---

## 📊 Monitoramento

### Logs da Aplicação

```bash
# Ver todos os logs relacionados ao SES
tail -f storage/logs/laravel.log | grep -E "SES|E-mail|Ticket"

# Ver apenas e-mails recebidos
tail -f storage/logs/laravel.log | grep "E-mail recebido via SES"

# Ver apenas erros
tail -f storage/logs/laravel.log | grep "ERROR"
```

### Métricas AWS

**CloudWatch:**
- Envios do SES (Sends, Deliveries, Bounces, Complaints)
- Invocações do SNS
- Objetos salvos no S3

**SES Console:**
- AWS Console → SES → Sending statistics
- AWS Console → SES → Reputation dashboard

---

## 💰 Custos

### Amazon SES Pricing

**Envio:**
- Primeiros 62.000 e-mails/mês: **GRÁTIS** (via EC2)
- Sem EC2: $0.10 por 1.000 e-mails

**Recebimento:**
- Primeiros 1.000 e-mails/mês: **GRÁTIS**
- Após isso: $0.10 por 1.000 e-mails

**S3 Storage:**
- Primeiros 5 GB: **GRÁTIS**
- $0.023 por GB/mês após isso

**SNS:**
- Primeiros 1.000 notificações: **GRÁTIS**
- $0.50 por milhão após isso

**Total estimado para 10.000 tickets/mês:** < $5 USD

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] Credenciais AWS em variáveis de ambiente
- [ ] Webhook secret forte (32+ caracteres)
- [ ] HTTPS obrigatório no webhook
- [ ] SPF, DKIM e DMARC configurados
- [ ] Rate limiting implementado
- [ ] Validação de remetentes
- [ ] Sanitização de HTML
- [ ] Logs de auditoria ativos

### Recomendações

1. **Nunca comite credenciais no Git**
2. **Use IAM com permissões mínimas**
3. **Monitore bounces e complaints**
4. **Configure alarmes no CloudWatch**
5. **Revise logs regularmente**

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

| Problema | Documento | Seção |
|----------|-----------|-------|
| E-mail não enviado | AMAZON-SES-CONFIG.md | Troubleshooting |
| E-mail não recebido | SES-INBOUND-CONFIG.md | Troubleshooting |
| Erro 401 no webhook | SES-INBOUND-CONFIG.md | Erro 401 |
| Tenant não encontrado | SES-INBOUND-CONFIG.md | Erro "Tenant não encontrado" |
| Anexos não salvos | SES-INBOUND-CONFIG.md | Anexos não são salvos |

### Recursos

- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/
- **Laravel Mail:** https://laravel.com/docs/mail
- **AWS SDK PHP:** https://docs.aws.amazon.com/sdk-for-php/
- **Status do SES:** https://status.aws.amazon.com/

---

## 📝 Resumo Executivo

### Para Envio de E-mails
1. Instalar SDK AWS
2. Configurar credenciais
3. Verificar e-mail/domínio
4. Testar envio
5. **Tempo:** ~10 minutos

### Para Recebimento de E-mails
1. Verificar domínio
2. Criar bucket S3
3. Criar SNS Topic
4. Criar Rule Set
5. Configurar webhook
6. Testar recebimento
7. **Tempo:** ~15 minutos

### Custo Total
- **Desenvolvimento:** GRÁTIS (tier gratuito)
- **Produção (10k tickets/mês):** < $5 USD/mês
- **ROI:** Muito alto (automação completa)

---

## 🎓 Próximos Passos

Após configurar o SES:

1. ✅ **Implementar notificações avançadas**
   - Mudança de status
   - Atribuição de responsável
   - SLA vencendo

2. ✅ **Melhorar processamento de e-mails**
   - Detectar spam
   - Extrair assinatura de e-mail
   - Categorizar automaticamente

3. ✅ **Adicionar analytics**
   - Taxa de resposta por e-mail
   - Tempo médio de resposta
   - Satisfação do cliente

4. ✅ **Otimizar performance**
   - Usar filas para processamento
   - Cache de tenants
   - Batch processing de anexos

---

**Última atualização:** Outubro 2025  
**Sistema:** Sincro8 Tickets  
**Stack:** Laravel 12 + Amazon SES + SNS + S3
