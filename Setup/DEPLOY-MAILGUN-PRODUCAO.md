# 🚀 Deploy da Migração Mailgun em Produção

Guia para instalar e configurar o Mailgun no servidor de produção.

---

## ⚠️ Pré-requisitos

- ✅ Conta Mailgun criada
- ✅ Domínio verificado no Mailgun
- ✅ DNS configurado (SPF, DKIM, MX)
- ✅ API Key e Webhook Signing Key obtidos
- ✅ Acesso SSH ao servidor de produção
- ✅ Backup do banco de dados (recomendado)

---

## 📋 Passo 1: Backup (Recomendado)

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Fazer backup do banco
cd /var/www/fluxdesk
php artisan backup:run  # se tiver configurado

# Ou backup manual do PostgreSQL
pg_dump -U postgres -d fluxdesk > ~/backup_fluxdesk_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📥 Passo 2: Atualizar Código

```bash
cd /var/www/fluxdesk

# Verificar status atual
git status
git log --oneline -3

# Fazer pull das alterações
git pull origin main

# Ou se estiver em outra branch:
git fetch origin
git checkout main
git pull
```

**Commit esperado:**
```
b5bd34a feat: migração completa do Amazon SES para Mailgun
```

---

## 📦 Passo 3: Instalar Dependências

```bash
# Instalar pacotes do Composer (Mailgun)
composer install --no-dev --optimize-autoloader

# Verificar se o pacote foi instalado
composer show | grep mailgun
# Deve aparecer: mailgun/mailgun-php v4.3.5
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

```bash
# Editar .env em produção
nano .env
# ou
vim .env
```

**Adicionar/atualizar estas linhas:**

```bash
# ===========================
# E-MAIL - MAILGUN
# ===========================
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@seudominio.com.br"
MAIL_FROM_NAME="Fluxdesk"

# Credenciais Mailgun
MAILGUN_DOMAIN=seudominio.com.br
MAILGUN_SECRET=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_ENDPOINT=api.mailgun.net

# Se região EU:
# MAILGUN_ENDPOINT=api.eu.mailgun.net

# Webhook Signing Key (IMPORTANTE para segurança!)
MAILGUN_WEBHOOK_SIGNING_KEY=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Domínio de tickets
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br
```

**Salvar e sair:**
- Nano: `Ctrl+X` → `Y` → `Enter`
- Vim: `Esc` → `:wq` → `Enter`

---

## 🧹 Passo 5: Limpar Cache

```bash
# Limpar todos os caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Reotimizar para produção
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔄 Passo 6: Reiniciar Workers de Fila

**IMPORTANTE:** Os workers precisam ser reiniciados para carregar o novo código.

### Opção A: Supervisor (Recomendado)

```bash
# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*

# Verificar status
sudo supervisorctl status fluxdesk-worker:*

# Deve mostrar:
# fluxdesk-worker:fluxdesk-worker_00   RUNNING   pid 12345, uptime 0:00:05
# fluxdesk-worker:fluxdesk-worker_01   RUNNING   pid 12346, uptime 0:00:05
```

### Opção B: Systemd

```bash
# Reiniciar serviço
sudo systemctl restart fluxdesk-queue

# Verificar status
sudo systemctl status fluxdesk-queue
```

### Opção C: Manual (se não usar gerenciador)

```bash
# Parar workers antigos
pkill -f "php artisan queue:work"

# Iniciar novo worker (em screen ou tmux)
screen -S queue
php artisan queue:work --sleep=1 --tries=3 --max-time=3600 --max-jobs=1000
# Pressione Ctrl+A, D para desanexar
```

---

## 🌐 Passo 7: Configurar Route no Mailgun

1. Acesse: https://app.mailgun.com/app/sending/routes
2. Clique em **Create Route**
3. Configure:

**Expression Type:** Match Recipient  
**Filter Expression:**
```
match_recipient(".*@tickets.fluxdesk.com.br")
```

**Actions:**
- ✅ **Forward** → `https://seudominio.com/api/webhooks/mailgun-inbound`
- ✅ **Store** (opcional, para debug)

**Priority:** `0`  
**Description:** `Fluxdesk Inbound - Create Tickets`

4. Salve

---

## 🧪 Passo 8: Testar Envio

### 8.1. Teste via Artisan

```bash
php artisan tinker
```

```php
Mail::raw('Teste de envio via Mailgun em PRODUÇÃO', function ($message) {
    $message->to('seu-email-pessoal@exemplo.com')
            ->subject('Teste Mailgun Produção');
});
```

Pressione `Ctrl+D` para sair.

### 8.2. Verificar Logs do Mailgun

1. Acesse: https://app.mailgun.com/app/sending/logs
2. Verifique se o e-mail aparece como **Delivered**

### 8.3. Verificar Logs da Aplicação

```bash
# Seguir logs em tempo real
tail -f storage/logs/laravel.log

# Ou com Pail (se instalado)
php artisan pail
```

---

## 📩 Passo 9: Testar Recebimento (Criar Ticket por E-mail)

### 9.1. Enviar E-mail de Teste

Envie um e-mail para:
```
{tenant_id}@tickets.fluxdesk.com.br
```

Exemplo:
```
Para: 42262851012132@tickets.fluxdesk.com.br
Assunto: Teste de ticket por e-mail via Mailgun
Corpo: Este é um teste do sistema de recebimento após a migração.
```

### 9.2. Verificar Processamento

```bash
# Ver logs em tempo real
tail -f storage/logs/laravel.log | grep -i mailgun

# Verificar se o job foi processado
php artisan queue:failed

# Verificar se o ticket foi criado
php artisan tinker
>>> \App\Models\Ticket::latest()->first();
>>> \App\Models\TicketEmail::latest()->first();
```

---

## 🔍 Passo 10: Verificar Saúde do Sistema

```bash
# 1. Verificar se os workers estão rodando
ps aux | grep "queue:work"

# 2. Verificar Redis
redis-cli ping
# Deve retornar: PONG

# 3. Verificar PostgreSQL
psql -U postgres -d fluxdesk -c "SELECT COUNT(*) FROM tickets;"

# 4. Verificar rotas da API
php artisan route:list | grep mailgun
# Deve mostrar: POST   api/webhooks/mailgun-inbound

# 5. Verificar configuração de e-mail
php artisan tinker
>>> config('mail.default');
// Deve retornar: "mailgun"
>>> config('services.mailgun.domain');
// Deve retornar: "seudominio.com.br"
```

---

## 🚨 Troubleshooting em Produção

### Problema: E-mails não são enviados

**1. Verificar configuração:**
```bash
php artisan tinker
>>> config('mail.mailer');
>>> config('services.mailgun');
```

**2. Verificar logs:**
```bash
tail -f storage/logs/laravel.log | grep -i "mail\|mailgun"
```

**3. Verificar Mailgun Dashboard:**
- Acesse: https://app.mailgun.com/app/sending/logs
- Verifique se há erros (bounces, rejects)

### Problema: Webhooks não funcionam

**1. Verificar se a rota está acessível:**
```bash
curl -X POST https://seudominio.com/api/webhooks/mailgun-inbound \
  -d "sender=teste@exemplo.com" \
  -d "recipient=123@tickets.fluxdesk.com.br" \
  -d "subject=Teste" \
  -d "body-plain=Corpo do teste"
```

**2. Verificar logs:**
```bash
tail -f storage/logs/laravel.log | grep -i "mailgun\|webhook"
```

**3. Verificar firewall:**
```bash
# Verificar se a porta 80/443 está aberta
sudo ufw status | grep -E "80|443"

# Verificar Nginx/Apache
sudo systemctl status nginx
# ou
sudo systemctl status apache2
```

### Problema: Workers não processam jobs

**1. Verificar se estão rodando:**
```bash
sudo supervisorctl status fluxdesk-worker:*
```

**2. Reiniciar:**
```bash
sudo supervisorctl restart fluxdesk-worker:*
```

**3. Verificar logs do supervisor:**
```bash
tail -f /var/log/supervisor/fluxdesk-worker-stderr.log
```

### Problema: Erro "Invalid signature"

**Causa:** `MAILGUN_WEBHOOK_SIGNING_KEY` incorreta ou ausente.

**Solução:**
```bash
# 1. Obter a key correta em: https://app.mailgun.com/app/account/security/api_keys
# 2. Atualizar .env
nano .env
# 3. Limpar cache
php artisan config:clear
php artisan config:cache
# 4. Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 🔄 Rollback em Produção

Se algo der errado, você pode voltar para o SES:

### Método 1: Rollback Rápido (apenas .env)

```bash
# Editar .env
nano .env

# Comentar Mailgun e descomentar SES:
# MAIL_MAILER=mailgun
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-2

# Limpar cache
php artisan config:clear
php artisan config:cache

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*
```

### Método 2: Rollback Completo (Git)

```bash
# Voltar para o commit anterior
git checkout pre-mailgun-migration

# Reinstalar dependências
composer install --no-dev --optimize-autoloader

# Limpar cache
php artisan config:clear
php artisan config:cache
php artisan route:cache

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 📊 Monitoramento Pós-Deploy

### Logs para Acompanhar

```bash
# 1. Logs da aplicação
tail -f storage/logs/laravel.log

# 2. Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 3. Logs do Supervisor
tail -f /var/log/supervisor/fluxdesk-worker-stderr.log
tail -f /var/log/supervisor/fluxdesk-worker-stdout.log

# 4. PostgreSQL (se necessário)
tail -f /var/log/postgresql/postgresql-13-main.log
```

### Métricas para Verificar

```bash
# Jobs na fila
php artisan queue:monitor

# Jobs falhados
php artisan queue:failed

# Status geral
php artisan about
```

---

## ✅ Checklist Final de Deploy

- [ ] Backup do banco de dados criado
- [ ] Git pull executado (commit `b5bd34a`)
- [ ] Composer install executado
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Cache limpo e reotimizado
- [ ] Workers reiniciados
- [ ] Route configurada no Mailgun
- [ ] Teste de envio realizado com sucesso
- [ ] Teste de recebimento realizado com sucesso
- [ ] Logs verificados (sem erros)
- [ ] Workers rodando normalmente
- [ ] Monitoramento ativo por 24h

---

## 📞 Suporte

**Em caso de problemas:**

1. ✅ Verifique os logs: `tail -f storage/logs/laravel.log`
2. ✅ Verifique o Mailgun Dashboard: https://app.mailgun.com/app/sending/logs
3. ✅ Consulte esta documentação
4. ✅ Se necessário, faça rollback para o SES

**Documentação:**
- `Setup/MIGRACAO-MAILGUN.md` - Guia completo
- `Setup/MAILGUN-ENV-VARS.txt` - Variáveis de ambiente

---

## 🎯 Resumo dos Comandos

```bash
# 1. Atualizar código
git pull origin main

# 2. Instalar dependências
composer install --no-dev --optimize-autoloader

# 3. Configurar .env (editar manualmente)
nano .env

# 4. Limpar e otimizar cache
php artisan config:clear && php artisan cache:clear && php artisan route:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache

# 5. Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*

# 6. Verificar status
sudo supervisorctl status fluxdesk-worker:*
php artisan route:list | grep mailgun

# 7. Testar
php artisan tinker
>>> Mail::raw('Teste', fn($m) => $m->to('seu@email.com')->subject('Teste Mailgun'));
```

---

**✨ Deploy concluído! Monitore os logs nas próximas horas para garantir que tudo está funcionando.**

