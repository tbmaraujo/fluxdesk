# 🚀 FLUXDESK - Guia de Deploy Automatizado

**Sistema de Chamados de TI**  
Stack: Laravel 11, Inertia.js, React, TypeScript, PostgreSQL  
Servidor: Ubuntu 24.04 LTS, Nginx, PHP-FPM 8.3, Node 20 LTS

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação Inicial](#instalação-inicial)
4. [Deploy de Nova Versão](#deploy-de-nova-versão)
5. [Rollback](#rollback)
6. [Configuração de Variáveis](#configuração-de-variáveis)
7. [Estrutura de Diretórios](#estrutura-de-diretórios)
8. [Health Checks](#health-checks)
9. [Integração CI/CD](#integração-cicd)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O script `install_and_deploy.sh` automatiza todo o processo de deploy do FLUXDESK em produção, incluindo:

- ✅ Instalação de dependências (PHP 8.3, Node 20, Nginx, PostgreSQL Client)
- ✅ Configuração de serviços (Nginx, PHP-FPM, Supervisor)
- ✅ Deploy com releases versionadas (rollback fácil)
- ✅ Build de assets (Vite + React)
- ✅ Migrações de banco de dados
- ✅ Otimização de caches do Laravel
- ✅ Health checks automáticos
- ✅ Rollback com um comando

### Estrutura de Releases

```
/var/www/fluxdesk/
├── releases/
│   ├── 2025-10-24-143000/  # Release antiga
│   ├── 2025-10-24-150000/  # Release anterior
│   └── 2025-10-24-153000/  # Release atual
├── shared/
│   ├── .env
│   └── storage/
└── current -> releases/2025-10-24-153000  # Symlink para release ativa
```

**Benefícios:**
- Rollback instantâneo (troca de symlink)
- Histórico de releases (últimas 3 mantidas)
- Zero downtime em deploys bem-sucedidos

---

## 🔧 Pré-requisitos

### Servidor EC2

- **OS:** Ubuntu 24.04 LTS
- **RAM:** 2GB mínimo (4GB recomendado)
- **Storage:** 20GB mínimo
- **Security Group:** Portas 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Banco de Dados PostgreSQL

Você pode usar:
- **Amazon RDS PostgreSQL** (recomendado)
- **PostgreSQL instalado localmente**
- **Supabase / Neon / Render** (alternativas cloud)

### Cloudflare Tunnel

O servidor já deve ter o Cloudflare Tunnel configurado:
```bash
sudo systemctl status cloudflared
# ● cloudflared.service - cloudflared
#    Active: active (running)
```

### Acesso ao Repositório GitHub

O repositório é **privado**, então você precisa configurar autenticação:

**Opção 1: SSH (Recomendado)**
```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "deploy@fluxdesk"

# Exibir chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# Settings → SSH and GPG keys → New SSH key
```

**Opção 2: HTTPS com Token**
```bash
# Criar Personal Access Token no GitHub
# Settings → Developer settings → Personal access tokens → Generate new token
# Permissões: repo (Full control of private repositories)

# Configurar credenciais
git config --global credential.helper store
git clone https://github.com/tbmaraujo/Sistema-Chamados.git
# Usuário: seu_username
# Senha: ghp_seu_token_aqui
```

---

## 🚀 Instalação Inicial

### 1. Fazer Upload do Script

```bash
# Na sua máquina local
scp Setup/install_and_deploy.sh ubuntu@SEU_IP_EC2:/home/ubuntu/

# Conectar via SSH
ssh ubuntu@SEU_IP_EC2

# Dar permissão de execução
chmod +x install_and_deploy.sh
```

### 2. Executar Instalação Completa

```bash
sudo bash install_and_deploy.sh all
```

**O que acontece:**
1. Instala PHP 8.3 + extensões
2. Instala Node 20 LTS
3. Instala Nginx
4. Instala Composer 2
5. Cria estrutura de diretórios (`/var/www/fluxdesk`)
6. Configura Nginx vhost
7. Configura Supervisor para queue workers
8. Clona repositório
9. Roda `composer install --no-dev`
10. Roda `npm ci && npm run build`
11. Executa migrações
12. Otimiza caches (config, route, view)
13. Ativa release
14. Executa health checks

### 3. Configurar Variáveis de Ambiente

```bash
# Editar .env compartilhado
sudo nano /var/www/fluxdesk/shared/.env
```

**Variáveis obrigatórias:**
```env
APP_NAME=FluxDesk
APP_ENV=production
APP_KEY=base64:SERÁ_GERADO_AUTOMATICAMENTE
APP_DEBUG=false
APP_URL=https://app.fluxdesk.com.br

# Banco de dados PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=seu-rds.rds.amazonaws.com  # Ou 127.0.0.1
DB_PORT=5432
DB_DATABASE=fluxdesk
DB_USERNAME=fluxdesk_user
DB_PASSWORD=sua_senha_segura_aqui

# Cache e Sessões
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync  # Ou 'database' se usar filas
```

Após configurar, rode novamente:
```bash
sudo bash install_and_deploy.sh deploy
```

---

## 📦 Deploy de Nova Versão

### Deploy Manual

```bash
sudo bash install_and_deploy.sh deploy
```

**Processo:**
1. Cria nova release com timestamp: `2025-10-24-153000`
2. Clona branch `main` do GitHub
3. Cria symlinks para `.env` e `storage` (shared)
4. Roda `composer install --no-dev --optimize-autoloader`
5. Roda `npm ci && npm run build` (Vite)
6. Executa `php artisan migrate --force`
7. Otimiza caches: config, route, view, event
8. Ajusta permissões (`www-data`)
9. Ativa release (troca symlink `current`)
10. Reload Nginx + PHP-FPM + Cloudflared
11. Remove releases antigas (mantém 3)
12. Executa health checks

**Output esperado:**
```
[INFO] Iniciando deploy...
[INFO] Criando release: 2025-10-24-153000
[INFO] Clonando repositório...
[INFO] Instalando dependências PHP...
[INFO] Compilando assets (Vite)...
[INFO] Executando migrações...
[INFO] Otimizando caches...
[INFO] Ativando release...
[INFO] ✅ Deploy concluído com sucesso!
[INFO] Release ativa: 2025-10-24-153000
[INFO] Executando health checks...
[INFO] ✅ Nginx ativo
[INFO] ✅ PHP-FPM ativo
[INFO] ✅ Aplicação respondendo (HTTP 200)
[INFO] ✅ Sem dev-server (build de produção OK)
[INFO] 🎉 Todos os health checks passaram!
```

---

## ⏮️ Rollback

Se algo der errado no deploy, faça rollback instantâneo:

```bash
sudo bash install_and_deploy.sh rollback
```

**O que acontece:**
1. Identifica release atual
2. Busca release anterior disponível
3. Troca symlink `current` para release anterior
4. Reload Nginx + PHP-FPM
5. Executa health checks

**Exemplo:**
```
[INFO] Iniciando rollback...
[WARN] Fazendo rollback de 2025-10-24-153000 para 2025-10-24-150000...
[INFO] ✅ Rollback concluído!
[INFO] Release ativa: 2025-10-24-150000
```

**Importante:** Rollback **não reverte migrações de banco de dados**. Se a nova release rodou migrations destrutivas, você precisará restaurar um backup.

---

## ⚙️ Configuração de Variáveis

### Variáveis do Script

Edite no início de `install_and_deploy.sh`:

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `APP_NAME` | Nome da aplicação | `fluxdesk` |
| `DOMAIN` | Domínio da aplicação | `app.fluxdesk.com.br` |
| `REPO_URL` | URL do repositório GitHub | `https://github.com/tbmaraujo/Sistema-Chamados.git` |
| `BRANCH` | Branch a ser deployada | `main` |
| `PHP_VERSION` | Versão do PHP | `8.3` |
| `NODE_VERSION` | Versão do Node | `20` |
| `APP_DIR` | Diretório raiz | `/var/www/fluxdesk` |
| `BUILD_ON_SERVER` | Compilar assets no servidor | `true` |
| `NGINX_USER` | Usuário do Nginx | `www-data` |
| `RELEASES_TO_KEEP` | Número de releases a manter | `3` |

### Variáveis de Ambiente (.env)

Arquivo: `/var/www/fluxdesk/shared/.env`

**Essenciais:**
```env
APP_KEY=         # Gerado automaticamente
DB_HOST=         # Host do PostgreSQL
DB_DATABASE=     # Nome do banco
DB_USERNAME=     # Usuário do banco
DB_PASSWORD=     # Senha do banco
```

**Opcionais (Produção):**
```env
# Logging
LOG_LEVEL=error
LOG_CHANNEL=stack

# Cache (se usar Redis)
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Filas (se usar)
QUEUE_CONNECTION=database  # ou redis

# E-mail (se configurar)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@fluxdesk.com.br
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 📁 Estrutura de Diretórios

```
/var/www/fluxdesk/
│
├── releases/                    # Todas as releases
│   ├── 2025-10-24-143000/      # Release antiga (será removida)
│   ├── 2025-10-24-150000/      # Release anterior
│   └── 2025-10-24-153000/      # Release atual
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── database/
│       ├── public/
│       ├── resources/
│       ├── routes/
│       ├── storage -> /var/www/fluxdesk/shared/storage  # SYMLINK
│       ├── .env -> /var/www/fluxdesk/shared/.env        # SYMLINK
│       ├── composer.json
│       ├── package.json
│       └── vite.config.js
│
├── shared/                      # Arquivos compartilhados
│   ├── .env                     # Configurações (não versionado)
│   └── storage/                 # Storage persistente
│       ├── app/
│       │   └── public/          # Uploads de usuários
│       ├── framework/
│       │   ├── cache/
│       │   ├── sessions/
│       │   └── views/
│       └── logs/
│           └── laravel.log
│
└── current -> releases/2025-10-24-153000  # SYMLINK para release ativa
```

**Por que symlinks?**
- `.env`: Mantém configurações entre deploys
- `storage`: Preserva uploads e logs
- `current`: Permite rollback instantâneo

---

## 🩺 Health Checks

Execute health checks manualmente:

```bash
sudo bash install_and_deploy.sh smoke
```

**Verificações realizadas:**

1. **Nginx ativo**
   ```bash
   systemctl is-active nginx
   ```

2. **PHP-FPM ativo**
   ```bash
   systemctl is-active php8.3-fpm
   ```

3. **Aplicação respondendo (HTTP 200)**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1
   ```

4. **Sem dev-server (Vite)**
   ```bash
   curl -s http://127.0.0.1 | grep -E "5173|@vite/client" && echo "ERRO!" || echo "OK"
   ```

5. **Cloudflared ativo** (se configurado)
   ```bash
   systemctl is-active cloudflared
   ```

6. **Permissões de escrita em storage**
   ```bash
   [ -w /var/www/fluxdesk/shared/storage/logs ] && echo "OK"
   ```

**Output esperado:**
```
[INFO] Executando health checks...
[INFO] ✅ Nginx ativo
[INFO] ✅ PHP-FPM ativo
[INFO] ✅ Aplicação respondendo (HTTP 200)
[INFO] ✅ Sem dev-server (build de produção OK)
[INFO] ✅ Cloudflared ativo
[INFO] ✅ Permissões OK
[INFO] 🎉 Todos os health checks passaram!
```

---

## 🔄 Integração CI/CD

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu
            sudo bash install_and_deploy.sh deploy

      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"❌ Deploy falhou!"}'
```

**Secrets necessários:**
- `EC2_HOST`: IP ou domínio do servidor
- `EC2_SSH_KEY`: Chave privada SSH
- `SLACK_WEBHOOK`: (opcional) Webhook do Slack

### Deploy Manual via SSH

```bash
# Na sua máquina local
ssh ubuntu@SEU_IP_EC2 "cd /home/ubuntu && sudo bash install_and_deploy.sh deploy"
```

---

## 🛠️ Troubleshooting

### ❌ Erro: "Falha ao clonar repositório"

**Causa:** Sem autenticação GitHub (repositório privado)

**Solução:**
```bash
# Opção 1: SSH
ssh-keygen -t ed25519 -C "deploy@fluxdesk"
cat ~/.ssh/id_ed25519.pub
# Adicione ao GitHub: Settings → SSH keys

# Opção 2: Token HTTPS
git config --global credential.helper store
```

---

### ❌ Erro: "Falha no npm run build"

**Causa:** Memória insuficiente (Node consome muita RAM no build)

**Solução:**
```bash
# Aumentar swap temporariamente
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tentar deploy novamente
sudo bash install_and_deploy.sh deploy

# Remover swap depois
sudo swapoff /swapfile
sudo rm /swapfile
```

---

### ❌ Erro: "ERRO: Dev-server detectado!"

**Causa:** Build de produção não foi executado corretamente

**Verificação:**
```bash
cd /var/www/fluxdesk/current
ls public/build/  # Deve conter manifest.json e assets/
```

**Solução:**
```bash
cd /var/www/fluxdesk/current
npm run build
sudo systemctl reload nginx
```

---

### ❌ Erro: "Permissão negada em storage/logs"

**Causa:** Permissões incorretas

**Solução:**
```bash
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage
sudo chmod -R 775 /var/www/fluxdesk/shared/storage
```

---

### ❌ Página em branco ou erro 500

**Diagnóstico:**
```bash
# Ver logs do Laravel
sudo tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log

# Ver logs do Nginx
sudo tail -f /var/log/nginx/fluxdesk_error.log

# Ver logs do PHP-FPM
sudo tail -f /var/log/php8.3-fpm.log
```

**Causas comuns:**
- APP_KEY não gerada
- Banco de dados inacessível
- Permissões incorretas
- Cache corrompido

**Solução:**
```bash
cd /var/www/fluxdesk/current

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Recriar caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Reload serviços
sudo systemctl reload nginx
sudo systemctl reload php8.3-fpm
```

---

### ❌ Cloudflared não conecta

**Verificação:**
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

**Solução:**
```bash
sudo systemctl restart cloudflared
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Laravel
sudo tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log

# Nginx Access
sudo tail -f /var/log/nginx/fluxdesk_access.log

# Nginx Error
sudo tail -f /var/log/nginx/fluxdesk_error.log

# PHP-FPM
sudo tail -f /var/log/php8.3-fpm.log

# Supervisor (queue workers)
sudo tail -f /var/www/fluxdesk/shared/storage/logs/worker.log
```

### Status de Serviços

```bash
# Nginx
sudo systemctl status nginx

# PHP-FPM
sudo systemctl status php8.3-fpm

# Cloudflared
sudo systemctl status cloudflared

# Supervisor
sudo supervisorctl status
```

### Espaço em Disco

```bash
df -h /var/www/fluxdesk
du -sh /var/www/fluxdesk/releases/*
```

---

## 🔐 Segurança

### Recomendações

1. **Firewall (UFW):**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

2. **Fail2Ban (proteção SSH):**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Atualizações automáticas:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. **SSL/TLS via Cloudflare:**
   - Cloudflare Tunnel já fornece SSL automático
   - Certifique-se que SSL/TLS está "Full" no painel Cloudflare

5. **Variáveis sensíveis:**
   - Nunca commite `.env` no Git
   - Use valores fortes em `APP_KEY` e `DB_PASSWORD`

---

## 📞 Suporte

**Desenvolvedor:** Thiago Araújo  
**Repositório:** https://github.com/tbmaraujo/Sistema-Chamados (privado)  
**Documentação:** `/home/thiago/Projetos/Sistema Chamados/sincro8-tickets/Setup/`

---

## 👤 Primeiro Acesso

### Criar Super Administrador

Após o deploy inicial, crie um super administrador:

```bash
cd /var/www/fluxdesk/current

# Modo interativo (recomendado)
sudo -u www-data php artisan user:create-super-admin

# Ou com flags
sudo -u www-data php artisan user:create-super-admin \
  --email=admin@fluxdesk.com.br \
  --name="Administrador" \
  --password="SuaSenhaSegura123"
```

**O que o comando faz:**
- Cria usuário com `is_super_admin = true`
- Acesso ao menu "Plataforma" (gestão de tenants)
- Cria tenant automaticamente se não existir
- Valida email, nome e senha
- Pode atualizar usuário existente

**Output esperado:**
```
🎉 Super Administrador criado com sucesso!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 CREDENCIAIS DE ACESSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nome:        Administrador
  Email:       admin@fluxdesk.com.br
  Função:      Admin
  Super Admin: SIM
  Tenant:      FluxDesk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Acesse: https://app.fluxdesk.com.br/login
```

### Acesso ao Sistema

1. Acesse: `https://app.fluxdesk.com.br` (redireciona automaticamente para `/login`)
2. Faça login com as credenciais criadas
3. Menu "Super Admin" → "Plataforma" estará visível
4. **Importante:** Troque a senha após primeiro login!

---

## 🔒 HTTPS e Proxy (Cloudflare/Nginx)

O sistema está configurado para funcionar corretamente atrás de proxies reversos (Cloudflare, Nginx, Load Balancers).

### TrustProxies Middleware

**Configurado automaticamente em `bootstrap/app.php`:**
```php
$middleware->trustProxies(at: '*');
```

**O que faz:**
- Detecta se requisição original era HTTPS
- Mantém IP real do usuário (via X-Forwarded-For)
- Força assets (CSS, JS) a usarem HTTPS

### ASSET_URL Automático

**O script configura automaticamente no `.env`:**
```env
ASSET_URL=https://app.fluxdesk.com.br
```

**Benefícios:**
- ✅ Assets sempre com HTTPS
- ✅ Sem Mixed Content no navegador
- ✅ Inertia.js funciona corretamente
- ✅ JavaScript carrega sem bloqueios

**Verificação:**
```bash
# Confirmar que assets usam HTTPS
curl -s https://app.fluxdesk.com.br | grep "https://app.fluxdesk.com.br/build"
```

---

## ✅ Validações Pré-Deploy

O script valida automaticamente antes de cada deploy:

### 1. PostgreSQL
```bash
[INFO] Verificando PostgreSQL...
[INFO] ✅ PostgreSQL rodando
```

**Se falhar:**
- Instala PostgreSQL client se necessário
- Alerta se PostgreSQL local não está rodando
- Continua se usar RDS/remoto

### 2. Validação do .env
```bash
[INFO] Validando arquivo .env...
[INFO] Adicionando ASSET_URL ao .env...
[INFO] ✅ .env validado
```

**Verifica:**
- ✅ Arquivo `.env` existe
- ✅ Variáveis obrigatórias: `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- ✅ `ASSET_URL` configurado (adiciona se faltar)
- ⚠️ Alerta se `APP_DEBUG=true`

**Se faltar variável:**
```
[ERROR] Variáveis obrigatórias faltando no .env:
  - DB_PASSWORD (senha do banco)

Configure: sudo nano /var/www/fluxdesk/shared/.env
```

### 3. Conexão com Banco
```bash
[INFO] Testando conexão com banco de dados...
[INFO] ✅ Conexão com banco OK
```

**Verifica antes das migrations:**
- Testa conexão real com `php artisan db:show`
- Sugere comando para criar banco se não existir
- Falha antes de clonar repositório (economiza tempo)

**Se banco não existir:**
```
[WARN] Não foi possível conectar ao banco de dados
[WARN] PostgreSQL está rodando localmente.
[WARN] Para criar o banco automaticamente, execute:
  sudo -u postgres psql -c "CREATE DATABASE fluxdesk;"
```

---

## ⚠️ Importante: Cache de Rotas

**O script NÃO usa `route:cache` por design!**

```bash
# ❌ NÃO é feito
php artisan route:cache

# ✅ Apenas estes caches
php artisan config:cache
php artisan view:cache
php artisan event:cache
```

**Por quê?**
- `route:cache` não suporta closures (funções anônimas)
- Quebra rotas dinâmicas: `auth()->check()`, redirecionamentos
- Incompatível com Inertia.js
- Rota raiz (`/`) usa closure para redirecionar dinamicamente

**Se tiver problemas após deploy:**
```bash
# Limpar cache de rotas manualmente
cd /var/www/fluxdesk/current
sudo -u www-data php artisan route:clear
```

---

## 📜 Changelog

### v1.2.0 (2025-10-24)
- ✅ **TrustProxies**: Suporte automático a HTTPS via proxy
- ✅ **ASSET_URL**: Configuração automática no deploy
- ✅ **Validações pré-deploy**: PostgreSQL, .env, conexão banco
- ✅ **Comando create-super-admin**: Criação fácil de super admin
- ✅ **Rota raiz inteligente**: Redireciona para login/dashboard
- ✅ **Sem route:cache**: Compatibilidade com Inertia.js

### v1.1.0 (2025-10-24)
- ✅ SSH GitHub privado configurado automaticamente
- ✅ NPM resiliente (fallback --legacy-peer-deps)
- ✅ Supervisor robusto (retry + warnings claros)
- ✅ Health checks aprimorados
- ✅ Auto-correção de permissões

### v1.0.0 (2025-10-24)
- ✅ Script de deploy automatizado
- ✅ Suporte a releases versionadas
- ✅ Rollback com um comando
- ✅ Health checks integrados
- ✅ Build de assets no servidor
- ✅ Otimização de caches
- ✅ Configuração Nginx + PHP-FPM 8.3
- ✅ Supervisor para queue workers
- ✅ Integração Cloudflare Tunnel

---

**🎉 FLUXDESK está pronto para produção!**
