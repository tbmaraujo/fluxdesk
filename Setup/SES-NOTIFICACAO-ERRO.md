# 📧 Erro ao Enviar Notificações via SES

## 🔴 Erro

```
Client error: `POST https://email.us-east-2.amazonaws.com/` resulted in a `400 Bad Request` response:
<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
  <Error>
    <Type>Sender</Type>
    <Code>MessageRejected</Code>
```

---

## ✅ Boa Notícia

**O ticket FOI criado com sucesso!** 🎉

O erro acontece **apenas na notificação** (envio de e-mail de confirmação). O sistema agora está preparado para:
- ✅ Criar o ticket mesmo se a notificação falhar
- ✅ Logar o erro detalhadamente
- ✅ Continuar processando normalmente

---

## 🔍 Causas Possíveis

### 1. **SES em Modo Sandbox** (mais comum)

Se sua conta SES está em sandbox, você só pode enviar e-mails para:
- ✅ E-mails verificados
- ✅ Domínios verificados

**Como verificar:**

```bash
# Via AWS CLI
aws ses get-account-sending-enabled --region us-east-2

# Se retornar "SendingEnabled": false, está em sandbox
```

**Solução:**
- Verificar e-mail do destinatário no SES
- OU solicitar saída do sandbox na AWS

---

### 2. **E-mail Remetente Não Verificado**

O e-mail configurado em `MAIL_FROM_ADDRESS` precisa estar verificado no SES.

**Verificar no `.env`:**
```bash
grep MAIL_FROM_ADDRESS /var/www/fluxdesk/current/.env
```

**Verificar no SES:**
1. AWS Console → SES → Verified identities
2. Procurar pelo e-mail ou domínio
3. Status deve ser "Verified"

---

### 3. **E-mail Destinatário Inválido**

O e-mail do contato pode ser inválido ou não verificado (em sandbox).

**Verificar nos logs:**
```bash
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log | grep "to_email"
```

---

## 🛠️ Soluções

### Solução 1: Sair do Sandbox (Recomendado para Produção)

1. Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. No menu lateral, clique em **"Account dashboard"**
3. Procure por **"Sending limits"** ou **"Request production access"**
4. Clique em **"Request production access"**
5. Preencha o formulário:
   - **Mail type:** Transactional
   - **Website URL:** Seu domínio
   - **Use case description:** "Sistema de help desk que envia notificações de tickets para clientes"
   - **How will you ensure compliance:** Explicar que só envia para seus clientes
6. Enviar solicitação
7. **Aguardar aprovação** (geralmente 24-48h)

---

### Solução 2: Verificar E-mails Destinatários (Temporário)

Enquanto estiver em sandbox, verifique os e-mails que vão receber notificações:

1. Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. **Verified identities** → **Create identity**
3. Tipo: **Email address**
4. Digite o e-mail do cliente
5. **Create identity**
6. AWS vai enviar e-mail de verificação
7. Cliente deve clicar no link para verificar

**Problema:** Não é prático para muitos clientes!

---

### Solução 3: Desabilitar Notificações Temporariamente

Se não for crítico enviar notificações agora:

**Opção A:** Comentar código (não recomendado)

**Opção B:** Configurar para não enviar:
```php
// Em config/mail.php ou .env
MAIL_MAILER=log  # Envia para log em vez de SES
```

**Opção C:** Já está funcionando! 
- O código atual já trata o erro
- Ticket é criado mesmo se notificação falhar
- Erro é apenas logado

---

## 📊 Verificar Status da Conta SES

### Via AWS Console:

1. Acesse [AWS SES Console](https://console.aws.amazon.com/ses)
2. **Account dashboard**
3. Veja "Sending limits":
   - **Sandbox:** Sending rate: 1 msg/sec, Daily quota: 200
   - **Production:** Sending rate: 14+ msg/sec, Daily quota: 50,000+

### Via AWS CLI:

```bash
aws sesv2 get-account --region us-east-2
```

---

## 📝 Ver Logs Detalhados

Após atualizar o código:

```bash
# Ver tentativas de envio
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log | grep "notificação"

# Ver erros específicos
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log | grep "Erro ao enviar"
```

**Exemplo de log:**
```
[2025-10-27 14:20:00] production.INFO: Tentando enviar notificação de ticket criado
{"ticket_id":9,"to_email":"cliente@example.com"}

[2025-10-27 14:20:01] production.ERROR: Erro ao enviar notificação de ticket criado
{"ticket_id":9,"contact_email":"cliente@example.com","error":"MessageRejected"}
```

---

## ✅ O Que Está Funcionando

Mesmo com erro na notificação:

- ✅ E-mail é recebido pelo sistema
- ✅ Tenant é identificado (por SLUG)
- ✅ Ticket é criado com sucesso
- ✅ Contato é criado/associado
- ✅ Anexos são processados (se houver)
- ✅ Ticket fica visível no sistema

**Apenas a notificação por e-mail falha**, mas o ticket existe!

---

## 🎯 Recomendação

### Para Ambiente de Testes:
- ✅ Verificar alguns e-mails manualmente no SES
- ✅ Aceitar que notificações falhem para e-mails não verificados
- ✅ Tickets continuam sendo criados normalmente

### Para Produção:
- 🔴 **Solicitar saída do sandbox** (obrigatório!)
- ✅ Após aprovação, notificações funcionarão para qualquer e-mail
- ✅ Monitorar bounces e complaints

---

## 📋 Checklist

- [ ] Verificar se SES está em sandbox
- [ ] Verificar se `MAIL_FROM_ADDRESS` está verificado no SES
- [ ] Se em sandbox: verificar e-mails destinatários
- [ ] OU solicitar saída do sandbox
- [ ] Atualizar código no servidor (`git pull`)
- [ ] Verificar que tickets estão sendo criados (mesmo com erro de notificação)
- [ ] Monitorar logs para ver detalhes dos erros

---

## 💡 Dica

Você pode verificar os tickets criados mesmo que a notificação tenha falhado:

```bash
php artisan tinker
>>> \App\Models\Ticket::latest()->take(5)->get(['id','title','status','created_at'])
```

Os tickets estarão lá! 🎉

---

**Última atualização:** 27/10/2025  
**Sistema:** Fluxdesk v1.0

