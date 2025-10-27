# 📘 Manual do Gerenciador Fluxdesk

**Script de Deploy e Manutenção Automatizado**  
**Stack:** Laravel 11 + Inertia (React+TS) + Tailwind + PostgreSQL + Redis

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Como Usar](#como-usar)
3. [Modo Interativo](#modo-interativo)
4. [Modo Linha de Comando](#modo-linha-de-comando)
5. [Referência de Comandos](#referência-de-comandos)
6. [Casos de Uso Comuns](#casos-de-uso-comuns)
7. [Estrutura de Releases](#estrutura-de-releases)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O script `install_and_deploy.sh` é uma ferramenta completa para gerenciar o ciclo de vida da aplicação Fluxdesk em produção. Ele oferece:

- ✅ **Instalação automatizada** em novos servidores
- ✅ **Deploy zero-downtime** com estratégia de releases
- ✅ **Rollback instantâneo** para versão anterior
- ✅ **Ferramentas de manutenção** (cache, migrations, backups)
- ✅ **Monitoramento** (logs, status, health checks)

### 🔑 Características Principais

- **Estratégia de Releases:** Cada deploy cria um novo diretório timestamped
- **Zero Downtime:** Troca atômica via symlink
- **Compartilhamento:** `.env` e `storage` compartilhados entre releases
- **Rollback Rápido:** Apenas troca o symlink para release anterior
- **Limpeza Automática:** Mantém apenas as 3 últimas releases

---

## 🚀 Como Usar

### Pré-requisitos

- ✅ Acesso root/sudo ao servidor
- ✅ Deploy key do GitHub configurada em `/root/.ssh/deploy_key`
- ✅ Arquivo `.env` configurado em `/var/www/fluxdesk/shared/.env`

### Inicialização

```bash
# Conectar ao servidor via SSH
ssh ubuntu@seu-servidor

# Navegar até o diretório (se já houver deploy anterior)
cd /var/www/fluxdesk

# OU baixar o script pela primeira vez
wget https://raw.githubusercontent.com/tbmaraujo/fluxdesk/main/Setup/install_and_deploy.sh
chmod +x install_and_deploy.sh
```

### ✅ Pode Executar de Qualquer Pasta

**O script usa caminhos absolutos**, então funciona de qualquer lugar:

```bash
# Todas estas formas funcionam:
sudo bash /var/www/fluxdesk/Setup/install_and_deploy.sh
cd ~ && sudo bash /var/www/fluxdesk/Setup/install_and_deploy.sh deploy
cd /tmp && sudo bash /var/www/fluxdesk/Setup/install_and_deploy.sh status
```

### 📍 Localização Recomendada do Script

#### **Opção 1: Dentro do projeto (recomendado após primeiro deploy)**
```bash
sudo bash /var/www/fluxdesk/Setup/install_and_deploy.sh
```
- ✅ Sempre atualizado com o código
- ✅ Versionado no git
- ⚠️ Só disponível após primeiro deploy

#### **Opção 2: Home do usuário (para primeira instalação)**
```bash
cd ~
wget https://raw.githubusercontent.com/tbmaraujo/fluxdesk/main/Setup/install_and_deploy.sh
chmod +x install_and_deploy.sh
sudo bash ~/install_and_deploy.sh
```
- ✅ Funciona antes do primeiro deploy
- ✅ Sempre acessível

#### **Opção 3: Global no sistema (opcional)**
```bash
sudo wget -O /usr/local/bin/fluxdesk-manager \
  https://raw.githubusercontent.com/tbmaraujo/fluxdesk/main/Setup/install_and_deploy.sh
sudo chmod +x /usr/local/bin/fluxdesk-manager

# Depois pode chamar de qualquer lugar:
sudo fluxdesk-manager
sudo fluxdesk-manager deploy
```
- ✅ Disponível globalmente
- ✅ Comando curto

#### **Opção 4: Criar Alias (mais prático)**
```bash
# Adicionar ao .bashrc
echo "alias fluxdesk='sudo bash /var/www/fluxdesk/Setup/install_and_deploy.sh'" >> ~/.bashrc
source ~/.bashrc

# Uso:
fluxdesk              # Menu interativo
fluxdesk deploy       # Deploy direto
fluxdesk status       # Ver status
```
- ✅ Mais conveniente
- ✅ Sempre usa versão do projeto

---

## 🎨 Modo Interativo

O **modo interativo** oferece um menu visual bonito e fácil de usar.

### Como Acessar

```bash
sudo bash install_and_deploy.sh
```

### Interface do Menu

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🚀 FLUXDESK - Gerenciador                    ║
║         Laravel 11 + Inertia + React + PostgreSQL        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────┐
│  📋 INSTALAÇÃO & DEPLOY                                   │
└───────────────────────────────────────────────────────────┘

  1)  🆕 Instalar em novo servidor (completo)
  2)  🚀 Atualizar versão (deploy)
  3)  🔄 Rollback (versão anterior)

┌───────────────────────────────────────────────────────────┐
│  🔧 MANUTENÇÃO                                            │
└───────────────────────────────────────────────────────────┘

  4)  💾 Migrar banco de dados
  5)  🧹 Limpar cache
  6)  ⚡ Otimizar cache (rebuild)
  7)  🔄 Restart de serviços
  8)  📦 Atualizar dependências

┌───────────────────────────────────────────────────────────┐
│  📊 MONITORAMENTO                                         │
└───────────────────────────────────────────────────────────┘

  9)  ✅ Health check (smoke test)
  10) 📈 Status dos serviços
  11) 📝 Ver logs

┌───────────────────────────────────────────────────────────┐
│  🛠️  UTILITÁRIOS                                          │
└───────────────────────────────────────────────────────────┘

  12) 💾 Backup do banco
  13) 🌱 Executar seeders
  14) 🧹 Limpar releases antigas

  0)  ❌ Sair
```

### Navegação

1. Digite o número da opção desejada
2. Pressione ENTER
3. Aguarde a execução
4. Pressione ENTER novamente para voltar ao menu
5. Digite `0` para sair

---

## ⌨️ Modo Linha de Comando

Para automação ou execução rápida de comandos específicos.

### Sintaxe

```bash
sudo bash install_and_deploy.sh [COMANDO]
```

### Lista de Comandos Disponíveis

| Comando | Descrição | Tempo Estimado |
|---------|-----------|----------------|
| `install` | Instala dependências do sistema | 5-10 min |
| `deploy` | Deploy de nova versão | 3-5 min |
| `rollback` | Volta para versão anterior | 10-30 seg |
| `migrate` | Executa migrações do banco | 10-60 seg |
| `clear-cache` | Limpa todos os caches | 5-10 seg |
| `optimize` | Rebuild de caches otimizados | 10-20 seg |
| `restart` | Reinicia serviços | 5-15 seg |
| `update-deps` | Atualiza composer + pnpm | 1-3 min |
| `smoke` | Health checks completos | 5-10 seg |
| `status` | Status dos serviços | Instantâneo |
| `logs` | Visualiza logs | Interativo |
| `backup` | Backup do banco de dados | 30 seg - 5 min |
| `seed` | Executa seeders | 10-60 seg |
| `cleanup` | Remove releases antigas | 5-15 seg |
| `all` | Instalação completa + deploy | 10-15 min |

---

## 📚 Referência de Comandos

### 1️⃣ Instalar em Novo Servidor

**Comando:** `install` ou Opção `1` do menu

**O que faz:**
- ✅ Instala PHP 8.3 + todas as extensões
- ✅ Instala Node.js 20 LTS + pnpm
- ✅ Instala Nginx
- ✅ Instala Composer
- ✅ Instala Supervisor (queue workers)
- ✅ Configura estrutura de diretórios
- ✅ Configura Nginx para o domínio
- ✅ Cria `.env` de exemplo (se não existir)

**Uso:**
```bash
# Modo comando
sudo bash install_and_deploy.sh install

# OU modo interativo - opção 1
```

**Pós-instalação:**
```bash
# IMPORTANTE: Configure o .env antes de continuar
sudo nano /var/www/fluxdesk/shared/.env

# Configure especialmente:
# - DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
# - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (SES)
# - APP_URL, ASSET_URL
```

---

### 2️⃣ Atualizar Versão (Deploy)

**Comando:** `deploy` ou Opção `2` do menu

**🔍 IMPORTANTE: Como Funciona o Deploy**

O deploy **NÃO faz pull** do repositório. Ele usa a estratégia de **releases separadas**:

1. **Clone novo:** Faz `git clone` do branch `main` para um novo diretório timestamped
2. **Build isolado:** Instala dependências e compila assets na nova release
3. **Migrations:** Executa migrations (seguro, pois é idempotente)
4. **Troca atômica:** Troca o symlink `/var/www/fluxdesk/current` para a nova release
5. **Reload serviços:** Recarrega Nginx e PHP-FPM
6. **Smoke test:** Valida se a aplicação está respondendo
7. **Limpeza:** Remove releases antigas (mantém apenas 3)

**Vantagens desta estratégia:**
- ✅ **Zero downtime:** Troca instantânea via symlink
- ✅ **Rollback rápido:** Apenas troca o symlink de volta
- ✅ **Builds isolados:** Problemas no build não afetam a versão atual
- ✅ **Histórico:** Mantém últimas releases para debugging

**Estrutura criada:**
```
/var/www/fluxdesk/
├── releases/
│   ├── 2025-10-26-143022/    ← Release antiga
│   ├── 2025-10-26-153045/    ← Release antiga
│   └── 2025-10-26-163012/    ← Release atual
├── shared/
│   ├── .env                   ← Compartilhado
│   └── storage/               ← Compartilhado
└── current → releases/2025-10-26-163012/  ← Symlink
```

**Uso:**
```bash
# Modo comando
sudo bash install_and_deploy.sh deploy

# OU modo interativo - opção 2
```

**O que é executado:**
```bash
1. git clone --depth 1 --branch main [REPO_URL] [RELEASE_PATH]
2. composer install --no-dev --optimize-autoloader
3. pnpm install --frozen-lockfile
4. pnpm run build
5. php artisan migrate --force
6. php artisan config:cache
7. php artisan view:cache
8. ln -sfn [RELEASE_PATH] /var/www/fluxdesk/current
9. systemctl reload nginx php8.3-fpm
```

**Logs de deploy:**
Cada deploy gera um log em:
```
/var/www/fluxdesk/releases/[TIMESTAMP].deploy.log
```

---

### 3️⃣ Rollback

**Comando:** `rollback` ou Opção `3` do menu

**O que faz:**
- ✅ Lista releases anteriores disponíveis
- ✅ Seleciona automaticamente a release anterior
- ✅ Troca o symlink `current` para ela
- ✅ Recarrega serviços
- ✅ Executa smoke test

**Uso:**
```bash
sudo bash install_and_deploy.sh rollback
```

**Quando usar:**
- ❌ Deploy com bug crítico
- ❌ Migrations problemáticas (requer correção manual do DB)
- ❌ Assets quebrados

**⚠️ ATENÇÃO:**
Rollback **NÃO desfaz migrations**. Se a migration alterou o schema de forma incompatível, você precisará:
1. Fazer rollback da aplicação
2. Reverter a migration manualmente: `php artisan migrate:rollback`

---

### 4️⃣ Migrar Banco de Dados

**Comando:** `migrate` ou Opção `4` do menu

**O que faz:**
- ✅ Executa apenas `php artisan migrate --force`
- ✅ Valida conexão com banco antes
- ✅ **Não faz deploy completo**

**Uso:**
```bash
sudo bash install_and_deploy.sh migrate
```

**Quando usar:**
- ➕ Aplicar migrations sem fazer deploy
- ➕ Testar migrations em staging
- ➕ Corrigir migrations após rollback

---

### 5️⃣ Limpar Cache

**Comando:** `clear-cache` ou Opção `5` do menu

**O que faz:**
```bash
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
php artisan cache:clear
```

**Uso:**
```bash
sudo bash install_and_deploy.sh clear-cache
```

**Quando usar:**
- 🐛 Debugging (remover caches que podem estar causando problemas)
- ⚙️ Após alterar `.env` manualmente
- 🔧 Comportamento estranho da aplicação

---

### 6️⃣ Otimizar Cache

**Comando:** `optimize` ou Opção `6` do menu

**O que faz:**
1. Limpa todos os caches (igual ao `clear-cache`)
2. Reconstrói caches otimizados:
   ```bash
   php artisan config:cache
   php artisan view:cache
   php artisan event:cache
   ```

**Uso:**
```bash
sudo bash install_and_deploy.sh optimize
```

**Quando usar:**
- ⚡ Após mudanças no `.env`
- ⚡ Para melhorar performance
- ⚡ Após deploy (já feito automaticamente)

**⚠️ Nota:** Não usa `route:cache` pois quebra redirecionamentos dinâmicos do Inertia.js

---

### 7️⃣ Restart de Serviços

**Comando:** `restart` ou Opção `7` do menu

**O que faz:**
```bash
systemctl restart php8.3-fpm
systemctl restart nginx
supervisorctl restart all  # (queue workers)
```

**Uso:**
```bash
sudo bash install_and_deploy.sh restart
```

**Quando usar:**
- 🔄 Após mudanças de configuração do PHP/Nginx
- 🔄 Workers travados
- 🔄 Problemas de memória/performance

**⚠️ Nota:** Causa **downtime de 2-5 segundos** (diferente de `reload`)

---

### 8️⃣ Atualizar Dependências

**Comando:** `update-deps` ou Opção `8` do menu

**O que faz:**
```bash
composer install --no-dev --optimize-autoloader
pnpm install --frozen-lockfile
```

**Uso:**
```bash
sudo bash install_and_deploy.sh update-deps
```

**Quando usar:**
- 📦 Atualizar dependências após `git pull` manual
- 📦 Corrigir dependências corrompidas
- 📦 Debugging de problemas de autoload

**⚠️ Nota:** Não reconstrói assets. Para recompilar, use `deploy`.

---

### 9️⃣ Health Check

**Comando:** `smoke` ou Opção `9` do menu

**O que faz:**
- ✅ Verifica se Nginx está rodando
- ✅ Verifica se PHP-FPM está rodando
- ✅ Testa HTTP 200/302 na aplicação
- ✅ Valida ausência de dev-server (Vite)
- ✅ Verifica permissões de storage
- ✅ Checa Cloudflared (se configurado)

**Uso:**
```bash
sudo bash install_and_deploy.sh smoke
```

**Quando usar:**
- 🔍 Após deploy (já executado automaticamente)
- 🔍 Verificação periódica
- 🔍 Troubleshooting de problemas

---

### 🔟 Status dos Serviços

**Comando:** `status` ou Opção `10` do menu

**O que mostra:**
```
📦 Serviços do Sistema
  ✅ Nginx: RODANDO
  ✅ PHP-FPM: RODANDO
  ✅ Supervisor: RODANDO
  ⚠️  PostgreSQL: Remoto/Não instalado
  ⚠️  Redis: Não instalado

📂 Releases
  ➡️  Ativa: 2025-10-26-163012
  📊 Total: 3 releases

💾 Uso de Disco
  📁 Aplicação: 2.1G
  📦 Releases: 1.8G
  💾 Storage: 340M
```

**Uso:**
```bash
sudo bash install_and_deploy.sh status
```

---

### 1️⃣1️⃣ Ver Logs

**Comando:** `logs` ou Opção `11` do menu

**O que mostra:**
Submenu para escolher qual log visualizar:
1. Laravel (aplicação)
2. Nginx (acesso)
3. Nginx (erros)
4. PHP-FPM (erros)
5. Worker (queue)

**Uso:**
```bash
sudo bash install_and_deploy.sh logs
# Depois escolhe qual log
```

**Atalho direto (sem menu):**
```bash
# Laravel
tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log

# Nginx errors
tail -f /var/log/nginx/fluxdesk_error.log

# Worker
tail -f /var/www/fluxdesk/shared/storage/logs/worker.log
```

---

### 1️⃣2️⃣ Backup do Banco

**Comando:** `backup` ou Opção `12` do menu

**O que faz:**
1. Lê credenciais do `.env`
2. Executa `pg_dump` do PostgreSQL
3. Compacta com gzip
4. Salva em `/var/www/fluxdesk/backups/backup-YYYYMMDD-HHMMSS.sql.gz`

**Uso:**
```bash
sudo bash install_and_deploy.sh backup
```

**Quando usar:**
- 💾 Antes de migrations arriscadas
- 💾 Backup periódico
- 💾 Antes de executar seeders

**Restaurar backup:**
```bash
# Descompactar
gunzip /var/www/fluxdesk/backups/backup-20251026-163012.sql.gz

# Restaurar
sudo -u postgres psql -d fluxdesk < /var/www/fluxdesk/backups/backup-20251026-163012.sql
```

---

### 1️⃣3️⃣ Executar Seeders

**Comando:** `seed` ou Opção `13` do menu

**O que faz:**
- ⚠️ Pede confirmação (seeders podem sobrescrever dados!)
- ✅ Executa `php artisan db:seed --force`

**Uso:**
```bash
sudo bash install_and_deploy.sh seed
```

**Quando usar:**
- 🌱 Popular dados iniciais
- 🌱 Ambiente de staging/dev
- 🌱 Após reset do banco

**⚠️ CUIDADO:** **NUNCA** execute em produção com dados reais sem backup!

---

### 1️⃣4️⃣ Limpar Releases Antigas

**Comando:** `cleanup` ou Opção `14` do menu

**O que faz:**
- ✅ Mantém as 3 releases mais recentes
- ✅ Remove todas as outras
- ✅ Libera espaço em disco

**Uso:**
```bash
sudo bash install_and_deploy.sh cleanup
```

**Quando usar:**
- 🧹 Disco cheio
- 🧹 Muitas releases antigas acumuladas
- 🧹 Limpeza periódica

**Configurar quantas manter:**
Edite a variável no script:
```bash
RELEASES_TO_KEEP=3  # Altere para 5, 10, etc
```

---

## 💡 Casos de Uso Comuns

### 🆕 Primeira Instalação (Servidor Novo)

```bash
# 1. Upload da deploy key
sudo mkdir -p /root/.ssh
sudo vim /root/.ssh/deploy_key
# Cole a chave privada
sudo chmod 600 /root/.ssh/deploy_key

# 2. Baixar script
wget https://raw.githubusercontent.com/tbmaraujo/fluxdesk/main/Setup/install_and_deploy.sh
chmod +x install_and_deploy.sh

# 3. Executar instalação completa
sudo bash install_and_deploy.sh all

# 4. Configurar .env
sudo nano /var/www/fluxdesk/shared/.env

# 5. Deploy novamente (agora com .env configurado)
sudo bash install_and_deploy.sh deploy
```

---

### 🚀 Deploy Rotineiro (Atualização de Código)

```bash
# Conectar ao servidor
ssh ubuntu@servidor

# Opção 1: Menu interativo
cd /var/www/fluxdesk
sudo bash Setup/install_and_deploy.sh
# Escolher opção 2

# Opção 2: Direto
cd /var/www/fluxdesk
sudo bash Setup/install_and_deploy.sh deploy
```

**Tempo total:** 3-5 minutos

---

### ⚡ Hotfix Urgente

```bash
# 1. Commitar e pushar hotfix no GitHub
git commit -m "fix: critical bug"
git push origin main

# 2. Deploy no servidor
ssh ubuntu@servidor
cd /var/www/fluxdesk
sudo bash Setup/install_and_deploy.sh deploy

# 3. Se der problema, rollback instantâneo
sudo bash Setup/install_and_deploy.sh rollback
```

---

### 🐛 Debugging de Problemas

```bash
# Ver status geral
sudo bash install_and_deploy.sh status

# Ver logs de erro
sudo bash install_and_deploy.sh logs
# Escolher opção 3 (Nginx errors) ou 1 (Laravel)

# Limpar cache (pode resolver problemas)
sudo bash install_and_deploy.sh clear-cache

# Restart completo
sudo bash install_and_deploy.sh restart

# Health check
sudo bash install_and_deploy.sh smoke
```

---

### 💾 Manutenção de Banco de Dados

```bash
# Backup antes de migration arriscada
sudo bash install_and_deploy.sh backup

# Executar migration
sudo bash install_and_deploy.sh migrate

# Se der problema, restaurar backup
gunzip /var/www/fluxdesk/backups/backup-*.sql.gz
sudo -u postgres psql -d fluxdesk < /var/www/fluxdesk/backups/backup-*.sql

# Rollback da aplicação se necessário
sudo bash install_and_deploy.sh rollback
```

---

### 🔄 Manutenção Periódica

```bash
# Limpeza mensal
sudo bash install_and_deploy.sh cleanup

# Backup semanal
sudo bash install_and_deploy.sh backup

# Verificar uso de disco
sudo bash install_and_deploy.sh status
```

---

## 🏗️ Estrutura de Releases

### Diretórios

```
/var/www/fluxdesk/
├── releases/                    # Releases timestamped
│   ├── 2025-10-26-143022/
│   │   ├── app/
│   │   ├── public/
│   │   ├── resources/
│   │   ├── .env → ../../shared/.env
│   │   └── storage → ../../shared/storage
│   ├── 2025-10-26-153045/
│   └── 2025-10-26-163012/      # Mais recente
│
├── shared/                      # Dados compartilhados
│   ├── .env                     # Configuração
│   └── storage/                 # Arquivos/logs
│       ├── app/
│       ├── framework/
│       └── logs/
│
├── current → releases/2025-10-26-163012/  # Symlink para release ativa
│
└── backups/                     # Backups de banco
    ├── backup-20251026-120000.sql.gz
    └── backup-20251026-163000.sql.gz
```

### Por Que Esta Estrutura?

1. **Releases isoladas:** Cada deploy é independente
2. **Rollback instantâneo:** Apenas troca symlink
3. **Histórico:** Mantém últimas releases para debugging
4. **Compartilhamento:** `.env` e `storage` únicos para todas
5. **Zero downtime:** Troca atômica do symlink

---

## 🔧 Troubleshooting

### ❌ Erro: "Deploy key não encontrada"

**Causa:** Arquivo `/root/.ssh/deploy_key` não existe

**Solução:**
```bash
sudo mkdir -p /root/.ssh
sudo vim /root/.ssh/deploy_key
# Cole a chave privada do GitHub
sudo chmod 600 /root/.ssh/deploy_key
```

---

### ❌ Erro: "Falha ao conectar ao banco"

**Causa:** Credenciais incorretas no `.env`

**Solução:**
```bash
# Editar .env
sudo nano /var/www/fluxdesk/shared/.env

# Verificar:
# DB_HOST=127.0.0.1 (ou IP do RDS)
# DB_DATABASE=fluxdesk
# DB_USERNAME=fluxdesk_user
# DB_PASSWORD=senha_correta

# Testar conexão
cd /var/www/fluxdesk/current
php artisan db:show
```

---

### ❌ Erro 502 Bad Gateway

**Causa:** PHP-FPM parado ou sem permissões

**Solução:**
```bash
# Verificar status
sudo systemctl status php8.3-fpm

# Reiniciar
sudo bash install_and_deploy.sh restart

# Verificar logs
tail -f /var/log/nginx/fluxdesk_error.log
```

---

### ❌ Assets não carregam (404)

**Causa:** Build de assets falhou

**Solução:**
```bash
# Verificar se build existe
ls -la /var/www/fluxdesk/current/public/build/

# Rebuild manualmente
cd /var/www/fluxdesk/current
pnpm run build

# Verificar permissões
sudo chown -R www-data:www-data /var/www/fluxdesk/
```

---

### ❌ "Dev-server detectado em produção"

**Causa:** Build de produção não foi feito

**Solução:**
```bash
# No script, verificar variável
BUILD_ON_SERVER="true"  # Deve estar true

# Forçar rebuild
cd /var/www/fluxdesk/current
pnpm run build

# Limpar cache do navegador
# Ctrl+Shift+R (hard reload)
```

---

### ❌ Workers não processam filas

**Causa:** Supervisor parado ou mal configurado

**Solução:**
```bash
# Verificar status
sudo supervisorctl status

# Reiniciar workers
sudo supervisorctl restart all

# Ver logs
tail -f /var/www/fluxdesk/shared/storage/logs/worker.log

# Reconfigurar supervisor
sudo bash install_and_deploy.sh install
```

---

### ❌ Disco cheio

**Causa:** Muitas releases antigas ou logs grandes

**Solução:**
```bash
# Ver uso
sudo bash install_and_deploy.sh status

# Limpar releases
sudo bash install_and_deploy.sh cleanup

# Limpar logs antigos
sudo find /var/www/fluxdesk/shared/storage/logs/ -name "*.log" -mtime +30 -delete

# Limpar logs do sistema
sudo journalctl --vacuum-time=7d
```

---

## 📞 Suporte

Para problemas não cobertos neste manual:

1. **Verificar logs:** `sudo bash install_and_deploy.sh logs`
2. **Health check:** `sudo bash install_and_deploy.sh smoke`
3. **Status:** `sudo bash install_and_deploy.sh status`
4. **Documentação Laravel:** https://laravel.com/docs/11.x
5. **Issues GitHub:** Abrir issue no repositório

---

## 📄 Changelog do Script

### v2.0 (2025-10-26)
- ✅ Menu interativo visual
- ✅ 14 opções de gerenciamento
- ✅ Modo linha de comando mantido
- ✅ Backup de banco de dados
- ✅ Status detalhado dos serviços
- ✅ Submenu de logs

### v1.0 (2025-10-20)
- ✅ Deploy básico com releases
- ✅ Rollback
- ✅ Instalação automatizada
- ✅ Health checks

---

## 🎓 Glossário

- **Release:** Versão timestamped da aplicação em `/var/www/fluxdesk/releases/`
- **Symlink:** Atalho simbólico que aponta `/current` para a release ativa
- **Zero Downtime:** Deploy sem interrupção do serviço
- **Rollback:** Voltar para versão anterior instantaneamente
- **Smoke Test:** Testes rápidos para validar funcionamento básico
- **Shared:** Diretório com arquivos compartilhados entre releases (`.env`, `storage`)
- **Health Check:** Verificação automática do estado da aplicação

---

**Versão do Manual:** 2.0  
**Última Atualização:** 26/10/2025  
**Autor:** Sistema Fluxdesk  
**Licença:** Uso interno

