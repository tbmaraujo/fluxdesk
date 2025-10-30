# 🐛 Bugfix: Tabela `replies` - Colunas Faltantes

**Data:** 2025-10-30  
**Prioridade:** 🔴 **CRÍTICA**  
**Status:** ✅ Corrigido

---

## 📋 Resumo

O sistema estava recebendo tickets por e-mail corretamente, mas **respostas de clientes por e-mail não apareciam na aba "Comunicação"** do ticket.

### Erro Identificado

```
SQLSTATE[42703]: Undefined column: 7 ERROR:  column "is_internal" of relation "replies" does not exist
LINE 1: ...nto "replies" ("ticket_id", "user_id", "content", "is_intern...
```

---

## 🔍 Causa Raiz

A tabela `replies` **não tinha colunas essenciais** que o código tentava usar:

| Coluna | Status | Problema |
|--------|--------|----------|
| `is_internal` | ❌ Não existe | Código tentava inserir, mas coluna nunca foi criada |
| `from_email` | ❌ Não existe | Migration criada mas não executada em produção |
| `from_name` | ❌ Não existe | Migration criada mas não executada em produção |
| `via` | ❌ Não existe | Migration criada mas não executada em produção |

### Estrutura Original (Incorreta)

```sql
-- Tabela replies original
CREATE TABLE replies (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    external_message_id VARCHAR(255) UNIQUE,  -- Adicionado depois
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Estrutura Corrigida

```sql
-- Tabela replies corrigida
CREATE TABLE replies (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,        -- ✅ NOVO
    external_message_id VARCHAR(255) UNIQUE,
    from_email VARCHAR(255),                  -- ✅ NOVO
    from_name VARCHAR(255),                   -- ✅ NOVO
    via VARCHAR(50) DEFAULT 'internal',       -- ✅ NOVO (enum: internal, email, portal)
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## ✅ Solução Implementada

### 1. Migration Atualizada

**Arquivo:** `database/migrations/2025_10_29_174842_add_email_fields_to_replies_table.php`

```php
public function up(): void
{
    Schema::table('replies', function (Blueprint $table) {
        // ✅ Adicionar is_internal se não existir
        if (!Schema::hasColumn('replies', 'is_internal')) {
            $table->boolean('is_internal')->default(false)->after('content');
        }
        
        // ✅ Adicionar campos de e-mail
        $table->string('from_email')->nullable()->after('external_message_id');
        $table->string('from_name')->nullable()->after('from_email');
        $table->enum('via', ['internal', 'email', 'portal'])
            ->default('internal')
            ->after('from_name');
    });
}
```

### 2. Model Atualizado

**Arquivo:** `app/Models/Reply.php`

```php
protected $fillable = [
    "user_id",
    "ticket_id",
    "content",
    "is_internal",           // ✅ Campo obrigatório
    "external_message_id",
    "from_email",            // ✅ Para respostas por e-mail
    "from_name",             // ✅ Para respostas por e-mail
    "via",                   // ✅ Origem: internal, email, portal
];
```

### 3. Service Atualizado

**Arquivo:** `app/Services/EmailInboundService.php`

O serviço já estava usando os campos corretamente:

```php
$reply = Reply::create([
    'ticket_id' => $ticket->id,
    'user_id' => null,
    'content' => $content,
    'is_internal' => false,           // ✅ Usa o campo
    'external_message_id' => $messageId,
    'from_email' => $fromEmail,       // ✅ Usa o campo
    'from_name' => $reply->from_name, // ✅ Usa o campo
    'via' => 'email',                 // ✅ Usa o campo
]);
```

---

## 🚀 Deploy em Produção

### Passo 1: Verificar Estrutura Atual

```bash
# Conectar ao PostgreSQL em produção
sudo -u postgres psql fluxdesk

# Executar script de verificação
\i /var/www/fluxdesk/verify-replies-table.sql
```

### Passo 2: Executar Deploy

```bash
# Dar permissão de execução
chmod +x /var/www/fluxdesk/deploy-fix-replies.sh

# Executar deploy
cd /var/www/fluxdesk
./deploy-fix-replies.sh
```

### Passo 3: Verificar Correção

```bash
# Verificar estrutura da tabela após migration
sudo -u postgres psql fluxdesk -c "\d replies"

# Verificar logs
tail -f /var/www/fluxdesk/storage/logs/laravel.log

# Testar envio de e-mail de resposta
# (enviar e-mail respondendo a um ticket existente)
```

---

## 🧪 Testes

### Teste 1: Criar Resposta Interna

```bash
# Via painel web, adicionar resposta a um ticket
# Deve funcionar normalmente
```

### Teste 2: Resposta por E-mail

```bash
# 1. Criar ticket via e-mail
# 2. Receber notificação com Reply-To HMAC
# 3. Responder o e-mail
# 4. Verificar se resposta aparece na aba "Comunicação"
```

### Teste 3: Verificar Campos

```sql
-- Verificar se os novos campos estão sendo preenchidos
SELECT 
    id,
    ticket_id,
    is_internal,
    from_email,
    from_name,
    via,
    created_at
FROM replies
WHERE via = 'email'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 Impacto

### Antes da Correção
- ❌ Respostas por e-mail causavam erro 500
- ❌ Clientes não conseguiam responder por e-mail
- ❌ Jobs da fila falhavam continuamente
- ❌ Tickets ficavam sem respostas dos clientes

### Após a Correção
- ✅ Respostas por e-mail funcionam corretamente
- ✅ Clientes podem responder tickets por e-mail
- ✅ Jobs processam sem erros
- ✅ Histórico de comunicação completo

---

## 🔐 Rollback (se necessário)

**⚠️ ATENÇÃO:** O rollback vai **remover dados** se houver respostas criadas após o deploy!

```bash
cd /var/www/fluxdesk/current

# Reverter migration
php artisan migrate:rollback --step=1

# Ou reverter manualmente no PostgreSQL
sudo -u postgres psql fluxdesk -c "
ALTER TABLE replies 
DROP COLUMN IF EXISTS is_internal,
DROP COLUMN IF EXISTS from_email,
DROP COLUMN IF EXISTS from_name,
DROP COLUMN IF EXISTS via;
"
```

---

## 📝 Lições Aprendidas

1. **Sempre executar migrations em produção** após criar novas
2. **Validar estrutura do banco** antes de fazer deploy de código que usa novos campos
3. **Criar migrations completas** que incluam todos os campos necessários
4. **Testes de integração** devem validar estrutura do banco

---

## 🔗 Arquivos Relacionados

- Migration: `database/migrations/2025_10_29_174842_add_email_fields_to_replies_table.php`
- Model: `app/Models/Reply.php`
- Service: `app/Services/EmailInboundService.php`
- Script de deploy: `deploy-fix-replies.sh`
- Script de verificação: `verify-replies-table.sql`

---

## ✅ Checklist de Verificação Pós-Deploy

- [ ] Migration executada com sucesso
- [ ] Estrutura da tabela `replies` correta
- [ ] PHP-FPM recarregado
- [ ] Queue workers reiniciados
- [ ] Logs sem erros relacionados a `is_internal`
- [ ] Teste de resposta por e-mail funcionando
- [ ] Resposta aparece na aba "Comunicação" do ticket
- [ ] Campos `from_email`, `from_name` e `via` preenchidos corretamente

