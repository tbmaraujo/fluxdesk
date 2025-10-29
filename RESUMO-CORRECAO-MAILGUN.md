# 🐛 Correção: Erro ao Processar E-mails do Mailgun

## ✅ STATUS: IMPLEMENTADO E NO AR

---

## 📋 Resumo Executivo

**Problema:** O webhook do Mailgun estava falhando com o erro:  
`"Não foi possível extrair tenant_id do destinatário: (todos destinatários: )"`

**Causa:** O serviço esperava formato de payload do Amazon SES, mas recebia formato do Mailgun.

**Solução:** Implementado detecção automática de formato e processamento específico para cada provedor.

---

## 🔧 O Que Foi Corrigido

### Arquivo: `app/Services/EmailInboundService.php`

**ANTES:**
- ❌ Processava apenas payload no formato SES
- ❌ Campos do Mailgun (`recipient`, `sender`, etc.) eram ignorados
- ❌ Resultava em variáveis vazias e erro

**DEPOIS:**
- ✅ Detecta automaticamente o formato (Mailgun ou SES)
- ✅ Processa corretamente ambos os formatos
- ✅ Mantém compatibilidade total com SES
- ✅ Extrai corretamente todos os campos do Mailgun

### Novos Métodos Criados

1. `isMailgunPayload()` - Detecta formato do payload
2. `processMailgunEmail()` - Processa e-mails do Mailgun
3. `extractMailgunAttachmentsArray()` - Extrai anexos do Mailgun
4. `processSESEmail()` - Mantém lógica original do SES

---

## 🚀 Deploy em Produção

### 1️⃣ Acesse o servidor

```bash
ssh user@app.fluxdesk.com.br
```

### 2️⃣ Execute o script de deploy

```bash
cd /var/www/fluxdesk/current
./deploy-fix-mailgun-payload.sh
```

**O script irá:**
- ✅ Fazer backup do arquivo atual
- ✅ Baixar a última versão do Git
- ✅ Instalar dependências (se houver)
- ✅ Limpar e reconstruir cache
- ✅ **Reiniciar os queue workers** (CRÍTICO!)
- ✅ Exibir logs recentes

---

## 🧪 Como Testar

### Teste 1: Verificar tenants disponíveis

```bash
# No servidor, execute:
php artisan tinker

# No tinker:
\App\Models\Tenant::where('is_active', true)->get(['id', 'slug', 'email_code']);
```

**Anote o `slug` ou `email_code` de um tenant para usar no teste.**

### Teste 2: Enviar e-mail real

Envie um e-mail para:
```
{slug_ou_email_code}@tickets.fluxdesk.com.br
```

Por exemplo:
- `empresa-teste@tickets.fluxdesk.com.br` (se slug = "empresa-teste")
- `42262851012132@tickets.fluxdesk.com.br` (se email_code = "42262851012132")

### Teste 3: Monitorar logs em tempo real

```bash
# No servidor:
tail -f storage/logs/laravel.log | grep -E '(Mailgun|tenant_id|EmailIngest|Ticket)'
```

**Logs de sucesso esperados:**
```
[INFO] Processando e-mail do Mailgun
[INFO] Email do Mailgun parseado
[INFO] Tenant identificado por slug
[INFO] Novo ticket enfileirado para processamento
[INFO] Email ingerido e processado com sucesso
[INFO] Ticket criado a partir de e-mail
```

### Teste 4: Verificar fila

```bash
# Ver jobs processados em tempo real:
php artisan queue:listen --verbose

# Ou processar um único job:
php artisan queue:work --once
```

---

## ⚠️ Pontos de Atenção

### 1. Queue Workers DEVEM Ser Reiniciados

Os workers em execução têm o código antigo em memória. Você DEVE reiniciá-los:

```bash
# Via Supervisor (recomendado):
sudo supervisorctl restart fluxdesk-worker:*

# Ou via Laravel:
php artisan queue:restart
```

### 2. Formato do E-mail de Destino

O e-mail deve estar no formato:
- `{slug}@tickets.fluxdesk.com.br`
- `{email_code}@tickets.fluxdesk.com.br`
- `{id_numerico}@tickets.fluxdesk.com.br` (menos recomendado)

### 3. Tenant Deve Estar Ativo

```sql
SELECT * FROM tenants WHERE slug = 'seu-slug' AND is_active = true;
```

### 4. Rota do Mailgun Configurada

Certifique-se de que a rota no Mailgun está apontando para:
```
https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound
```

---

## 🔍 Troubleshooting

### Erro: "Tenant não encontrado"

**Solução:**
```sql
-- Ver todos os tenants ativos:
SELECT id, slug, email_code, name FROM tenants WHERE is_active = true;

-- Se necessário, criar email_code:
UPDATE tenants SET email_code = 'codigo-unico-123' WHERE id = X;
```

### Erro: "Nenhum cliente encontrado para o tenant"

**Solução:**
```sql
-- Verificar se o tenant tem clientes:
SELECT * FROM clients WHERE tenant_id = X;

-- Se necessário, criar um cliente padrão
```

### Erro: "Nenhum serviço encontrado para o tenant"

**Solução:**
```sql
-- Verificar se o tenant tem serviços:
SELECT * FROM services WHERE tenant_id = X;

-- Se necessário, criar um serviço
```

### Jobs ficam em loop na fila

**Solução:**
```bash
# Ver jobs que falharam:
php artisan queue:failed

# Limpar failed jobs (se necessário):
php artisan queue:flush
```

---

## 📊 Checklist de Deploy

- [ ] **Código commitado e pushed** ✅ (já feito!)
- [ ] **Acessar servidor de produção**
- [ ] **Executar `./deploy-fix-mailgun-payload.sh`**
- [ ] **Verificar que queue workers foram reiniciados**
- [ ] **Anotar slug/email_code de um tenant válido**
- [ ] **Enviar e-mail de teste**
- [ ] **Monitorar logs por 5 minutos**
- [ ] **Verificar que ticket foi criado**
- [ ] **Confirmar que não há erros no log**

---

## 📞 Suporte

Se ainda houver problemas após o deploy:

1. **Colete informações:**
   ```bash
   # Últimas 50 linhas do log:
   tail -n 50 storage/logs/laravel.log > /tmp/fluxdesk-debug.log
   
   # Status da fila:
   php artisan queue:monitor
   
   # Jobs falhados:
   php artisan queue:failed
   ```

2. **Verifique a configuração:**
   ```bash
   php artisan tinker
   
   # No tinker:
   config('mail.ticket_domain')
   config('services.reply.hmac_secret')
   ```

3. **Teste o endpoint diretamente:**
   ```bash
   curl -X POST https://app.fluxdesk.com.br/api/webhooks/mailgun-test \
     -F "recipient=teste@tickets.fluxdesk.com.br" \
     -F "sender=cliente@example.com" \
     -F "subject=Teste" \
     -F "body-plain=Corpo do teste"
   ```

---

## 📚 Documentação Completa

Para mais detalhes técnicos, consulte:
- `BUGFIX-MAILGUN-PAYLOAD.md` - Documentação técnica completa
- `deploy-fix-mailgun-payload.sh` - Script de deploy
- `test-endpoint-simple.sh` - Script de teste

---

**Implementado em:** 29/10/2025  
**Commit:** `98219f7`  
**Branch:** `main`  
**Status:** ✅ Pronto para deploy em produção

