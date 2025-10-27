# 📋 Requisitos para E-mail Inbound Funcionar

Para que o sistema de recebimento de e-mails funcione corretamente, o tenant precisa ter alguns dados cadastrados.

---

## ✅ Requisitos Obrigatórios

Para cada tenant que vai receber tickets por e-mail, é necessário ter:

### 1. **Pelo menos 1 Usuário** 🔴 OBRIGATÓRIO

O tenant deve ter pelo menos um usuário cadastrado.

**Por quê?**
- A coluna `user_id` na tabela `tickets` não pode ser NULL
- Tickets criados por e-mail são automaticamente atribuídos ao primeiro usuário do tenant

**Como verificar:**
```bash
php artisan tinker
>>> \App\Models\User::where('tenant_id', 2)->count()
# Deve retornar pelo menos 1
```

**Se não tiver usuário:**
- Crie um usuário no sistema para o tenant
- Ou o e-mail vai falhar com erro: "Nenhum usuário encontrado para o tenant"

---

### 2. **Pelo menos 1 Cliente** 🔴 OBRIGATÓRIO

O tenant deve ter pelo menos um cliente cadastrado.

**Por quê?**
- Contatos precisam estar associados a um cliente
- Tickets precisam estar associados a um cliente

**Como verificar:**
```bash
php artisan tinker
>>> \App\Models\Client::where('tenant_id', 2)->count()
# Deve retornar pelo menos 1
```

**Se não tiver cliente:**
- Crie um cliente padrão para o tenant
- Ou o e-mail vai falhar com erro: "Nenhum cliente encontrado para o tenant"

---

### 3. **Pelo menos 1 Serviço** 🔴 OBRIGATÓRIO

O tenant deve ter pelo menos um serviço cadastrado.

**Por quê?**
- Tickets precisam estar associados a um serviço
- O serviço define o tipo de ticket

**Como verificar:**
```bash
php artisan tinker
>>> \App\Models\Service::where('tenant_id', 2)->count()
# Deve retornar pelo menos 1
```

**Se não tiver serviço:**
- Crie um serviço padrão para o tenant
- Ou o e-mail vai falhar com erro: "Nenhum serviço encontrado para o tenant"

---

## 🔍 Verificar Tenant Completo

Script para verificar se um tenant tem tudo que precisa:

```bash
php artisan tinker

$tenantId = 2;  # Ajuste para o seu tenant

echo "=== Verificando Tenant $tenantId ===\n";

$tenant = \App\Models\Tenant::find($tenantId);
echo "Tenant: " . ($tenant ? $tenant->name : 'NÃO ENCONTRADO') . "\n";

$users = \App\Models\User::where('tenant_id', $tenantId)->count();
echo "Usuários: $users " . ($users > 0 ? '✓' : '✗ FALTA') . "\n";

$clients = \App\Models\Client::where('tenant_id', $tenantId)->count();
echo "Clientes: $clients " . ($clients > 0 ? '✓' : '✗ FALTA') . "\n";

$services = \App\Models\Service::where('tenant_id', $tenantId)->count();
echo "Serviços: $services " . ($services > 0 ? '✓' : '✗ FALTA') . "\n";

$canReceive = $users > 0 && $clients > 0 && $services > 0;
echo "\n" . ($canReceive ? '✓ PODE RECEBER E-MAILS' : '✗ NÃO PODE RECEBER E-MAILS') . "\n";
```

---

## 📝 Exemplo de Resultado

### ✅ Tenant Configurado Corretamente:
```
=== Verificando Tenant 2 ===
Tenant: One Gestão de Tecnologia Ltda
Usuários: 1 ✓
Clientes: 2 ✓
Serviços: 3 ✓

✓ PODE RECEBER E-MAILS
```

### ❌ Tenant com Problemas:
```
=== Verificando Tenant 2 ===
Tenant: One Gestão de Tecnologia Ltda
Usuários: 0 ✗ FALTA
Clientes: 2 ✓
Serviços: 1 ✓

✗ NÃO PODE RECEBER E-MAILS
```

---

## ⚙️ Como o Sistema Atribui

### Usuário Responsável
- O ticket é atribuído ao **primeiro usuário** do tenant (ORDER BY id)
- Futuramente: permitir configurar usuário padrão para e-mails

### Cliente
- O contato é associado ao **primeiro cliente** do tenant
- Futuramente: permitir configurar cliente padrão para e-mails

### Serviço
- O ticket é associado ao **primeiro serviço** do tenant
- Futuramente: permitir configurar serviço padrão para e-mails

---

## 🔧 Configuração Recomendada

Para cada tenant, crie:

1. **Usuário padrão para e-mails:**
   - Nome: "Suporte E-mail" ou "Sistema"
   - Use este usuário para tickets automáticos

2. **Cliente padrão:**
   - Nome: "Clientes Gerais" ou "Via E-mail"
   - Use para contatos que vêm de e-mail

3. **Serviço padrão:**
   - Nome: "Suporte Geral" ou "E-mail"
   - Use para tickets que vêm de e-mail

---

## 🐛 Erros Comuns

### Erro: "Nenhum usuário encontrado para o tenant"

**Causa:** Tenant não tem usuários cadastrados

**Solução:**
```bash
# Via interface administrativa:
# Cadastrar usuário para o tenant

# Ou via Tinker (exemplo):
php artisan tinker
>>> $user = new \App\Models\User();
>>> $user->tenant_id = 2;
>>> $user->name = 'Suporte E-mail';
>>> $user->email = 'suporte@tenant.com';
>>> $user->password = bcrypt('senha123');
>>> $user->save();
```

### Erro: "Nenhum cliente encontrado para o tenant"

**Causa:** Tenant não tem clientes cadastrados

**Solução:** Cadastrar cliente via interface administrativa

### Erro: "Nenhum serviço encontrado para o tenant"

**Causa:** Tenant não tem serviços cadastrados

**Solução:** Cadastrar serviço via interface administrativa

---

## 📊 Checklist de Setup

Antes de usar e-mail inbound para um tenant:

- [ ] Tenant existe e está ativo
- [ ] Tenant tem pelo menos 1 usuário
- [ ] Tenant tem pelo menos 1 cliente
- [ ] Tenant tem pelo menos 1 serviço
- [ ] SLUG do tenant está configurado
- [ ] DNS configurado (MX records)
- [ ] SNS configurado para receber e-mails
- [ ] Workers rodando
- [ ] Teste de e-mail realizado

---

## 💡 Dica

Crie um comando Artisan para verificar todos os tenants:

```bash
php artisan tinker
>>> \App\Models\Tenant::all()->each(function($t) {
...   $u = $t->users()->count();
...   $c = $t->clients()->count();
...   $s = $t->services()->count();
...   $ok = $u && $c && $s ? '✓' : '✗';
...   echo "$ok {$t->name} (U:$u C:$c S:$s)\n";
... });
```

---

**Última atualização:** 27/10/2025  
**Sistema:** Fluxdesk v1.0

