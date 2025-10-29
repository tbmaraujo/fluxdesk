# 🔐 Corrigir Permissões em Deploy Gerenciado

Guia para resolver problemas de permissões em ambientes com Deployer/Capistrano/Envoyer.

---

## 🚨 Sintomas do Problema

Se você vê erros como:

```
Fatal error: Could not open stream: Permission denied
The stream or file "storage/logs/laravel.log" could not be opened
The bootstrap/cache directory must be present and writable
```

Você tem **problema de permissões**!

---

## 🎯 Causa do Problema

Em deploys gerenciados:
- ❌ Arquivos são criados pelo usuário de deploy (`ubuntu`, `deploy`)
- ❌ PHP-FPM/Nginx roda como `www-data`
- ❌ `www-data` não consegue escrever nos arquivos

**Solução:** Arquivos devem pertencer a `www-data`

---

## ✅ Solução Rápida (Execute no Servidor)

```bash
cd /var/www/fluxdesk/current

# 1. Corrigir dono dos arquivos
sudo chown -R www-data:www-data /var/www/fluxdesk/releases/2025-10-29-004201
sudo chown -R www-data:www-data /var/www/fluxdesk/shared

# 2. Corrigir permissões
sudo chmod -R 775 /var/www/fluxdesk/shared/storage
sudo chmod -R 775 /var/www/fluxdesk/shared/storage/framework
sudo chmod -R 775 /var/www/fluxdesk/shared/storage/logs

# 3. Se bootstrap/cache não for symlink:
sudo chmod -R 775 bootstrap/cache

# 4. Corrigir git ownership
git config --global --add safe.directory "$(pwd)"

# 5. Testar
php artisan --version
# Deve funcionar sem erros
```

---

## 🔧 Solução Permanente: Configurar Deployer

### **1. Editar `deploy.php` (na sua máquina local)**

```php
<?php
namespace Deployer;

require 'recipe/laravel.php';

// ... suas configurações existentes ...

// ==========================================
// CONFIGURAÇÃO DE PERMISSÕES
// ==========================================

// Definir usuário do servidor web
set('http_user', 'www-data');

// Modo de permissões
set('writable_mode', 'chmod');
set('writable_chmod_mode', '0775');

// Usar sudo para corrigir permissões
set('writable_use_sudo', true);

// Diretórios que precisam ser graváveis
set('writable_dirs', [
    'bootstrap/cache',
    'storage',
    'storage/app',
    'storage/app/public',
    'storage/framework',
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
]);

// Arquivos/diretórios compartilhados entre releases
set('shared_files', ['.env']);
set('shared_dirs', [
    'storage',
]);

// ==========================================
// TAREFA: CORRIGIR PERMISSÕES
// ==========================================
task('deploy:fix-permissions', function () {
    // Corrigir dono da release atual
    run('sudo chown -R www-data:www-data {{release_path}}');
    
    // Corrigir dono do shared
    run('sudo chown -R www-data:www-data {{deploy_path}}/shared');
    
    // Corrigir permissões específicas
    run('sudo chmod -R 775 {{release_path}}/bootstrap/cache');
    run('sudo chmod -R 775 {{deploy_path}}/shared/storage');
    
    writeln('<info>Permissões corrigidas</info>');
});

// Executar após criar symlink
after('deploy:symlink', 'deploy:fix-permissions');

// ==========================================
// TAREFA: REINICIAR WORKERS
// ==========================================
task('supervisor:restart', function () {
    run('sudo supervisorctl restart fluxdesk-worker:*');
    writeln('<info>Workers reiniciados</info>');
});

after('deploy:fix-permissions', 'supervisor:restart');
```

### **2. Configurar Sudoers no Servidor**

```bash
# No servidor:
sudo visudo
```

**Adicionar:**
```bash
# Deployer - Permissões
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/chown -R www-data\:www-data *
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/chmod -R 775 *
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart fluxdesk-worker:*
```

**Mais seguro (específico):**
```bash
# Deployer - Permissões específicas
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/chown -R www-data\:www-data /var/www/fluxdesk/*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/chmod -R 775 /var/www/fluxdesk/*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart fluxdesk-worker:*
```

### **3. Testar Deploy**

```bash
# Na máquina local:
git add deploy.php
git commit -m "fix: configurar permissões corretas no deploy"
git push origin main
vendor/bin/dep deploy production
```

---

## 🔍 Verificar Permissões Atuais

```bash
# Ver dono dos arquivos
ls -la /var/www/fluxdesk/current/storage/logs

# Verificar quem roda o PHP-FPM
ps aux | grep php-fpm
# Procure pelo usuário (geralmente www-data)

# Verificar qual usuário o Nginx usa
grep "^user" /etc/nginx/nginx.conf
# Deve retornar: user www-data;
```

---

## 📋 Estrutura Correta de Permissões

```
/var/www/fluxdesk/
├── releases/
│   └── 2025-10-29-004201/
│       ├── app/                    (www-data:www-data 755)
│       ├── bootstrap/
│       │   └── cache/              (www-data:www-data 775) ← gravável
│       ├── storage → ../shared/storage/
│       └── .env → ../shared/.env
│
├── shared/
│   ├── .env                        (www-data:www-data 644)
│   └── storage/                    (www-data:www-data 775) ← gravável
│       ├── app/                    (www-data:www-data 775)
│       ├── framework/              (www-data:www-data 775)
│       └── logs/                   (www-data:www-data 775)
│
└── current → releases/2025-10-29-004201/
```

---

## 🛠️ Script de Correção Manual

Crie este script no servidor: `/var/www/fluxdesk/fix-permissions.sh`

```bash
#!/bin/bash

RELEASE_PATH="/var/www/fluxdesk/current"
SHARED_PATH="/var/www/fluxdesk/shared"

echo "Corrigindo permissões do Fluxdesk..."

# Corrigir dono
sudo chown -R www-data:www-data "$RELEASE_PATH"
sudo chown -R www-data:www-data "$SHARED_PATH"

# Corrigir permissões
sudo chmod -R 775 "$SHARED_PATH/storage"
sudo chmod -R 775 "$RELEASE_PATH/bootstrap/cache"

# Garantir que .env não é público
sudo chmod 644 "$SHARED_PATH/.env"

echo "✓ Permissões corrigidas!"
echo ""
echo "Testando..."
cd "$RELEASE_PATH"
php artisan --version && echo "✓ Laravel funciona!"
```

**Usar:**
```bash
chmod +x /var/www/fluxdesk/fix-permissions.sh
/var/www/fluxdesk/fix-permissions.sh
```

---

## 🐛 Troubleshooting

### Erro: "Permission denied" ao escrever logs

```bash
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage/logs
sudo chmod -R 775 /var/www/fluxdesk/shared/storage/logs
```

### Erro: "bootstrap/cache not writable"

```bash
# Se for symlink:
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage/framework/cache
sudo chmod -R 775 /var/www/fluxdesk/shared/storage/framework/cache

# Se for diretório real:
sudo chown -R www-data:www-data /var/www/fluxdesk/current/bootstrap/cache
sudo chmod -R 775 /var/www/fluxdesk/current/bootstrap/cache
```

### Erro: "Class not found" após deploy

```bash
cd /var/www/fluxdesk/current
composer dump-autoload -o
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

### Storage vazio após deploy

Verifique se é symlink:
```bash
ls -la /var/www/fluxdesk/current/storage
# Deve ser: storage -> /var/www/fluxdesk/shared/storage

# Se não for, corrigir:
cd /var/www/fluxdesk/current
rm -rf storage
ln -s /var/www/fluxdesk/shared/storage storage
```

---

## ✅ Checklist Pós-Deploy

```bash
cd /var/www/fluxdesk/current

# 1. Verificar dono
ls -la storage | head -1
# Deve mostrar: www-data www-data

# 2. Verificar se consegue escrever
sudo -u www-data touch storage/logs/test.log && echo "✓ Gravável" || echo "✗ Não gravável"

# 3. Testar Laravel
php artisan --version
# Deve funcionar sem erros

# 4. Verificar cache
php artisan config:cache
# Deve funcionar sem erros

# 5. Verificar workers
sudo supervisorctl status fluxdesk-worker:*
# Todos devem estar RUNNING
```

---

## 🔒 Segurança

**Permissões recomendadas:**
- Arquivos: `644` (rw-r--r--)
- Diretórios: `755` (rwxr-xr-x)
- Storage: `775` (rwxrwxr-x)
- .env: `644` (rw-r--r--)

**Nunca usar:**
- ❌ `777` (todos podem escrever - inseguro!)
- ❌ Dono `root` (PHP não conseguirá acessar)

---

## 📚 Recursos

- [Deployer - Permissions](https://deployer.org/docs/7.x/recipe/deploy/writable)
- [Laravel - Directory Permissions](https://laravel.com/docs/11.x/deployment#server-requirements)
- [Linux File Permissions](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)

---

**✨ Permissões corrigidas! Deploy funcionando perfeitamente!**

