#!/usr/bin/env bash
#
# Script de diagnóstico do Mailgun Inbound
# Verifica conectividade, DNS, SSL e logs
#

set -euo pipefail

DOMAIN="${1:-app.fluxdesk.com.br}"
ENDPOINT="https://${DOMAIN}/api/webhooks/mailgun-inbound"
TEST_ENDPOINT="https://${DOMAIN}/api/webhooks/mailgun-test"

echo "=========================================="
echo "DIAGNÓSTICO MAILGUN INBOUND"
echo "=========================================="
echo ""

# 1. Verificar DNS
echo "1️⃣  Verificando DNS..."
dig +short "$DOMAIN" A || nslookup "$DOMAIN" || echo "⚠️  DNS lookup falhou"
echo ""

# 2. Verificar conectividade HTTPS
echo "2️⃣  Verificando conectividade HTTPS..."
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" "https://${DOMAIN}" || echo "⚠️  Falha na conexão HTTPS"
echo ""

# 3. Verificar SSL
echo "3️⃣  Verificando certificado SSL..."
echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -dates || echo "⚠️  Falha na verificação SSL"
echo ""

# 4. Testar endpoint principal (sem payload real)
echo "4️⃣  Testando endpoint principal (GET)..."
curl -s -i -X GET "$ENDPOINT" | head -20
echo ""

# 5. Testar endpoint de diagnóstico
echo "5️⃣  Testando endpoint de diagnóstico..."
curl -s -i -X POST "$TEST_ENDPOINT" \
  -H "User-Agent: DiagnosticScript/1.0" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1&timestamp=$(date +%s)" | head -30
echo ""

# 6. Verificar logs recentes (se estiver no servidor)
echo "6️⃣  Verificando logs recentes..."
if [[ -f "storage/logs/laravel.log" ]]; then
    echo "Últimas 20 linhas do log Laravel:"
    tail -20 storage/logs/laravel.log
else
    echo "⚠️  Arquivo storage/logs/laravel.log não encontrado (execute no servidor)"
fi
echo ""

# 7. Verificar nginx/apache logs (se estiver no servidor)
echo "7️⃣  Verificando logs do servidor web..."
if [[ -f "/var/log/nginx/access.log" ]]; then
    echo "Últimas requisições ao webhook:"
    grep -i "mailgun" /var/log/nginx/access.log | tail -10 || echo "Nenhuma requisição encontrada"
elif [[ -f "/var/log/apache2/access.log" ]]; then
    echo "Últimas requisições ao webhook:"
    grep -i "mailgun" /var/log/apache2/access.log | tail -10 || echo "Nenhuma requisição encontrada"
else
    echo "⚠️  Logs do servidor web não encontrados (execute no servidor como root/sudo)"
fi
echo ""

echo "=========================================="
echo "CHECKLIST MAILGUN CONSOLE"
echo "=========================================="
echo ""
echo "Acesse: https://app.mailgun.com/app/sending/domains"
echo ""
echo "Verifique:"
echo "✓ 1. Domain (mg.fluxdesk.com.br) está verificado?"
echo "✓ 2. DNS records (TXT, MX, CNAME) estão configurados?"
echo "✓ 3. Routes está configurado?"
echo "     - Expression: match_recipient(\".*@tickets.fluxdesk.com.br\")"
echo "     - Actions: forward(\"${ENDPOINT}\")"
echo "     - Priority: 0"
echo "✓ 4. Webhook Signing Key está copiado no .env?"
echo "✓ 5. Logs do Mailgun mostram tentativas de webhook?"
echo "     - Acesse: https://app.mailgun.com/app/logs"
echo ""

echo "=========================================="
echo "TESTES MANUAIS"
echo "=========================================="
echo ""
echo "1. Teste o endpoint de diagnóstico:"
echo "   curl -X POST ${TEST_ENDPOINT} -d 'test=1'"
echo ""
echo "2. Envie e-mail de teste via Mailgun:"
echo "   (pelo console ou API do Mailgun)"
echo ""
echo "3. Monitore logs em tempo real:"
echo "   tail -f storage/logs/laravel.log | grep -i mailgun"
echo ""
echo "4. Verifique se o queue worker está rodando:"
echo "   ps aux | grep 'queue:work'"
echo ""

