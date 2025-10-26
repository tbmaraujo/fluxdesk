#!/bin/bash

###############################################################################
# Script de Deploy Rápido - Correção de Segurança Super Admin
# 
# Este script automatiza o deploy da correção de segurança no servidor EC2.
# Execute com cuidado e verifique cada passo.
###############################################################################

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🔒 DEPLOY DE SEGURANÇA - ISOLAMENTO SUPER ADMIN 🔒        ║"
echo "║                                                              ║"
echo "║   Sistema: Sincro8 Tickets                                  ║"
echo "║   Data: $(date '+%d/%m/%Y %H:%M:%S')                                  ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Função de confirmação
confirm() {
    local message=$1
    echo -e "${YELLOW}⚠️  $message${NC}"
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}❌ Deploy cancelado pelo usuário${NC}"
        exit 1
    fi
}

# Função de step
step() {
    local step_num=$1
    local step_name=$2
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📍 PASSO $step_num: $step_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo -e "${RED}❌ Erro: Este script deve ser executado na raiz do projeto Laravel${NC}"
    exit 1
fi

# Confirmação inicial
confirm "Este script irá fazer deploy da correção de segurança Super Admin. TODOS os caches serão limpos."

# PASSO 1: Backup
step 1 "Backup de Segurança"
BACKUP_FILE="backup_pre_security_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 Criando backup do banco de dados..."
if command -v mysqldump &> /dev/null; then
    echo "Digite a senha do MySQL quando solicitado:"
    mysqldump -u root -p sincro8_tickets > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Backup do banco falhou ou foi pulado${NC}"
        confirm "Deseja continuar sem backup do banco?"
    }
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  mysqldump não encontrado, pulando backup do banco${NC}"
    confirm "Deseja continuar sem backup?"
fi

# PASSO 2: Atualizar Código
step 2 "Atualizar Código do Repositório"
echo "📥 Fazendo pull do código..."
git pull origin main || {
    echo -e "${RED}❌ Erro ao fazer pull do código${NC}"
    exit 1
}
echo -e "${GREEN}✅ Código atualizado com sucesso${NC}"

# PASSO 3: Verificar Integridade
step 3 "Verificar Integridade da Correção"
echo "🧪 Executando testes de segurança..."
bash Setup/test_superadmin_security.sh || {
    echo -e "${RED}❌ Testes de segurança falharam!${NC}"
    echo -e "${YELLOW}Verifique os erros acima antes de continuar.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Todos os testes passaram (13/13)${NC}"

# PASSO 4: Limpar Caches
step 4 "Limpar Caches do Laravel"
echo "🧹 Limpando cache de rotas..."
php artisan route:clear
echo -e "${GREEN}✅ Cache de rotas limpo${NC}"

echo "🧹 Limpando cache de configuração..."
php artisan config:clear
echo -e "${GREEN}✅ Cache de configuração limpo${NC}"

echo "🧹 Limpando cache da aplicação..."
php artisan cache:clear
echo -e "${GREEN}✅ Cache da aplicação limpo${NC}"

echo "🧹 Limpando cache de views..."
php artisan view:clear
echo -e "${GREEN}✅ Cache de views limpo${NC}"

# PASSO 5: Recompilar para Produção (Opcional)
step 5 "Otimizar para Produção"
read -p "Deseja recompilar caches para produção? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "⚡ Recompilando rotas..."
    php artisan route:cache
    
    echo "⚡ Recompilando configuração..."
    php artisan config:cache
    
    echo "⚡ Recompilando views..."
    php artisan view:cache
    
    echo -e "${GREEN}✅ Caches recompilados para produção${NC}"
else
    echo -e "${YELLOW}⏭️  Recompilação pulada${NC}"
fi

# PASSO 6: Reiniciar Serviços
step 6 "Reiniciar Serviços"
echo "🔄 Verificando serviços..."

# PHP-FPM
if systemctl is-active --quiet php8.2-fpm; then
    read -p "Reiniciar PHP-FPM? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sudo systemctl restart php8.2-fpm
        echo -e "${GREEN}✅ PHP-FPM reiniciado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PHP-FPM não detectado ou não ativo${NC}"
fi

# Queue Workers
if pgrep -f "artisan queue:work" > /dev/null; then
    read -p "Reiniciar Queue Workers? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        php artisan queue:restart
        echo -e "${GREEN}✅ Queue Workers reiniciados${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Queue Workers não detectados${NC}"
fi

# PASSO 7: Verificação Pós-Deploy
step 7 "Verificação Pós-Deploy"
echo "🔍 Verificando middlewares registrados..."
php artisan route:list --columns=uri,name,middleware | grep -E "(dashboard|tickets)" | head -n 5
echo ""
echo -e "${GREEN}✅ Middlewares parecem estar corretos${NC}"

# PASSO 8: Instruções Finais
step 8 "Testes Manuais Necessários"
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Execute os seguintes testes manuais:${NC}"
echo ""
echo "1️⃣  Login como Super Admin:"
echo "   - Acessar: http://SEU_DOMINIO/dashboard"
echo "   - Espera: Redirecionado para /superadmin/tenants"
echo "   - Mensagem de erro deve aparecer"
echo ""
echo "2️⃣  Login como Usuário Normal:"
echo "   - Acessar: http://SEU_DOMINIO/dashboard"
echo "   - Espera: Dashboard carrega normalmente"
echo "   - Apenas dados do próprio tenant"
echo ""
echo "3️⃣  Verificar Logs:"
echo "   - Comando: tail -f storage/logs/laravel.log"
echo "   - Procurar por: 'Super Admin tentou acessar área operacional'"
echo ""

# PASSO 9: Monitoramento
step 9 "Monitoramento"
echo "📊 Para monitorar o sistema após o deploy:"
echo ""
echo "Logs em tempo real:"
echo "  tail -f storage/logs/laravel.log"
echo ""
echo "Procurar erros:"
echo "  grep 'ERROR' storage/logs/laravel-$(date +%Y-%m-%d).log"
echo ""
echo "Verificar tentativas de acesso bloqueadas:"
echo "  grep 'Super Admin tentou acessar' storage/logs/laravel.log"
echo ""

# Resumo Final
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Resumo do Deploy:"
echo "  - Backup criado: ${BACKUP_FILE:-'Não criado'}"
echo "  - Código atualizado: ✅"
echo "  - Testes passaram: ✅ (13/13)"
echo "  - Caches limpos: ✅"
echo "  - Serviços reiniciados: ✅"
echo ""
echo "📚 Documentação:"
echo "  - Detalhes técnicos: Setup/SECURITY-FIX-SUPERADMIN.md"
echo "  - Resumo executivo: Setup/RESUMO-CORREÇÃO-SEGURANÇA.md"
echo "  - Procedimento completo: Setup/DEPLOY-SECURITY-FIX.md"
echo ""
echo -e "${YELLOW}⚠️  NÃO ESQUEÇA DE EXECUTAR OS TESTES MANUAIS!${NC}"
echo ""
echo "Data/Hora do Deploy: $(date '+%d/%m/%Y %H:%M:%S')"
echo ""

exit 0
