# Deploy: Fix Email Replies - Colunas Ausentes

## 🔴 Problema
Cliente responde ticket por e-mail e a interação não é criada.

**Erro:**
```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "is_internal" of relation "replies" does not exist
```

## 🎯 Causa
Migration não foi executada em produção. As colunas necessárias não existem na tabela `replies`:
- `is_internal` (boolean)
- `from_email` (string, nullable)
- `from_name` (string, nullable)
- `via` (enum: internal, email, portal)

## ✅ Solução

### 1. Fazer pull do código
```bash
cd /var/www/fluxdesk/current
git pull origin main
```

### 2. Executar script de deploy
```bash
./deploy-fix-email-replies.sh
```

### 3. Verificar manualmente (se necessário)
```bash
# Ver estrutura da tabela
sudo -u www-data psql -U fluxdesk -d fluxdesk -c "\d replies"

# Verificar colunas específicas
sudo -u www-data psql -U fluxdesk -d fluxdesk -c "
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'replies' 
AND column_name IN ('is_internal', 'from_email', 'from_name', 'via')
ORDER BY ordinal_position;
"

# Se necessário, executar migration manualmente
cd /var/www/fluxdesk/current
sudo -u www-data php artisan migrate --force
```

## 🧪 Teste
1. Enviar e-mail respondendo um ticket existente com [TKT-ID] no assunto
2. Verificar se a resposta aparece no ticket
3. Verificar logs: `tail -f /var/www/fluxdesk/current/storage/logs/laravel.log`

## 📋 Arquivos alterados
- `database/migrations/2025_10_29_174842_add_email_fields_to_replies_table.php` (corrigida)
- `app/Models/Reply.php` (já com fillable atualizado)
- `app/Services/EmailInboundService.php` (usa as novas colunas)
- `resources/js/Pages/Tickets/Show.tsx` (exibe via e from_name)

## ⚠️ Importante
- A migration é **idempotente**: verifica se a coluna existe antes de adicionar
- Não afeta dados existentes
- Queue workers serão reiniciados automaticamente pelo script

