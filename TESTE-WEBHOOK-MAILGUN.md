# 🧪 Como Testar o Webhook do Mailgun (Passo a Passo)

## 📋 Contexto

O **Sample POST** do Mailgun gera e-mails aleatórios que não existem no banco de dados. Para testar **de verdade**, você precisa cadastrar um e-mail no sistema.

---

## ✅ Passo 1: Cadastrar E-mail no Sistema

### Opção A: Comando Artisan (Recomendado)

```bash
# No servidor ou local
php artisan email:register suporte@tickets.fluxdesk.com.br --tenant=1

# Com mais opções
php artisan email:register atendimento@tickets.fluxdesk.com.br \
  --tenant=1 \
  --service=1 \
  --priority=1 \
  --client=1 \
  --purpose=incoming
```

**Parâmetros:**
- `email` - E-mail a ser cadastrado (obrigatório)
- `--tenant` - ID ou slug do tenant (obrigatório ou interativo)
- `--service` - ID do serviço (opcional, usa o primeiro do tenant)
- `--priority` - ID da prioridade (opcional, usa a primeira do serviço)
- `--client` - ID do cliente (opcional, usa o primeiro do tenant)
- `--purpose` - `incoming` (entrada), `outgoing` (saída) ou `both` (padrão: incoming)

**Exemplo de output:**
```
✅ E-mail cadastrado com sucesso!

┌─────────────┬────────────────────────────────────────┐
│ Campo       │ Valor                                  │
├─────────────┼────────────────────────────────────────┤
│ ID          │ 1                                      │
│ E-mail      │ suporte@tickets.fluxdesk.com.br       │
│ Tenant      │ Minha Empresa (ID: 1)                 │
│ Propósito   │ incoming                              │
│ Serviço     │ 1                                      │
│ Prioridade  │ 1                                      │
│ Cliente     │ 1                                      │
│ Ativo       │ ✅ Sim                                 │
└─────────────┴────────────────────────────────────────┘
```

### Opção B: Diretamente no Banco de Dados

```bash
php artisan tinker
```

```php
// 1. Verificar tenants disponíveis
\App\Models\Tenant::select('id', 'name', 'slug')->get();

// 2. Verificar serviços do tenant
\App\Models\Service::where('tenant_id', 1)->select('id', 'name')->get();

// 3. Verificar prioridades do serviço
\App\Models\Priority::where('service_id', 1)->select('id', 'name')->get();

// 4. Cadastrar e-mail
\App\Models\TenantEmailAddress::create([
    'tenant_id' => 1,
    'email' => 'suporte@tickets.fluxdesk.com.br',
    'purpose' => 'incoming',
    'service_id' => 1,
    'priority_id' => 1,
    'client_filter' => 1, // opcional
    'active' => true,
    'verified' => true,
    'verified_at' => now(),
]);
```

### Opção C: Via Interface Web (Futuro)

```
/settings/emails → Adicionar E-mail
```

---

## ✅ Passo 2: Listar E-mails Cadastrados

```bash
php artisan tinker
```

```php
// Listar todos os e-mails cadastrados
\App\Models\TenantEmailAddress::with('tenant:id,name')
    ->where('active', true)
    ->get(['id', 'tenant_id', 'email', 'purpose', 'service_id', 'priority_id']);

// Ver detalhes de um e-mail específico
$email = \App\Models\TenantEmailAddress::where('email', 'suporte@tickets.fluxdesk.com.br')->first();
echo "ID: {$email->id}\n";
echo "Tenant: {$email->tenant->name}\n";
echo "Serviço: {$email->service_id}\n";
echo "Prioridade: {$email->priority_id}\n";
echo "Ativo: " . ($email->active ? 'Sim' : 'Não') . "\n";
```

---

## ✅ Passo 3: Configurar Route no Mailgun

### No Painel do Mailgun

1. Acesse: **Sending** → **Routes**
2. Clique em **Create Route**
3. Configure:

```
Expression Type: Match Recipient
Recipient: suporte@tickets.fluxdesk.com.br

Actions:
☑ Forward to URL: https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound
☐ Stop processing routes (deixar desmarcado se houver outras rotas)
```

4. Salve

### Via API (Opcional)

```bash
curl -X POST https://api.mailgun.net/v3/routes \
  -u "api:SUA_API_KEY" \
  -F "priority=0" \
  -F "description=Fluxdesk Inbound - Suporte" \
  -F "expression=match_recipient('suporte@tickets.fluxdesk.com.br')" \
  -F "action=forward('https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound')" \
  -F "action=store()"
```

---

## ✅ Passo 4: Testar com E-mail Real

### Opção A: Enviar E-mail Manualmente

Use seu cliente de e-mail favorito e envie para:
```
Para: suporte@tickets.fluxdesk.com.br
Assunto: Teste de ticket via Mailgun
Corpo: Este é um teste de criação de ticket por e-mail.
```

### Opção B: Sample POST com E-mail Customizado

Infelizmente, o **Sample POST** do Mailgun não permite customizar o destinatário. Use a **Opção A** ou **Opção C**.

### Opção C: Test via curl (Simulado)

```bash
curl -X POST https://app.fluxdesk.com.br/api/webhooks/mailgun-inbound \
  -F "sender=cliente@example.com" \
  -F "recipient=suporte@tickets.fluxdesk.com.br" \
  -F "subject=Teste de ticket" \
  -F "body-plain=Corpo do e-mail de teste" \
  -F "Message-Id=<test-$(date +%s)@example.com>" \
  -F "timestamp=$(date +%s)" \
  -F "token=test-token" \
  -F "signature=test-signature"
```

**⚠️ Nota:** Este teste vai falhar na validação HMAC se você tiver a `webhook_signing_key` configurada. Para testar sem validação, temporariamente comente a verificação ou não configure a key.

---

## ✅ Passo 5: Monitorar Processamento

### Logs em tempo real

```bash
# No servidor
tail -f /var/www/fluxdesk/current/storage/logs/laravel.log
```

**Logs esperados (sucesso):**
```
[INFO] Mailgun inbound recebido
[INFO] E-mail Mailgun enfileirado para processamento
[INFO] Processando e-mail recebido
[INFO] E-mail encontrado no banco de dados
[INFO] Remetente identificado
[INFO] Novo contato criado a partir de e-mail
[INFO] Ticket criado a partir de e-mail
[INFO] Email ingerido e processado com sucesso
```

### Verificar no banco de dados

```bash
php artisan tinker
```

```php
// Ver últimos e-mails processados
\App\Models\TicketEmail::orderBy('created_at', 'desc')
    ->take(5)
    ->get(['id', 'message_id', 'from', 'subject', 'status', 'ticket_id']);

// Ver último ticket criado
\App\Models\Ticket::with('contact:id,name,email')
    ->orderBy('created_at', 'desc')
    ->first(['id', 'title', 'contact_id', 'status', 'created_at']);

// Ver detalhes do processamento
$email = \App\Models\TicketEmail::where('message_id', 'MESSAGE_ID_AQUI')->first();
echo "Status: {$email->status}\n";
echo "Ticket: {$email->ticket_id}\n";
echo "Erro: " . ($email->error_message ?? 'Nenhum') . "\n";
```

---

## 🐛 Troubleshooting

### ❌ "Não foi possível extrair tenant_id do destinatário"

**Causa:** E-mail não cadastrado em `tenant_email_addresses`

**Solução:**
```bash
php artisan email:register SEU_EMAIL@tickets.fluxdesk.com.br --tenant=1
```

### ❌ "Tenant não encontrado"

**Causa:** Tenant ID extraído não existe no banco

**Solução:** Verificar tenants ativos:
```bash
php artisan tinker
\App\Models\Tenant::where('is_active', true)->get(['id', 'name', 'slug']);
```

### ❌ "Nenhum serviço encontrado para o tenant"

**Causa:** Tenant não tem serviços cadastrados

**Solução:** Cadastrar pelo menos um serviço via interface web ou:
```bash
php artisan tinker
\App\Models\Service::create([
    'tenant_id' => 1,
    'name' => 'Suporte Técnico',
    'ticket_type_id' => 1, // Ajustar conforme seu sistema
]);
```

### ❌ "Nenhum usuário encontrado para o tenant"

**Causa:** Tenant não tem usuários

**Solução:** Criar usuário via comando ou interface:
```bash
php artisan make:superadmin
# ou
php artisan tinker
\App\Models\User::create([
    'tenant_id' => 1,
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('senha'),
    'role' => 'ADMIN',
    'is_active' => true,
]);
```

### ❌ "Webhook com assinatura inválida"

**Causa:** HMAC signature não corresponde

**Solução:** 
- Verificar `MAILGUN_WEBHOOK_SIGNING_KEY` no `.env`
- Obter a key correta em: Mailgun → Settings → Webhooks → Signing key
- Ou temporariamente desabilitar validação removendo a key do `.env`

---

## 📊 Verificação Completa

Execute este script para diagnóstico completo:

```bash
php artisan tinker
```

```php
// 1. Verificar tenants
echo "=== TENANTS ===\n";
$tenants = \App\Models\Tenant::where('is_active', true)->get(['id', 'name']);
foreach ($tenants as $t) {
    echo "ID {$t->id}: {$t->name}\n";
    
    // E-mails do tenant
    $emails = \App\Models\TenantEmailAddress::where('tenant_id', $t->id)
        ->where('active', true)
        ->pluck('email');
    
    if ($emails->isEmpty()) {
        echo "  ⚠️  Sem e-mails cadastrados\n";
    } else {
        echo "  📧 E-mails: " . $emails->implode(', ') . "\n";
    }
    
    // Serviços
    $services = \App\Models\Service::where('tenant_id', $t->id)->count();
    echo "  📋 Serviços: {$services}\n";
    
    // Usuários
    $users = \App\Models\User::where('tenant_id', $t->id)->count();
    echo "  👥 Usuários: {$users}\n";
    
    echo "\n";
}

// 2. Últimos e-mails processados
echo "=== ÚLTIMOS E-MAILS ===\n";
$emails = \App\Models\TicketEmail::orderBy('created_at', 'desc')->take(5)->get();
foreach ($emails as $e) {
    $status = match($e->status) {
        'processed' => '✅',
        'failed' => '❌',
        'queued' => '⏳',
        default => '❓'
    };
    echo "{$status} {$e->from} → {$e->to}\n";
    echo "   Status: {$e->status} | Ticket: " . ($e->ticket_id ?? 'N/A') . "\n";
    if ($e->error_message) {
        echo "   Erro: {$e->error_message}\n";
    }
}
```

---

## ✅ Resultado Esperado

Ao enviar um e-mail para um endereço **cadastrado**, você deve ver:

1. **Webhook responde:** HTTP 200 + `{"ok":true}`
2. **Logs mostram:** "Email ingerido e processado com sucesso"
3. **Banco de dados:**
   - Registro em `ticket_emails` com `status = 'processed'`
   - Novo ticket em `tickets`
   - Novo contato em `contacts` (se não existir)
4. **Notificação enviada** para o contato

---

**Pronto para testar!** 🚀

