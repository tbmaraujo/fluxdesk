# 🔧 Troubleshooting - Problema na Criação de Tickets

**Problema Reportado:** Ao clicar em "Criar Chamado", nada acontece e não redireciona para `/tickets/open`.

---

## 📋 Checklist de Diagnóstico

### 1️⃣ Verificar Logs do Laravel (MAIS IMPORTANTE)

```bash
# Acessar o servidor
ssh usuario@app.fluxdesk.com.br

# Ver logs em tempo real
cd /var/www/fluxdesk/current
tail -f storage/logs/laravel.log

# Ou ver últimas 100 linhas
tail -100 storage/logs/laravel.log

# Procurar por erros específicos
grep "CRIAÇÃO DE TICKET" storage/logs/laravel.log
grep "VALIDAÇÃO FALHOU" storage/logs/laravel.log
grep "Prioridade não encontrada" storage/logs/laravel.log
```

**O que procurar:**
- ✅ `=== INICIANDO CRIAÇÃO DE TICKET ===` → Requisição chegou no controller
- ❌ `=== VALIDAÇÃO FALHOU ===` → Erro de validação
- ❌ `Prioridade não encontrada` → Prioridade não existe no banco
- ❌ `ERROR` ou `EXCEPTION` → Erro no código

---

### 2️⃣ Verificar Logs do Navegador (Console JavaScript)

```javascript
// Abrir DevTools (F12) → Console
// Ao clicar em "Criar Chamado", deve aparecer:

🚀 Iniciando submit do ticket...
📝 Dados do formulário: {...}
📤 Enviando requisição para: ...
```

**Se NÃO aparecer nada:**
- ❌ Erro de JavaScript impedindo o submit
- ❌ Botão não está disparando o evento

**Se aparecer erro:**
- Copiar a mensagem completa
- Verificar se é CSRF token expirado
- Verificar se é erro de rede

---

### 3️⃣ Verificar Prioridades Cadastradas no Banco

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql fluxdesk

# Verificar prioridades cadastradas
SELECT p.id, p.name, p.service_id, s.name as service_name, p.tenant_id
FROM priorities p
JOIN services s ON s.id = p.service_id
ORDER BY p.service_id, p.name;

# Verificar se há prioridades para o tenant correto
SELECT tenant_id, COUNT(*) as total_priorities
FROM priorities
GROUP BY tenant_id;

# Sair do PostgreSQL
\q
```

**Problema comum:**
- Se aparecer `(0 rows)` → **PROBLEMA ENCONTRADO!** Não há prioridades cadastradas
- Se as prioridades tiverem `tenant_id` diferente → Problema de multi-tenancy

---

### 4️⃣ Verificar Logs do Nginx

```bash
# Verificar erros do Nginx
sudo tail -100 /var/log/nginx/fluxdesk_error.log

# Verificar logs de acesso
sudo tail -100 /var/log/nginx/fluxdesk_access.log | grep POST | grep tickets
```

**Procurar por:**
- Status 500 → Erro no servidor
- Status 422 → Erro de validação
- Status 419 → CSRF token expirado
- Status 403 → Sem permissão

---

### 5️⃣ Verificar Logs do PHP-FPM

```bash
# Ver logs do PHP-FPM
sudo tail -100 /var/log/php8.3-fpm.log

# Procurar por erros de memória, timeouts, etc
sudo grep -i "error" /var/log/php8.3-fpm.log
```

---

### 6️⃣ Testar Manualmente via CURL

```bash
# Obter CSRF token primeiro (fazer login via navegador e copiar cookie)
# Depois testar criação de ticket:

curl -X POST https://app.fluxdesk.com.br/tickets \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-CSRF-TOKEN: <seu-token-aqui>" \
  --cookie "laravel_session=<sua-sessao-aqui>" \
  -d '{
    "title": "Teste via CURL",
    "description": "<p>Descrição teste</p>",
    "service_id": "1",
    "priority": "Normal",
    "contact_id": "1"
  }'
```

---

## 🔍 Causas Prováveis e Soluções

### Causa #1: Prioridades Não Cadastradas ⚠️

**Sintoma:** Log mostra "Prioridade não encontrada no banco"

**Solução:**
```bash
cd /var/www/fluxdesk/current

# Executar seeder de prioridades
php artisan db:seed --class=PrioritySeeder

# Ou criar manualmente
php artisan tinker
```

```php
// No tinker:
$service = \App\Models\Service::first();
$tenant = \App\Models\Tenant::first();

\App\Models\Priority::create([
    'tenant_id' => $tenant->id,
    'service_id' => $service->id,
    'name' => 'Normal',
    'response_sla_time' => 60, // 1 hora
    'resolution_sla_time' => 480, // 8 horas
]);

\App\Models\Priority::create([
    'tenant_id' => $tenant->id,
    'service_id' => $service->id,
    'name' => 'Alta',
    'response_sla_time' => 30,
    'resolution_sla_time' => 240,
]);

\App\Models\Priority::create([
    'tenant_id' => $tenant->id,
    'service_id' => $service->id,
    'name' => 'Crítica',
    'response_sla_time' => 15,
    'resolution_sla_time' => 120,
]);
```

---

### Causa #2: CSRF Token Expirado 🔐

**Sintoma:** Console do navegador mostra erro 419

**Solução:**
```bash
# Limpar cache de configuração
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan cache:clear

# Reiniciar PHP-FPM
sudo systemctl restart php8.3-fpm
```

---

### Causa #3: Problema de Permissões 📁

**Sintoma:** Erro 500 ou "permission denied" nos logs

**Solução:**
```bash
cd /var/www/fluxdesk/current

# Corrigir permissões
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Verificar storage link
php artisan storage:link
```

---

### Causa #4: Erro de JavaScript no Frontend 💻

**Sintoma:** Console mostra erro antes de "Enviando requisição"

**Solução:**
1. Abrir DevTools (F12) → Console
2. Copiar a stack trace do erro
3. Verificar se algum arquivo .js não foi carregado (erro 404)
4. Limpar cache do navegador: `Ctrl + Shift + Del`

---

### Causa #5: Timeout de Requisição ⏱️

**Sintoma:** Requisição demora muito e não retorna

**Solução:**
```bash
# Aumentar timeout do Nginx
sudo nano /etc/nginx/sites-available/fluxdesk

# Alterar:
fastcgi_read_timeout 300;
client_body_timeout 300s;

# Reiniciar Nginx
sudo nginx -t
sudo systemctl reload nginx

# Aumentar timeout do PHP-FPM
sudo nano /etc/php/8.3/fpm/pool.d/www.conf

# Alterar:
request_terminate_timeout = 300

# Reiniciar PHP-FPM
sudo systemctl restart php8.3-fpm
```

---

## 🚀 Solução Rápida: Recriar Prioridades

**Se a causa for prioridades ausentes, execute:**

```bash
cd /var/www/fluxdesk/current

php artisan tinker
```

```php
// Cole este código no tinker:

// Buscar todos os tenants
$tenants = \App\Models\Tenant::all();

// Buscar todas as mesas de serviço
$services = \App\Models\Service::all();

// Para cada tenant e serviço, criar prioridades padrão
foreach ($tenants as $tenant) {
    foreach ($services as $service) {
        // Verificar se já existem prioridades
        $existingCount = \App\Models\Priority::where('tenant_id', $tenant->id)
            ->where('service_id', $service->id)
            ->count();
        
        if ($existingCount === 0) {
            echo "Criando prioridades para Tenant {$tenant->id} - Service {$service->name}\n";
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Baixa',
                'response_sla_time' => 240, // 4 horas
                'resolution_sla_time' => 960, // 16 horas
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Normal',
                'response_sla_time' => 120, // 2 horas
                'resolution_sla_time' => 480, // 8 horas
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Alta',
                'response_sla_time' => 60, // 1 hora
                'resolution_sla_time' => 240, // 4 horas
            ]);
            
            \App\Models\Priority::create([
                'tenant_id' => $tenant->id,
                'service_id' => $service->id,
                'name' => 'Crítica',
                'response_sla_time' => 30, // 30 minutos
                'resolution_sla_time' => 120, // 2 horas
            ]);
        }
    }
}

echo "Prioridades criadas com sucesso!\n";
```

---

## 📊 Verificação Final

Após aplicar as correções:

```bash
# 1. Limpar todos os caches
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# 2. Otimizar aplicação
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Reiniciar serviços
sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx

# 4. Verificar logs em tempo real
tail -f storage/logs/laravel.log
```

**Testar no navegador:**
1. Limpar cache: `Ctrl + Shift + Del`
2. Fazer logout e login novamente
3. Abrir DevTools (F12) → Console
4. Tentar criar um ticket
5. Observar os logs no console e no servidor

---

## 📞 Suporte

Se o problema persistir após todas as verificações:

1. **Copiar logs completos:**
   ```bash
   tail -500 storage/logs/laravel.log > /tmp/laravel-debug.log
   cat /tmp/laravel-debug.log
   ```

2. **Copiar erro do console do navegador** (screenshot ou texto)

3. **Enviar informações:**
   - Logs do Laravel
   - Erro do console JavaScript
   - Resultado da query de prioridades
   - Versão do PHP: `php -v`
   - Versão do Laravel: `php artisan --version`

---

## ✅ Checklist de Sucesso

Quando tudo estiver funcionando, você verá:

**Console do Navegador:**
```
🚀 Iniciando submit do ticket...
📝 Dados do formulário: {...}
📤 Enviando requisição para: ...
✅ Ticket criado com sucesso!
🏁 Requisição finalizada
```

**Log do Laravel:**
```
=== VALIDAÇÃO DO TICKET REQUEST ===
Dados para validação: {...}
✅ Prioridade validada com sucesso
=== INICIANDO CRIAÇÃO DE TICKET ===
✅ Ticket criado com sucesso: {"ticket_id": 123}
```

**Resultado:** Redirecionamento para `/tickets/open` com toast de sucesso! 🎉
