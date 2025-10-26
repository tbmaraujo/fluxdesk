# 📧 Configuração do Amazon SES para Envio de E-mails

Este guia detalha como configurar o **Amazon Simple Email Service (SES)** para envio de e-mails no Sistema de Chamados Sincro8 Tickets.

---

## 📋 Pré-requisitos

- ✅ Conta AWS ativa
- ✅ SDK da AWS instalado (`aws/aws-sdk-php`)
- ✅ Acesso ao AWS Console
- ✅ Permissões IAM adequadas para SES

---

## 🚀 Passo 1: Configurar Permissões AWS

### ⚡ Escolha a Abordagem Correta

| Ambiente | Método Recomendado | Segurança |
|----------|-------------------|-----------|
| **Produção (EC2)** | **IAM Role (Instance Profile)** ✅ | 🔒 Alta |
| **Desenvolvimento Local** | Access Keys | ⚠️ Moderada |
| **CI/CD** | IAM Role ou OIDC | 🔒 Alta |

---

### 🔐 Opção 1: IAM Role para EC2 (RECOMENDADO para Produção)

**Por que IAM Roles são melhores:**
- ✅ **Sem credenciais em disco** - Não precisa de `.env` com secrets
- ✅ **Rotação automática** - Credenciais temporárias renovadas automaticamente
- ✅ **Menor superfície de ataque** - Impossível vazar secrets no código
- ✅ **Compliance** - Atende requisitos de segurança corporativa
- ✅ **Auditoria** - CloudTrail registra todas as ações da role

#### 1.1. Criar IAM Role

1. Acesse **AWS Console** → **IAM** → **Roles** → **Create role**
2. Selecione **AWS service** → **EC2**
3. Nome da role: `EC2-Sincro8-Tickets-SES-Role`

#### 1.2. Anexar Policy à Role

**Opção A - Policy Gerenciada (mais simples):**
- Anexe: `AmazonSESFullAccess`

**Opção B - Policy Customizada (mais segura):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESSendEmail",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowS3ForEmailStorage",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::sincro8-tickets-emails-inbound/*"
    }
  ]
}
```

#### 1.3. Anexar Role à Instância EC2

**Ao criar a instância:**
1. Em **Configure Instance Details**
2. **IAM role:** Selecione `EC2-Sincro8-Tickets-SES-Role`

**Para instância existente:**
1. Selecione a instância EC2
2. **Actions** → **Security** → **Modify IAM role**
3. Selecione `EC2-Sincro8-Tickets-SES-Role`
4. **Update IAM role**

#### 1.4. Configurar `.env` (SEM credenciais)

```bash
# Configuração do Mailer
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@seudominio.com"
MAIL_FROM_NAME="Sistema de Chamados"

# Região AWS (NECESSÁRIO)
AWS_DEFAULT_REGION=us-east-1

# ⚠️ NÃO CONFIGURE AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
# O SDK da AWS buscará automaticamente as credenciais da IAM Role via metadata service
```

**🎉 Pronto!** O SDK da AWS detectará automaticamente a IAM Role e usará credenciais temporárias.

---

### 🔑 Opção 2: Access Keys (Apenas para Desenvolvimento Local)

**⚠️ AVISO:** Use apenas em desenvolvimento local. **NUNCA em produção!**

#### 2.1. Criar Usuário IAM

No **AWS Console**, acesse **IAM** → **Users** → **Create User**:

1. **Nome do usuário:** `ses-sincro8-dev`
2. **Tipo de acesso:** Programmatic access
3. **Permissões:** Anexar policy customizada acima

#### 2.2. Obter Credenciais

Após criar o usuário, você receberá:
- **Access Key ID** (ex: `AKIAIOSFODNN7EXAMPLE`)
- **Secret Access Key** (ex: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

⚠️ **IMPORTANTE:** 
- Guarde o Secret Access Key em local seguro
- **NUNCA comite no Git**
- Rotacione regularmente (90 dias)
- Use apenas em ambiente local

#### 2.3. Configurar `.env` Local

```bash
# Configuração do Mailer
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@seudominio.com"
MAIL_FROM_NAME="Sistema de Chamados"

# Credenciais AWS (APENAS DESENVOLVIMENTO LOCAL)
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_DEFAULT_REGION=us-east-1

# Opcional: Configurações específicas do SES
# AWS_SES_REGION=us-east-1
# AWS_SES_CONFIGURATION_SET=nome-do-configuration-set
```

---

## 🔧 Passo 2: Verificar Configuração

### Testar Conexão com AWS

O Laravel SDK automaticamente busca credenciais na seguinte ordem:

1. **Variáveis de ambiente** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. **Credenciais compartilhadas** (`~/.aws/credentials`)
3. **IAM Role via metadata service** (EC2/ECS)

Para verificar qual método está sendo usado:

```bash
# Em produção EC2 com IAM Role
php artisan tinker
>>> AWS::credentials()
// Deve retornar credenciais temporárias com "AssumedRole"
```

### Regiões SES Disponíveis

| Região | Código | Localização |
|--------|--------|-------------|
| US East | `us-east-1` | Virgínia (recomendado) |
| US East | `us-east-2` | Ohio |
| US West | `us-west-2` | Oregon |
| EU | `eu-west-1` | Irlanda |
| EU | `eu-central-1` | Frankfurt |
| SA | `sa-east-1` | São Paulo |

💡 **Dica:** Use `us-east-1` para latência mais baixa e melhor disponibilidade.

---

## ✉️ Passo 3: Verificar Domínio/E-mail no SES

### 3.1. Verificar E-mail Remetente (Sandbox)

No ambiente **Sandbox**, você precisa verificar cada e-mail:

1. Acesse **AWS Console** → **Amazon SES** → **Verified identities**
2. Clique em **Create identity**
3. Selecione **Email address**
4. Digite: `noreply@seudominio.com`
5. Clique em **Create identity**
6. **Verifique o e-mail** recebido na caixa de entrada

### 3.2. Verificar Domínio Completo (Produção)

Para sair do Sandbox e enviar para qualquer destinatário:

1. Acesse **AWS Console** → **Amazon SES** → **Verified identities**
2. Clique em **Create identity**
3. Selecione **Domain**
4. Digite seu domínio: `seudominio.com`
5. **Configure os registros DNS:**
   - Adicione os registros **TXT**, **CNAME** e **MX** fornecidos pelo SES
   - Aguarde a propagação DNS (pode levar até 72h)

**Exemplo de registros DNS:**
```
Type: TXT
Name: _amazonses.seudominio.com
Value: abc123def456...

Type: CNAME
Name: abc123._domainkey.seudominio.com
Value: abc123.dkim.amazonses.com

Type: CNAME
Name: def456._domainkey.seudominio.com
Value: def456.dkim.amazonses.com
```

### 3.3. Solicitar Saída do Sandbox

**⚠️ IMPORTANTE:** No Sandbox, você **só pode enviar e-mails para endereços verificados**.

Para enviar para qualquer destinatário:

1. Acesse **AWS Console** → **Amazon SES** → **Account dashboard**
2. Clique em **Request production access**
3. Preencha o formulário:
   - **Mail type:** Transactional
   - **Website URL:** URL do seu sistema
   - **Use case description:** "Sistema de gerenciamento de chamados com notificações por e-mail para clientes e técnicos"
   - **Expected volume:** Estimativa de e-mails/dia
4. Aguarde aprovação (geralmente 24-48h)

---

## 🧪 Passo 4: Testar Envio de E-mail

### 4.1. Verificar Configuração

Execute o comando de teste:

```bash
php artisan mail:test-ses seu@email.com
```

**Saída esperada:**
```
📧 Enviando e-mail de teste para: seu@email.com

🔍 Verificando configurações...
┌─────────────────────────┬────────────────────┐
│ Configuração            │ Valor              │
├─────────────────────────┼────────────────────┤
│ MAIL_MAILER             │ ses                │
│ MAIL_FROM_ADDRESS       │ noreply@domain.com │
│ MAIL_FROM_NAME          │ Sistema Chamados   │
│ AWS_DEFAULT_REGION      │ us-east-1          │
│ AWS_ACCESS_KEY_ID       │ ✓ Configurado      │
│ AWS_SECRET_ACCESS_KEY   │ ✓ Configurado      │
└─────────────────────────┴────────────────────┘

📤 Enviando e-mail...

✅ E-mail de teste enviado com sucesso!

📬 Verifique a caixa de entrada de: seu@email.com
🗑️  Não esqueça de verificar a pasta de spam!

💡 Dica: No AWS SES Sandbox, você só pode enviar e-mails para endereços verificados.
```

### 4.2. Monitorar Envio no AWS Console

1. Acesse **AWS Console** → **Amazon SES** → **Sending statistics**
2. Verifique:
   - **Sends:** Número de e-mails enviados
   - **Deliveries:** E-mails entregues
   - **Bounces:** E-mails que retornaram
   - **Complaints:** Reclamações de spam

---

## 🐛 Troubleshooting

### ❌ Erro: "Email address is not verified"

**Causa:** O e-mail remetente não está verificado no SES.

**Solução:**
1. Verifique o e-mail em **SES** → **Verified identities**
2. Confirme o e-mail recebido na caixa de entrada

---

### ❌ Erro: "InvalidClientTokenId"

**Causa:** Credenciais AWS incorretas.

**Solução:**
1. Verifique `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` no `.env`
2. Confirme que as credenciais estão ativas no IAM
3. Verifique se não há espaços extras nas variáveis

---

### ❌ Erro: "MessageRejected: Email address is not verified"

**Causa:** Tentando enviar para destinatário não verificado no Sandbox.

**Solução:**
1. **Opção 1:** Verifique o e-mail do destinatário no SES
2. **Opção 2:** Solicite saída do Sandbox (produção)

---

### ❌ Erro: "User is not authorized to perform: ses:SendEmail"

**Causa:** Usuário IAM sem permissões SES.

**Solução:**
1. Acesse **IAM** → **Users** → Seu usuário
2. Adicione a policy `AmazonSESFullAccess` ou a policy JSON mínima acima

---

### ❌ E-mails caindo no spam

**Solução:**
1. **Configure SPF:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all
   ```

2. **Configure DKIM:** Verifique domínio completo no SES

3. **Configure DMARC:**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:postmaster@seudominio.com
   ```

4. **Use remetente profissional:** `noreply@seudominio.com` em vez de `admin@gmail.com`

---

## 📊 Monitoramento e Métricas

### CloudWatch Integration

O SES envia métricas automaticamente para o CloudWatch:

1. Acesse **AWS Console** → **CloudWatch** → **Metrics**
2. Selecione **SES**
3. Monitore:
   - **Send:** Total de envios
   - **Bounce:** Taxa de retorno
   - **Complaint:** Taxa de reclamações
   - **Delivery:** Taxa de entrega

### Configurar Alarmes

Crie alarmes para:
- **Bounce rate > 5%**: Investigar qualidade da lista
- **Complaint rate > 0.1%**: Revisar conteúdo dos e-mails

---

## 🔒 Segurança e Boas Práticas

### ✅ Recomendações

1. **Nunca commite credenciais AWS no Git**
   - Use `.env` (já está no `.gitignore`)
   - Em produção, use AWS Secrets Manager ou variáveis de ambiente

2. **Use IAM com permissões mínimas**
   - Crie usuário específico para SES
   - Não use root account

3. **Monitore custos**
   - Primeiros 62.000 e-mails/mês: **GRÁTIS** (via EC2)
   - Sem EC2: $0.10 por 1.000 e-mails

4. **Configure rate limiting**
   - SES tem limites de envio por segundo
   - Use filas (Laravel Queue) para grandes volumes

5. **Implemente bounce/complaint handling**
   - Configure SNS para receber notificações
   - Remova automaticamente e-mails inválidos

---

## 📦 Envio em Produção

### Configurar Filas para E-mails

Para melhor performance, use filas:

**1. Configure o driver de fila no `.env`:**
```bash
QUEUE_CONNECTION=database
```

**2. Execute as migrations de fila:**
```bash
php artisan queue:table
php artisan migrate
```

**3. Envie e-mails via fila:**
```php
Mail::to($user)->queue(new TicketNotification($ticket));
```

**4. Execute o worker:**
```bash
php artisan queue:work --tries=3 --timeout=60
```

---

## 🎯 Integração com Notificações de Tickets

### Exemplo: Notificar Criação de Ticket

**1. Crie o Mailable:**
```bash
php artisan make:mail TicketCreatedNotification
```

**2. Implemente o Mailable:**
```php
<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class TicketCreatedNotification extends Mailable
{
    public function __construct(
        public Ticket $ticket
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Novo Chamado #' . $this->ticket->id . ' - ' . $this->ticket->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tickets.created',
        );
    }
}
```

**3. Envie no Controller:**
```php
use App\Mail\TicketCreatedNotification;
use Illuminate\Support\Facades\Mail;

// Após criar o ticket
Mail::to($ticket->user->email)->send(
    new TicketCreatedNotification($ticket)
);

// Com fila (recomendado)
Mail::to($ticket->user->email)->queue(
    new TicketCreatedNotification($ticket)
);
```

---

## 📚 Recursos Adicionais

- **Documentação AWS SES:** https://docs.aws.amazon.com/ses/
- **Laravel Mail:** https://laravel.com/docs/mail
- **AWS SDK PHP:** https://docs.aws.amazon.com/sdk-for-php/
- **SES Pricing:** https://aws.amazon.com/ses/pricing/

---

## ✅ Checklist de Configuração

- [ ] Usuário IAM criado com permissões SES
- [ ] Credenciais AWS configuradas no `.env`
- [ ] E-mail remetente verificado no SES
- [ ] Domínio verificado (produção)
- [ ] Registros DNS configurados (SPF, DKIM, DMARC)
- [ ] Solicitação de saída do Sandbox enviada
- [ ] Comando de teste executado com sucesso
- [ ] E-mail de teste recebido
- [ ] Filas configuradas (opcional)
- [ ] Monitoramento configurado no CloudWatch

---

## 💬 Suporte

Em caso de dúvidas ou problemas:

1. Verifique o troubleshooting acima
2. Consulte os logs do Laravel: `storage/logs/laravel.log`
3. Verifique métricas no AWS SES Console
4. Entre em contato com o suporte AWS se necessário

---

**Última atualização:** Outubro 2025  
**Sistema:** Sincro8 Tickets  
**Versão:** Laravel 12 + Amazon SES
