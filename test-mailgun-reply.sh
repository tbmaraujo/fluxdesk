#!/usr/bin/env bash
#
# Script de teste para RESPOSTA A TICKET via Mailgun inbound (Reply-To HMAC)
# Uso:
#   bash test-mailgun-reply.sh [.env_path] [endpoint_url] [tenant_slug] [ticket_id]
#
# Exemplo:
#   bash test-mailgun-reply.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound myslug 123
#   bash test-mailgun-reply.sh .env http://127.0.0.1:8000/api/webhooks/mailgun-inbound myslug 45
#

set -euo pipefail

ENV_FILE="${1:-.env}"
ENDPOINT="${2:-http://127.0.0.1:8000/api/webhooks/mailgun-inbound}"
TENANT_SLUG="${3:-}"
TICKET_ID="${4:-}"

if [[ -z "$TENANT_SLUG" || -z "$TICKET_ID" ]]; then
    echo "Erro: forneça o tenant_slug e o ticket_id"
    echo "Uso: $0 [.env_path] [endpoint_url] [tenant_slug] [ticket_id]"
    exit 1
fi

# Carregar as chaves do .env
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Erro: arquivo $ENV_FILE não encontrado"
    exit 1
fi

# Extrair MAILGUN_SIGNING_KEY
SIGNING_KEY=$(grep -E '^MAILGUN_SIGNING_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
if [[ -z "$SIGNING_KEY" ]]; then
    SIGNING_KEY=$(grep -E '^MAILGUN_WEBHOOK_SIGNING_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi
if [[ -z "$SIGNING_KEY" ]]; then
    SIGNING_KEY=$(grep -E '^MAILGUN_SECRET=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

if [[ -z "$SIGNING_KEY" ]]; then
    echo "Erro: nenhuma signing key encontrada no .env"
    exit 1
fi

# Extrair REPLY_HMAC_SECRET
REPLY_SECRET=$(grep -E '^REPLY_HMAC_SECRET=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
if [[ -z "$REPLY_SECRET" ]]; then
    echo "Erro: REPLY_HMAC_SECRET não encontrado no .env"
    exit 1
fi

echo "SIGNING_KEY=${#SIGNING_KEY} chars"
echo "REPLY_SECRET=${#REPLY_SECRET} chars"

# Gerar timestamp, token e assinatura do Mailgun
TS=$(date +%s)
TK=$(openssl rand -hex 12)
SIG=$(printf "%s%s" "$TS" "$TK" | openssl dgst -sha256 -hmac "$SIGNING_KEY" -r | awk '{print $1}')

# Gerar HMAC para Reply-To
REPLY_HMAC=$(printf "%s|%s" "$TENANT_SLUG" "$TICKET_ID" | openssl dgst -sha256 -hmac "$REPLY_SECRET" -r | awk '{print $1}')
# Extrair 10 caracteres do meio (offset 10)
REPLY_HMAC_SHORT=$(echo "$REPLY_HMAC" | cut -c11-$((10+${#REPLY_HMAC})))

# Montar recipient com Reply-To HMAC
RECIPIENT="reply+tkt.${TENANT_SLUG}.${TICKET_ID}.${REPLY_HMAC_SHORT}@tickets.fluxdesk.com.br"
MSGID="test-reply-$(date +%s)@example.test"

# Montar message-headers
HEADERS="[[\"Message-Id\",\"$MSGID\"],[\"To\",\"$RECIPIENT\"],[\"From\",\"Cliente Teste <cliente@example.com>\"],[\"Subject\",\"Re: [TKT-${TICKET_ID}] Chamado\"]]"

echo ""
echo "TS=$TS  TK=$TK"
echo "SIG=$SIG"
echo "REPLY_HMAC=$REPLY_HMAC_SHORT"
echo ""
echo "Endpoint : $ENDPOINT"
echo ".env     : $ENV_FILE"
echo "Recipient: $RECIPIENT"
echo "Msg-ID   : $MSGID"
echo ""

# Fazer request
curl -sS -i -X POST "$ENDPOINT" \
  -H "User-Agent: Mailgun/Routes" \
  -F "timestamp=$TS" \
  -F "token=$TK" \
  -F "signature=$SIG" \
  --form-string "recipient=$RECIPIENT" \
  --form-string "to=$RECIPIENT" \
  --form-string "sender=cliente@example.com" \
  --form-string "from=Cliente Teste <cliente@example.com>" \
  --form-string "subject=Re: [TKT-${TICKET_ID}] Chamado" \
  --form-string "body-plain=Obrigado pela atenção. Aguardo retorno." \
  --form-string "body-html=<p>Obrigado pela atenção. Aguardo retorno.</p>" \
  --form-string "stripped-text=Obrigado pela atenção. Aguardo retorno." \
  --form-string "Message-Id=$MSGID" \
  --form-string "message-headers=$HEADERS"

echo ""

