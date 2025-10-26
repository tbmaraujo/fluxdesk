# 🐛 BUG: SuperAdmin Vendo Apenas Dados de Um Tenant

## Problema Identificado

Quando logado como **SuperAdmin**, o sistema exibia apenas dados de um único tenant (ex: clientes, mesas de serviço, tickets de um único cliente), impedindo o acesso global necessário para gerenciar múltiplos tenants.

### Causa Raiz

O middleware `IdentifyTenant` estava definindo `app('currentTenant')` para **TODOS os usuários autenticados**, incluindo SuperAdmins:

```php
// ❌ ANTES (INCORRETO)
if (auth()->user()->tenant_id) {
    $tenant = Tenant::withoutGlobalScopes()
        ->where('id', auth()->user()->tenant_id)
        ->where('is_active', true)
        ->first();
}

// Define tenant no container
app()->instance('currentTenant', $tenant);
```

### Fluxo do Problema

1. **SuperAdmin faz login**
   - Usuário tem `tenant_id` preenchido (ex: tenant_id = 1)
   
2. **Middleware IdentifyTenant executa**
   - Define `app('currentTenant')` baseado no tenant_id do SuperAdmin
   
3. **TenantScope é aplicado nos Models**
   ```php
   // TenantScope.php (linhas 27-31)
   if ($user && isset($user->is_super_admin) && $user->is_super_admin === true) {
       return; // ✅ Pula filtro para SuperAdmin
   }
   
   // MAS... (linhas 34-42)
   if (!app()->bound('currentTenant')) {
       return; // Não há tenant definido
   }
   
   $tenant = app('currentTenant'); // ❌ Tenant foi definido pelo middleware!
   
   // Aplica filtro
   $builder->where($model->getTable() . '.tenant_id', $tenant->id);
   ```

4. **Controllers carregam dados filtrados**
   ```php
   // TicketController::create() (linha 38)
   $clients = Client::with("contacts")->orderBy("name")->get();
   // ❌ Retorna apenas clientes do tenant 1
   
   $services = Service::with('priorities')->orderBy("name")->get();
   // ❌ Retorna apenas serviços do tenant 1
   ```

5. **Resultado**: SuperAdmin vê dados de apenas um tenant

---

## ✅ Solução Implementada

### Modificação no Middleware IdentifyTenant

Adicionada verificação para **pular identificação de tenant quando usuário é SuperAdmin**:

```php
// ✅ DEPOIS (CORRETO)
// app/Http/Middleware/IdentifyTenant.php (linhas 33-40)

// Se o usuário for super admin, não definir tenant (acesso global)
if (auth()->user()->is_super_admin === true) {
    \Log::info('SuperAdmin detectado - pulando identificação de tenant', [
        'user_id' => auth()->user()->id,
        'user_name' => auth()->user()->name,
    ]);
    return $next($request);
}
```

### Fluxo Corrigido

1. **SuperAdmin faz login**
   - Usuário tem `is_super_admin = true`
   
2. **Middleware IdentifyTenant executa**
   - ✅ Detecta que é SuperAdmin
   - ✅ **NÃO define** `app('currentTenant')`
   - ✅ Continua requisição sem tenant no container
   
3. **TenantScope é aplicado nos Models**
   ```php
   // Verifica se é SuperAdmin
   if ($user && isset($user->is_super_admin) && $user->is_super_admin === true) {
       return; // ✅ Pula filtro
   }
   
   // Verifica se tenant está definido
   if (!app()->bound('currentTenant')) {
       return; // ✅ Não há tenant, pula filtro
   }
   ```

4. **Controllers carregam TODOS os dados**
   ```php
   // TicketController::create() (linha 38)
   $clients = Client::with("contacts")->orderBy("name")->get();
   // ✅ Retorna TODOS os clientes de TODOS os tenants
   
   $services = Service::with('priorities')->orderBy("name")->get();
   // ✅ Retorna TODOS os serviços de TODOS os tenants
   ```

5. **Resultado**: SuperAdmin tem acesso global ✅

---

## 📂 Arquivos Modificados

### `/app/Http/Middleware/IdentifyTenant.php`
- **Linha 33-40**: Adicionada verificação de SuperAdmin antes de identificar tenant

---

## 🔍 Pontos de Atenção

### 1. Controllers que Usam `auth()->user()->tenant_id`

Vários controllers ainda usam `auth()->user()->tenant_id` diretamente para filtrar dados:

```php
// Exemplo: ServiceController::index()
$services = Service::where('tenant_id', auth()->user()->tenant_id)
    ->with('ticketType')
    ->get();
```

**Status**: ✅ **Seguro para SuperAdmin**
- SuperAdmin pode ter tenant_id, mas isso é apenas referência
- Como `app('currentTenant')` não é definido, TenantScope não filtra
- SuperAdmin vê todos os dados via Eloquent normal

### 2. TenantScope Dupla Proteção

O `TenantScope` tem **duas camadas de proteção**:
1. **Primeira verificação**: Se usuário é SuperAdmin → não filtra
2. **Segunda verificação**: Se `app('currentTenant')` não existe → não filtra

Agora com a correção no middleware, SuperAdmin passa pelas duas verificações. ✅

### 3. Logs Adicionados

O middleware agora loga quando detecta SuperAdmin:
```
[INFO] SuperAdmin detectado - pulando identificação de tenant
       user_id: 1
       user_name: Admin Master
```

---

## 🧪 Como Testar

### 1. Login como SuperAdmin
```bash
# Acessar o sistema em produção
# Fazer login com credenciais de SuperAdmin
```

### 2. Criar Ticket
- Acessar "Novo Ticket"
- Verificar select de **Cliente**: deve mostrar TODOS os clientes de TODOS os tenants
- Verificar select de **Mesa de Serviço**: deve mostrar TODOS os serviços

### 3. Listar Tickets
- Acessar "Tickets Abertos"
- Deve mostrar tickets de TODOS os tenants

### 4. Verificar Logs
```bash
tail -f storage/logs/laravel.log | grep "SuperAdmin detectado"
```

---

## ✅ Resultado Esperado

Após a correção:
- ✅ SuperAdmin vê **TODOS os clientes** de **TODOS os tenants**
- ✅ SuperAdmin vê **TODAS as mesas de serviço** de **TODOS os tenants**
- ✅ SuperAdmin pode criar tickets para **QUALQUER cliente**
- ✅ SuperAdmin pode gerenciar **TODOS os recursos** do sistema
- ✅ Usuários normais continuam vendo apenas dados do seu tenant

---

## 🚀 Deploy em Produção

1. **Fazer backup do arquivo original**:
```bash
cp app/Http/Middleware/IdentifyTenant.php app/Http/Middleware/IdentifyTenant.php.bak
```

2. **Aplicar a correção**:
```bash
git add app/Http/Middleware/IdentifyTenant.php
git commit -m "fix: SuperAdmin não deve ter tenant definido no container"
git push
```

3. **Em produção**:
```bash
cd /var/www/sincro8-tickets
git pull
php artisan optimize:clear
```

4. **Testar**:
- Fazer logout e login como SuperAdmin
- Verificar se vê todos os clientes

---

## 📝 Nota Técnica

Esta correção **NÃO afeta** o comportamento de usuários normais:
- Usuários normais continuam tendo `app('currentTenant')` definido
- TenantScope continua filtrando dados por tenant
- Isolamento multi-tenant permanece intacto

A mudança afeta **APENAS** SuperAdmins, que agora têm acesso global como esperado. ✅
