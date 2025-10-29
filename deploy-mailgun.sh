#!/bin/bash
#
# Script de Deploy da Migração Mailgun para Produção
# Fluxdesk - Help Desk System
#
# Uso: bash deploy-mailgun.sh
#

set -e  # Parar em caso de erro

echo "🚀 Deploy da Migração Mailgun - Fluxdesk"
echo "========================================"
echo ""

# Verificar se está rodando com sudo
if [ "$EUID" -eq 0 ]; then 
    echo -e "\033[0;31m⚠ AVISO: Você está rodando este script como ROOT (sudo)\033[0m"
    echo ""
    echo "Isso pode causar problemas de permissões!"
    echo "Recomendado: rode sem sudo e configure sudoers para supervisorctl"
    echo ""
    echo "Deseja continuar mesmo assim? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Deploy cancelado."
        echo ""
        echo "Para rodar sem sudo, configure:"
        echo "  sudo visudo"
        echo ""
        echo "E adicione:"
        echo "  ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart fluxdesk-worker:*"
        exit 0
    fi
    echo ""
fi

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Verificar se está na raiz do projeto
if [ ! -f "artisan" ]; then
    print_error "Erro: Execute este script na raiz do projeto Laravel"
    exit 1
fi

# Detectar se é deploy gerenciado (Capistrano/Deployer/Envoyer)
MANAGED_DEPLOY=false
if [[ "$PWD" == *"/releases/"* ]] || [[ "$PWD" == *"/current"* ]] || [ -L "." ]; then
    MANAGED_DEPLOY=true
    print_warning "Deploy gerenciado detectado (Capistrano/Deployer)"
    print_info "Pulando comandos Git (já gerenciado pela ferramenta de deploy)"
fi

# Passo 1: Atualizar código (apenas se não for deploy gerenciado)
if [ "$MANAGED_DEPLOY" = false ]; then
    # Verificar se Git está limpo
    print_info "Verificando status do Git..."
    
    # Corrigir problema de ownership se necessário
    if git status 2>&1 | grep -q "dubious ownership"; then
        print_warning "Corrigindo permissões do Git..."
        git config --global --add safe.directory "$PWD"
    fi
    
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        print_warning "Há alterações não commitadas. Deseja continuar? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_info "Deploy cancelado."
            exit 0
        fi
    fi

    print_info "Atualizando código do repositório..."
    git pull origin main
    if [ $? -eq 0 ]; then
        print_success "Código atualizado"
    else
        print_error "Falha ao atualizar código"
        exit 1
    fi

    # Verificar se o commit da migração existe
    if git log --oneline 2>/dev/null | grep -q "migração completa do Amazon SES para Mailgun"; then
        print_success "Commit da migração encontrado"
    else
        print_warning "Commit da migração não encontrado. Verifique se está no branch correto."
    fi
else
    print_success "Deploy gerenciado - código já foi atualizado pela ferramenta"
fi

# Passo 1.5: Verificar e corrigir permissões
print_info "Verificando permissões..."

# Verificar se storage é gravável
if [ ! -w "storage/logs" ]; then
    print_warning "Storage não é gravável. Tentando corrigir permissões..."
    
    # Tentar sem sudo primeiro
    chmod -R 775 storage 2>/dev/null || true
    chmod -R 775 bootstrap/cache 2>/dev/null || true
    
    # Se ainda não funcionar, tentar com sudo
    if [ ! -w "storage/logs" ]; then
        print_warning "Necessário sudo para corrigir permissões..."
        sudo chown -R www-data:www-data "$PWD" || print_warning "Falha ao alterar dono (ignorando)"
        sudo chmod -R 775 "$PWD/storage" || print_warning "Falha ao alterar permissões storage"
        sudo chmod -R 775 "$PWD/bootstrap/cache" || print_warning "Falha ao alterar permissões cache"
        
        if [ ! -w "storage/logs" ]; then
            print_error "Não foi possível corrigir permissões do storage"
            print_info "Execute manualmente:"
            echo "  sudo chown -R www-data:www-data $PWD"
            echo "  sudo chmod -R 775 $PWD/storage"
            echo "  sudo chmod -R 775 $PWD/bootstrap/cache"
            exit 1
        fi
    fi
    print_success "Permissões corrigidas"
else
    print_success "Permissões OK"
fi

# Passo 2: Instalar dependências
print_info "Instalando dependências do Composer..."
composer install --no-dev --optimize-autoloader --no-interaction
if [ $? -eq 0 ]; then
    print_success "Dependências instaladas"
else
    print_error "Falha ao instalar dependências"
    print_warning "Verifique se há problemas de permissões acima"
    exit 1
fi

# Verificar se o Mailgun foi instalado
if composer show | grep -q "mailgun/mailgun-php"; then
    print_success "Pacote mailgun/mailgun-php instalado"
else
    print_error "Pacote mailgun/mailgun-php não encontrado"
    exit 1
fi

# Passo 3: Verificar variáveis de ambiente
print_info "Verificando variáveis de ambiente..."
if grep -q "MAILGUN_DOMAIN=" .env && grep -q "MAILGUN_SECRET=" .env; then
    print_success "Variáveis Mailgun encontradas no .env"
else
    print_error "Variáveis Mailgun NÃO encontradas no .env"
    print_warning "Você precisa adicionar as variáveis do Mailgun ao .env:"
    echo ""
    cat Setup/MAILGUN-ENV-VARS.txt
    echo ""
    print_warning "Edite o .env e execute este script novamente."
    exit 1
fi

# Verificar se MAIL_MAILER está configurado como mailgun
if grep -q "^MAIL_MAILER=mailgun" .env; then
    print_success "MAIL_MAILER configurado como mailgun"
else
    print_warning "MAIL_MAILER não está configurado como 'mailgun'"
    print_info "Valor atual:"
    grep "^MAIL_MAILER=" .env || echo "  (não definido)"
    echo ""
    print_warning "Deseja continuar mesmo assim? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Passo 4: Limpar cache
print_info "Limpando cache da aplicação..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
print_success "Cache limpo"

# Passo 5: Otimizar para produção
print_info "Otimizando para produção..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
print_success "Aplicação otimizada"

# Passo 6: Verificar rotas
print_info "Verificando rota do webhook..."
if php artisan route:list | grep -q "webhooks/mailgun-inbound"; then
    print_success "Rota /api/webhooks/mailgun-inbound registrada"
else
    print_error "Rota do webhook Mailgun não encontrada"
    exit 1
fi

# Passo 7: Reiniciar workers (Supervisor)
print_info "Tentando reiniciar workers do Supervisor..."
if command -v supervisorctl &> /dev/null; then
    if sudo supervisorctl status | grep -q "fluxdesk-worker"; then
        sudo supervisorctl restart fluxdesk-worker:*
        if [ $? -eq 0 ]; then
            print_success "Workers reiniciados via Supervisor"
        else
            print_warning "Falha ao reiniciar workers via Supervisor"
        fi
    else
        print_warning "Workers 'fluxdesk-worker' não encontrados no Supervisor"
        print_info "Você precisará reiniciar os workers manualmente"
    fi
else
    print_warning "Supervisor não está instalado ou não está no PATH"
    print_info "Reinicie os workers manualmente com: php artisan queue:restart"
fi

# Passo 8: Verificar status dos workers
print_info "Verificando status dos workers..."
if command -v supervisorctl &> /dev/null; then
    if sudo supervisorctl status | grep -q "fluxdesk-worker.*RUNNING"; then
        print_success "Workers estão rodando"
    else
        print_warning "Workers podem não estar rodando corretamente"
        sudo supervisorctl status | grep fluxdesk-worker || true
    fi
fi

# Passo 9: Teste de configuração
print_info "Verificando configuração..."
CONFIG_CHECK=$(php artisan tinker --execute="echo config('mail.default');" 2>/dev/null | tail -n 1)
if [[ "$CONFIG_CHECK" == *"mailgun"* ]]; then
    print_success "Driver de e-mail: mailgun"
else
    print_warning "Driver de e-mail não é 'mailgun': $CONFIG_CHECK"
fi

# Resumo final
echo ""
echo "========================================"
echo "✅ Deploy Concluído!"
echo "========================================"
echo ""
print_info "Próximos passos:"
echo ""
echo "1. Configure a Route no Mailgun:"
echo "   https://app.mailgun.com/app/sending/routes"
echo ""
echo "2. Teste o envio de e-mails:"
echo "   php artisan tinker"
echo "   >>> Mail::raw('Teste', fn(\$m) => \$m->to('seu@email.com')->subject('Teste'));"
echo ""
echo "3. Teste o recebimento:"
echo "   Envie e-mail para: {tenant_id}@tickets.fluxdesk.com.br"
echo ""
echo "4. Monitore os logs:"
echo "   tail -f storage/logs/laravel.log"
echo ""
echo "📚 Documentação completa: Setup/DEPLOY-MAILGUN-PRODUCAO.md"
echo ""

# Perguntar se quer testar envio agora
print_warning "Deseja testar o envio de um e-mail agora? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Digite seu e-mail para teste:"
    read -r test_email
    
    if [ -n "$test_email" ]; then
        print_info "Enviando e-mail de teste para: $test_email"
        php artisan tinker --execute="Mail::raw('Deploy Mailgun concluído com sucesso!', function(\$m) { \$m->to('$test_email')->subject('Teste Mailgun - Fluxdesk'); });"
        if [ $? -eq 0 ]; then
            print_success "E-mail enviado! Verifique sua caixa de entrada."
            print_info "Logs do Mailgun: https://app.mailgun.com/app/sending/logs"
        else
            print_error "Falha ao enviar e-mail. Verifique os logs."
        fi
    fi
fi

echo ""
print_success "Script de deploy finalizado!"
echo ""

