# Troubleshooting: E-mails Não Chegam

Este guia ajuda a diagnosticar quando **e-mails não criam tickets** e **não aparecem nos logs**.

---

## 🚨 Sintomas

- ✉️ E-mail enviado para `xxx@tickets.fluxdesk.com.br`
- ❌ Ticket não é criado
- ❌ **Nada nos logs do Laravel** (`storage/logs/laravel.log`)
- ❌ Nenhum job na fila

---

## 🔍 Diagnóstico Rápido

### Passo 1: Executar Diagnóstico Automático

```bash
# No servidor
cd /var/www/fluxdesk/current
bash diagnose-mailgun.sh app.fluxdesk.com.br
```

Isso verifica:
- DNS
- Conectividade HTTPS
- Certificado SSL
- Endpoints
- Logs recentes

---

### Passo 2: Testar Endpoint Diretamente

```bash
# Teste simples (sem assinatura)
bash test-endpoint-simple.sh https://app.fluxdesk.com.br/api/webhooks/mailgun-test
```

**Resposta esperada:**
```json
HTTP/2 200
{"status":"received","timestamp":"...","data_received":{...}}
```

**Verificar logs:**
```bash
tail -f storage/logs/laravel.log | grep "MAILGUN TEST"
```

**Deve aparecer:**
```
[timestamp] production.INFO: === MAILGUN TEST ENDPOINT === {"timestamp":"...","ip":"...","all_data":{...}}
```

---

## 🔧 Possíveis Causas e Soluções

### ❌ Causa 1: Mailgun Routes Não Configurado

**Sintoma:** Mailgun recebe o e-mail mas não envia webhook.

**Verificar:**
1. Acesse: https://app.mailgun.com/app/sending/domains
2. Selecione seu domínio: `mg.fluxdesk.com.br`
3. Vá em **"Receiving"** → **"Routes"**

**Deve ter:**
```
Priority: 0
Expression: match_recipient(".*@tickets.fluxdesk.com.br")
Actions: forward("https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound")
Status: Active ✓
```

**Solução:**
```bash
# Criar route via API do Mailgun
curl -s --user "api:${MAILGUN_SECRET}" \
  https://api.mailgun.net/v3/routes \
  -F priority=0 \
  -F expression='match_recipient(".*@tickets.fluxdesk.com.br")' \
  -F action='forward("https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound")'
```

---

### ❌ Causa 2: DNS Não Configurado (MX Records)

**Sintoma:** Mailgun não recebe o e-mail (rejeita antes de processar).

**Verificar DNS:**
```bash
dig tickets.fluxdesk.com.br MX
# ou
nslookup -type=MX tickets.fluxdesk.com.br
```

**Deve retornar:**
```
tickets.fluxdesk.com.br.  IN  MX  10 mxa.mailgun.org.
tickets.fluxdesk.com.br.  IN  MX  10 mxb.mailgun.org.
```

**Solução:**
- Adicionar MX records no seu provedor DNS (Cloudflare/Route53/etc):
  - `tickets.fluxdesk.com.br` → MX → `10 mxa.mailgun.org`
  - `tickets.fluxdesk.com.br` → MX → `10 mxb.mailgun.org`

---

### ❌ Causa 3: Domínio Mailgun Não Verificado

**Sintoma:** Mailgun rejeita todos os e-mails.

**Verificar:**
1. Acesse: https://app.mailgun.com/app/sending/domains
2. Verifique se `mg.fluxdesk.com.br` tem status **"Active"** ✓

**Deve ter todos os DNS records configurados:**
- ✓ TXT `v=spf1 include:mailgun.org ~all`
- ✓ TXT `k=rsa; p=...` (DKIM)
- ✓ CNAME `email.mg.fluxdesk.com.br` → `mailgun.org`

**Solução:**
- Configurar todos os DNS records listados no painel do Mailgun

---

### ❌ Causa 4: Firewall Bloqueando Mailgun

**Sintoma:** Mailgun tenta enviar webhook mas é bloqueado.

**Verificar logs do Mailgun:**
1. Acesse: https://app.mailgun.com/app/logs
2. Filtrar por: `recipient:*@tickets.fluxdesk.com.br`
3. Procurar por "webhook" ou "forward"

**Se houver erro de conexão:**
- Verifique firewall/security group
- Mailgun IPs: https://documentation.mailgun.com/en/latest/user_manual.html#ips

**Solução (AWS Security Group):**
```
Type: HTTPS
Protocol: TCP
Port: 443
Source: 0.0.0.0/0  (ou IPs do Mailgun)
```

---

### ❌ Causa 5: SSL Certificate Inválido

**Sintoma:** Mailgun não confia no certificado.

**Verificar:**
```bash
curl -v https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound 2>&1 | grep -i ssl
```

**Ou:**
```bash
echo | openssl s_client -servername app.fluxdesk.com.br -connect app.fluxdesk.com.br:443
```

**Deve mostrar:**
- `Verify return code: 0 (ok)`

**Solução:**
- Renovar certificado Let's Encrypt: `sudo certbot renew`
- Verificar se o Cloudflare SSL está em modo "Full (strict)"

---

### ❌ Causa 6: Endpoint Retornando Erro

**Sintoma:** Laravel recebe request mas retorna 4xx/5xx.

**Testar endpoint:**
```bash
bash test-endpoint-simple.sh https://app.fluxdesk.com.br/api/webhooks/mailgun-test
```

**Se retornar 404:**
- Cache de rotas: `php artisan route:clear`
- Verificar nginx/apache config

**Se retornar 500:**
- Verificar logs: `tail -f storage/logs/laravel.log`
- Verificar permissões: `storage/` e `bootstrap/cache/`

---

### ❌ Causa 7: Middleware Bloqueando

**Sintoma:** Request chega mas middleware rejeita.

**Verificar:**
```bash
tail -f storage/logs/laravel.log | grep -i "mailgun\|signature"
```

**Se aparecer "Invalid signature":**
- Verifique `MAILGUN_SIGNING_KEY` no `.env`
- Limpe cache: `php artisan config:clear`

**Temporariamente desabilitar validação (APENAS PARA TESTE):**
```php
// app/Http/Middleware/VerifyMailgunSignature.php
public function handle(Request $request, Closure $next): Response
{
    Log::info('Webhook recebido', $request->all());
    return $next($request); // ← pular validação temporariamente
}
```

⚠️ **NÃO DEIXE ASSIM EM PRODUÇÃO!**

---

### ❌ Causa 8: Nginx/Apache Config Incorreto

**Sintoma:** Servidor web não repassa request ao Laravel.

**Verificar nginx:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log | grep mailgun
```

**Configuração esperada (nginx):**
```nginx
location ~ ^/(api|webhooks) {
    try_files $uri $uri/ /index.php?$query_string;
}
```

**Solução:**
```bash
sudo nano /etc/nginx/sites-available/fluxdesk
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Testes Progressivos

Execute estes testes em ordem:

### ✅ Teste 1: Conectividade Básica

```bash
curl -v https://app.fluxdesk.com.br
```

**Deve retornar:** HTTP 200 (página da aplicação)

---

### ✅ Teste 2: Endpoint de Diagnóstico

```bash
bash test-endpoint-simple.sh https://app.fluxdesk.com.br/api/webhooks/mailgun-test
```

**Deve retornar:** HTTP 200 + JSON

**Deve aparecer no log:**
```bash
tail -f storage/logs/laravel.log | grep "MAILGUN TEST"
```

---

### ✅ Teste 3: Endpoint Real (com assinatura válida)

```bash
bash test-mailgun-new-ticket.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound acme
```

**Deve retornar:** HTTP 200 + `{"ok":true,...}`

**Deve aparecer no log:**
```
[timestamp] production.INFO: Mailgun inbound recebido {"recipient":"acme@tickets.fluxdesk.com.br",...}
```

---

### ✅ Teste 4: E-mail Real do Mailgun

**Via Mailgun Console:**
1. Acesse: https://app.mailgun.com/app/sending/domains
2. Clique em "Send a test email"
3. **To:** `acme@tickets.fluxdesk.com.br`
4. **Subject:** Teste
5. **Body:** Teste de e-mail real

**Monitorar logs:**
```bash
tail -f storage/logs/laravel.log | grep -i mailgun
```

---

## 📊 Verificar Status no Mailgun

### Logs do Mailgun

1. Acesse: https://app.mailgun.com/app/logs
2. Filtrar por:
   - **Recipient:** `*@tickets.fluxdesk.com.br`
   - **Event:** `delivered`, `accepted`, `failed`
3. Clicar no log e ver "Route" action

**O que procurar:**
- ✓ **Accepted:** E-mail recebido pelo Mailgun
- ✓ **Delivered:** (se for envio)
- ✓ **Route → forward:** Webhook enviado
- ❌ **Failed:** Ver motivo

### Webhooks do Mailgun

1. Acesse: https://app.mailgun.com/app/webhooks
2. Verificar se há webhook configurado
3. Testar com "Test webhook"

---

## 🔑 Checklist Completo

```
□ DNS configurado (MX records)
□ Domínio Mailgun verificado
□ Routes configurado no Mailgun
□ Endpoint acessível (HTTPS)
□ Certificado SSL válido
□ Firewall permite conexões do Mailgun
□ MAILGUN_SIGNING_KEY no .env
□ php artisan config:clear executado
□ Nginx/Apache config correto
□ storage/logs com permissão de escrita
□ Queue worker rodando (php artisan queue:work)
```

---

## 🆘 Último Recurso: Logs Detalhados

### Habilitar logs detalhados no Laravel:

```bash
# .env
APP_DEBUG=true
LOG_LEVEL=debug
LOG_CHANNEL=stack
```

```bash
php artisan config:clear
```

### Monitorar em tempo real:

```bash
# Terminal 1: Laravel logs
tail -f storage/logs/laravel.log

# Terminal 2: Nginx access
sudo tail -f /var/log/nginx/access.log | grep webhooks

# Terminal 3: Nginx errors
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Próximos Passos

Se após todos os testes acima **ainda não aparecer nada nos logs**:

1. **O problema é ANTES do Laravel chegar a processar**
   - Verifique Mailgun Routes (99% dos casos)
   - Verifique DNS (MX records)
   - Verifique firewall/security group

2. **Contate o suporte do Mailgun:**
   - https://help.mailgun.com/
   - Informe: "Webhook not being sent for route"
   - Forneça: logs do Mailgun, configuração do route

---

## ✅ Solução Mais Comum

**90% dos casos:** Route não configurado no Mailgun.

**Solução:**
```bash
# Via API
curl -s --user "api:SEU_MAILGUN_SECRET" \
  https://api.mailgun.net/v3/routes \
  -F priority=0 \
  -F expression='match_recipient(".*@tickets.fluxdesk.com.br")' \
  -F action='forward("https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound")'
```

**Via Console:**
1. https://app.mailgun.com/app/sending/domains → seu domínio
2. "Receiving" tab → "Create Route"
3. Configure conforme imagem/exemplo acima

