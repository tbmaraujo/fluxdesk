#!/bin/bash

# Script para testar o webhook de e-mail localmente
# Uso: ./test-email-webhook.sh [tenant_id] [modo]
# Modos: new (novo ticket) | reply (resposta)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
APP_URL="${APP_URL:-http://localhost:8000}"
WEBHOOK_SECRET="${SES_WEBHOOK_SECRET:-LLtC0ZrotUnA9KspRKKkgjlTJT1RjiuAG7DZ9Q1MXRg=}"
TENANT_ID="${1:-1}"
MODE="${2:-new}"

echo -e "${GREEN}=== Teste de Webhook de E-mail ===${NC}"
echo ""
echo "Configuração:"
echo "  - URL: $APP_URL"
echo "  - Tenant ID: $TENANT_ID"
echo "  - Modo: $MODE"
echo ""

# Gerar message_id único
MESSAGE_ID="test-$(date +%s)-$$"
TIMESTAMP=$(date -u +"%a, %d %b %Y %H:%M:%S +0000")

# Preparar payload baseado no modo
if [ "$MODE" == "new" ]; then
    SUBJECT="Teste de criação de ticket via e-mail"
    TICKET_REF=""
    echo -e "${YELLOW}Testando CRIAÇÃO de novo ticket...${NC}"
elif [ "$MODE" == "reply" ]; then
    TICKET_ID="${3:-123}"
    SUBJECT="Re: [TKT-${TICKET_ID}] Teste de criação de ticket via e-mail"
    TICKET_REF="TKT-${TICKET_ID}"
    echo -e "${YELLOW}Testando RESPOSTA ao ticket #${TICKET_ID}...${NC}"
else
    echo -e "${RED}Modo inválido! Use 'new' ou 'reply'${NC}"
    exit 1
fi

# Payload SNS simulado (formato que o SES envia)
PAYLOAD=$(cat <<EOF
{
  "Type": "Notification",
  "MessageId": "sns-msg-${MESSAGE_ID}",
  "TopicArn": "arn:aws:sns:us-east-2:123456789:FluxdeskSES-Inbound-Emails",
  "Message": "{\n  \"notificationType\": \"Received\",\n  \"mail\": {\n    \"timestamp\": \"${TIMESTAMP}\",\n    \"source\": \"cliente@example.com\",\n    \"messageId\": \"${MESSAGE_ID}\",\n    \"destination\": [\"${TENANT_ID}@tickets.fluxdesk.com.br\"],\n    \"commonHeaders\": {\n      \"from\": [\"Cliente Teste <cliente@example.com>\"],\n      \"to\": [\"${TENANT_ID}@tickets.fluxdesk.com.br\"],\n      \"subject\": \"${SUBJECT}\",\n      \"date\": \"${TIMESTAMP}\"\n    }\n  },\n  \"receipt\": {\n    \"timestamp\": \"${TIMESTAMP}\",\n    \"recipients\": [\"${TENANT_ID}@tickets.fluxdesk.com.br\"],\n    \"action\": {\n      \"type\": \"S3\",\n      \"bucketName\": \"fluxdesk-emails-inbound\",\n      \"objectKey\": \"inbound/${MESSAGE_ID}\"\n    }\n  },\n  \"content\": \"From: cliente@example.com\\nTo: ${TENANT_ID}@tickets.fluxdesk.com.br\\nSubject: ${SUBJECT}\\n\\nEste é um teste de processamento de e-mail.\\n\\nAtenciosamente,\\nCliente Teste\"\n}",
  "Timestamp": "${TIMESTAMP}",
  "SignatureVersion": "1",
  "Signature": "test-signature",
  "SigningCertURL": "https://sns.us-east-2.amazonaws.com/test.pem",
  "UnsubscribeURL": "https://sns.us-east-2.amazonaws.com/test"
}
EOF
)

echo ""
echo "Enviando requisição..."
echo ""

# Fazer a requisição
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${APP_URL}/api/webhooks/ses-inbound" \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: Notification" \
  -d "$PAYLOAD")

# Extrair código HTTP
HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Resposta da API:"
echo "  - HTTP Code: $HTTP_CODE"
echo "  - Body: $BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Webhook aceito com sucesso!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Verifique os logs: tail -f storage/logs/laravel.log | grep -i email"
    echo "2. Verifique a fila: php artisan queue:monitor redis"
    echo "3. Certifique-se que o worker está rodando: php artisan queue:work"
    echo ""
    echo "Verificando job na fila..."
    
    # Dar tempo para o job ser processado
    sleep 2
    
    # Verificar no banco (requer tinker ou query direta)
    echo ""
    echo "Para verificar o resultado:"
    echo "  php artisan tinker"
    echo "  >>> TicketEmail::where('message_id', '${MESSAGE_ID}')->first()"
    
    if [ "$MODE" == "new" ]; then
        echo "  >>> Ticket::latest()->first()"
    else
        echo "  >>> Reply::latest()->first()"
    fi
else
    echo -e "${RED}✗ Erro no webhook (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "  - Secret do webhook incorreto"
    echo "  - Aplicação não está rodando"
    echo "  - Erro no processamento"
    echo ""
    echo "Verificar logs:"
    echo "  tail -f storage/logs/laravel.log"
fi

echo ""
echo -e "${GREEN}=== Fim do teste ===${NC}"

