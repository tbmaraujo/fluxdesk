# Correção: Suporte a E-mails Encaminhados

## Problema Identificado

Quando um e-mail era **encaminhado** de um endereço corporativo (ex: `atendimento@onegestao.com.br`) para o sistema de tickets (ex: `42262851012132@tickets.fluxdesk.com.br`), o sistema tentava extrair o tenant ID do **destinatário original** em vez do **destinatário final**.

### Erro anterior:
```
Não foi possível extrair tenant_id do destinatário: atendimento@onegestao.com.br
```

### Por que acontecia?
O código pegava apenas o **primeiro** destinatário da lista (`mail['destination'][0]`), mas em e-mails encaminhados, o primeiro pode ser o endereço corporativo do cliente, não o endereço do sistema de tickets.

---

## Solução Implementada

Modificamos o `EmailInboundService` para:

1. ✅ **Receber TODOS os destinatários** (não apenas o primeiro)
2. ✅ **Procurar** pelo destinatário que termine com `@tickets.fluxdesk.com.br`
3. ✅ **Logar** todos os destinatários para facilitar debug
4. ✅ **Fallback inteligente** se não encontrar o domínio esperado

---

## Arquivos Alterados

### 1. `app/Services/EmailInboundService.php`

**Antes:**
```php
$to = $mail['destination'][0] ?? ''; // Apenas o primeiro
```

**Depois:**
```php
$destinations = $mail['destination'] ?? [];
$to = $this->findTicketEmailAddress($destinations); // Busca o correto
```

**Novo método adicionado:**
```php
private function findTicketEmailAddress(array $destinations): string
{
    $ticketDomain = config('mail.ticket_domain', 'tickets.fluxdesk.com.br');
    
    foreach ($destinations as $destination) {
        if (str_ends_with(strtolower($destination), '@' . strtolower($ticketDomain))) {
            return $destination; // Retorna o endereço do sistema
        }
    }
    
    // Fallback: primeiro destinatário
    return $destinations[0] ?? '';
}
```

### 2. `config/mail.php`

Adicionada configuração para domínio de tickets:

```php
'ticket_domain' => env('MAIL_TICKET_DOMAIN', 'tickets.fluxdesk.com.br'),
```

---

## Configuração no `.env`

Adicione (opcional, já tem valor padrão):

```env
# Domínio para receber tickets por e-mail
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br
```

---

## Como Funciona Agora

### Cenário 1: E-mail direto ✅
```
De: cliente@empresa.com
Para: 42262851012132@tickets.fluxdesk.com.br
```
→ Sistema identifica: `42262851012132@tickets.fluxdesk.com.br`  
→ Extrai tenant ID: `42262851012132` (SLUG)  
→ ✅ Ticket criado

### Cenário 2: E-mail encaminhado ✅
```
De: cliente@empresa.com
Para: atendimento@onegestao.com.br
Encaminhado para: 42262851012132@tickets.fluxdesk.com.br
```

**Destinatários recebidos pelo SES:**
```json
"destination": [
  "atendimento@onegestao.com.br",
  "42262851012132@tickets.fluxdesk.com.br"
]
```

→ Sistema procura qual termina com `@tickets.fluxdesk.com.br`  
→ Identifica: `42262851012132@tickets.fluxdesk.com.br`  
→ Extrai tenant ID: `42262851012132` (SLUG)  
→ ✅ Ticket criado

---

## Logs Melhorados

Agora os logs mostram **todos** os destinatários:

```json
{
  "from": "cliente@empresa.com",
  "destinations": [
    "atendimento@onegestao.com.br",
    "42262851012132@tickets.fluxdesk.com.br"
  ],
  "ticket_email": "42262851012132@tickets.fluxdesk.com.br",
  "subject": "Problema com sistema"
}
```

---

## Testar a Correção

### 1. Deploy
```bash
# No servidor EC2
sudo bash /var/www/fluxdesk/current/Setup/install_and_deploy.sh deploy
```

### 2. Testar e-mail encaminhado

Configure um **redirecionamento** no e-mail corporativo:

**Gmail / Google Workspace:**
1. Acesse **Configurações** → **Encaminhamento e POP/IMAP**
2. Adicionar endereço de encaminhamento: `42262851012132@tickets.fluxdesk.com.br`
3. Confirmar encaminhamento

**Microsoft 365:**
1. Acesse **Configurações** → **E-mail** → **Encaminhamento**
2. Ativar encaminhamento para: `42262851012132@tickets.fluxdesk.com.br`

### 3. Enviar e-mail de teste

Envie um e-mail para `atendimento@onegestao.com.br` (ou o e-mail configurado para encaminhamento).

### 4. Verificar logs

```bash
# Acompanhar processamento
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

Procure por:
```
✅ "E-mail do sistema encontrado"
✅ "Tenant identificado"
✅ "Ticket criado a partir de e-mail"
```

---

## Limitações Conhecidas

1. **Múltiplos domínios de tickets**
   - Se você usar múltiplos domínios (ex: `tickets.fluxdesk.com.br` e `chamados.minhaempresa.com`), configure `MAIL_TICKET_DOMAIN` no `.env` com o domínio principal.

2. **Encaminhamento com BCC**
   - Se o e-mail for enviado em **BCC** (cópia oculta), o SES pode não receber todos os destinatários. Recomenda-se usar **encaminhamento automático** em vez de BCC.

---

## Vantagens da Solução

✅ **Flexível**: Funciona com e-mails diretos e encaminhados  
✅ **Robusto**: Fallback para primeiro destinatário se domínio não encontrado  
✅ **Auditável**: Logs detalhados de todos os destinatários  
✅ **Configurável**: Domínio pode ser alterado via `.env`  
✅ **Transparente**: Cliente não precisa mudar forma de enviar e-mails

---

## Suporte a Múltiplos Clientes

Com essa correção, você pode configurar:

1. **E-mail corporativo do cliente** (ex: `atendimento@onegestao.com.br`)
2. **Encaminhamento automático** para `SLUG@tickets.fluxdesk.com.br`
3. Cliente continua enviando para seu próprio e-mail
4. Sistema recebe e processa automaticamente

Isso é especialmente útil para:
- Clientes que já têm um e-mail de atendimento divulgado
- Empresas que não querem mudar cultura interna
- Transição gradual para o novo sistema

---

## Resumo Técnico

| Item | Antes | Depois |
|------|-------|--------|
| **Destinatários** | Apenas primeiro (`$to = $destinations[0]`) | Todos (`findTicketEmailAddress()`) |
| **Busca tenant** | Do primeiro destinatário | Do destinatário com domínio correto |
| **E-mail encaminhado** | ❌ Falhava | ✅ Funciona |
| **Logs** | Apenas 1 destinatário | Todos destinatários |
| **Configuração** | Hardcoded | Via `.env` (`MAIL_TICKET_DOMAIN`) |

---

## Commit

```
fix: suportar e-mails encaminhados na criação de tickets

- Buscar destinatário correto em múltiplos recipients
- Adicionar método findTicketEmailAddress()
- Configuração de domínio via MAIL_TICKET_DOMAIN
- Logs detalhados com todos destinatários
- Fallback inteligente para primeiro destinatário

Corrige erro: "Não foi possível extrair tenant_id do destinatário: atendimento@onegestao.com.br"
Agora funciona quando e-mail corporativo encaminha para SLUG@tickets.fluxdesk.com.br
```

