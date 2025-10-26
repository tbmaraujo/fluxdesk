#!/bin/bash

################################################################################
# FLUXDESK - Script de Deploy Automatizado
# Descrição: Instalação, deploy, rollback e health-check para Laravel 11
# Stack: Ubuntu 24.04, Nginx, PHP-FPM 8.3, Node 20, PostgreSQL
# Estrutura: /var/www/fluxdesk/{releases,shared,current}
################################################################################

set -Eeuo pipefail
trap 'echo "[ERR] Falha na linha $LINENO"; exit 1' ERR

# ============================
# VARIÁVEIS DE CONFIGURAÇÃO
# ============================

APP_NAME="fluxdesk"
DOMAIN="app.fluxdesk.com.br"
REPO_URL="git@github.com:tbmaraujo/fluxdesk.git"
BRANCH="main"
PHP_VERSION="8.3"
NODE_VERSION="20"
APP_DIR="/var/www/${APP_NAME}"
BUILD_ON_SERVER="true"
NGINX_USER="www-data"
RELEASES_TO_KEEP=3

# Subpastas
RELEASES_DIR="${APP_DIR}/releases"
SHARED_DIR="${APP_DIR}/shared"
CURRENT_DIR="${APP_DIR}/current"

# ============================
# FUNÇÕES DE LOGGING
# ============================

log() {
    echo -e "\e[32m[INFO]\e[0m $1"
}

warn() {
    echo -e "\e[33m[WARN]\e[0m $1"
}

err() {
    echo -e "\e[31m[ERROR]\e[0m $1"
    exit 1
}

# ============================
# CONFIGURAÇÃO SSH/GIT
# ============================

setup_git_ssh() {
    log "Configurando SSH para GitHub privado..."
    mkdir -p /root/.ssh
    chmod 700 /root/.ssh
    
    # Garantir permissões corretas da chave
    chmod 600 /root/.ssh/deploy_key 2>/dev/null || true
    
    # Adicionar GitHub ao known_hosts para evitar prompt
    ssh-keyscan -t rsa,ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null || true
    chmod 644 /root/.ssh/known_hosts
    
    # Configurar SSH para usar a deploy key
    cat >/root/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/deploy_key
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
    chmod 600 /root/.ssh/config
    
    # Exportar comando SSH para git
    export GIT_SSH_COMMAND="ssh -i /root/.ssh/deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
    
    log "✅ SSH configurado para GitHub"
}

# ============================
# CHECAGENS INICIAIS
# ============================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        err "Este script deve ser executado como root (use sudo)"
    fi
}

check_github_auth() {
    if [ ! -f /root/.ssh/deploy_key ]; then
        err "Deploy key não encontrada em /root/.ssh/deploy_key!"
    fi
    log "✅ Deploy key encontrada"
}

# ============================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================

install_packages() {
    log "Atualizando repositórios..."
    apt-get update -qq

    log "Instalando dependências básicas..."
    apt-get install -y -qq \
        software-properties-common \
        curl \
        wget \
        git \
        unzip \
        supervisor \
        certbot \
        gnupg2 \
        ca-certificates \
        lsb-release

    # PHP 8.3
    log "Adicionando repositório PHP 8.3..."
    add-apt-repository -y ppa:ondrej/php
    apt-get update -qq

    log "Instalando PHP ${PHP_VERSION} e extensões..."
    apt-get install -y -qq \
        php${PHP_VERSION}-fpm \
        php${PHP_VERSION}-cli \
        php${PHP_VERSION}-common \
        php${PHP_VERSION}-mbstring \
        php${PHP_VERSION}-xml \
        php${PHP_VERSION}-curl \
        php${PHP_VERSION}-zip \
        php${PHP_VERSION}-intl \
        php${PHP_VERSION}-bcmath \
        php${PHP_VERSION}-gd \
        php${PHP_VERSION}-pgsql \
        php${PHP_VERSION}-redis \
        php${PHP_VERSION}-opcache

    # Node.js 20 LTS
    log "Instalando Node.js ${NODE_VERSION} LTS..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs

    # pnpm (gerenciador de pacotes do projeto)
    log "Habilitando pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@latest --activate
    log "✅ pnpm instalado: $(pnpm --version)"

    # Nginx
    log "Instalando Nginx..."
    apt-get install -y -qq nginx

    # Composer
    log "Instalando Composer 2..."
    if [ ! -f /usr/local/bin/composer ]; then
        curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    fi

    # PostgreSQL Client (se necessário)
    log "Instalando PostgreSQL client..."
    apt-get install -y -qq postgresql-client

    log "✅ Todas as dependências instaladas com sucesso!"
}

# ============================
# CONFIGURAÇÃO DE DIRETÓRIOS
# ============================

setup_dirs() {
    log "Criando estrutura de diretórios..."
    
    mkdir -p "${RELEASES_DIR}"
    mkdir -p "${SHARED_DIR}"
    mkdir -p "${SHARED_DIR}/storage"
    mkdir -p "${SHARED_DIR}/storage/app/public"
    mkdir -p "${SHARED_DIR}/storage/framework/cache"
    mkdir -p "${SHARED_DIR}/storage/framework/sessions"
    mkdir -p "${SHARED_DIR}/storage/framework/views"
    mkdir -p "${SHARED_DIR}/storage/logs"

    # .env compartilhado
    if [ ! -f "${SHARED_DIR}/.env" ]; then
        warn "Arquivo .env não encontrado em ${SHARED_DIR}/.env"
        warn "Criando .env de exemplo. ATENÇÃO: Configure manualmente!"
        cat > "${SHARED_DIR}/.env" <<'EOF'
APP_NAME=FluxDesk
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://app.fluxdesk.com.br
ASSET_URL=https://app.fluxdesk.com.br

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fluxdesk
DB_USERNAME=fluxdesk_user
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

VITE_APP_NAME="${APP_NAME}"
EOF
        warn "⚠️  Configure o arquivo ${SHARED_DIR}/.env antes de prosseguir!"
    fi

    # Permissões
    chown -R ${NGINX_USER}:${NGINX_USER} "${APP_DIR}"
    chmod -R 755 "${APP_DIR}"
    chmod -R 775 "${SHARED_DIR}/storage"

    log "✅ Estrutura de diretórios criada!"
}

# ============================
# CONFIGURAÇÃO DO NGINX
# ============================

setup_nginx() {
    log "Configurando Nginx para ${DOMAIN}..."

    cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${CURRENT_DIR}/public;
    index index.php index.html;

    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Ativar site
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
    
    # Remover default se existir
    rm -f /etc/nginx/sites-enabled/default

    # Testar configuração
    nginx -t || err "Erro na configuração do Nginx!"

    # NÃO recarregar Nginx aqui (evitar 502 no primeiro provisionamento)
    # O reload será feito no final do deploy

    log "✅ Nginx configurado!"
}

# ============================
# CONFIGURAÇÃO DO SUPERVISOR
# ============================

setup_supervisor() {
    log "Configurando Supervisor para queue workers..."

    # Garantir que supervisor está instalado e rodando
    if ! systemctl is-active --quiet supervisor; then
        log "Iniciando serviço supervisor..."
        systemctl enable supervisor 2>/dev/null || true
        systemctl start supervisor
        
        # Aguardar supervisor ficar pronto (verificar socket)
        log "Aguardando supervisor inicializar..."
        for i in {1..10}; do
            if [ -S /var/run/supervisor.sock ] || supervisorctl status >/dev/null 2>&1; then
                log "✅ Supervisor pronto"
                break
            fi
            if [ $i -eq 10 ]; then
                warn "Supervisor demorou para iniciar, continuando mesmo assim..."
            fi
            sleep 1
        done
    fi

    cat > /etc/supervisor/conf.d/${APP_NAME}-worker.conf <<EOF
[program:${APP_NAME}-worker]
process_name=%(program_name)s_%(process_num)02d
command=php ${CURRENT_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=${NGINX_USER}
numprocs=2
redirect_stderr=true
stdout_logfile=${SHARED_DIR}/storage/logs/worker.log
stopwaitsecs=3600
EOF

    # Recarregar configurações do supervisor com retry
    log "Recarregando configurações do supervisor..."
    for i in {1..3}; do
        if supervisorctl reread 2>/dev/null && supervisorctl update 2>/dev/null; then
            log "✅ Supervisor configurado!"
            return 0
        fi
        if [ $i -lt 3 ]; then
            warn "Tentativa $i falhou, aguardando 2s..."
            sleep 2
        fi
    done
    
    warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    warn "⚠️  Supervisor não conseguiu inicializar"
    warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    warn "Isso NÃO impede o deploy. Workers são opcionais."
    warn ""
    warn "Para usar filas mais tarde, escolha:"
    warn ""
    warn "1. Sem filas (mais simples):"
    warn "   Configure no .env: QUEUE_CONNECTION=sync"
    warn ""
    warn "2. Corrigir supervisor:"
    warn "   sudo apt-get remove --purge supervisor"
    warn "   sudo apt-get install -y supervisor"
    warn "   sudo supervisorctl reread && sudo supervisorctl update"
    warn ""
    warn "3. Usar systemd ao invés:"
    warn "   Ver: /home/ubuntu/Sistema-Chamados/Setup/README-DEPLOY.md"
    warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ============================
# VALIDAÇÕES PRÉ-DEPLOY
# ============================

validate_postgres() {
    log "Verificando PostgreSQL..."
    
    # Verificar se PostgreSQL está instalado
    if ! command -v psql &> /dev/null; then
        warn "PostgreSQL client não instalado"
        return 1
    fi
    
    # Verificar se está rodando (local ou remoto)
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        warn "PostgreSQL não está rodando localmente"
        warn "Se usar RDS/remoto, ignore este aviso"
    fi
    
    return 0
}

validate_env() {
    log "Validando arquivo .env..."
    
    if [ ! -f "${SHARED_DIR}/.env" ]; then
        err ".env não encontrado em ${SHARED_DIR}/.env"
    fi
    
    # Verificar variáveis críticas
    local missing=""
    
    if ! grep -q "DB_HOST=" "${SHARED_DIR}/.env" || grep -q "DB_HOST=$" "${SHARED_DIR}/.env"; then
        missing="${missing}\n  - DB_HOST (host do banco de dados)"
    fi
    
    if ! grep -q "DB_DATABASE=" "${SHARED_DIR}/.env" || grep -q "DB_DATABASE=$" "${SHARED_DIR}/.env"; then
        missing="${missing}\n  - DB_DATABASE (nome do banco)"
    fi
    
    if ! grep -q "DB_USERNAME=" "${SHARED_DIR}/.env" || grep -q "DB_USERNAME=$" "${SHARED_DIR}/.env"; then
        missing="${missing}\n  - DB_USERNAME (usuário do banco)"
    fi
    
    if ! grep -q "DB_PASSWORD=" "${SHARED_DIR}/.env" || grep -q "DB_PASSWORD=$" "${SHARED_DIR}/.env"; then
        missing="${missing}\n  - DB_PASSWORD (senha do banco)"
    fi
    
    if [ -n "$missing" ]; then
        err "Variáveis obrigatórias faltando no .env:${missing}\n\nConfigure: sudo nano ${SHARED_DIR}/.env"
    fi
    
    # Verificar APP_DEBUG
    if grep -q "APP_DEBUG=true" "${SHARED_DIR}/.env"; then
        warn "⚠️  ATENÇÃO: APP_DEBUG=true em produção!"
        warn "Configure: APP_DEBUG=false"
    fi
    
    # Adicionar ASSET_URL se não existir (necessário para HTTPS com proxy)
    if ! grep -q "^ASSET_URL=" "${SHARED_DIR}/.env"; then
        log "Adicionando ASSET_URL ao .env..."
        echo "ASSET_URL=https://app.fluxdesk.com.br" >> "${SHARED_DIR}/.env"
    fi
    
    log "✅ .env validado"
}

check_database_connection() {
    log "Testando conexão com banco de dados..."
    
    cd ${RELEASE_PATH}
    
    # Tentar conectar com o banco
    if php artisan db:show 2>&1 | grep -qi "database\|connection"; then
        log "✅ Conexão com banco OK"
        return 0
    else
        warn "Não foi possível conectar ao banco de dados"
        warn "Verifique: DB_HOST, DB_USERNAME, DB_PASSWORD no .env"
        
        # Sugerir criação de banco se PostgreSQL local
        if systemctl is-active --quiet postgresql 2>/dev/null; then
            warn ""
            warn "PostgreSQL está rodando localmente."
            warn "Para criar o banco automaticamente, execute:"
            warn "  sudo -u postgres psql -c \"CREATE DATABASE \$(grep DB_DATABASE ${SHARED_DIR}/.env | cut -d '=' -f 2);\""
        fi
        
        return 1
    fi
}

# ============================
# DEPLOY
# ============================

deploy() {
    log "Iniciando deploy..."

    # Validações pré-deploy
    validate_postgres
    validate_env

    RELEASE_NAME=$(date +%Y-%m-%d-%H%M%S)
    RELEASE_PATH="${RELEASES_DIR}/${RELEASE_NAME}"
    DEPLOY_LOG="${RELEASE_PATH}.deploy.log"

    log "Criando release: ${RELEASE_NAME}"
    
    # Configurar SSH para GitHub
    setup_git_ssh
    
    # Clone do repositório com fallback
    log "Clonando repositório..."
    if ! git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${RELEASE_PATH}" 2>&1 | tee -a "${DEPLOY_LOG}"; then
        warn "Tentativa 1 falhou, aguardando 2s e tentando novamente..."
        sleep 2
        git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${RELEASE_PATH}" 2>&1 | tee -a "${DEPLOY_LOG}" || {
            err "Falha ao clonar repositório após 2 tentativas"
        }
    fi

    # Entrar no diretório da release
    cd ${RELEASE_PATH}

    # Symlinks para shared
    log "Criando symlinks para arquivos compartilhados..."
    rm -rf storage
    ln -s ${SHARED_DIR}/storage storage
    ln -sf ${SHARED_DIR}/.env .env

    # Composer install com memória ilimitada
    log "Instalando dependências PHP..."
    COMPOSER_MEMORY_LIMIT=-1 composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction 2>&1 | tee -a "${DEPLOY_LOG}" || {
        err "Falha no composer install"
    }

    # PNPM build resiliente (projeto usa pnpm, não npm)
    if [ "${BUILD_ON_SERVER}" = "true" ]; then
        log "Instalando dependências com pnpm..."
        pnpm install --frozen-lockfile 2>&1 | tee -a "${DEPLOY_LOG}" || {
            warn "pnpm install --frozen-lockfile falhou, tentando sem frozen..."
            pnpm install 2>&1 | tee -a "${DEPLOY_LOG}" || {
                err "Falha na instalação com pnpm"
            }
        }
        
        log "Compilando assets (Vite)..."
        pnpm run build 2>&1 | tee -a "${DEPLOY_LOG}" || {
            warn "pnpm run build falhou, tentando com --force..."
            pnpm run build -- --force 2>&1 | tee -a "${DEPLOY_LOG}" || {
                err "Falha no pnpm run build mesmo com --force"
            }
        }
    fi

    # Gerar APP_KEY se não existir
    if ! grep -q "APP_KEY=base64:" ${SHARED_DIR}/.env; then
        warn "APP_KEY não configurada. Gerando..."
        php artisan key:generate --force
    fi

    # Verificar conexão com banco antes de migrar
    check_database_connection || {
        err "Não foi possível conectar ao banco de dados. Configure o banco antes de continuar."
    }

    # Migrar banco de dados
    log "Executando migrações..."
    php artisan migrate --force || {
        err "Falha nas migrações. Verifique se o banco de dados existe e as credenciais estão corretas."
    }

    # Cache de otimização
    log "Otimizando caches..."
    php artisan config:cache
    # NÃO usar route:cache com Inertia.js (quebra redirecionamentos dinâmicos)
    php artisan view:cache
    php artisan event:cache

    # Storage link
    log "Criando link simbólico do storage público..."
    php artisan storage:link --force 2>&1 | tee -a "${DEPLOY_LOG}" || true
    
    # Permissões finais
    log "Ajustando permissões..."
    chown -R ${NGINX_USER}:${NGINX_USER} "${RELEASES_DIR}" "${SHARED_DIR}"
    chmod -R 755 ${RELEASE_PATH}
    chmod -R 775 ${RELEASE_PATH}/bootstrap/cache
    
    # Permissões storage (mais granular)
    find "${SHARED_DIR}/storage" -type d -exec chmod 775 {} \;
    find "${SHARED_DIR}/storage" -type f -exec chmod 664 {} \;

    # Health check antes de ativar (garantir que build terminou)
    log "Verificando saúde da release antes de ativar..."
    for i in {1..5}; do
        if [ -f "${RELEASE_PATH}/public/index.php" ] && [ -d "${RELEASE_PATH}/public/build" ]; then
            log "✅ Release pronta para ativação"
            break
        fi
        if [ $i -eq 5 ]; then
            err "Release não está pronta após 5 tentativas"
        fi
        sleep 2
    done
    
    # Ativar release (trocar symlink)
    log "Ativando release..."
    ln -sfn ${RELEASE_PATH} ${CURRENT_DIR}

    # Reload de serviços (Nginx agora, depois que current existe)
    log "Recarregando serviços..."
    systemctl reload php${PHP_VERSION}-fpm
    systemctl reload nginx
    
    # NÃO tocar no cloudflared (já está configurado e rodando)

    # Smoke test anti-Vite (CRÍTICO)
    log "Verificando se NÃO há dev-server em produção..."
    sleep 2  # Dar tempo do Nginx recarregar
    if curl -fsS "http://127.0.0.1" 2>&1 | grep -E "5173|@vite/client|react-refresh" >/dev/null; then
        err "[CRÍTICO] Conteúdo de dev (Vite) detectado em produção! Build falhou!"
    fi
    log "✅ Build de produção confirmado (sem dev-server)"
    
    # Limpar releases antigas
    cleanup_old_releases

    log "✅ Deploy concluído com sucesso!"
    log "Release ativa: ${RELEASE_NAME}"
    log "Log completo: ${DEPLOY_LOG}"
}

# ============================
# ROLLBACK
# ============================

rollback() {
    log "Iniciando rollback..."

    # Listar releases (exceto a atual)
    CURRENT_RELEASE=$(readlink ${CURRENT_DIR} | xargs basename)
    RELEASES=($(ls -1t ${RELEASES_DIR} | grep -v ${CURRENT_RELEASE}))

    if [ ${#RELEASES[@]} -eq 0 ]; then
        err "Nenhuma release anterior disponível para rollback!"
    fi

    PREVIOUS_RELEASE=${RELEASES[0]}
    PREVIOUS_PATH="${RELEASES_DIR}/${PREVIOUS_RELEASE}"

    warn "Fazendo rollback de ${CURRENT_RELEASE} para ${PREVIOUS_RELEASE}..."

    # Trocar symlink
    ln -sfn ${PREVIOUS_PATH} ${CURRENT_DIR}

    # Reload de serviços
    systemctl reload php${PHP_VERSION}-fpm
    systemctl reload nginx

    log "✅ Rollback concluído!"
    log "Release ativa: ${PREVIOUS_RELEASE}"
}

# ============================
# LIMPEZA DE RELEASES ANTIGAS
# ============================

cleanup_old_releases() {
    log "Limpando releases antigas (mantendo ${RELEASES_TO_KEEP})..."

    RELEASES=($(ls -1t ${RELEASES_DIR}))
    TOTAL=${#RELEASES[@]}

    if [ ${TOTAL} -gt ${RELEASES_TO_KEEP} ]; then
        for (( i=${RELEASES_TO_KEEP}; i<${TOTAL}; i++ )); do
            RELEASE_TO_DELETE="${RELEASES_DIR}/${RELEASES[$i]}"
            log "Removendo release: ${RELEASES[$i]}"
            rm -rf ${RELEASE_TO_DELETE}
        done
    fi

    log "✅ Limpeza concluída!"
}

# ============================
# HEALTH CHECK
# ============================

smoke() {
    log "Executando health checks..."

    # Check 1: Nginx rodando
    if ! systemctl is-active --quiet nginx; then
        err "Nginx não está rodando!"
    fi
    log "✅ Nginx ativo"

    # Check 2: PHP-FPM rodando
    if ! systemctl is-active --quiet php${PHP_VERSION}-fpm; then
        err "PHP-FPM não está rodando!"
    fi
    log "✅ PHP-FPM ativo"

    # Check 3: Aplicação respondendo (localhost)
    # Testar rota /up (health check do Laravel 11) ou aceitar 200/302
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/up 2>/dev/null || echo "000")
    
    # Se /up não existir, testar rota raiz e aceitar 200 ou 302 (redirect)
    if [ "${HTTP_CODE}" = "000" ] || [ "${HTTP_CODE}" = "404" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1)
    fi
    
    if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "302" ]; then
        err "Aplicação retornou código HTTP ${HTTP_CODE} (esperado: 200 ou 302)"
    fi
    log "✅ Aplicação respondendo (HTTP ${HTTP_CODE})"

    # Check 4: Verificar se NÃO tem dev-server (Vite) - DUPLO CHECK
    log "Verificando ausência de dev-server (Vite)..."
    HTML_CONTENT=$(curl -fsS http://127.0.0.1 2>/dev/null || echo "")
    if echo "$HTML_CONTENT" | grep -E "5173|@vite/client|react-refresh" >/dev/null; then
        err "[CRÍTICO] Dev-server detectado! Build de produção falhou!"
    fi
    if echo "$HTML_CONTENT" | grep -q "public/build"; then
        log "✅ Assets de produção detectados (public/build)"
    else
        warn "Atenção: Referência a public/build não encontrada no HTML"
    fi
    log "✅ Sem dev-server (build de produção OK)"

    # Check 5: Cloudflared (se estiver configurado)
    if systemctl is-active --quiet cloudflared; then
        log "✅ Cloudflared ativo"
    else
        warn "Cloudflared não está rodando (pode estar OK se não usar)"
    fi

    # Check 6: Permissões
    if [ ! -w "${SHARED_DIR}/storage/logs" ]; then
        err "Diretório de logs sem permissão de escrita!"
    fi
    log "✅ Permissões OK"

    log "🎉 Todos os health checks passaram!"
}

# ============================
# COMANDO ALL (COMPLETO)
# ============================

run_all() {
    log "Executando instalação e deploy completos..."
    
    install_packages
    setup_dirs
    setup_nginx
    setup_supervisor
    if ! deploy; then
        warn "Deploy falhou! Tentando rollback automático..."
        if rollback 2>/dev/null; then
            err "Deploy falhou e rollback foi executado"
        else
            err "Deploy falhou e rollback também falhou (sem release anterior?)"
        fi
    fi
    smoke

    log "🎉 Instalação e deploy completos com sucesso!"
}

# ============================
# MENU PRINCIPAL
# ============================

show_usage() {
    cat <<EOF
┌────────────────────────────────────────────────────────────┐
│  FLUXDESK - Script de Deploy Automatizado                 │
│  Stack: Ubuntu 24.04, Nginx, PHP 8.3, Node 20             │
└────────────────────────────────────────────────────────────┘

USO:
  sudo bash install_and_deploy.sh [COMANDO]

COMANDOS:
  install    Instala dependências do sistema (PHP, Node, Nginx, etc)
  deploy     Faz deploy de nova release (clone, build, migrate, ativa)
  rollback   Faz rollback para release anterior
  smoke      Executa health checks na aplicação
  all        Executa tudo (install + deploy + smoke)

EXEMPLOS:
  # Instalação inicial
  sudo bash install_and_deploy.sh install

  # Deploy
  sudo bash install_and_deploy.sh deploy

  # Rollback
  sudo bash install_and_deploy.sh rollback

  # Health check
  sudo bash install_and_deploy.sh smoke

  # Completo (primeira vez)
  sudo bash install_and_deploy.sh all

EOF
}

# ============================
# EXECUÇÃO
# ============================

check_root

case "${1:-}" in
    install)
        install_packages
        setup_dirs
        setup_nginx
        setup_supervisor
        ;;
    deploy)
        check_github_auth
        deploy
        smoke
        ;;
    rollback)
        rollback
        smoke
        ;;
    smoke)
        smoke
        ;;
    all)
        if ! check_github_auth; then
            err "Falha na verificação de autenticação GitHub"
        fi
        run_all
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0
