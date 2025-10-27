# 🔧 Corrigir Erro do Supervisor

## ❌ Erro Encontrado

```
error: <class 'FileNotFoundError'>, [Errno 2] No such file or directory
file: /usr/lib/python3/dist-packages/supervisor/xmlrpc.py line: 557
```

**Causa:** O socket do Supervisor (`/var/run/supervisor.sock`) não existe ou o serviço não está rodando corretamente.

---

## ✅ Solução Rápida (Script Automático)

```bash
# No servidor EC2
cd /var/www/fluxdesk/current

# Atualizar código
git pull origin main

# Executar script de correção
sudo bash Setup/FIX-SUPERVISOR-ONLY.sh
```

**Tempo:** ~2 minutos

---

## 🛠️ Solução Manual (Passo a Passo)

### 1. Parar tudo e limpar

```bash
# Parar Supervisor
sudo systemctl stop supervisor

# Matar processos remanescentes
sudo killall supervisord 2>/dev/null || true

# Aguardar
sleep 2

# Limpar arquivos antigos
sudo rm -f /var/run/supervisor.sock
sudo rm -f /var/run/supervisord.pid
sudo rm -f /tmp/supervisor.sock
```

### 2. Verificar instalação

```bash
# Ver se está instalado
which supervisord

# Se não estiver, instalar
sudo apt-get update
sudo apt-get install --reinstall -y supervisor
```

### 3. Verificar/criar diretórios

```bash
# Criar diretórios necessários
sudo mkdir -p /var/log/supervisor
sudo mkdir -p /var/run/supervisor
sudo mkdir -p /etc/supervisor/conf.d

# Ajustar permissões
sudo chown root:root /var/log/supervisor
sudo chown root:root /var/run/supervisor
sudo chmod 755 /var/log/supervisor
sudo chmod 755 /var/run/supervisor
```

### 4. Verificar configuração principal

```bash
# Ver se existe
ls -la /etc/supervisor/supervisord.conf

# Se NÃO existir, criar
sudo nano /etc/supervisor/supervisord.conf
```

**Cole este conteúdo:**

```ini
[unix_http_server]
file=/var/run/supervisor.sock
chmod=0700

[supervisord]
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/var/log/supervisor
nodaemon=false
minfds=1024
minprocs=200

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock

[include]
files = /etc/supervisor/conf.d/*.conf
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

### 5. Criar configuração do worker

```bash
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
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
stopwaitsecs=3600
startsecs=0
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

### 6. Criar diretório de logs

```bash
sudo mkdir -p /var/www/fluxdesk/current/storage/logs
sudo chown -R www-data:www-data /var/www/fluxdesk/current/storage
```

### 7. Iniciar Supervisor

```bash
# Habilitar no boot
sudo systemctl enable supervisor

# Iniciar serviço
sudo systemctl start supervisor

# Aguardar
sleep 3

# Verificar status
sudo systemctl status supervisor
```

**Esperado:** Status `active (running)`

### 8. Verificar socket

```bash
# Verificar se socket foi criado
ls -la /var/run/supervisor.sock

# Deve existir e mostrar:
# srwx------ 1 root root ... /var/run/supervisor.sock
```

### 9. Carregar configurações

```bash
# Recarregar
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar workers
sudo supervisorctl start fluxdesk-worker:*
```

### 10. Verificar workers

```bash
sudo supervisorctl status

# Esperado:
# fluxdesk-worker:fluxdesk-worker_00   RUNNING   pid 12345, uptime 0:00:10
# fluxdesk-worker:fluxdesk-worker_01   RUNNING   pid 12346, uptime 0:00:10
```

---

## ✅ Verificações Finais

### Socket existe?

```bash
ls -la /var/run/supervisor.sock
# Deve existir
```

### Supervisor está rodando?

```bash
sudo systemctl status supervisor
# Deve mostrar: active (running)
```

### Workers estão rodando?

```bash
sudo supervisorctl status
# Deve mostrar 2 workers RUNNING
```

### Logs aparecem?

```bash
tail -f /var/www/fluxdesk/current/storage/logs/worker.log
# Deve mostrar logs dos workers
```

---

## 🐛 Ainda com Erro?

### Erro: "unix:///var/run/supervisor.sock no such file"

**Causa:** Supervisor não criou o socket

**Solução:**

```bash
# Testar iniciando manualmente
sudo supervisord -c /etc/supervisor/supervisord.conf

# Aguardar
sleep 3

# Verificar se criou o socket
ls -la /var/run/supervisor.sock

# Se criou, reiniciar via systemctl
sudo systemctl restart supervisor
```

### Erro: Permission denied no socket

**Solução:**

```bash
# Ajustar permissões
sudo chmod 700 /var/run/supervisor.sock
sudo chown root:root /var/run/supervisor.sock
```

### Supervisor não inicia

**Ver logs detalhados:**

```bash
# Logs do systemd
sudo journalctl -u supervisor -n 50 --no-pager

# Testar configuração
sudo supervisord -c /etc/supervisor/supervisord.conf -n

# Se mostrar erro, corrigir e tentar novamente
```

### Workers não aparecem

**Verificar configuração:**

```bash
# Ver se arquivo existe
ls -la /etc/supervisor/conf.d/fluxdesk-worker.conf

# Ver se está incluído
grep "include" /etc/supervisor/supervisord.conf
# Deve ter: files = /etc/supervisor/conf.d/*.conf

# Recarregar
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fluxdesk-worker:*
```

---

## 📊 Comandos Úteis

```bash
# Status
sudo supervisorctl status

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*

# Parar workers
sudo supervisorctl stop fluxdesk-worker:*

# Ver logs em tempo real
sudo supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00

# Recarregar configuração
sudo supervisorctl reread
sudo supervisorctl update

# Reiniciar Supervisor
sudo systemctl restart supervisor
```

---

## 🎯 Após Corrigir

Quando Supervisor estiver funcionando, continue com:

1. ✅ **Atualizar .env** (se ainda não fez):
   ```bash
   QUEUE_CONNECTION=redis
   AWS_SES_S3_BUCKET=fluxdesk-tickets-emails-inbound
   ```

2. ✅ **Limpar caches**:
   ```bash
   cd /var/www/fluxdesk/current
   php artisan config:clear
   php artisan cache:clear
   php artisan queue:restart
   ```

3. ✅ **Testar queue**:
   ```bash
   php artisan tinker
   >>> dispatch(function() { \Log::info('Test'); });
   ```

4. ✅ **Ver logs**:
   ```bash
   tail -f storage/logs/laravel.log
   tail -f storage/logs/worker.log
   ```

---

**Última atualização:** 27/10/2025  
**Script automático:** `Setup/FIX-SUPERVISOR-ONLY.sh`

