# Correção: Processamento de Payload do Mailgun

**Data:** 29/10/2025  
**Tipo:** Bugfix  
**Prioridade:** Alta  
**Status:** ✅ Implementado

---

## 📋 Problema Identificado

Ao testar o recebimento de e-mails via webhook do Mailgun, o sistema apresentava erro:

```
[2025-10-29 17:08:23] production.ERROR: Não foi possível extrair tenant_id do destinatário:  (todos destinatários: )
```

### Causa Raiz

O `EmailInboundService::processInboundEmail()` estava **esperando exclusivamente o formato de payload do Amazon SES**, mas recebendo dados no **formato do Mailgun**.

**Formato SES (esperado):**
```php
[
    'mail' => [
        'source' => 'cliente@example.com',
        'destination' => ['tenant@tickets.fluxdesk.com.br'],
        'commonHeaders' => [
            'subject' => 'Assunto',
            // ...
        ]
    ]
]
```

**Formato Mailgun (recebido):**
```php
[
    'sender' => 'cliente@example.com',
    'recipient' => 'tenant@tickets.fluxdesk.com.br',
    'subject' => 'Assunto',
    'body-plain' => '...',
    'body-html' => '...',
    // ...
]
```

Como os campos não existiam no payload do Mailgun, as variáveis ficavam **vazias**, resultando no erro.

---

## 🔧 Solução Implementada

### 1. Detecção Automática de Formato

Adicionado método `isMailgunPayload()` que identifica o tipo de payload:

```php
private function isMailgunPayload(array $payload): bool
{
    return isset($payload['recipient']) 
        || isset($payload['sender'])
        || isset($payload['body-plain']);
}
```

### 2. Processamento Específico para Mailgun

Criado método `processMailgunEmail()` que:
- Extrai corretamente os campos do Mailgun (`sender`, `recipient`, `body-plain`, etc.)
- Normaliza os dados no formato esperado pelos métodos internos
- Processa anexos no formato do Mailgun (`attachment-1`, `attachment-2`, etc.)

### 3. Manutenção da Compatibilidade com SES

O método original foi refatorado para `processSESEmail()`, mantendo toda a lógica existente.

### 4. Arquitetura Final

```
processInboundEmail()
  ├─> isMailgunPayload()?
  │   ├─> [SIM] processMailgunEmail()
  │   │   ├─> Extrai campos do Mailgun
  │   │   ├─> Normaliza dados
  │   │   ├─> Processa anexos
  │   │   └─> Cria ticket/resposta
  │   │
  │   └─> [NÃO] processSESEmail()
  │       ├─> Extrai campos do SES
  │       ├─> Busca conteúdo do S3 (se necessário)
  │       └─> Cria ticket/resposta
```

---

## 📁 Arquivos Modificados

### `app/Services/EmailInboundService.php`

**Mudanças:**
1. ✅ `processInboundEmail()` - Refatorado para detectar formato automaticamente
2. ✅ `isMailgunPayload()` - Novo método privado
3. ✅ `processMailgunEmail()` - Novo método privado para Mailgun
4. ✅ `extractMailgunAttachmentsArray()` - Novo método privado
5. ✅ `processSESEmail()` - Refatorado do código original

**Impacto:**
- ✅ Mantém 100% de compatibilidade com SES
- ✅ Adiciona suporte completo ao Mailgun
- ✅ Sem breaking changes

---

## 🧪 Como Testar

### 1. Preparação

Certifique-se de ter:
- Um tenant válido no banco de dados
- E-mail do tenant: `{slug}@tickets.fluxdesk.com.br` ou `{email_code}@tickets.fluxdesk.com.br`
- Rota do Mailgun configurada (ver imagem fornecida)

### 2. Teste via Script

Execute:
```bash
./test-endpoint-simple.sh https://app.fluxdesk.com.br/api/webhooks/mailgun-test
```

**Observação:** Este endpoint só loga os dados (diagnóstico), não processa e-mails.

### 3. Teste Real via Mailgun

Envie um e-mail para:
```
SEU_TENANT_SLUG@tickets.fluxdesk.com.br
```

### 4. Monitore os Logs

```bash
tail -f storage/logs/laravel.log | grep -E '(Mailgun|tenant_id|EmailIngest)'
```

**Logs esperados (sucesso):**
```
[INFO] Processando e-mail do Mailgun
[INFO] Email do Mailgun parseado
[INFO] Tenant identificado por slug/email_code
[INFO] Novo ticket enfileirado para processamento
[INFO] Email ingerido e processado com sucesso
```

**Logs de erro (se ainda houver problemas):**
```
[ERROR] Não foi possível extrair tenant_id do destinatário
[ERROR] Tenant não encontrado
```

---

## 🚀 Deploy

### Passo a Passo

1. **Commit e Push:**
   ```bash
   git add app/Services/EmailInboundService.php
   git commit -m "fix: suporte a payload do Mailgun no EmailInboundService"
   git push origin main
   ```

2. **Execute o script de deploy:**
   ```bash
   ssh user@app.fluxdesk.com.br
   cd /var/www/fluxdesk/current
   ./deploy-fix-mailgun-payload.sh
   ```

3. **Reinicie os queue workers (IMPORTANTE):**
   ```bash
   sudo supervisorctl restart fluxdesk-worker:*
   # ou
   php artisan queue:restart
   ```

### Checklist Pós-Deploy

- [ ] Código atualizado em produção
- [ ] Queue workers reiniciados
- [ ] Cache do Laravel limpo
- [ ] Teste de e-mail real executado
- [ ] Logs monitorados por 5-10 minutos
- [ ] Ticket criado com sucesso

---

## 🔍 Troubleshooting

### Erro: "Não foi possível extrair tenant_id"

**Causas possíveis:**
1. Tenant não existe no banco (slug/email_code incorreto)
2. Tenant está inativo (`is_active = false`)
3. Formato do e-mail incorreto

**Solução:**
```sql
-- Verificar tenants ativos
SELECT id, slug, email_code, is_active FROM tenants WHERE is_active = true;

-- Se necessário, criar email_code
UPDATE tenants SET email_code = 'codigo-unico' WHERE id = X;
```

### Erro: "Tenant não encontrado"

O tenant_id foi extraído mas não existe no banco.

**Solução:**
```sql
SELECT * FROM tenants WHERE id = X;
```

### Queue workers não estão processando

**Solução:**
```bash
# Verificar status
php artisan queue:listen --timeout=60 --tries=3

# Verificar failed_jobs
php artisan queue:failed
```

---

## 📊 Métricas de Sucesso

Após o deploy, espera-se:

- ✅ Taxa de erro em webhooks do Mailgun: **0%**
- ✅ Tickets criados via e-mail: **100%**
- ✅ Tempo de processamento: **< 5 segundos**
- ✅ Compatibilidade SES mantida: **100%**

---

## 🔗 Referências

- **Documentação Mailgun Webhooks:** https://documentation.mailgun.com/docs/mailgun/user-manual/receive-and-forward/
- **Rota no Mailgun:** Ver screenshot fornecido
- **Script de teste:** `test-endpoint-simple.sh`
- **Endpoint de teste:** `/api/webhooks/mailgun-test`
- **Endpoint de produção:** `/api/webhooks/mailgun-inbound`

---

## 📝 Notas Importantes

1. **Idempotência mantida:** O sistema continua usando `Message-ID` para evitar duplicatas
2. **HMAC validado:** O middleware `VerifyMailgunSignature` continua ativo no endpoint de produção
3. **Anexos suportados:** Ambos formatos (SES e Mailgun) processam anexos corretamente
4. **Threading mantido:** Reply-To HMAC, In-Reply-To e Subject [TKT-ID] continuam funcionando

---

**Autor:** Sistema Fluxdesk  
**Revisado por:** -  
**Aprovado para produção:** ✅

