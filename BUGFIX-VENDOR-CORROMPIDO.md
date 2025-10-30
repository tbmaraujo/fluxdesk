# 🐛 Bugfix: Vendor Corrompido - Arquivos Symfony Faltando

**Data:** 2025-10-30  
**Prioridade:** 🔴 **CRÍTICA**  
**Status:** ✅ Script de correção criado

---

## 📋 Resumo

Erros indicando que arquivos do Symfony estão faltando no diretório `vendor/`, causando falhas na aplicação.

---

## 🐛 Erros Identificados

### Erro 1: ConsoleErrorEvent.php
```
[2025-10-30 00:17:32] production.ERROR: 
include(/var/www/fluxdesk/releases/2025-10-29-235754/vendor/composer/../symfony/console/Event/ConsoleErrorEvent.php): 
Failed to open stream: No such file or directory
```

**Arquivo faltando:**
```
vendor/symfony/console/Event/ConsoleErrorEvent.php
```

### Erro 2: wcswidth_table_zero.php
```
[2025-10-30 00:17:32] production.ERROR: 
require(/var/www/fluxdesk/releases/2025-10-29-235754/vendor/symfony/string/Resources/data/wcswidth_table_zero.php): 
Failed to open stream: No such file or directory
```

**Arquivo faltando:**
```
vendor/symfony/string/Resources/data/wcswidth_table_zero.php
```

---

## 🔍 Causa Raiz

Esses erros indicam que o diretório `vendor/` está **incompleto ou corrompido**. Possíveis causas:

### 1. **Composer Install Interrompido** ⚠️
- Deploy foi interrompido durante `composer install`
- Timeout de rede ao baixar pacotes
- Memória insuficiente durante instalação

### 2. **Permissões Incorretas** 🔒
- Arquivos criados sem permissão de leitura
- Propriedade incorreta (não pertence ao usuário correto)

### 3. **Espaço em Disco Insuficiente** 💾
- Disco cheio durante instalação
- Arquivos parcialmente escritos

### 4. **Cache Corrompido do Composer** 🗂️
- Cache local do Composer com arquivos inválidos
- Versões conflitantes em cache

### 5. **Git Clone Incompleto** 📦
- Clone do repositório não completou 100%
- Arquivos do vendor commitados no repo (má prática)

---

## ✅ Solução

Criei um script automatizado que:

1. ✅ Detecta arquivos faltantes
2. ✅ Remove vendor corrompido
3. ✅ Limpa cache do Composer
4. ✅ Reinstala todas as dependências
5. ✅ Otimiza autoloader
6. ✅ Limpa e recria caches do Laravel
7. ✅ Ajusta permissões
8. ✅ Reinicia serviços

---

## 🚀 Como Aplicar a Correção

### Opção 1: Script Automatizado (RECOMENDADO) ⭐

```bash
# No servidor de produção
cd /var/www/fluxdesk

# Executar script de correção
sudo bash fix-vendor-production.sh
```

**O script vai:**
- Detectar a release problemática automaticamente
- Remover e reinstalar o vendor completamente
- Otimizar tudo
- Reiniciar serviços

**Tempo estimado:** 3-5 minutos

---

### Opção 2: Correção Manual

```bash
# 1. Navegar para a release problemática
cd /var/www/fluxdesk/releases/2025-10-29-235754

# 2. Limpar cache do Composer
composer clear-cache

# 3. Remover vendor corrompido
rm -rf vendor/

# 4. Reinstalar dependências
COMPOSER_MEMORY_LIMIT=-1 composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction

# 5. Verificar se arquivos foram criados
ls -la vendor/symfony/console/Event/ConsoleErrorEvent.php
ls -la vendor/symfony/string/Resources/data/wcswidth_table_zero.php

# 6. Otimizar autoloader
composer dump-autoload --optimize --no-dev

# 7. Limpar caches do Laravel
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 8. Recriar caches
php artisan config:cache
php artisan view:cache
php artisan event:cache

# 9. Ajustar permissões
sudo chown -R www-data:www-data /var/www/fluxdesk/releases/2025-10-29-235754
sudo chmod -R 755 /var/www/fluxdesk/releases/2025-10-29-235754

# 10. Reiniciar serviços
sudo systemctl reload php8.3-fpm
sudo systemctl restart fluxdesk-queue
```

---

### Opção 3: Deploy Nova Release (Mais Seguro)

Se a correção não funcionar, faça um **novo deploy** que recriará tudo do zero:

```bash
cd /var/www/fluxdesk

# Deploy nova release
sudo bash Setup/install_and_deploy.sh deploy
```

**Vantagens:**
- ✅ Recria tudo do zero (limpo)
- ✅ Mantém release anterior para rollback
- ✅ Aplica também a correção da tabela `replies`

---

## 🔍 Diagnóstico Adicional

### Verificar Espaço em Disco

```bash
df -h
```

**Deve ter pelo menos 2GB livres.**

### Verificar Permissões

```bash
ls -la /var/www/fluxdesk/releases/2025-10-29-235754/vendor/symfony/
```

**Deve mostrar:**
```
drwxr-xr-x  www-data  www-data  ...
```

### Verificar Integridade do Composer

```bash
cd /var/www/fluxdesk/releases/2025-10-29-235754

# Validar composer.json
composer validate

# Ver pacotes instalados
composer show | grep symfony

# Ver por que um pacote foi instalado
composer why symfony/console
composer why symfony/string
```

### Verificar Versões

```bash
# PHP
php -v
# Deve ser 8.3.x

# Composer
composer --version
# Deve ser 2.x

# Node/pnpm (não relacionado mas importante)
node -v
pnpm -v
```

---

## 🛡️ Prevenção

Para evitar que isso aconteça novamente:

### 1. **Verificar Espaço em Disco**

```bash
# Adicionar verificação antes do deploy
df -h | grep "/$"
```

Se menos de 2GB livres, executar cleanup:
```bash
sudo bash Setup/install_and_deploy.sh cleanup
```

### 2. **Monitorar Logs de Deploy**

```bash
# Ver logs do último deploy
ls -lt /var/www/fluxdesk/releases/*.deploy.log | head -1

# Verificar se composer install completou
tail -100 /var/www/fluxdesk/releases/2025-10-29-235754.deploy.log | grep -A 10 "composer install"
```

### 3. **Timeout Adequado**

No script de deploy, o `composer install` já tem flags corretas:
```bash
COMPOSER_MEMORY_LIMIT=-1 composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction
```

### 4. **Cache do Composer**

Periodicamente limpar cache antigo:
```bash
composer clear-cache
composer global clear-cache
```

### 5. **Verificação Automática Pós-Deploy**

Adicionar ao script de deploy:
```bash
# Verificar arquivos críticos do Symfony
if [ ! -f "vendor/symfony/console/Event/ConsoleErrorEvent.php" ]; then
    echo "❌ ERRO: Arquivos Symfony faltando!"
    exit 1
fi
```

---

## 📊 Impacto

### Antes da Correção
- ❌ Aplicação quebrada
- ❌ Artisan commands falhando
- ❌ Jobs da fila falhando
- ❌ Impossível executar migrations
- ❌ Impossível limpar caches

### Após a Correção
- ✅ Vendor completo e íntegro
- ✅ Todos os comandos funcionando
- ✅ Jobs processando normalmente
- ✅ Aplicação 100% funcional

---

## ⏱️ Tempo de Resolução

| Método | Tempo Estimado |
|--------|----------------|
| Script automatizado | 3-5 minutos |
| Correção manual | 5-10 minutos |
| Deploy nova release | 5-7 minutos |

---

## ✅ Verificação Pós-Correção

### 1. Verificar Arquivos

```bash
cd /var/www/fluxdesk/current

# Verificar arquivos específicos
test -f vendor/symfony/console/Event/ConsoleErrorEvent.php && echo "✅ OK" || echo "❌ FALTANDO"
test -f vendor/symfony/string/Resources/data/wcswidth_table_zero.php && echo "✅ OK" || echo "❌ FALTANDO"
```

### 2. Testar Artisan

```bash
php artisan --version
php artisan list
php artisan config:show
```

**Não deve mostrar erros.**

### 3. Verificar Logs

```bash
tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log
```

**Não deve aparecer:**
- ❌ "Failed to open stream"
- ❌ "No such file or directory"
- ❌ Erros relacionados a Symfony

### 4. Testar Aplicação

```bash
# Verificar HTTP
curl -I https://app.fluxdesk.com.br

# Deve retornar: HTTP/1.1 200 OK (ou 302 se redirecionar)
```

### 5. Verificar Queue

```bash
# Status do queue worker
sudo systemctl status fluxdesk-queue

# Monitorar jobs
cd /var/www/fluxdesk/current
php artisan queue:monitor
```

---

## 🔗 Arquivos Relacionados

- Script de correção: `fix-vendor-production.sh`
- Script de deploy principal: `Setup/install_and_deploy.sh`
- Documentação: `BUGFIX-VENDOR-CORROMPIDO.md` (este arquivo)

---

## 🎓 Lições Aprendidas

1. ✅ Sempre verificar espaço em disco antes de deploy
2. ✅ Monitorar logs de deploy para detectar falhas
3. ✅ Ter script de correção pronto para problemas comuns
4. ✅ Deploy com releases separadas facilita rollback
5. ✅ Cache do Composer pode causar problemas - limpar periodicamente

---

## 📞 Suporte

Se o problema persistir após executar o script:

1. **Capture evidências:**
   ```bash
   # Espaço em disco
   df -h > /tmp/disk-space.txt
   
   # Permissões
   ls -laR /var/www/fluxdesk/current/vendor/symfony/ > /tmp/permissions.txt
   
   # Composer
   cd /var/www/fluxdesk/current
   composer diagnose > /tmp/composer-diagnose.txt
   
   # Versões
   php -v > /tmp/versions.txt
   composer --version >> /tmp/versions.txt
   ```

2. **Considere fazer novo deploy** (Opção 3)

3. **Verifique logs de deploy** para identificar onde falhou

---

**Status:** 🟢 Script de correção pronto para uso

