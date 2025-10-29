#!/usr/bin/env bash
#
# Script de teste para criação de NOVO TICKET via Mailgun inbound
# Uso:
#   bash test-mailgun-new-ticket.sh [.env_path] [endpoint_url] [tenant_identifier]
#
# Exemplo:
#   bash test-mailgun-new-ticket.sh .env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound 42262851012132
#   bash test-mailgun-new-ticket.sh .env http://127.0.0.1:8000/api/webhooks/mailgun-inbound myslug
#

set -euo pipefail

ENV_FILE="${1:-.env}"
ENDPOINT="${2:-http://127.0.0.1:8000/api/webhooks/mailgun-inbound}"
TENANT_IDENTIFIER="${3:-}"

if [[ -z "$TENANT_IDENTIFIER" ]]; then
    echo "Erro: forneça o identificador do tenant (slug, email_code ou ID)"
    echo "Uso: $0 [.env_path] [endpoint_url] [tenant_identifier]"
    exit 1
fi

# Carregar MAILGUN_SIGNING_KEY do .env
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Erro: arquivo $ENV_FILE não encontrado"
    exit 1
fi

# Extrair a signing key (ordem: SIGNING_KEY -> WEBHOOK_SIGNING_KEY -> SECRET)
SIGNING_KEY=$(grep -E '^MAILGUN_SIGNING_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
if [[ -z "$SIGNING_KEY" ]]; then
    SIGNING_KEY=$(grep -E '^MAILGUN_WEBHOOK_SIGNING_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi
if [[ -z "$SIGNING_KEY" ]]; then
    SIGNING_KEY=$(grep -E '^MAILGUN_SECRET=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

if [[ -z "$SIGNING_KEY" ]]; then
    echo "Erro: nenhuma signing key encontrada no .env"
    echo "Configure MAILGUN_SIGNING_KEY, MAILGUN_WEBHOOK_SIGNING_KEY ou MAILGUN_SECRET"
    exit 1
fi

echo "SIGNING_KEY=${#SIGNING_KEY} chars"

# Gerar timestamp, token e assinatura
TS=$(date +%s)
TK=$(openssl rand -hex 12)
SIG=$(printf "%s%s" "$TS" "$TK" | openssl dgst -sha256 -hmac "$SIGNING_KEY" -r | awk '{print $1}')

echo "TS=$TS  TK=$TK"
echo "SIG=$SIG"

# Montar recipient
RECIPIENT="${TENANT_IDENTIFIER}@tickets.fluxdesk.com.br"
MSGID="test-new-ticket-$(date +%s)@example.test"

# Montar message-headers (JSON array de pares)
HEADERS="[[\"Message-Id\",\"$MSGID\"],[\"To\",\"$RECIPIENT\"],[\"From\",\"Cliente Teste <cliente@example.com>\"],[\"Subject\",\"Novo chamado de teste\"]]"

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
  --form-string "subject=Novo chamado de teste" \
  --form-string "body-plain=Olá, meu computador não liga. Preciso de ajuda urgente!" \
  --form-string "body-html=<p>Olá, meu computador não liga. Preciso de ajuda urgente!</p>" \
  --form-string "stripped-text=Olá, meu computador não liga. Preciso de ajuda urgente!" \
  --form-string "Message-Id=$MSGID" \
  --form-string "message-headers=$HEADERS"

echo ""

