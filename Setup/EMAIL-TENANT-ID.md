# 📧 Como Identificar Tenants em E-mails

## 🎯 Formato de E-mail para Tickets

O sistema aceita **dois formatos** para identificar o tenant:

### Opção 1: ID do Tenant (mais simples)
```
{tenant_id}@tickets.fluxdesk.com.br
```

**Exemplo:**
```
1@tickets.fluxdesk.com.br
5@tickets.fluxdesk.com.br
123@tickets.fluxdesk.com.br
```

### Opção 2: CNPJ do Tenant (mais intuitivo)
```
{cnpj}@tickets.fluxdesk.com.br
```

**Exemplo:**
```
42262851012132@tickets.fluxdesk.com.br
12345678000199@tickets.fluxdesk.com.br
```

---

## 🔍 Como Descobrir o ID ou CNPJ

### No servidor (via Tinker):

```bash
cd /var/www/fluxdesk/current
php artisan tinker

# Listar todos os tenants
>>> \App\Models\Tenant::all(['id', 'name', 'document', 'cnpj'])

# Buscar por nome
>>> \App\Models\Tenant::where('name', 'LIKE', '%nome%')->get(['id', 'name', 'document'])

# Buscar por CNPJ
>>> \App\Models\Tenant::where('document', '42262851012132')->first()
```

---

## ⚙️ Como Funciona

O sistema detecta automaticamente qual formato foi usado:

1. **Número pequeno (≤ 10 dígitos):** Trata como **ID do tenant**
   ```
   5@tickets.fluxdesk.com.br → Busca tenant com id = 5
   ```

2. **Número grande (> 10 dígitos):** Trata como **CNPJ/documento**
   ```
   42262851012132@tickets.fluxdesk.com.br → Busca tenant onde document = '42262851012132'
   ```

---

## 📋 Exemplos de Uso

### Criar ticket usando ID:
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Problema no sistema
Corpo: Descrição do problema
```

### Criar ticket usando CNPJ:
```
Para: 42262851012132@tickets.fluxdesk.com.br
Assunto: Problema no sistema
Corpo: Descrição do problema
```

### Responder ticket:
```
Para: 1@tickets.fluxdesk.com.br
Assunto: Re: [TKT-123] Problema no sistema
Corpo: Resposta ao problema
```

---

## 🐛 Troubleshooting

### Erro: "Tenant não encontrado"

**Causa:** O tenant com aquele ID ou CNPJ não existe no banco.

**Solução:**

1. **Verificar se o tenant existe:**
```bash
php artisan tinker
>>> \App\Models\Tenant::find(1)  # Por ID
>>> \App\Models\Tenant::where('document', '42262851012132')->first()  # Por CNPJ
```

2. **Listar todos os tenants disponíveis:**
```bash
>>> \App\Models\Tenant::all(['id', 'name', 'document'])
```

3. **Criar tenant se necessário** (via interface administrativa)

### Erro: "CNPJ não encontrado"

**Verificar qual campo armazena o CNPJ:**

```bash
php artisan tinker
>>> \App\Models\Tenant::first()
# Ver quais campos existem: document, cnpj, etc.
```

O sistema busca em ambos os campos:
- `document`
- `cnpj`

---

## 📊 Campos da Tabela Tenants

Verifique quais campos sua tabela tem:

```bash
php artisan tinker
>>> Schema::getColumnListing('tenants')
```

**Campos comuns:**
- `id` - ID numérico (sempre existe)
- `document` - CNPJ/CPF
- `cnpj` - CNPJ específico
- `name` - Nome do tenant
- `email` - E-mail do tenant

---

## 🎯 Qual Usar?

### Use ID quando:
- ✅ E-mail para testes
- ✅ Sistemas automatizados
- ✅ Você sabe o ID exato

### Use CNPJ quando:
- ✅ E-mail manual de clientes
- ✅ Mais intuitivo para usuários finais
- ✅ Integração com sistemas externos

---

## 📝 Logs

O sistema registra nos logs quando identifica um tenant:

```bash
# Ver logs
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log | grep "Tenant identificado"

# Exemplo de log:
# [2025-10-27 14:00:00] production.INFO: Tenant identificado por CNPJ/documento
# {"identifier":"42262851012132","tenant_id":5}
```

---

## 💡 Dicas

1. **Comunique aos clientes:** Informe qual e-mail usar
2. **Documente:** Mantenha um registro de ID vs CNPJ
3. **Monitore logs:** Acompanhe se os e-mails estão sendo processados
4. **Teste antes:** Envie um e-mail de teste primeiro

---

## 🔧 Customização

Se sua tabela usa outro campo para CNPJ, edite:

`app/Services/EmailInboundService.php` - linha ~117:

```php
$tenant = Tenant::where('document', $identifier)
    ->orWhere('cnpj', $identifier)
    ->orWhere('seu_campo_aqui', $identifier)  // Adicione seu campo
    ->first();
```

---

**Última atualização:** 27/10/2025  
**Sistema:** Fluxdesk v1.0

