# Configuração Rápida: E-mail do Tenant

Este guia mostra como configurar o `email_code` para um tenant existente.

---

## Via Tinker (Recomendado)

```bash
php artisan tinker
```

```php
// Listar todos os tenants
App\Models\Tenant::all(['id', 'name', 'slug', 'email_code']);

// Configurar email_code para tenant específico
$tenant = App\Models\Tenant::find(1); // ou ::where('slug', 'acme')->first()
$tenant->email_code = '42262851012132'; // código único
$tenant->save();

// Verificar
$tenant->refresh();
echo "Tenant: {$tenant->name}\n";
echo "Slug: {$tenant->slug}\n";
echo "Email Code: {$tenant->email_code}\n";
echo "E-mail: {$tenant->email_code}@tickets.fluxdesk.com.br\n";
```

---

## Via Migration/Seeder

Crie um seeder ou adicione ao `DatabaseSeeder.php`:

```php
use App\Models\Tenant;

// Atualizar tenant existente
$tenant = Tenant::where('slug', 'acme')->first();
if ($tenant) {
    $tenant->update(['email_code' => '42262851012132']);
}

// Ou criar novo tenant já com email_code
Tenant::create([
    'name' => 'Acme Corporation',
    'slug' => 'acme',
    'email_code' => '42262851012132',
    'domain' => 'acme.fluxdesk.com.br',
    'is_active' => true,
]);
```

Execute:
```bash
php artisan db:seed --class=TenantSeeder
```

---

## Regras para `email_code`

✅ **Permitido:**
- Números: `42262851012132`
- Letras minúsculas: `acme`
- Hífen: `acme-corp`
- Underline: `acme_corp`

❌ **Não permitido:**
- Espaços
- Caracteres especiais (@, !, $, etc.)
- Letras maiúsculas (serão convertidas para minúsculas)

⚠️ **Importante:**
- Deve ser **único** (índice único no banco)
- Pode ser `NULL` (nesse caso, use `slug` ou `id` para receber e-mails)

---

## Testando

### 1. Configurar tenant

```bash
php artisan tinker

$tenant = App\Models\Tenant::first();
$tenant->email_code = 'teste123';
$tenant->save();
exit
```

### 2. Testar webhook

```bash
# Local
bash test-mailgun-new-ticket.sh .env http://127.0.0.1:8000/api/webhooks/mailgun-inbound teste123

# Produção
bash test-mailgun-new-ticket.sh /var/www/fluxdesk/current/.env https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound teste123
```

### 3. Verificar logs

```bash
tail -f storage/logs/laravel.log | grep "Tenant identificado"
```

**Resposta esperada:**
```
[timestamp] local.INFO: Tenant identificado para criação de novo ticket {"tenant_id":1,"tenant_slug":"acme","recipient":"teste123@tickets.fluxdesk.com.br"}
```

---

## Opções de Identificação

O sistema identifica o tenant por **três métodos** (em ordem):

### 1. Por `slug`

```
acme@tickets.fluxdesk.com.br
↓
SELECT * FROM tenants WHERE slug = 'acme' AND is_active = true
```

### 2. Por `email_code`

```
42262851012132@tickets.fluxdesk.com.br
↓
SELECT * FROM tenants WHERE email_code = '42262851012132' AND is_active = true
```

### 3. Por `id` (se for numérico)

```
1@tickets.fluxdesk.com.br
↓
SELECT * FROM tenants WHERE id = 1 AND is_active = true
```

---

## Exemplos Práticos

### Exemplo 1: Tenant com slug amigável

```php
$tenant = Tenant::create([
    'name' => 'Acme Corp',
    'slug' => 'acme',           // ← usado para e-mail
    'email_code' => null,       // não precisa
    'domain' => 'acme.fluxdesk.com.br',
    'is_active' => true,
]);
```

**E-mail:** `acme@tickets.fluxdesk.com.br`

### Exemplo 2: Tenant com código numérico

```php
$tenant = Tenant::create([
    'name' => 'Cliente XYZ',
    'slug' => 'cliente-xyz',
    'email_code' => '42262851012132', // ← usado para e-mail
    'domain' => 'xyz.fluxdesk.com.br',
    'is_active' => true,
]);
```

**E-mails aceitos:**
- `42262851012132@tickets.fluxdesk.com.br` (via email_code)
- `cliente-xyz@tickets.fluxdesk.com.br` (via slug)

### Exemplo 3: Multi-tenant com IDs

```php
// Usar o ID do tenant como identificador
// ID: 1
```

**E-mail:** `1@tickets.fluxdesk.com.br`

---

## FAQ

### P: Posso mudar o `email_code` depois?

**R:** Sim, mas e-mails enviados para o código antigo não funcionarão mais.

### P: E se eu não configurar `email_code`?

**R:** O sistema usa o `slug` ou `id` como fallback.

### P: Posso usar o mesmo `email_code` para vários tenants?

**R:** Não, o campo tem índice `unique`.

### P: Como desabilitar e-mails para um tenant?

**R:** Defina `is_active = false` ou remova o `email_code`.

### P: O `email_code` diferencia maiúsculas/minúsculas?

**R:** Não, o sistema converte tudo para minúsculas antes de buscar.

---

## Troubleshooting

### Erro: Duplicate entry for email_code

**Causa:** Tentando usar um `email_code` já existente.

**Solução:**
```bash
php artisan tinker
App\Models\Tenant::where('email_code', '42262851012132')->get();
# Altere o código conflitante ou use outro
```

### E-mail não cria ticket

**Verificar:**
1. Tenant está ativo?
   ```bash
   App\Models\Tenant::where('slug', 'acme')->first()->is_active
   ```

2. Logs mostram algum erro?
   ```bash
   tail -f storage/logs/laravel.log | grep -i "inbound\|mailgun"
   ```

3. Worker da fila está rodando?
   ```bash
   ps aux | grep queue:work
   ```

---

**Próxima etapa:** Configurar Mailgun Routes (veja `MAILGUN-INBOUND-README.md`)

