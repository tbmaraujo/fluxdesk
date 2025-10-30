#!/usr/bin/env bash
#
# Deploy Fix: Adicionar campos faltantes na tabela replies
# Data: 2025-10-30
# Problema: Coluna is_internal não existe, causando erro ao processar respostas por e-mail
#

set -e  # Parar em caso de erro

echo "======================================"
echo "🚀 Deploy Fix - Tabela Replies"
echo "======================================"
echo ""

# Variáveis de ambiente
PROJECT_DIR="/var/www/fluxdesk"
DEPLOY_DIR="$PROJECT_DIR/releases/$(date +%Y-%m-%d-%H%M%S)"
CURRENT_LINK="$PROJECT_DIR/current"

echo "📋 Informações do Deploy:"
echo "  - Diretório do projeto: $PROJECT_DIR"
echo "  - Nova release: $DEPLOY_DIR"
echo "  - Symlink atual: $CURRENT_LINK"
echo ""

# Verificar se o projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Erro: Diretório $PROJECT_DIR não encontrado"
    exit 1
fi

# Criar diretório da nova release
echo "📦 Criando diretório da nova release..."
mkdir -p "$DEPLOY_DIR"

# Clonar código do repositório
echo "📥 Clonando código do repositório..."
cd "$PROJECT_DIR"

# Se houver um current, usar como referência
if [ -L "$CURRENT_LINK" ]; then
    CURRENT_DIR=$(readlink -f "$CURRENT_LINK")
    echo "  - Copiando de: $CURRENT_DIR"
    cp -r "$CURRENT_DIR/." "$DEPLOY_DIR/"
else
    echo "❌ Erro: Symlink $CURRENT_LINK não encontrado"
    exit 1
fi

# Navegar para o diretório da nova release
cd "$DEPLOY_DIR"

# Pull das últimas alterações
echo "🔄 Atualizando código..."
git fetch origin main
git reset --hard origin/main

# Instalar dependências do Composer
echo "📦 Instalando dependências do Composer..."
composer install --no-dev --optimize-autoloader --no-interaction

# Instalar dependências do Node
echo "📦 Instalando dependências do Node (pnpm)..."
pnpm install --frozen-lockfile

# Compilar assets
echo "🔨 Compilando assets..."
pnpm build

# Criar symlinks para storage e .env
echo "🔗 Criando symlinks..."
rm -rf "$DEPLOY_DIR/storage"
ln -s "$PROJECT_DIR/storage" "$DEPLOY_DIR/storage"

rm -f "$DEPLOY_DIR/.env"
ln -s "$PROJECT_DIR/.env" "$DEPLOY_DIR/.env"

# Otimizar caches do Laravel
echo "⚡ Otimizando caches do Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Executar migrations (incluindo a correção da tabela replies)
echo "🗄️  Executando migrations..."
echo "⚠️  ATENÇÃO: Executando migration que adiciona campos à tabela replies"
php artisan migrate --force

# Recriar caches otimizados
echo "⚡ Recriando caches otimizados..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Atualizar symlink para a nova release
echo "🔄 Atualizando symlink para nova release..."
ln -sfn "$DEPLOY_DIR" "$CURRENT_LINK"

# Recarregar PHP-FPM
echo "🔄 Recarregando PHP-FPM..."
sudo systemctl reload php8.3-fpm

# Reiniciar queue workers
echo "🔄 Reiniciando queue workers..."
sudo systemctl restart fluxdesk-queue

# Verificar status dos serviços
echo ""
echo "✅ Verificando status dos serviços..."
sudo systemctl status php8.3-fpm --no-pager | head -n 5
sudo systemctl status fluxdesk-queue --no-pager | head -n 5

echo ""
echo "======================================"
echo "✅ Deploy concluído com sucesso!"
echo "======================================"
echo ""
echo "📋 Próximos passos:"
echo "  1. Verificar logs: tail -f $PROJECT_DIR/storage/logs/laravel.log"
echo "  2. Testar resposta por e-mail"
echo "  3. Monitorar fila: php artisan queue:monitor"
echo ""
echo "🔍 Para verificar a estrutura da tabela replies:"
echo "   sudo -u postgres psql fluxdesk -c '\\d replies'"
echo ""

