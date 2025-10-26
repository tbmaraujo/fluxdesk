# ⚡ FLUXDESK - Guia Rápido de Deploy

**Deploy em 5 minutos** — Servidor EC2 Ubuntu 24.04 LTS

---

## 📋 Pré-requisitos

- ✅ Servidor EC2 Ubuntu 24.04 com acesso SSH
- ✅ Banco PostgreSQL (RDS ou local)
- ✅ Cloudflare Tunnel configurado (opcional)
- ✅ Acesso ao repositório GitHub (chave SSH ou token)

---

## 🚀 Deploy Completo (Primeira Vez)

### 1. Conectar ao Servidor

```bash
ssh ubuntu@SEU_IP_EC2
```

### 2. Fazer Upload do Script

```bash
# Na sua máquina local
scp Setup/install_and_deploy.sh ubuntu@SEU_IP_EC2:/home/ubuntu/

# No servidor
chmod +x install_and_deploy.sh
```

### 3. Configurar Acesso ao GitHub

**Opção A: SSH (Recomendado)**
```bash
ssh-keygen -t ed25519 -C "deploy@fluxdesk"
cat ~/.ssh/id_ed25519.pub
# Adicionar no GitHub: Settings → SSH keys
```

**Opção B: HTTPS com Token**
```bash
# Gerar token no GitHub (Settings → Developer settings)
# Clonar uma vez para salvar credenciais
git config --global credential.helper store
```

### 4. Executar Instalação Completa

```bash
sudo bash install_and_deploy.sh all
```

**O que acontece:**
- Instala PHP 8.3, Node 20, Nginx, Composer
- Cria estrutura de diretórios
- Configura Nginx vhost
- Clona repositório
- Roda composer install + npm build
- Executa migrations
- Ativa release
- Health checks

### 5. Configurar .env

```bash
sudo nano /var/www/fluxdesk/shared/.env
```

**Variáveis obrigatórias:**
```env
APP_KEY=        # Gerado automaticamente
DB_HOST=seu-rds.rds.amazonaws.com
DB_DATABASE=fluxdesk
DB_USERNAME=fluxdesk_user
DB_PASSWORD=SUA_SENHA_AQUI
```

### 6. Deploy Novamente (Aplicar .env)

```bash
sudo bash install_and_deploy.sh deploy
```

### 7. Verificar

```bash
curl http://127.0.0.1
# Deve retornar HTML do sistema
```

**Pronto! 🎉** Sistema no ar em https://app.fluxdesk.com.br

---

## 🔄 Deploy de Atualização

```bash
# Conectar ao servidor
ssh ubuntu@SEU_IP_EC2

# Deploy
sudo bash install_and_deploy.sh deploy

# Verificar
sudo bash install_and_deploy.sh smoke
```

**Deploy automático via Git push:** Configure GitHub Actions (ver README-DEPLOY.md)

---

## ⏮️ Rollback

```bash
sudo bash install_and_deploy.sh rollback
```

Volta para a release anterior instantaneamente.

---

## 🩺 Health Check

```bash
# Completo
sudo bash install_and_deploy.sh smoke

# Ou usar script dedicado
bash Setup/health-check.sh
```

---

## 📁 Estrutura de Arquivos

```
/var/www/fluxdesk/
├── releases/
│   └── 2025-10-24-153000/  # Release ativa
├── shared/
│   ├── .env                # Configurações
│   └── storage/            # Uploads e logs
└── current → releases/2025-10-24-153000  # Symlink
```

---

## 🔧 Comandos Úteis

### Logs

```bash
# Laravel
sudo tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log

# Nginx
sudo tail -f /var/log/nginx/fluxdesk_error.log

# PHP-FPM
sudo tail -f /var/log/php8.3-fpm.log
```

### Serviços

```bash
# Status
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status cloudflared

# Restart
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm
```

### Laravel

```bash
cd /var/www/fluxdesk/current

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Recriar caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migrations
php artisan migrate --pretend  # Ver SQL sem executar
php artisan migrate --force    # Executar
```

### Queue Workers (se usar)

```bash
sudo supervisorctl status
sudo supervisorctl restart fluxdesk-worker:*
```

---

## ❌ Troubleshooting Rápido

### Página em branco

```bash
# Ver logs
sudo tail -20 /var/log/nginx/fluxdesk_error.log

# Verificar permissões
sudo chown -R www-data:www-data /var/www/fluxdesk/shared/storage
sudo chmod -R 775 /var/www/fluxdesk/shared/storage

# Limpar caches
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan cache:clear
```

### Erro 502 Bad Gateway

```bash
# PHP-FPM parado?
sudo systemctl status php8.3-fpm
sudo systemctl start php8.3-fpm
```

### Build não funciona (dev-server)

```bash
cd /var/www/fluxdesk/current
npm run build
sudo systemctl reload nginx
```

### Sem memória (npm build falha)

```bash
# Criar swap temporário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Deploy novamente
sudo bash install_and_deploy.sh deploy

# Remover swap
sudo swapoff /swapfile
sudo rm /swapfile
```

---

## 📞 Ajuda Completa

Ver **README-DEPLOY.md** para documentação completa com:
- Configuração de variáveis detalhada
- Integração CI/CD
- SSL/HTTPS manual
- Monitoramento
- Backup e recovery
- Performance tuning

---

## ✅ Checklist Pós-Deploy

- [ ] Sistema acessível via browser
- [ ] Login funcionando
- [ ] Criar tickets funciona
- [ ] Upload de arquivos funciona
- [ ] Logs sem erros críticos
- [ ] Backup configurado (banco + storage)
- [ ] Monitoramento configurado (opcional)
- [ ] SSL ativo (via Cloudflare ou Certbot)

---

**🎉 FLUXDESK em produção!**

Documentação completa: `/home/thiago/Projetos/Sistema Chamados/sincro8-tickets/Setup/README-DEPLOY.md`
