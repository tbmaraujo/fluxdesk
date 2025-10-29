# 🚀 Deploy da Correção do Mailgun Webhook

## ✅ O que foi corrigido?

**Problema:** O `EmailIngestJob` estava recebendo os parâmetros na ordem errada, causando o erro:
```
Argument #1 ($messageId) must be of type string, array given
```

**Solução:** Corrigido o `MailgunInboundController` para passar os parâmetros usando argumentos nomeados do PHP 8, garantindo a ordem correta.

---

## 📦 Commits Enviados

1. **ff9207a** - `fix: corrige ordem de parâmetros no dispatch do EmailIngestJob via Mailgun`
   - Usa argumentos nomeados para garantir ordem correta
   - Corrige erro 'array given, string expected'
   - Adiciona comentário sobre s3ObjectKey null no Mailgun

2. **f00fb04** - `chore: adiciona script de deploy para correção do Mailgun`
   - Script automatizado para facilitar o deploy

---

## 🔧 Como fazer o deploy no servidor

### Opção 1: Script Automatizado (Recomendado)

```bash
# 1. Conectar ao servidor
ssh ubuntu@ec2-3-142-211-6.us-east-2.compute.amazonaws.com
# ou
ssh ubuntu@app.fluxdesk.com.br

# 2. Executar o script de deploy
cd /var/www/fluxdesk/current
git pull origin main
chmod +x deploy-mailgun-fix.sh
sudo ./deploy-mailgun-fix.sh
```

### Opção 2: Comandos Manuais

```bash
# 1. Conectar ao servidor
ssh ubuntu@ec2-3-142-211-6.us-east-2.compute.amazonaws.com

# 2. Navegar até o diretório
cd /var/www/fluxdesk/current

# 3. Atualizar código
git fetch origin
git reset --hard origin/main

# 4. Atualizar dependências (se necessário)
composer install --no-dev --optimize-autoloader

# 5. Limpar cache
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# 6. Reotimizar
php artisan config:cache
php artisan route:cache

# 7. Reiniciar queue workers (IMPORTANTE!)
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 🧪 Como testar após o deploy

### 1. Testar o Sample POST do Mailgun

Acesse o painel do Mailgun e envie um novo **Sample POST** para:
```
https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound
```

### 2. Verificar os logs em tempo real

```bash
# No servidor
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log
```

**Logs esperados (sucesso):**
```
[INFO] Mailgun inbound recebido
[INFO] E-mail Mailgun enfileirado para processamento
[INFO] Email ingerido e processado com sucesso
```

### 3. Verificar se o job foi processado

```bash
# Verificar fila
php artisan queue:work --once

# Ou consultar no banco
psql -h seu-rds.amazonaws.com -U fluxdesk_user -d fluxdesk
SELECT * FROM ticket_emails ORDER BY created_at DESC LIMIT 5;
SELECT * FROM jobs;  -- Deve estar vazia se foi processado
SELECT * FROM failed_jobs;  -- Deve estar vazia
```

### 4. Testar via curl (opcional)

```bash
curl -X POST https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound \
  -F "sender=test@example.com" \
  -F "recipient=support@app.fluxdesk.com.br" \
  -F "subject=Teste de webhook" \
  -F "body-plain=Corpo do email de teste" \
  -F "Message-Id=<test-$(date +%s)@example.com>" \
  -F "timestamp=$(date +%s)" \
  -F "token=test-token" \
  -F "signature=test-signature"
```

---

## 📊 Monitoramento

### Verificar status dos workers

```bash
sudo supervisorctl status fluxdesk-worker:*
```

**Output esperado:**
```
fluxdesk-worker:fluxdesk-worker_00   RUNNING   pid 12345, uptime 0:00:10
fluxdesk-worker:fluxdesk-worker_01   RUNNING   pid 12346, uptime 0:00:10
```

### Ver logs do supervisor

```bash
sudo tail -f /var/log/supervisor/fluxdesk-worker-*.log
```

---

## ⚠️ Troubleshooting

### Erro persiste após deploy

1. **Verificar se o código foi atualizado:**
   ```bash
   cd /var/www/fluxdesk/current
   git log --oneline -5
   # Deve mostrar: ff9207a fix: corrige ordem de parâmetros
   ```

2. **Limpar todas as filas:**
   ```bash
   php artisan queue:flush
   redis-cli FLUSHALL  # ⚠️ Cuidado: limpa todo o Redis
   ```

3. **Reiniciar tudo:**
   ```bash
   sudo supervisorctl restart all
   sudo systemctl restart php8.3-fpm
   sudo systemctl restart nginx
   ```

### Workers não estão processando

```bash
# Ver configuração do supervisor
cat /etc/supervisor/conf.d/fluxdesk-worker.conf

# Recarregar configuração
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart fluxdesk-worker:*
```

### Ver jobs falhados

```bash
php artisan queue:failed
php artisan queue:retry all  # Reprocessar tudo
```

---

## ✅ Checklist de Deploy

- [ ] Código atualizado no servidor (`git log` mostra commit ff9207a)
- [ ] Cache limpo (`php artisan config:clear`)
- [ ] Workers reiniciados (`supervisorctl restart`)
- [ ] Sample POST do Mailgun testado
- [ ] Logs não mostram mais erro "array given, string expected"
- [ ] Ticket criado com sucesso ou email registrado em `ticket_emails`

---

## 📞 Suporte

Se o erro persistir, verificar:

1. **Arquivo alterado:**
   ```bash
   cat app/Http/Controllers/Api/MailgunInboundController.php | grep -A 10 "EmailIngestJob::dispatch"
   ```
   
   **Deve mostrar:**
   ```php
   EmailIngestJob::dispatch(
       messageId: $messageId,
       from: $sender,
       subject: $subject,
       to: $recipient,
       s3ObjectKey: null,
       rawPayload: $payload
   );
   ```

2. **Compartilhar logs completos:**
   ```bash
   tail -n 100 storage/logs/laravel.log
   ```

---

**Data do Deploy:** 29/10/2025  
**Commits:** ff9207a, f00fb04  
**Ambiente:** Produção (app.fluxdesk.com.br)

