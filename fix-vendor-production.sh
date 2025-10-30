#!/usr/bin/env bash
#
# Fix: Arquivos faltantes no vendor (Symfony)
# Data: 2025-10-30
# Problema: composer install incompleto ou corrompido
#

set -e

echo "======================================"
echo "🔧 Fix: Vendor Corrompido"
echo "======================================"
echo ""

# Variáveis
RELEASE_DIR="/var/www/fluxdesk/releases/2025-10-29-235754"
CURRENT_DIR="/var/www/fluxdesk/current"

# Determinar qual diretório usar
if [ -d "$RELEASE_DIR" ]; then
    WORK_DIR="$RELEASE_DIR"
    echo "📂 Trabalhando na release específica: $RELEASE_DIR"
elif [ -L "$CURRENT_DIR" ]; then
    WORK_DIR=$(readlink -f "$CURRENT_DIR")
    echo "📂 Trabalhando na release atual: $WORK_DIR"
else
    echo "❌ Erro: Nenhum diretório de release encontrado!"
    exit 1
fi

echo ""
echo "🔍 Diagnóstico inicial..."

# Verificar se o vendor existe
if [ ! -d "$WORK_DIR/vendor" ]; then
    echo "❌ Diretório vendor não existe!"
else
    echo "✅ Diretório vendor existe"
fi

# Verificar arquivos específicos que estão faltando
echo ""
echo "🔍 Verificando arquivos faltantes do Symfony..."

MISSING_FILES=(
    "vendor/symfony/console/Event/ConsoleErrorEvent.php"
    "vendor/symfony/string/Resources/data/wcswidth_table_zero.php"
)

MISSING_COUNT=0
for file in "${MISSING_FILES[@]}"; do
    if [ ! -f "$WORK_DIR/$file" ]; then
        echo "❌ Faltando: $file"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    else
        echo "✅ OK: $file"
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    echo ""
    echo "✅ Todos os arquivos estão presentes!"
    echo "O problema pode ter sido corrigido automaticamente."
    exit 0
fi

echo ""
echo "⚠️  Encontrados $MISSING_COUNT arquivo(s) faltante(s)"
echo ""

# Navegar para o diretório
cd "$WORK_DIR"

echo "======================================"
echo "🔧 Aplicando Correções"
echo "======================================"
echo ""

# Solução 1: Limpar cache do Composer
echo "1️⃣ Limpando cache do Composer..."
composer clear-cache

# Solução 2: Remover vendor e composer.lock
echo ""
echo "2️⃣ Removendo vendor corrompido..."
rm -rf vendor/

echo ""
echo "3️⃣ Reinstalando dependências do Composer..."
echo "   (Isso pode levar alguns minutos...)"
echo ""

# Reinstalar com flags corretas para produção
COMPOSER_MEMORY_LIMIT=-1 composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    --verbose

echo ""
echo "======================================"
echo "✅ Verificação Pós-Correção"
echo "======================================"
echo ""

# Verificar novamente os arquivos
MISSING_COUNT_AFTER=0
for file in "${MISSING_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ AINDA FALTANDO: $file"
        MISSING_COUNT_AFTER=$((MISSING_COUNT_AFTER + 1))
    else
        echo "✅ Corrigido: $file"
    fi
done

echo ""

if [ $MISSING_COUNT_AFTER -eq 0 ]; then
    echo "✅ SUCESSO! Todos os arquivos foram restaurados!"
    
    # Recriar autoload otimizado
    echo ""
    echo "4️⃣ Otimizando autoloader..."
    composer dump-autoload --optimize --no-dev
    
    # Limpar caches do Laravel
    echo ""
    echo "5️⃣ Limpando caches do Laravel..."
    php artisan config:clear
    php artisan cache:clear
    php artisan view:clear
    
    # Recriar caches otimizados
    echo ""
    echo "6️⃣ Recriando caches otimizados..."
    php artisan config:cache
    php artisan view:cache
    php artisan event:cache
    
    # Ajustar permissões
    echo ""
    echo "7️⃣ Ajustando permissões..."
    chown -R www-data:www-data "$WORK_DIR"
    chmod -R 755 "$WORK_DIR"
    
    # Recarregar serviços
    echo ""
    echo "8️⃣ Recarregando serviços..."
    systemctl reload php8.3-fpm
    systemctl restart fluxdesk-queue
    
    echo ""
    echo "======================================"
    echo "🎉 Correção Concluída!"
    echo "======================================"
    echo ""
    echo "✅ Vendor reinstalado"
    echo "✅ Autoloader otimizado"
    echo "✅ Caches limpos e recriados"
    echo "✅ Permissões ajustadas"
    echo "✅ Serviços reiniciados"
    echo ""
    echo "📋 Próximos passos:"
    echo "  1. Testar aplicação: curl -I https://app.fluxdesk.com.br"
    echo "  2. Verificar logs: tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log"
    echo "  3. Testar resposta por e-mail"
    echo ""
else
    echo "❌ ERRO: Ainda há $MISSING_COUNT_AFTER arquivo(s) faltante(s)"
    echo ""
    echo "🔍 Possíveis causas:"
    echo "  1. Problema no composer.json ou composer.lock"
    echo "  2. Problema de rede ao baixar pacotes"
    echo "  3. Versão incompatível do PHP ou Composer"
    echo ""
    echo "🔧 Tente manualmente:"
    echo "  cd $WORK_DIR"
    echo "  composer show symfony/console"
    echo "  composer show symfony/string"
    echo "  composer why symfony/console"
    echo ""
    exit 1
fi

