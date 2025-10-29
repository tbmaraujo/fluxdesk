#!/usr/bin/env bash
#
# Teste SIMPLES do endpoint (sem assinatura)
# Usa o endpoint de diagnóstico /api/webhooks/mailgun-test
#

set -euo pipefail

ENDPOINT="${1:-https://app.fluxdesk.com.br/api/webhooks/mailgun-test}"

echo "=========================================="
echo "TESTE SIMPLES DO ENDPOINT"
echo "=========================================="
echo ""
echo "Endpoint: $ENDPOINT"
echo "Timestamp: $(date)"
echo ""

curl -v -X POST "$ENDPOINT" \
  -H "User-Agent: TestScript/1.0" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -F "recipient=teste@tickets.fluxdesk.com.br" \
  -F "sender=cliente@example.com" \
  -F "subject=Teste de conectividade" \
  -F "body-plain=Este é um teste" \
  -F "timestamp=$(date +%s)" \
  -F "token=test-token-$(openssl rand -hex 8)"

echo ""
echo ""
echo "=========================================="
echo "Verifique os logs:"
echo "tail -f storage/logs/laravel.log | grep 'MAILGUN TEST'"
echo "=========================================="

