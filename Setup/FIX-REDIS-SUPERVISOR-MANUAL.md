# 🔧 Corrigir Redis e Supervisor - Manual Passo a Passo

Você está com dois problemas no servidor:
1. ❌ Redis não está rodando
2. ❌ Supervisor não está configurado

---

## 🚀 Opção 1: Script Automático (RECOMENDADO)

```bash
# SSH na EC2
cd /var/www/fluxdesk/current/Setup

# Baixar script atualizado (ou fazer git pull)
git pull origin main

# Executar script
sudo bash FIX-REDIS-SUPERVISOR.sh
```

**O script faz tudo automaticamente:**
- ✅ Instala e inicia Redis
- ✅ Instala e configura Supervisor
- ✅ Cria configuração dos workers
- ✅ Atualiza `.env` (com backup)
- ✅ Inicia os workers
- ✅ Limpa caches

---

## 🛠️ Opção 2: Manual (Passo a Passo)

### 1️⃣ Instalar e Iniciar Redis

```bash
# Atualizar pacotes
sudo apt-get update

# Instalar Redis
sudo apt-get install -y redis-server

# Habilitar para iniciar no boot
sudo systemctl enable redis-server

# Iniciar Redis
sudo systemctl start redis-server

# Verificar status
sudo systemctl status redis-server

# Testar
redis-cli ping
# Deve retornar: PONG
```

**Verificar configuração do Redis:**

```bash
sudo nano /etc/redis/redis.conf

# Garantir que estas linhas estejam assim:
bind 127.0.0.1 ::1
supervised systemd
```

---

### 2️⃣ Instalar e Configurar Supervisor

```bash
# Instalar Supervisor
sudo apt-get install -y supervisor

# Habilitar para iniciar no boot
sudo systemctl enable supervisor

# Iniciar Supervisor
sudo systemctl start supervisor

# Verificar status
sudo systemctl status supervisor
```

---

### 3️⃣ Criar Configuração do Worker

```bash
# Criar arquivo de configuração
sudo nano /etc/supervisor/conf.d/fluxdesk-worker.conf
```

**Cole este conteúdo:**

```ini
[program:fluxdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/fluxdesk/current/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/fluxdesk/current/storage/logs/worker.log
stopwaitsecs=3600
startsecs=0
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

**Ajustar permissões:**

```bash
# Criar diretório de logs se não existir
sudo mkdir -p /var/www/fluxdesk/current/storage/logs

# Ajustar proprietário
sudo chown -R www-data:www-data /var/www/fluxdesk/current/storage
```

---

### 4️⃣ Atualizar .env

```bash
# Fazer backup
sudo cp /var/www/fluxdesk/current/.env /var/www/fluxdesk/current/.env.backup.$(date +%Y%m%d_%H%M%S)

# Editar .env
sudo nano /var/www/fluxdesk/current/.env
```

**Alterar/adicionar estas linhas:**

```bash
# ALTERAR ESTA LINHA:
QUEUE_CONNECTION=redis  # Era: sync

# ADICIONAR SE NÃO EXISTIREM:
AWS_SES_S3_BUCKET=fluxdesk-emails-inbound
AWS_BUCKET=fluxdesk-emails-inbound

# Deixar vazio por enquanto (preencher depois):
SES_SNS_TOPIC_ARN=
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

### 5️⃣ Iniciar Workers

```bash
# Recarregar configurações do Supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar workers
sudo supervisorctl start fluxdesk-worker:*

# Verificar status
sudo supervisorctl status fluxdesk-worker:*
```

**Resultado esperado:**
```
fluxdesk-worker:fluxdesk-worker_00   RUNNING   pid 12345, uptime 0:00:05
fluxdesk-worker:fluxdesk-worker_01   RUNNING   pid 12346, uptime 0:00:05
```

---

### 6️⃣ Limpar Caches do Laravel

```bash
cd /var/www/fluxdesk/current

# Limpar configurações
php artisan config:clear
php artisan cache:clear

# Reiniciar workers (importante!)
php artisan queue:restart
```

---

## ✅ Verificar se Está Funcionando

### Teste 1: Redis

```bash
redis-cli ping
# Resultado esperado: PONG

redis-cli info | grep connected_clients
# Resultado esperado: connected_clients:2 (ou mais)
```

### Teste 2: Supervisor

```bash
sudo supervisorctl status
# Resultado esperado: 2 workers RUNNING
```

### Teste 3: Queue Laravel

```bash
cd /var/www/fluxdesk/current

# Ver jobs na fila
php artisan queue:monitor redis

# Testar enviando um job
php artisan tinker
>>> dispatch(function() { \Log::info('Test job executed!'); });
>>> exit

# Ver logs
tail -f storage/logs/laravel.log
# Deve aparecer: Test job executed!
```

### Teste 4: Logs dos Workers

```bash
# Ver logs em tempo real
sudo supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00 stdout

# Ou ver arquivo direto
tail -f /var/www/fluxdesk/current/storage/logs/worker.log
```

---

## 🐛 Troubleshooting

### Redis não inicia

```bash
# Ver erro específico
sudo journalctl -u redis-server -n 50

# Testar configuração
redis-server /etc/redis/redis.conf --test-memory 1024

# Verificar se porta está em uso
sudo netstat -tulpn | grep 6379
```

### Supervisor não inicia

```bash
# Ver logs
sudo journalctl -u supervisor -n 50

# Verificar configuração
sudo supervisord -c /etc/supervisor/supervisord.conf -n

# Reiniciar serviço
sudo systemctl restart supervisor
```

### Workers não iniciam

```bash
# Ver logs de erro
sudo supervisorctl tail fluxdesk-worker:fluxdesk-worker_00

# Verificar se PHP funciona
sudo -u www-data php /var/www/fluxdesk/current/artisan queue:work redis --once

# Ver permissões
ls -la /var/www/fluxdesk/current/storage/logs/
```

### Worker.log vazio

```bash
# Criar arquivo manualmente
sudo touch /var/www/fluxdesk/current/storage/logs/worker.log

# Ajustar permissões
sudo chown www-data:www-data /var/www/fluxdesk/current/storage/logs/worker.log
sudo chmod 664 /var/www/fluxdesk/current/storage/logs/worker.log

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 📊 Comandos Úteis

### Redis
```bash
# Status
sudo systemctl status redis-server

# Restart
sudo systemctl restart redis-server

# Logs
sudo journalctl -u redis-server -f

# Monitor em tempo real
redis-cli monitor

# Limpar tudo (cuidado!)
redis-cli FLUSHALL
```

### Supervisor
```bash
# Status de todos os processos
sudo supervisorctl status

# Restart de um worker específico
sudo supervisorctl restart fluxdesk-worker:fluxdesk-worker_00

# Restart de todos
sudo supervisorctl restart fluxdesk-worker:*

# Stop (parar) workers
sudo supervisorctl stop fluxdesk-worker:*

# Ver logs em tempo real
sudo supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00
```

### Laravel Queue
```bash
cd /var/www/fluxdesk/current

# Ver jobs na fila
php artisan queue:monitor redis

# Ver jobs falhados
php artisan queue:failed

# Reprocessar job falhado
php artisan queue:retry {id}

# Reprocessar todos falhados
php artisan queue:retry all

# Limpar jobs falhados
php artisan queue:flush

# Reiniciar workers (graceful restart)
php artisan queue:restart
```

---

## 🎯 Checklist Final

Após seguir todos os passos, verifique:

- [ ] Redis está rodando: `redis-cli ping` → PONG
- [ ] Supervisor está rodando: `sudo systemctl status supervisor` → active
- [ ] Workers estão rodando: `sudo supervisorctl status` → 2 processos RUNNING
- [ ] `.env` atualizado: `QUEUE_CONNECTION=redis`
- [ ] Caches limpos: `php artisan config:clear`
- [ ] Queue funciona: testar com `php artisan tinker`
- [ ] Logs aparecem: `tail -f storage/logs/worker.log`

---

## 📞 Próximos Passos

Depois que Redis e Supervisor estiverem funcionando:

1. ✅ **Configurar AWS** (seguir `INBOUND-UPGRADE-PRODUCAO.md`)
   - Criar bucket S3
   - Criar SNS Topic
   - Criar Rule Set no SES

2. ✅ **Testar e-mail inbound**
   - Enviar e-mail de teste
   - Verificar logs
   - Ver ticket criado

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** Média  
**Requer:** Acesso root/sudo na EC2

