# Mapear E-mail Corporativo para Tenant

## Problema

Quando você quer que o SES receba e-mails **diretamente** no domínio corporativo do cliente (ex: `atendimento@onegestao.com.br`), sem usar o domínio `@tickets.fluxdesk.com.br`, o sistema não consegue identificar qual tenant deve receber o ticket.

---

## Solução 1: Mapeamento Manual (Rápido)

Configure um mapeamento direto no arquivo de configuração:

### 1. Editar `config/mail.php`

Adicione o e-mail corporativo do cliente ao array `tenant_email_mapping`:

```php
'tenant_email_mapping' => [
    'atendimento@onegestao.com.br' => '42262851012132',
    'suporte@outraempresa.com.br' => 'outraempresa',
    // Adicione mais conforme necessário
],
```

**Formato:**
- **Chave**: E-mail corporativo do cliente (lowercase)
- **Valor**: SLUG do tenant no sistema

### 2. Deploy

```bash
# No servidor EC2
cd /var/www/fluxdesk/current
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan config:clear
php artisan config:cache
sudo supervisorctl restart fluxdesk-worker:*
```

### 3. Testar

Envie um e-mail para `atendimento@onegestao.com.br` e verifique se o ticket é criado.

---

## Solução 2: Configurar Domínio Corporativo no SES (Recomendado)

Para que o SES receba e-mails no domínio `onegestao.com.br`:

### 1. Verificar Domínio no SES

No console da AWS:

1. Acesse **Amazon SES** → **Verified identities**
2. Clique em **Create identity**
3. Selecione **Domain**
4. Digite: `onegestao.com.br`
5. Clique em **Create identity**

### 2. Configurar DNS

Adicione os registros DNS que o SES mostrar:

```
Tipo: TXT
Nome: _amazonses.onegestao.com.br
Valor: (valor fornecido pelo SES)

Tipo: MX
Nome: onegestao.com.br
Prioridade: 10
Valor: inbound-smtp.us-east-2.amazonaws.com

Tipo: CNAME (DKIM 1)
Nome: xxx._domainkey.onegestao.com.br
Valor: xxx.dkim.amazonses.com

Tipo: CNAME (DKIM 2)
Nome: yyy._domainkey.onegestao.com.br
Valor: yyy.dkim.amazonses.com

Tipo: CNAME (DKIM 3)
Nome: zzz._domainkey.onegestao.com.br
Valor: zzz.dkim.amazonses.com
```

### 3. Criar Receipt Rule

No console da AWS:

1. Acesse **Amazon SES** → **Email receiving** → **Receipt rules**
2. Edite o **Rule set** existente
3. Adicione nova regra:
   - **Recipients**: `atendimento@onegestao.com.br`
   - **Actions**:
     - **S3**: Bucket `fluxdesk-tickets-emails-inbound`
     - **SNS**: Topic `fluxdesk-inbound-emails`

### 4. Configurar Mapeamento

Mesmo com o domínio verificado, você ainda precisa mapear o e-mail:

```php
// config/mail.php
'tenant_email_mapping' => [
    'atendimento@onegestao.com.br' => '42262851012132',
],
```

---

## Como Funciona

### Antes (sem mapeamento)

```
E-mail enviado para: atendimento@onegestao.com.br
↓
SES recebe
↓
Sistema tenta extrair tenant de: "atendimento"
↓
❌ Erro: Tenant não encontrado
```

### Depois (com mapeamento)

```
E-mail enviado para: atendimento@onegestao.com.br
↓
SES recebe
↓
Sistema busca mapeamento: atendimento@onegestao.com.br → 42262851012132
↓
Sistema encontra tenant com SLUG: 42262851012132
↓
✅ Ticket criado
```

---

## Configuração no Servidor

### No arquivo `/var/www/fluxdesk/shared/.env`

Não precisa adicionar nada no `.env`. A configuração fica apenas no `config/mail.php`.

### Atualizar no servidor

```bash
# 1. Editar config/mail.php localmente
nano /home/thiago/Projetos/fludesk/config/mail.php

# 2. Adicionar mapeamento
'tenant_email_mapping' => [
    'atendimento@onegestao.com.br' => '42262851012132',
],

# 3. Commit e push
cd /home/thiago/Projetos/fludesk
git add config/mail.php
git commit -m "config: mapear atendimento@onegestao.com.br para tenant 42262851012132"
git push origin main

# 4. Deploy no servidor
# (no servidor EC2)
sudo bash /var/www/fluxdesk/current/Setup/install_and_deploy.sh deploy
```

---

## Múltiplos E-mails para o Mesmo Tenant

Se o cliente tiver múltiplos e-mails:

```php
'tenant_email_mapping' => [
    'atendimento@onegestao.com.br' => '42262851012132',
    'suporte@onegestao.com.br' => '42262851012132',
    'comercial@onegestao.com.br' => '42262851012132',
],
```

Todos os e-mails criarão tickets no **mesmo tenant**! 🎉

---

## Múltiplos Clientes

Para configurar múltiplos clientes:

```php
'tenant_email_mapping' => [
    // Cliente 1: One Gestão
    'atendimento@onegestao.com.br' => '42262851012132',
    'suporte@onegestao.com.br' => '42262851012132',
    
    // Cliente 2: Outra Empresa
    'contato@outraempresa.com.br' => 'outraempresa-slug',
    'helpdesk@outraempresa.com.br' => 'outraempresa-slug',
    
    // Cliente 3: Mais uma Empresa
    'ti@maisuma.com.br' => 'maisuma',
],
```

---

## Vantagens do Mapeamento

✅ **Simples**: Apenas uma linha de configuração por e-mail  
✅ **Flexível**: Suporta múltiplos e-mails por tenant  
✅ **Rápido**: Não precisa configurar DNS  
✅ **Centralized**: Toda configuração em um único arquivo  
✅ **Auditável**: Fácil ver quais e-mails estão mapeados

---

## Desvantagens do Mapeamento

❌ **Manual**: Precisa adicionar cada e-mail manualmente  
❌ **Deploy**: Qualquer mudança exige deploy  
❌ **Limitado**: Só funciona para e-mails específicos (não aceita wildcards)

---

## Alternativa: Wildcard no SES (Avançado)

Se você quiser aceitar **qualquer** e-mail em um domínio corporativo, você pode:

### 1. Verificar o domínio inteiro no SES

```
onegestao.com.br
```

### 2. Criar Receipt Rule com wildcard

```
Recipients: *@onegestao.com.br
```

### 3. Implementar lógica de busca de tenant por domínio

Modificar `extractTenantId()` para buscar tenant pelo domínio do e-mail:

```php
// Extrair domínio
preg_match('/@(.+)$/', $email, $matches);
$domain = $matches[1] ?? '';

// Buscar tenant que tenha esse domínio configurado
$tenant = Tenant::where('email_domain', $domain)->first();
```

⚠️ **Isso requer** adicionar um campo `email_domain` na tabela `tenants` e uma migration.

---

## Troubleshooting

### ❌ Ainda recebo erro "Tenant não encontrado"

**Verificar:**

1. O mapeamento está correto no `config/mail.php`?
2. O SLUG do tenant está correto?
3. O cache foi limpo após alterar config?

```bash
php artisan config:clear
php artisan config:cache
```

### ❌ E-mail não chega ao sistema

**Verificar:**

1. O domínio `onegestao.com.br` está verificado no SES?
2. Há uma Receipt Rule para `atendimento@onegestao.com.br`?
3. O SNS Topic está configurado?
4. O webhook está apontando para a API correta?

### ❌ Ticket criado mas no tenant errado

**Verificar:**

1. O SLUG no mapeamento está correto?
2. O tenant com esse SLUG existe no banco?

```sql
SELECT id, name, slug FROM tenants WHERE slug = '42262851012132';
```

---

## Resumo

**Para usar e-mail corporativo do cliente:**

1. ✅ Adicionar mapeamento em `config/mail.php`
2. ✅ Fazer deploy
3. ✅ Configurar Receipt Rule no SES (se domínio não estiver verificado)
4. ✅ Testar enviando e-mail

**Formato do mapeamento:**
```php
'email-cliente@dominio.com' => 'slug-do-tenant'
```

**Onde está o SLUG?**
- No sistema: **Configurações** → **Empresas** → Coluna SLUG
- No banco: `SELECT slug FROM tenants WHERE id = X;`

---

## Exemplo Completo

```php
// config/mail.php

return [
    // ... outras configurações ...
    
    'ticket_domain' => 'tickets.fluxdesk.com.br',
    
    'tenant_email_mapping' => [
        // Mapeamento de e-mails corporativos
        'atendimento@onegestao.com.br' => '42262851012132',
    ],
];
```

Pronto! Agora o sistema aceita e-mails tanto em:
- ✅ `42262851012132@tickets.fluxdesk.com.br` (padrão)
- ✅ `atendimento@onegestao.com.br` (mapeado)

E ambos criam tickets no mesmo tenant! 🎉

