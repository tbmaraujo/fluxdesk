# 🚀 Deploy Mailgun em Sistema Gerenciado (Capistrano/Deployer/Envoyer)

Guia para deploy da migração Mailgun em ambientes com **ferramentas de deploy automatizado**.

---

## 🎯 Identificando Deploy Gerenciado

Você está usando deploy gerenciado se:
- ✅ Usa **Deployer**, **Capistrano**, **Envoyer** ou similar
- ✅ Estrutura de diretórios: `/var/www/app/releases/` e `/current`
- ✅ Cada deploy cria uma nova pasta em `releases/`
- ✅ Symlink `current` aponta para a versão atual

**Exemplo de estrutura:**
```
/var/www/fluxdesk/
├── releases/
│   ├── 2025-10-29-004201/  ← versão atual
│   └── 2025-10-28-180523/  ← versão anterior
├── current → releases/2025-10-29-004201/
├── shared/
│   ├── storage/
│   └── .env
└── repo/
```

---

## ⚡ Deploy Rápido (Script Automatizado)

### 1. Fazer Push do Código

```bash
# Na sua máquina local:
cd /caminho/para/fludesk
git add -A
git commit -m "feat: atualiza para Mailgun"
git push origin main
```

### 2. Executar Deploy

```bash
# Na sua máquina local:
# Se usa Deployer:
vendor/bin/dep deploy production

# Se usa outro:
# cap production deploy
# ou pelo painel do Envoyer
```

### 3. No Servidor, Executar Script Pós-Deploy

```bash
ssh usuario@seu-servidor.com
cd /var/www/fluxdesk/current
bash deploy-mailgun.sh
```

O script agora detecta automaticamente que é deploy gerenciado e pula os comandos git! ✅

---

## 🔧 Deploy Manual (Passo a Passo)

Se preferir fazer manualmente:

### 1. No Servidor

```bash
ssh usuario@seu-servidor.com
cd /var/www/fluxdesk/current
```

### 2. Verificar Código

```bash
# Verificar commit atual
git log --oneline -3
# Deve aparecer: "feat: migração completa do Amazon SES para Mailgun"
```

Se não aparecer, faça deploy novamente:
```bash
# Sair do servidor
exit

# Na máquina local:
git push origin main
vendor/bin/dep deploy production  # ou sua ferramenta

# Voltar ao servidor
ssh usuario@seu-servidor.com
cd /var/www/fluxdesk/current
```

### 3. Instalar Dependências

```bash
composer install --no-dev --optimize-autoloader
```

### 4. Configurar `.env`

⚠️ **IMPORTANTE:** O `.env` geralmente está em `/var/www/fluxdesk/shared/.env`

```bash
# Editar o .env compartilhado
nano /var/www/fluxdesk/shared/.env
# ou
vim /var/www/fluxdesk/shared/.env
```

**Adicionar:**
```bash
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=seudominio.com.br
MAILGUN_SECRET=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_ENDPOINT=api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=sua-chave-aqui
MAIL_FROM_ADDRESS=noreply@seudominio.com.br
MAIL_FROM_NAME=Fluxdesk
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br
```

### 5. Limpar Cache

```bash
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 6. Otimizar

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 7. Reiniciar Workers

```bash
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 🔍 Corrigir Erro "dubious ownership"

Se aparecer este erro ao executar comandos git:

```bash
fatal: detected dubious ownership in repository at '/var/www/fluxdesk/releases/...'
```

**Solução:**
```bash
git config --global --add safe.directory /var/www/fluxdesk/releases/2025-10-29-004201

# Ou para todas as releases:
git config --global --add safe.directory '/var/www/fluxdesk/releases/*'
```

**Melhor ainda - não usar git diretamente:**
Como você usa deploy gerenciado, não precisa rodar `git pull` manualmente. Use a ferramenta de deploy!

---

## 📝 Configurar Variáveis no Deployer

Se você usa **Deployer**, adicione as variáveis ao seu `deploy.php`:

```php
// deploy.php

set('shared_files', ['.env']);
set('shared_dirs', ['storage']);

// Tarefa pós-deploy para migração Mailgun
task('mailgun:install', function () {
    run('cd {{release_path}} && composer install --no-dev --optimize-autoloader');
    run('cd {{release_path}} && php artisan config:clear');
    run('cd {{release_path}} && php artisan cache:clear');
    run('cd {{release_path}} && php artisan config:cache');
    run('cd {{release_path}} && php artisan route:cache');
});

after('deploy:symlink', 'mailgun:install');
after('deploy:success', 'supervisor:restart');

// Tarefa para reiniciar workers
task('supervisor:restart', function () {
    run('sudo supervisorctl restart fluxdesk-worker:*');
});
```

Depois, ao fazer deploy:
```bash
vendor/bin/dep deploy production
```

Tudo será executado automaticamente! 🎉

---

## 🧪 Testar Após Deploy

### 1. Verificar Configuração

```bash
cd /var/www/fluxdesk/current
php artisan tinker
```

```php
config('mail.default');
// Deve retornar: "mailgun"

config('services.mailgun.domain');
// Deve retornar: "seudominio.com.br"
```

### 2. Testar Envio

```php
Mail::raw('Teste pós-deploy Mailgun', function($m) {
    $m->to('seu-email@exemplo.com')
      ->subject('Teste Mailgun - Produção');
});
```

### 3. Verificar Logs

```bash
tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log
```

### 4. Verificar Workers

```bash
sudo supervisorctl status fluxdesk-worker:*
```

---

## 🔄 Rollback Rápido

### Opção 1: Rollback da Ferramenta

```bash
# Deployer:
vendor/bin/dep rollback production

# Capistrano:
# cap production deploy:rollback
```

Depois, reinicie os workers:
```bash
ssh usuario@servidor.com
sudo supervisorctl restart fluxdesk-worker:*
```

### Opção 2: Apenas Voltar para SES

Editar `/var/www/fluxdesk/shared/.env`:
```bash
# MAIL_MAILER=mailgun
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

Depois:
```bash
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan config:cache
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 📊 Estrutura de Arquivos

### Onde Estão os Arquivos?

```
/var/www/fluxdesk/
├── current/                    ← Symlink para a versão atual
│   ├── app/
│   ├── config/
│   ├── .env → ../shared/.env  ← Symlink para .env compartilhado
│   └── storage → ../shared/storage/
│
├── releases/
│   └── 2025-10-29-004201/     ← Código da versão atual
│
└── shared/                     ← Arquivos compartilhados
    ├── .env                    ← ARQUIVO REAL DO .ENV
    └── storage/
        └── logs/
            └── laravel.log     ← Logs
```

**Sempre edite:** `/var/www/fluxdesk/shared/.env` (não o do current!)

---

## 🐛 Troubleshooting

### Workers não reiniciam automaticamente

Adicione no `deploy.php`:
```php
after('deploy:symlink', 'supervisor:restart');
```

### Erro: "Class 'Mailgun\Mailgun' not found"

```bash
cd /var/www/fluxdesk/current
composer install --no-dev --optimize-autoloader
php artisan config:clear
```

### Variáveis não atualizam

```bash
# Verificar se editou o arquivo certo
ls -la /var/www/fluxdesk/current/.env
# Deve ser um symlink para: ../shared/.env

# Limpar cache
php artisan config:clear
php artisan config:cache

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*
```

### Permissões

```bash
# Corrigir permissões do storage
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage
sudo chmod -R 775 /var/www/fluxdesk/shared/storage

# Corrigir permissões do cache
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage/framework
```

---

## ✅ Checklist de Deploy Gerenciado

- [ ] Código commitado e pushed para o repositório
- [ ] Deploy executado via ferramenta (Deployer/Capistrano/Envoyer)
- [ ] Variáveis Mailgun adicionadas em `/var/www/fluxdesk/shared/.env`
- [ ] Composer install executado
- [ ] Cache limpo e reotimizado
- [ ] Workers reiniciados
- [ ] Route configurada no Mailgun
- [ ] Teste de envio realizado
- [ ] Teste de recebimento realizado
- [ ] Logs verificados

---

## 🎯 Resumo dos Comandos

```bash
# 1. Na máquina local - fazer deploy
git push origin main
vendor/bin/dep deploy production

# 2. No servidor - configurar
ssh usuario@servidor.com
cd /var/www/fluxdesk/current

# 3. Executar script automatizado
bash deploy-mailgun.sh

# Ou manual:
composer install --no-dev --optimize-autoloader
nano /var/www/fluxdesk/shared/.env  # adicionar variáveis Mailgun
php artisan config:clear && php artisan cache:clear
php artisan config:cache && php artisan route:cache
sudo supervisorctl restart fluxdesk-worker:*

# 4. Testar
php artisan tinker
>>> Mail::raw('Teste', fn($m) => $m->to('seu@email.com')->subject('Teste'));
```

---

## 📚 Recursos

- [Deployer Documentation](https://deployer.org/)
- [Capistrano Documentation](https://capistranorb.com/)
- [Laravel Envoy](https://laravel.com/docs/11.x/envoy)

---

**✨ Deploy gerenciado configurado! Use `bash deploy-mailgun.sh` a cada novo deploy.**

