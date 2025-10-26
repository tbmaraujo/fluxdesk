# 🚨 SOLUÇÃO RÁPIDA: Problema na Criação de Tickets

## 📌 Problema
Ao clicar em "Criar Chamado", nada acontece e não redireciona.

## 🔧 Solução em 3 Passos

### 1️⃣ Executar Script de Diagnóstico

```bash
# No servidor de produção
cd /var/www/fluxdesk/current/Setup
chmod +x diagnose_ticket_creation.sh
./diagnose_ticket_creation.sh
```

O script vai identificar automaticamente o problema.

---

### 2️⃣ Causa Mais Provável: Prioridades Ausentes

**Se o diagnóstico mostrar "Nenhuma prioridade encontrada":**

```bash
cd /var/www/fluxdesk/current
php artisan tinker
```

Cole o código abaixo no tinker:

```php
$tenants = \App\Models\Tenant::all();
$services = \App\Models\Service::all();

foreach ($tenants as $tenant) {
    foreach ($services as $service) {
        if (\App\Models\Priority::where('tenant_id', $tenant->id)
                ->where('service_id', $service->id)->count() === 0) {
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Baixa',
                'response_sla_time' => 240,
                'resolution_sla_time' => 960,
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Normal',
                'response_sla_time' => 120,
                'resolution_sla_time' => 480,
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Alta',
                'response_sla_time' => 60,
                'resolution_sla_time' => 240,
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Crítica',
                'response_sla_time' => 30,
                'resolution_sla_time' => 120,
            ]);
            
            echo "✅ Prioridades criadas para {$service->name} - Tenant {$tenant->id}\n";
        }
    }
}
```

Saia do tinker: `exit`

---

### 3️⃣ Limpar Caches e Reiniciar

```bash
cd /var/www/fluxdesk/current

# Limpar todos os caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Recriar caches otimizados
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Reiniciar serviços
sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx
```

---

## ✅ Testar

1. Limpar cache do navegador: `Ctrl + Shift + Del`
2. Fazer logout e login novamente
3. Abrir DevTools (F12) → Console
4. Tentar criar um ticket

**Você deve ver no console:**
```
🚀 Iniciando submit do ticket...
📝 Dados do formulário: {...}
📤 Enviando requisição para: ...
✅ Ticket criado com sucesso!
```

---

## 📚 Documentação Completa

- **Diagnóstico detalhado:** `TROUBLESHOOTING-TICKET-CREATION.md`
- **Script automatizado:** `diagnose_ticket_creation.sh`

---

## 🆘 Se Não Resolver

Execute no servidor e envie o resultado:

```bash
# Capturar logs
tail -100 storage/logs/laravel.log > /tmp/debug.log

# Ver conteúdo
cat /tmp/debug.log
```

Envie também:
- Screenshot do console do navegador (F12)
- Resultado do script de diagnóstico
- Resultado da query de prioridades

---

## 📊 Monitoramento em Tempo Real

```bash
# Terminal 1: Logs do Laravel
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log

# Terminal 2: Logs do Nginx
sudo tail -f /var/log/nginx/fluxdesk_error.log

# Terminal 3: Logs do PHP-FPM
sudo tail -f /var/log/php8.3-fpm.log
```

---

**⚡ Na maioria dos casos, o problema é prioridades ausentes no banco. Siga o passo 2 e resolverá!**
