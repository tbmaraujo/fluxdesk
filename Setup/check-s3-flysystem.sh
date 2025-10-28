#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificação: league/flysystem-aws-s3-v3"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /var/www/fluxdesk/current 2>/dev/null || cd /home/thiago/Projetos/fludesk

# 1. Verificar se pacote está no composer.lock
echo "[1/4] Verificando composer.lock..."
if grep -q "league/flysystem-aws-s3-v3" composer.lock 2>/dev/null; then
    VERSION=$(grep -A 5 "league/flysystem-aws-s3-v3" composer.lock | grep "version" | head -1 | cut -d'"' -f4)
    echo "✅ Pacote encontrado no composer.lock"
    echo "   Versão: ${VERSION}"
else
    echo "❌ Pacote NÃO encontrado no composer.lock"
    echo "   Execute: composer require league/flysystem-aws-s3-v3"
    exit 1
fi

echo ""

# 2. Verificar se está instalado no vendor
echo "[2/4] Verificando pasta vendor..."
if [ -d "vendor/league/flysystem-aws-s3-v3" ]; then
    echo "✅ Pacote instalado em vendor/league/flysystem-aws-s3-v3"
    
    # Verificar a classe específica que estava dando erro
    if [ -f "vendor/league/flysystem-aws-s3-v3/PortableVisibilityConverter.php" ]; then
        echo "✅ PortableVisibilityConverter.php encontrado"
    else
        echo "⚠️  PortableVisibilityConverter.php não encontrado"
    fi
else
    echo "❌ Pacote NÃO instalado no vendor"
    echo "   Execute: composer install --no-dev"
    exit 1
fi

echo ""

# 3. Verificar configuração do S3 no filesystem
echo "[3/4] Verificando configuração S3..."
if grep -q "'driver' => 's3'" config/filesystems.php 2>/dev/null; then
    echo "✅ Driver S3 configurado em config/filesystems.php"
else
    echo "⚠️  Driver S3 não encontrado na configuração"
fi

# Verificar se .env tem as credenciais AWS
if [ -f ".env" ]; then
    if grep -q "AWS_ACCESS_KEY_ID=" .env && grep -q "AWS_SECRET_ACCESS_KEY=" .env; then
        echo "✅ Credenciais AWS encontradas no .env"
    elif grep -q "AWS_USE_PATH_STYLE_ENDPOINT=" .env; then
        echo "✅ Configurado para usar IAM Role (EC2)"
    else
        echo "⚠️  Credenciais AWS não encontradas no .env"
    fi
    
    if grep -q "AWS_BUCKET=" .env || grep -q "AWS_SES_S3_BUCKET=" .env; then
        BUCKET=$(grep "AWS_SES_S3_BUCKET=" .env | cut -d'=' -f2)
        echo "✅ Bucket configurado: ${BUCKET}"
    else
        echo "⚠️  Bucket não configurado no .env"
    fi
fi

echo ""

# 4. Verificar se erro ainda aparece nos logs
echo "[4/4] Verificando logs recentes..."
if [ -d "storage/logs" ]; then
    LATEST_LOG=$(ls -t storage/logs/laravel-*.log 2>/dev/null | head -1)
    
    if [ -n "$LATEST_LOG" ]; then
        if grep -q "PortableVisibilityConverter" "$LATEST_LOG" 2>/dev/null; then
            echo "❌ ERRO ainda presente no log!"
            echo ""
            echo "Últimas ocorrências:"
            grep "PortableVisibilityConverter" "$LATEST_LOG" | tail -3
        else
            echo "✅ Nenhum erro 'PortableVisibilityConverter' encontrado nos logs"
        fi
    else
        echo "⚠️  Nenhum log encontrado em storage/logs/"
    fi
else
    echo "⚠️  Diretório storage/logs não encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificação concluída!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para testar na prática:"
echo "  1. Envie um e-mail para: SLUG@seu-dominio.com"
echo "  2. Acompanhe: tail -f storage/logs/laravel-\$(date +%Y-%m-%d).log"
echo ""

