# 🚨 INSTRUÇÕES DE DEPLOY URGENTE

**Data:** 2025-10-30  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo estimado:** 15 minutos

---

## 📋 Contexto

**Problema identificado:** Respostas de clientes por e-mail não aparecem na aba "Comunicação" dos tickets.

**Erro no log:**
```
SQLSTATE[42703]: Undefined column: 7 ERROR:  
column "is_internal" of relation "replies" does not exist
```

**Causa:** A tabela `replies` no banco de dados de produção está **incompleta** - falta a coluna `is_internal` e outros campos necessários.

---

## 🎯 Solução

Foi criada uma **migration corretiva** que adiciona as colunas faltantes:
- `is_internal` (boolean) - Distinguir respostas internas de públicas
- `from_email` (varchar) - E-mail do remetente
- `from_name` (varchar) - Nome do remetente  
- `via` (enum) - Origem da resposta: `internal`, `email` ou `portal`

---

## 🚀 PASSO A PASSO DO DEPLOY

### ⚠️ IMPORTANTE: Leia TUDO antes de executar

### Pré-requisitos

- [ ] Acesso SSH ao servidor de produção
- [ ] Permissões sudo
- [ ] Backup do banco de dados atual

---

### Passo 1: Backup (OBRIGATÓRIO)

```bash
# Conectar ao servidor
ssh usuario@servidor

# Ir para o diretório do projeto
cd /var/www/fluxdesk

# Fazer backup do banco
./backup-database.sh

# Verificar se backup foi criado
ls -lh backup/
```

**✅ Confirme que o backup foi criado antes de prosseguir!**

---

### Passo 2: Atualizar Código

```bash
cd /var/www/fluxdesk

# Fazer pull das mudanças
git fetch origin main
git pull origin main

# Verificar se os arquivos foram atualizados
ls -l deploy-fix-replies.sh
ls -l database/migrations/2025_10_29_174842_add_email_fields_to_replies_table.php
```

---

### Passo 3: Executar Deploy

```bash
# Tornar script executável (se necessário)
chmod +x deploy-fix-replies.sh

# Executar deploy
./deploy-fix-replies.sh
```

**O que o script faz:**
1. ✅ Cria nova release do código
2. ✅ Atualiza dependências (Composer + pnpm)
3. ✅ Compila assets do frontend
4. ✅ Executa a migration corretiva
5. ✅ Otimiza caches do Laravel
6. ✅ Atualiza symlink para nova release
7. ✅ Reinicia PHP-FPM e queue workers

---

### Passo 4: Verificação Pós-Deploy

#### 4.1 Verificar Estrutura da Tabela

```bash
sudo -u postgres psql fluxdesk -c "\d replies"
```

**Deve mostrar as colunas:**
```
 id                   | bigint
 ticket_id            | bigint
 user_id              | bigint
 content              | text
 is_internal          | boolean          ✅ NOVA
 external_message_id  | character varying(255)
 from_email           | character varying(255)  ✅ NOVA
 from_name            | character varying(255)  ✅ NOVA
 via                  | character varying(50)   ✅ NOVA
 created_at           | timestamp
 updated_at           | timestamp
```

#### 4.2 Verificar Logs

```bash
tail -f /var/www/fluxdesk/storage/logs/laravel.log
```

**Não deve aparecer:**
- ❌ Erros sobre `is_internal`
- ❌ Erros sobre `from_email`, `from_name` ou `via`

#### 4.3 Verificar Serviços

```bash
# Status do PHP-FPM
sudo systemctl status php8.3-fpm

# Status do queue worker
sudo systemctl status fluxdesk-queue

# Verificar se jobs estão processando
cd /var/www/fluxdesk/current
php artisan queue:monitor
```

---

### Passo 5: Teste Funcional

#### 5.1 Teste de Resposta por E-mail

1. **Abrir um ticket existente** no sistema
2. **Enviar e-mail respondendo** ao ticket (usando o Reply-To recebido)
3. **Aguardar alguns segundos** (processing da fila)
4. **Atualizar página** do ticket no navegador
5. **Verificar se a resposta aparece** na aba "Comunicação"

#### 5.2 Verificar no Banco

```bash
sudo -u postgres psql fluxdesk -c "
SELECT 
    id,
    ticket_id,
    is_internal,
    from_email,
    from_name,
    via,
    LEFT(content, 50) as content_preview,
    created_at
FROM replies
WHERE via = 'email'
ORDER BY created_at DESC
LIMIT 5;
"
```

**Deve mostrar:**
- ✅ `is_internal` = false
- ✅ `from_email` preenchido
- ✅ `from_name` preenchido
- ✅ `via` = email

---

## ✅ Checklist Final

Após o deploy, confirme:

- [ ] Backup do banco criado
- [ ] Deploy executado sem erros
- [ ] Migration aplicada com sucesso
- [ ] Estrutura da tabela `replies` correta (4 colunas novas)
- [ ] PHP-FPM reiniciado
- [ ] Queue workers reiniciados
- [ ] Logs sem erros de `is_internal`
- [ ] Teste de resposta por e-mail funcional
- [ ] Resposta aparece na aba "Comunicação"
- [ ] Campos `from_email`, `from_name` e `via` preenchidos

---

## 🔄 Rollback (Apenas se Necessário)

**⚠️ ATENÇÃO:** Rollback remove os novos campos e **perde dados** de respostas criadas após o deploy!

```bash
cd /var/www/fluxdesk/current

# Reverter migration
php artisan migrate:rollback --step=1

# Reiniciar serviços
sudo systemctl reload php8.3-fpm
sudo systemctl restart fluxdesk-queue
```

**Se o rollback não funcionar**, restaurar backup do banco:

```bash
cd /var/www/fluxdesk

# Parar serviços
sudo systemctl stop php8.3-fpm
sudo systemctl stop fluxdesk-queue

# Restaurar backup (ajuste o nome do arquivo)
gunzip -c backup/fluxdesk_backup_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql fluxdesk

# Reiniciar serviços
sudo systemctl start php8.3-fpm
sudo systemctl start fluxdesk-queue
```

---

## 📞 Suporte

Se encontrar qualquer problema:

1. **NÃO ENTRE EM PÂNICO** 🧘
2. **Capture evidências:**
   - Screenshot do erro
   - Logs: `tail -100 /var/www/fluxdesk/storage/logs/laravel.log`
   - Estrutura da tabela: `sudo -u postgres psql fluxdesk -c "\d replies"`
3. **Considere rollback** se o problema for crítico
4. **Documente o problema** para análise posterior

---

## 📚 Documentação Adicional

- `BUGFIX-REPLIES-TABLE.md` - Documentação técnica completa
- `RESUMO-FIX-REPLIES.md` - Resumo executivo
- `verify-replies-table.sql` - Script SQL de verificação
- `test-migration-local.sh` - Script para testar localmente

---

## ⏱️ Tempo Estimado por Etapa

| Etapa | Tempo |
|-------|-------|
| Backup do banco | 2-3 min |
| Pull do código | 1 min |
| Deploy (script completo) | 5-7 min |
| Verificação | 3-5 min |
| Testes | 3-5 min |
| **TOTAL** | **~15-20 min** |

---

## 🎯 Resultado Esperado

Após este deploy:

✅ Clientes conseguem **responder tickets por e-mail**  
✅ Respostas aparecem **corretamente na aba "Comunicação"**  
✅ Sistema registra **origem da resposta** (email/internal/portal)  
✅ Sistema armazena **dados do remetente** (email e nome)  
✅ **Sem erros** nos logs relacionados a `is_internal`

---

**BOA SORTE! 🚀**

