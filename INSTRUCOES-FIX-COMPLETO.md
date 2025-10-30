# 🚨 INSTRUÇÕES COMPLETAS: Fix de Produção

**Data:** 2025-10-30  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Total Estimado:** 10-15 minutos

---

## 📋 Problemas Identificados

Existem **DOIS problemas críticos** em produção que precisam ser corrigidos:

### 1. 🐛 **Tabela `replies` Incompleta**
- ❌ Coluna `is_internal` não existe
- ❌ Colunas `from_email`, `from_name`, `via` não existem
- ❌ Respostas por e-mail não funcionam

### 2. 🐛 **Vendor Corrompido (Symfony)**
- ❌ Arquivos do Symfony faltando no `vendor/`
- ❌ Aplicação quebrada
- ❌ Comandos artisan falhando

---

## 🎯 Solução Recomendada: DEPLOY NOVO

A **melhor solução** é fazer um **novo deploy completo** que corrige ambos os problemas de uma vez:

### ✅ Por que Deploy Novo?

1. **Corrige ambos os problemas simultaneamente**
2. **Recria vendor do zero** (limpo e íntegro)
3. **Executa migration corretiva** da tabela `replies`
4. **Atualiza código** para versão mais recente
5. **Mantém release anterior** para rollback se necessário
6. **Zero downtime** (troca atômica via symlink)

---

## 🚀 PASSO A PASSO (RECOMENDADO)

### Pré-requisitos

```bash
# Conectar ao servidor
ssh usuario@servidor

# Verificar espaço em disco (precisa de pelo menos 2GB livres)
df -h
```

---

### Passo 1: Backup (OBRIGATÓRIO) ⚠️

```bash
cd /var/www/fluxdesk

# Fazer backup do banco
./backup-database.sh

# Verificar se backup foi criado
ls -lh backup/ | tail -1
```

**✅ NÃO prossiga sem confirmar que o backup foi criado!**

---

### Passo 2: Verificar Código Atualizado no GitHub

```bash
# No seu computador local (não no servidor)
cd /caminho/do/projeto/fludesk

# Verificar status
git status

# Se houver mudanças não commitadas, commitar:
git add .
git commit -m "fix: corrigir tabela replies e vendor"
git push origin main
```

**✅ Confirme que o push foi bem-sucedido antes de continuar.**

---

### Passo 3: Deploy Nova Release

```bash
# No servidor
cd /var/www/fluxdesk

# Executar deploy
sudo bash Setup/install_and_deploy.sh deploy
```

**O que vai acontecer:**
1. ✅ Clone novo do repositório
2. ✅ Instala dependências PHP (Composer) - **VENDOR NOVO**
3. ✅ Instala dependências Node (pnpm)
4. ✅ Compila assets (Vite)
5. ✅ Executa migrations - **CORRIGE TABELA REPLIES**
6. ✅ Otimiza caches
7. ✅ Troca symlink para nova release
8. ✅ Reinicia serviços
9. ✅ Executa smoke tests

**Tempo estimado:** 5-7 minutos

---

### Passo 4: Verificação Pós-Deploy

#### 4.1 Verificar Vendor (Symfony)

```bash
cd /var/www/fluxdesk/current

# Verificar arquivos do Symfony que estavam faltando
test -f vendor/symfony/console/Event/ConsoleErrorEvent.php && echo "✅ OK" || echo "❌ FALTANDO"
test -f vendor/symfony/string/Resources/data/wcswidth_table_zero.php && echo "✅ OK" || echo "❌ FALTANDO"

# Testar artisan
php artisan --version
```

**Deve mostrar versão do Laravel sem erros.**

#### 4.2 Verificar Tabela Replies

```bash
# Verificar estrutura da tabela
sudo -u postgres psql fluxdesk -c "\d replies"
```

**Deve mostrar as colunas:**
- ✅ `is_internal` (boolean)
- ✅ `from_email` (character varying)
- ✅ `from_name` (character varying)
- ✅ `via` (character varying)

#### 4.3 Verificar Logs

```bash
# Monitorar logs (Ctrl+C para sair)
tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log
```

**NÃO deve aparecer:**
- ❌ "Failed to open stream"
- ❌ "column is_internal does not exist"
- ❌ Erros relacionados a Symfony

#### 4.4 Verificar Aplicação

```bash
# Testar HTTP
curl -I https://app.fluxdesk.com.br

# Deve retornar: HTTP/1.1 200 OK ou 302
```

#### 4.5 Verificar Serviços

```bash
# PHP-FPM
sudo systemctl status php8.3-fpm

# Queue Workers
sudo systemctl status fluxdesk-queue

# Nginx
sudo systemctl status nginx
```

**Todos devem estar:** `active (running)`

---

### Passo 5: Teste Funcional

#### Teste de Resposta por E-mail

1. **Abrir ticket existente** no sistema
2. **Copiar o e-mail de Reply-To** da notificação recebida
3. **Enviar e-mail respondendo** ao ticket
4. **Aguardar alguns segundos** (processing)
5. **Atualizar página do ticket**
6. **Verificar se resposta aparece** na aba "Comunicação"

---

## 🆘 Plano B: Se o Deploy Falhar

Se o deploy der erro, você tem duas opções:

### Opção B1: Corrigir Vendor na Release Antiga

```bash
cd /var/www/fluxdesk

# Executar script de correção
sudo bash fix-vendor-production.sh
```

Isso vai:
- Reinstalar vendor na release problemática
- Limpar e recriar caches
- Reiniciar serviços

**Mas:** Isso NÃO corrige a tabela `replies`!

---

### Opção B2: Correções Individuais

Se você quiser corrigir cada problema separadamente:

#### B2.1 Corrigir Apenas Vendor

```bash
cd /var/www/fluxdesk/current

# Limpar e reinstalar
composer clear-cache
rm -rf vendor/
COMPOSER_MEMORY_LIMIT=-1 composer install --no-dev --optimize-autoloader --no-interaction

# Recarregar serviços
sudo systemctl reload php8.3-fpm
sudo systemctl restart fluxdesk-queue
```

#### B2.2 Corrigir Apenas Tabela Replies

```bash
cd /var/www/fluxdesk/current

# Pull das mudanças (se já fez commit)
git pull origin main

# Executar migration
php artisan migrate --force

# Verificar
sudo -u postgres psql fluxdesk -c "\d replies"
```

---

## 🔄 Rollback (Última Opção)

Se tudo der errado e a aplicação ficar pior:

```bash
cd /var/www/fluxdesk

# Rollback para release anterior
sudo bash Setup/install_and_deploy.sh rollback

# Verificar
curl -I https://app.fluxdesk.com.br
```

**⚠️ ATENÇÃO:** Rollback NÃO desfaz migrations! A tabela `replies` continuará com as novas colunas (se foram adicionadas).

---

## ✅ Checklist Final

Após o deploy, confirme:

### Vendor Corrompido
- [ ] Arquivos Symfony existem
- [ ] `php artisan --version` funciona
- [ ] Logs sem "Failed to open stream"

### Tabela Replies
- [ ] Coluna `is_internal` existe
- [ ] Colunas `from_email`, `from_name`, `via` existem
- [ ] Logs sem "column is_internal does not exist"
- [ ] Teste de resposta por e-mail funciona

### Geral
- [ ] Backup do banco criado
- [ ] Deploy completou sem erros
- [ ] Serviços rodando (PHP-FPM, queue, nginx)
- [ ] Aplicação responde (HTTP 200)
- [ ] Logs limpos (sem erros críticos)

---

## 📊 Resumo de Tempo

| Etapa | Tempo |
|-------|-------|
| Backup | 2-3 min |
| Commit + Push | 1-2 min |
| Deploy | 5-7 min |
| Verificação | 2-3 min |
| Testes | 2-3 min |
| **TOTAL** | **12-18 min** |

---

## 📞 Troubleshooting

### Problema: Deploy falha no composer install

```bash
# Verificar espaço em disco
df -h

# Se pouco espaço, limpar releases antigas
sudo bash Setup/install_and_deploy.sh cleanup

# Tentar novamente
sudo bash Setup/install_and_deploy.sh deploy
```

### Problema: Migration falha

```bash
# Verificar conexão com banco
sudo -u postgres psql fluxdesk -c "SELECT version();"

# Ver detalhes do erro
tail -100 /var/www/fluxdesk/shared/storage/logs/laravel.log | grep -i "migration"

# Se a coluna já existe, é seguro continuar
```

### Problema: Serviços não iniciam

```bash
# Ver logs detalhados
sudo journalctl -u php8.3-fpm -n 50
sudo journalctl -u fluxdesk-queue -n 50

# Verificar configuração PHP
php -i | grep memory_limit

# Reiniciar manualmente
sudo systemctl restart php8.3-fpm
sudo systemctl restart fluxdesk-queue
sudo systemctl restart nginx
```

---

## 🎯 Resultado Esperado

**Após este procedimento:**

✅ **Vendor íntegro** - Todos os arquivos Symfony presentes  
✅ **Tabela replies completa** - Todas as colunas necessárias  
✅ **Respostas por e-mail funcionando** - Clientes podem responder  
✅ **Aplicação 100% funcional** - Sem erros nos logs  
✅ **Queue processando** - Jobs executando normalmente  

---

## 📚 Documentação Adicional

- **Vendor corrompido:** `BUGFIX-VENDOR-CORROMPIDO.md`
- **Tabela replies:** `BUGFIX-REPLIES-TABLE.md`
- **Deploy completo:** `INSTRUCOES-DEPLOY-URGENTE.md`
- **Resumo executivo:** `RESUMO-FIX-REPLIES.md`

---

**BOA SORTE! 🚀**

**Em caso de dúvidas, siga exatamente este documento passo a passo.**

