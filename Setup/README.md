# 📦 FLUXDESK - Pasta Setup (Arquivos de Deploy)

**Ambiente de Deploy Completo para EC2 Ubuntu 24.04 LTS**

Esta pasta contém todos os arquivos necessários para fazer deploy do FLUXDESK em produção de forma automatizada e profissional.

---

## 📁 Arquivos Incluídos

### 🚀 **Scripts de Deploy**

#### `install_and_deploy.sh` ⭐
**Script principal de deploy**

Comandos disponíveis:
```bash
sudo bash install_and_deploy.sh install   # Instala dependências e configura servidor
sudo bash install_and_deploy.sh deploy    # Deploy de nova versão
sudo bash install_and_deploy.sh rollback  # Volta para versão anterior
sudo bash install_and_deploy.sh smoke     # Health check completo
sudo bash install_and_deploy.sh all       # Instalação + Deploy completo
```

**Funcionalidades:**
- ✅ Instala PHP 8.3, Node 20, Nginx, Composer
- ✅ Cria estrutura de releases versionadas
- ✅ Configura Nginx automaticamente
- ✅ Faz build de assets (Vite + React)
- ✅ Executa migrations
- ✅ Otimiza caches do Laravel
- ✅ Health checks automáticos
- ✅ Rollback com um comando

---

#### `health-check.sh`
**Script de verificação de saúde**

```bash
bash health-check.sh
```

**Verifica:**
- Sistema operacional
- Serviços (Nginx, PHP-FPM, PostgreSQL)
- Estrutura de diretórios
- Permissões
- Arquivo .env
- Resposta HTTP
- Build de produção (detecta dev-server)
- Assets compilados
- Espaço em disco
- Logs de erros

---

### ⚙️ **Arquivos de Configuração**

#### `nginx.conf`
**Virtual host do Nginx**

Copiar para: `/etc/nginx/sites-available/fluxdesk`

**Características:**
- Server block otimizado para Laravel
- Cache de assets (1 ano)
- Security headers
- Suporte a uploads grandes (20MB)
- Logs separados
- Health check endpoint
- Bloqueia arquivos sensíveis

**Ativação:**
```bash
sudo ln -s /etc/nginx/sites-available/fluxdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

#### `supervisor-worker.conf`
**Configuração de Queue Workers**

Copiar para: `/etc/supervisor/conf.d/fluxdesk-worker.conf`

**Configuração:**
- 2 workers paralelos
- Auto-restart automático
- Logs em `/var/www/fluxdesk/shared/storage/logs/worker.log`
- Timeout de 1 hora (evita memory leak)
- Retry de jobs (até 3 vezes)

**Ativação:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fluxdesk-worker:*
```

---

#### `.env.production.example`
**Template de arquivo .env para produção**

Copiar para: `/var/www/fluxdesk/shared/.env`

**Variáveis essenciais:**
- `APP_KEY` (gerado automaticamente)
- Banco de dados (PostgreSQL)
- Redis (opcional)
- E-mail (SMTP)
- Segurança (APP_DEBUG=false)

**Configuração:**
```bash
sudo cp .env.production.example /var/www/fluxdesk/shared/.env
sudo nano /var/www/fluxdesk/shared/.env
# Editar DB_HOST, DB_PASSWORD, etc
```

---

### 📚 **Documentação**

#### `README-DEPLOY.md` ⭐
**Documentação completa de deploy**

**Conteúdo:**
- Pré-requisitos detalhados
- Instalação passo a passo
- Deploy de nova versão
- Rollback
- Configuração de variáveis
- Estrutura de diretórios
- Health checks
- Integração CI/CD
- Troubleshooting completo
- Monitoramento
- Backup e recovery

**📖 Leitura obrigatória antes do primeiro deploy!**

---

#### `QUICKSTART.md`
**Guia rápido (deploy em 5 minutos)**

Para quem tem pressa e já conhece os conceitos.

**Ideal para:**
- Deploy rápido
- Referência rápida de comandos
- Troubleshooting comum

---

### 🤖 **CI/CD**

#### `github-actions-deploy.yml`
**Workflow do GitHub Actions**

Copiar para: `.github/workflows/deploy.yml`

**Funcionalidades:**
- Deploy automático ao fazer push na `main`
- Health check pós-deploy
- Rollback automático em caso de falha
- Suporte a notificações (Slack/Discord)

**Configuração:**
1. Criar secrets no GitHub:
   - `EC2_HOST` → IP ou domínio do servidor
   - `EC2_USERNAME` → ubuntu
   - `EC2_SSH_KEY` → Chave privada SSH completa

2. Copiar arquivo para `.github/workflows/deploy.yml`

3. Push para `main` → Deploy automático! 🎉

---

## 🗂️ Estrutura de Deploy no Servidor

```
/var/www/fluxdesk/
├── releases/                    # Releases versionadas
│   ├── 2025-10-24-143000/      # Release antiga
│   ├── 2025-10-24-150000/      # Release anterior
│   └── 2025-10-24-153000/      # Release atual
├── shared/                      # Arquivos compartilhados
│   ├── .env                     # Configurações
│   ├── storage/                 # Uploads e cache
│   │   └── logs/               # Logs
│   └── ...
└── current → releases/2025-10-24-153000  # Symlink para release ativa
```

**Vantagens:**
- ✅ Rollback instantâneo (troca de symlink)
- ✅ Zero downtime
- ✅ Histórico de releases
- ✅ Storage compartilhado

---

## 🚦 Workflow de Deploy

### **Deploy Inicial (Primeira Vez)**

```bash
# 1. Conectar ao servidor
ssh ubuntu@SEU_IP

# 2. Upload do script
# (Na máquina local)
scp Setup/install_and_deploy.sh ubuntu@SEU_IP:/home/ubuntu/

# 3. Executar instalação completa
sudo bash install_and_deploy.sh all

# 4. Configurar .env
sudo nano /var/www/fluxdesk/shared/.env

# 5. Deploy novamente (aplicar .env)
sudo bash install_and_deploy.sh deploy

# 6. Verificar
curl http://127.0.0.1
```

---

### **Deploy de Atualização**

```bash
# Conectar ao servidor
ssh ubuntu@SEU_IP

# Deploy
sudo bash install_and_deploy.sh deploy

# Health check
sudo bash install_and_deploy.sh smoke
```

**Ou via GitHub Actions:**
```bash
git push origin main  # Deploy automático! 🚀
```

---

### **Rollback**

```bash
sudo bash install_and_deploy.sh rollback
```

Volta para a release anterior em **segundos**.

---

## ✅ Checklist de Deploy

### Antes do Deploy

- [ ] Servidor EC2 provisionado
- [ ] PostgreSQL configurado (RDS ou local)
- [ ] Cloudflare Tunnel configurado (opcional)
- [ ] Acesso SSH ao servidor
- [ ] Repositório GitHub acessível

### Durante o Deploy

- [ ] Script executado sem erros
- [ ] Build de assets concluído
- [ ] Migrations executadas
- [ ] Health check passou

### Após o Deploy

- [ ] Sistema acessível via browser
- [ ] Login funcionando
- [ ] Criar tickets funciona
- [ ] Upload de arquivos funciona
- [ ] Logs sem erros críticos
- [ ] Backup configurado

---

## 🔧 Comandos Úteis

### **Logs**
```bash
# Laravel
sudo tail -f /var/www/fluxdesk/shared/storage/logs/laravel.log

# Nginx
sudo tail -f /var/log/nginx/fluxdesk_error.log

# Queue Workers
sudo tail -f /var/www/fluxdesk/shared/storage/logs/worker.log
```

### **Serviços**
```bash
# Status
sudo systemctl status nginx
sudo systemctl status php8.3-fpm

# Restart
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm

# Queue Workers
sudo supervisorctl status
sudo supervisorctl restart fluxdesk-worker:*
```

### **Laravel**
```bash
cd /var/www/fluxdesk/current

# Limpar caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Recriar caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migrations
php artisan migrate --pretend
php artisan migrate --force
```

---

## 🆘 Troubleshooting

Ver **README-DEPLOY.md → Seção Troubleshooting** para:
- Página em branco
- Erro 502
- Build falhando
- Sem memória
- Permissões incorretas
- E muito mais...

---

## 📞 Suporte

**Documentação:**
- Completa: `README-DEPLOY.md`
- Rápida: `QUICKSTART.md`

**Scripts:**
- Deploy: `install_and_deploy.sh`
- Health Check: `health-check.sh`

**Configurações:**
- Nginx: `nginx.conf`
- Supervisor: `supervisor-worker.conf`
- Env: `.env.production.example`

**CI/CD:**
- GitHub Actions: `github-actions-deploy.yml`

---

## 🎯 Próximos Passos

1. **Ler `README-DEPLOY.md`** (documentação completa)
2. **Executar primeiro deploy** via `install_and_deploy.sh all`
3. **Configurar CI/CD** com GitHub Actions
4. **Configurar monitoramento** (opcional)
5. **Configurar backup** automático

---

**🚀 FLUXDESK pronto para produção!**

Todos os arquivos seguem as melhores práticas de DevOps e segurança para Laravel em produção.
