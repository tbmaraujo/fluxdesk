# 🚀 Deploy da Correção Crítica - tenant_id NULL

**Problema Resolvido:** `SQLSTATE[23502]: Not null violation: null value in column "tenant_id"`

---

## 🎯 Resumo da Correção

O problema era que ao criar tickets, o `tenant_id` não estava sendo preenchido, causando erro de constraint do banco de dados PostgreSQL.

**Causa Raiz:** O trait `BelongsToTenant` não estava funcionando corretamente em produção.

**Solução:** Adicionar `tenant_id` explicitamente no `TicketController::store()` e no `$fillable` do modelo `Ticket`.

---

## 📝 Arquivos Alterados

### 1. `app/Http/Controllers/TicketController.php`
- ✅ Adicionado `"tenant_id" => $user->tenant_id` ao criar ticket
- ✅ Logs melhorados com emojis para facilitar debug
- ✅ Try-catch para capturar exceções

### 2. `app/Models/Ticket.php`
- ✅ Adicionado `"tenant_id"` ao array `$fillable`

### 3. `resources/js/Pages/Tickets/Create.tsx`
- ✅ Logs no console do navegador
- ✅ Validação frontend antes do submit
- ✅ Tratamento de erros com alertas

### 4. `app/Http/Requests/StoreTicketRequest.php`
- ✅ Logs detalhados de validação
- ✅ Listagem de prioridades disponíveis em caso de erro

---

## 🚀 Procedimento de Deploy

### **1. No Servidor de Produção**

```bash
# Conectar ao servidor
ssh ubuntu@app.fluxdesk.com.br

# Navegar para o diretório da aplicação
cd /var/www/fluxdesk

# Fazer backup do release atual (opcional, mas recomendado)
cp -r current current.backup.$(date +%Y%m%d_%H%M%S)

# Ir para o repositório git
cd repo

# Puxar as últimas alterações
git pull origin main
```

---

### **2. Instalar Dependências (se necessário)**

```bash
cd /var/www/fluxdesk/repo

# Composer (apenas se houver mudanças no composer.json)
composer install --no-dev --optimize-autoloader

# NPM (apenas se quiser recompilar assets no servidor - OPCIONAL)
# npm install
# npm run build
```

---

### **3. Copiar Arquivos Atualizados**

```bash
# Copiar arquivos PHP atualizados
cp -f app/Http/Controllers/TicketController.php /var/www/fluxdesk/current/app/Http/Controllers/
cp -f app/Models/Ticket.php /var/www/fluxdesk/current/app/Models/
cp -f app/Http/Requests/StoreTicketRequest.php /var/www/fluxdesk/current/app/Http/Requests/

# Copiar assets compilados do repositório local
# IMPORTANTE: Estes assets já foram compilados no ambiente local
cp -rf public/build/* /var/www/fluxdesk/current/public/build/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/fluxdesk/current
```

---

### **4. Limpar Caches**

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
```

---

### **5. Reiniciar Serviços**

```bash
# Reiniciar PHP-FPM
sudo systemctl restart php8.3-fpm

# Recarregar Nginx (sem downtime)
sudo systemctl reload nginx

# Verificar status dos serviços
sudo systemctl status php8.3-fpm
sudo systemctl status nginx
```

---

### **6. Verificar Logs em Tempo Real**

```bash
# Em um terminal separado, monitorar logs
tail -f storage/logs/laravel.log
```

---

### **7. Testar Criação de Ticket via Tinker**

```bash
cd /var/www/fluxdesk/current
php artisan tinker
```

```php
// No tinker, testar criação:
$user = \App\Models\User::first();
$contact = \App\Models\Contact::first();
$service = \App\Models\Service::first();

$ticket = $user->tickets()->create([
    'title' => 'Teste Pós-Fix',
    'description' => '<p>Teste após correção do tenant_id</p>',
    'priority' => 'Normal',
    'service_id' => $service->id,
    'contact_id' => $contact->id,
    'client_id' => $contact->client_id,
    'tenant_id' => $user->tenant_id, // Agora é obrigatório
]);

echo "✅ Ticket criado com ID: " . $ticket->id . " - Tenant: " . $ticket->tenant_id . "\n";
exit
```

**Resultado Esperado:**
```
✅ Ticket criado com ID: X - Tenant: Y
```

---

### **8. Testar no Navegador**

1. **Limpar cache do navegador:** `Ctrl + Shift + Del`
2. **Fazer logout e login novamente**
3. **Abrir DevTools (F12) → Console**
4. **Tentar criar um ticket**

**Logs Esperados no Console:**
```
🚀 Iniciando submit do ticket...
📝 Dados do formulário: {...}
📤 Enviando requisição para: https://app.fluxdesk.com.br/tickets
✅ Ticket criado com sucesso!
🏁 Requisição finalizada
```

**Logs Esperados no Laravel:**
```
[2025-10-24 XX:XX:XX] === VALIDAÇÃO DO TICKET REQUEST ===
[2025-10-24 XX:XX:XX] Dados para validação: {...}
[2025-10-24 XX:XX:XX] ✅ Prioridade validada com sucesso
[2025-10-24 XX:XX:XX] === INICIANDO CRIAÇÃO DE TICKET ===
[2025-10-24 XX:XX:XX] Usuário: {...}
[2025-10-24 XX:XX:XX] Contato encontrado: {...}
[2025-10-24 XX:XX:XX] ✅ Ticket criado com sucesso: {"ticket_id":X,"tenant_id":Y}
```

---

## ✅ Checklist de Verificação

- [ ] Git pull executado com sucesso
- [ ] Arquivos PHP copiados
- [ ] Assets compilados copiados
- [ ] Caches limpos
- [ ] Serviços reiniciados
- [ ] Teste via Tinker bem-sucedido (ticket criado com tenant_id)
- [ ] Teste no navegador bem-sucedido
- [ ] Logs do console mostram fluxo completo
- [ ] Logs do Laravel confirmam criação

---

## 🔍 Verificação de tenant_id no Banco

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql fluxdesk

# Verificar últimos tickets criados
SELECT id, title, tenant_id, client_id, user_id, created_at 
FROM tickets 
ORDER BY id DESC 
LIMIT 10;

# Verificar se há tickets com tenant_id NULL
SELECT COUNT(*) as tickets_sem_tenant 
FROM tickets 
WHERE tenant_id IS NULL;

# Sair
\q
```

**Resultado Esperado:** 
- Todos os tickets devem ter `tenant_id` preenchido
- A query de `tickets_sem_tenant` deve retornar `0`

---

## 🆘 Troubleshooting

### Problema: Ainda dá erro de tenant_id NULL

**Verificar:**
1. Os arquivos foram realmente copiados?
   ```bash
   grep "tenant_id.*user->tenant_id" /var/www/fluxdesk/current/app/Http/Controllers/TicketController.php
   ```
   Deve mostrar a linha com `"tenant_id" => $user->tenant_id`

2. O cache foi limpo?
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

3. O PHP-FPM foi reiniciado?
   ```bash
   sudo systemctl restart php8.3-fpm
   ```

---

### Problema: Assets antigos no navegador

**Solução:**
1. Limpar cache do navegador: `Ctrl + Shift + F5`
2. Abrir em modo anônimo/privado
3. Verificar se os assets foram atualizados:
   ```bash
   ls -lh /var/www/fluxdesk/current/public/build/assets/Create-*.js
   ```
   A data deve ser recente (hoje)

---

### Problema: Logs não aparecem

**Verificar permissões:**
```bash
sudo chown -R www-data:www-data /var/www/fluxdesk/current/storage
sudo chmod -R 775 /var/www/fluxdesk/current/storage
```

**Verificar nível de log no .env:**
```bash
grep LOG_LEVEL /var/www/fluxdesk/current/.env
```
Deve ser `info` ou `debug` para ver todos os logs.

---

## 📊 Resultado Esperado Final

Após o deploy, a criação de tickets deve funcionar normalmente:

1. ✅ Formulário carregado corretamente
2. ✅ Validação no frontend passa
3. ✅ Requisição enviada ao backend
4. ✅ Validação no backend passa (prioridade encontrada)
5. ✅ Ticket criado com `tenant_id` preenchido
6. ✅ Redirecionamento para `/tickets/open`
7. ✅ Toast de sucesso exibido
8. ✅ Ticket aparece na lista de tickets abertos

---

## 🎉 Sucesso!

Se todos os testes passaram, o problema está **100% resolvido**! 🎊

A aplicação agora:
- ✅ Cria tickets com `tenant_id` preenchido
- ✅ Tem logs detalhados para debug futuro
- ✅ Valida dados no frontend e backend
- ✅ Trata erros adequadamente

---

## 📝 Notas Importantes

1. **Multi-tenancy:** Agora o `tenant_id` é **sempre** preenchido explicitamente, garantindo isolamento de dados entre tenants.

2. **Logs de Debug:** Os logs adicionados facilitarão troubleshooting futuro. Podem ser removidos após estabilização.

3. **Trait BelongsToTenant:** Ainda está ativo e pode ser útil para outros modelos. Para o Ticket, usamos assignment explícito por segurança.

4. **Validação de Prioridade:** Continua validando se a prioridade existe para o serviço e tenant específicos.

---

**Deploy executado em:** ____________________  
**Responsável:** ____________________  
**Status:** ⬜ Sucesso  ⬜ Parcial  ⬜ Falhou  
**Observações:** ____________________
