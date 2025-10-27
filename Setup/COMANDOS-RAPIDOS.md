# ⚡ Comandos Rápidos para Corrigir Supervisor

## 🔴 Problema Identificado

Você tem uma configuração antiga do `sincro8-worker` que está conflitando com a nova configuração.

```
Error: The directory named as part of the path /home/ubuntu/sincro8-tickets/storage/logs/worker.log does not exist
in section 'program:sincro8-worker' (file: '/etc/supervisor/conf.d/sincro8-worker.conf')
```

---

## ✅ Solução em 2 Passos

### No servidor EC2:

```bash
# 1. Atualizar código
cd /var/www/fluxdesk/current
git pull origin main

# 2. Limpar configurações antigas
sudo bash Setup/CLEANUP-OLD-SUPERVISOR.sh

# 3. Executar correção completa
sudo bash Setup/FIX-SUPERVISOR-ONLY.sh
```

---

## 🛠️ OU: Comandos Manuais Rápidos

Se preferir fazer manualmente:

```bash
# 1. Parar Supervisor
sudo systemctl stop supervisor
sudo killall supervisord 2>/dev/null || true

# 2. Remover configurações antigas
sudo rm -f /etc/supervisor/conf.d/sincro8-worker.conf
sudo rm -f /etc/supervisor/conf.d/laravel-worker.conf
sudo rm -f /var/run/supervisor.sock
sudo rm -f /var/run/supervisord.pid

# 3. Criar configuração nova do fluxdesk
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

```bash
# 4. Criar diretório de logs
sudo mkdir -p /var/www/fluxdesk/current/storage/logs
sudo chown -R www-data:www-data /var/www/fluxdesk/current/storage

# 5. Iniciar Supervisor
sudo systemctl start supervisor

# 6. Carregar configuração e iniciar workers
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fluxdesk-worker:*

# 7. Verificar status
sudo supervisorctl status
```

---

## ✅ Resultado Esperado

```bash
$ sudo supervisorctl status
fluxdesk-worker:fluxdesk-worker_00   RUNNING   pid 12345, uptime 0:00:10
fluxdesk-worker:fluxdesk-worker_01   RUNNING   pid 12346, uptime 0:00:10
```

---

## 🔍 Verificar Configurações Antigas

```bash
# Ver quais configs existem
ls -la /etc/supervisor/conf.d/

# Deve ter APENAS:
# fluxdesk-worker.conf

# Se tiver outras (sincro8-worker.conf, etc), remover:
sudo rm /etc/supervisor/conf.d/sincro8-worker.conf
```

---

## 📊 Comandos Úteis

```bash
# Status dos workers
sudo supervisorctl status

# Ver logs em tempo real
sudo supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00

# Reiniciar workers
sudo supervisorctl restart fluxdesk-worker:*

# Parar workers
sudo supervisorctl stop fluxdesk-worker:*

# Recarregar configuração
sudo supervisorctl reread
sudo supervisorctl update
```

---

## 🐛 Se Ainda Der Erro

### Ver quais arquivos de config existem:

```bash
ls -la /etc/supervisor/conf.d/
```

### Remover TODOS e criar só o fluxdesk:

```bash
sudo rm /etc/supervisor/conf.d/*.conf
sudo nano /etc/supervisor/conf.d/fluxdesk-worker.conf
# Colar a configuração acima
```

### Reiniciar tudo:

```bash
sudo systemctl restart supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fluxdesk-worker:*
sudo supervisorctl status
```

---

## 📝 Checklist Rápido

- [ ] Atualizar código (`git pull`)
- [ ] Remover `sincro8-worker.conf`
- [ ] Criar `fluxdesk-worker.conf`
- [ ] Ajustar path: `/var/www/fluxdesk/current`
- [ ] Criar diretório de logs
- [ ] Iniciar Supervisor
- [ ] Verificar 2 workers RUNNING

---

**Tempo estimado:** 5 minutos  
**Depois:** Continue com configuração AWS

