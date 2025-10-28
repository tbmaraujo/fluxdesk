# Como Configurar Encaminhamento de E-mail para Tickets

## Cenário

Seu cliente já tem um e-mail de atendimento divulgado (ex: `atendimento@onegestao.com.br`) e quer que os e-mails enviados para lá **automaticamente** criem tickets no sistema.

---

## Solução

Configure um **encaminhamento automático** do e-mail corporativo do cliente para o e-mail do sistema de tickets.

---

## Gmail / Google Workspace

### 1. Acessar Configurações
1. Faça login no Gmail/Google Workspace com a conta do cliente
2. Clique no **ícone de engrenagem** (⚙️) → **Ver todas as configurações**
3. Vá na aba **Encaminhamento e POP/IMAP**

### 2. Adicionar Endereço de Encaminhamento
1. Clique em **Adicionar um endereço de encaminhamento**
2. Digite o e-mail do sistema: `42262851012132@tickets.fluxdesk.com.br`
   - Substitua `42262851012132` pelo **SLUG** do tenant do cliente
3. Clique em **Avançar** → **Continuar** → **OK**

### 3. Confirmar Encaminhamento
1. O Google enviará um e-mail de confirmação para `42262851012132@tickets.fluxdesk.com.br`
2. **IMPORTANTE**: Este e-mail será recebido pelo SES e **criará um ticket automaticamente**
3. Abra este ticket no sistema e copie o **código de confirmação**
4. Volte para as configurações do Gmail e cole o código
5. Clique em **Verificar**

### 4. Ativar Encaminhamento
1. Selecione a opção: **Encaminhar uma cópia dos e-mails recebidos para...**
2. Escolha o endereço `42262851012132@tickets.fluxdesk.com.br`
3. Escolha o que fazer com o e-mail original:
   - **Manter cópia no Gmail** (recomendado) - O e-mail fica no Gmail E cria ticket
   - **Marcar como lido** - Se quiser que fique marcado como lido
   - **Arquivar cópia do Gmail** - Se quiser limpar a caixa de entrada
4. Clique em **Salvar alterações**

✅ Pronto! Agora todo e-mail enviado para `atendimento@onegestao.com.br` será automaticamente encaminhado para o sistema e criará um ticket.

---

## Microsoft 365 / Outlook

### 1. Acessar Configurações
1. Faça login no Outlook Web (outlook.office.com) com a conta do cliente
2. Clique no **ícone de engrenagem** (⚙️) → **Exibir todas as configurações do Outlook**
3. Vá em **E-mail** → **Encaminhamento**

### 2. Configurar Encaminhamento
1. Marque **Habilitar encaminhamento**
2. Digite o e-mail do sistema: `42262851012132@tickets.fluxdesk.com.br`
   - Substitua `42262851012132` pelo **SLUG** do tenant do cliente
3. Escolha se quer **Manter uma cópia das mensagens encaminhadas** (recomendado)
4. Clique em **Salvar**

✅ Pronto! Agora todo e-mail enviado para `atendimento@onegestao.com.br` será automaticamente encaminhado para o sistema e criará um ticket.

---

## cPanel / Webmail

### 1. Acessar Encaminhadores
1. Faça login no cPanel do provedor de e-mail
2. Vá em **E-mail** → **Encaminhadores** (ou **Forwarders**)

### 2. Adicionar Encaminhador
1. Clique em **Adicionar Encaminhador** (ou **Add Forwarder**)
2. Preencha:
   - **Endereço**: `atendimento` (parte antes do @)
   - **Domínio**: `onegestao.com.br` (selecione da lista)
   - **Encaminhar para**: `42262851012132@tickets.fluxdesk.com.br`
3. Opções adicionais:
   - ✅ Marque **Entregar também na caixa de entrada local** se quiser manter cópia
4. Clique em **Adicionar Encaminhador**

✅ Pronto! Agora todo e-mail enviado para `atendimento@onegestao.com.br` será automaticamente encaminhado para o sistema e criará um ticket.

---

## Plesk

### 1. Acessar Correio
1. Faça login no Plesk
2. Vá em **Correio** → Selecione o domínio
3. Clique no endereço de e-mail (ex: `atendimento@onegestao.com.br`)

### 2. Configurar Encaminhamento
1. Vá na aba **Encaminhamento**
2. Marque **Ativar encaminhamento**
3. Adicione o endereço: `42262851012132@tickets.fluxdesk.com.br`
4. Opções:
   - ✅ Marque **Entregar também na caixa postal** se quiser manter cópia
5. Clique em **OK**

✅ Pronto! Agora todo e-mail enviado para `atendimento@onegestao.com.br` será automaticamente encaminhado para o sistema e criará um ticket.

---

## Zimbra

### 1. Acessar Preferências
1. Faça login no Zimbra Webmail
2. Vá em **Preferências** → **Correio**
3. Clique em **Filtros de Correio**

### 2. Criar Filtro de Encaminhamento
1. Clique em **Novo Filtro**
2. Configure:
   - **Nome**: `Encaminhar para Sistema de Tickets`
   - **Se todas as seguintes condições forem atendidas**:
     - **De** / **contém** / `@` (qualquer remetente)
   - **Execute as seguintes ações**:
     - **Redirecionar para endereço** / `42262851012132@tickets.fluxdesk.com.br`
     - ✅ Marque **Manter uma cópia da mensagem** se quiser
3. Clique em **OK**

✅ Pronto! Agora todo e-mail enviado para `atendimento@onegestao.com.br` será automaticamente encaminhado para o sistema e criará um ticket.

---

## Como Encontrar o SLUG do Cliente

### No Sistema Fluxdesk:

1. Faça login como **administrador**
2. Vá em **Configurações** → **Empresas** (ou **Tenants**)
3. Procure pela empresa do cliente (ex: **One Gestão**)
4. O **SLUG** está listado na coluna ou nos detalhes da empresa
5. Ex: `42262851012132`

### No Banco de Dados:

```sql
SELECT id, name, slug, cnpj 
FROM tenants 
WHERE name LIKE '%One Gestão%';
```

---

## Testar se Funcionou

### 1. Enviar E-mail de Teste

Peça para alguém (ou você mesmo) enviar um e-mail para:
```
atendimento@onegestao.com.br
```

Com:
- **Assunto**: `Teste de integração sistema de tickets`
- **Corpo**: `Este é um teste para verificar se o encaminhamento está funcionando.`

### 2. Verificar Logs (Servidor)

```bash
# No servidor EC2
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

Procure por:
```
✅ "E-mail do sistema encontrado"
✅ "Tenant identificado"
✅ "Ticket criado a partir de e-mail"
```

### 3. Verificar no Sistema

1. Faça login no Fluxdesk
2. Vá em **Tickets** (ou **Chamados**)
3. Deve aparecer um **novo ticket** com:
   - **Título**: `Teste de integração sistema de tickets`
   - **Descrição**: Conteúdo do e-mail
   - **Contato**: E-mail de quem enviou

---

## Troubleshooting

### ❌ Erro: "Tenant não encontrado"

**Causa**: SLUG incorreto no endereço de e-mail.

**Solução**:
1. Verifique o SLUG correto do cliente no sistema
2. Atualize o encaminhamento com o SLUG correto

### ❌ E-mail não chega ao sistema

**Causa 1**: Encaminhamento não configurado corretamente.

**Solução**:
1. Verifique se o encaminhamento está **ativo**
2. Teste enviando um e-mail de teste

**Causa 2**: SES não está recebendo o e-mail.

**Solução**:
1. Verifique se o domínio `tickets.fluxdesk.com.br` está verificado no SES
2. Verifique se há regras de recebimento (Receipt Rules) configuradas
3. Confira se o SNS Topic está apontando para a API correta

### ❌ Ticket criado mas destinatário errado

**Causa**: Sistema não está encontrando o e-mail `@tickets.fluxdesk.com.br`.

**Solução**:
1. Verifique os logs para ver quais destinatários estão chegando
2. Verifique se `MAIL_TICKET_DOMAIN` está correto no `.env`

```bash
# Verificar configuração
cd /var/www/fluxdesk/current
grep MAIL_TICKET_DOMAIN .env
```

---

## Configuração Avançada: Múltiplos E-mails

Se o cliente tiver **múltiplos e-mails** de atendimento:

- `atendimento@onegestao.com.br`
- `suporte@onegestao.com.br`
- `comercial@onegestao.com.br`

Configure **encaminhamento** em **todos eles** para o mesmo endereço do sistema:
```
42262851012132@tickets.fluxdesk.com.br
```

Todos os e-mails serão **unificados** em um único tenant no sistema! 🎉

---

## Configuração no .env (Servidor)

Certifique-se de que o `.env` do servidor tem:

```env
# Domínio para receber tickets
MAIL_TICKET_DOMAIN=tickets.fluxdesk.com.br
```

Após alterar, **limpe o cache**:

```bash
cd /var/www/fluxdesk/current
php artisan config:clear
php artisan config:cache
```

---

## Resumo

1. ✅ Configure **encaminhamento automático** no provedor de e-mail do cliente
2. ✅ Use o **SLUG** do tenant como prefixo: `SLUG@tickets.fluxdesk.com.br`
3. ✅ Mantenha **cópia** dos e-mails na caixa original (recomendado)
4. ✅ Teste enviando um e-mail
5. ✅ Verifique se ticket foi criado no sistema

---

## Vantagens

✅ **Transparência**: Cliente continua usando seu e-mail divulgado  
✅ **Automação**: Tickets criados automaticamente  
✅ **Rastreabilidade**: E-mails ficam na caixa original E no sistema  
✅ **Simplicidade**: Sem necessidade de treinar equipe  
✅ **Flexibilidade**: Funciona com qualquer provedor de e-mail

