# Como Usar: Configuração de E-mails via Interface

## 🎯 Objetivo

Este guia ensina como configurar e-mails de recebimento de tickets usando a interface administrativa do Fluxdesk, sem precisar editar código.

---

## 📍 Acessando as Configurações

1. Faça login no sistema
2. Clique em **Configurações** no menu lateral
3. Na seção **Geral**, clique em **E-mail**
4. Você verá 4 guias:
   - **Geral** - Configurações básicas
   - **Recebimento** ⭐ - Cadastrar e-mails (principal)
   - **Autorizações** - Regras de autorização (em desenvolvimento)
   - **Envio** - Configurações de envio

---

## ✉️ Cadastrando E-mail de Recebimento

### Passo 1: Acessar Guia "Recebimento"

1. Clique na guia **"Recebimento"**
2. Clique no botão **"+ Adicionar E-mail"**

### Passo 2: Preencher Formulário

No dialog que abre, preencha:

**E-mail** (obrigatório)
- Digite o e-mail corporativo que receberá os tickets
- Exemplo: `atendimento@onegestao.com.br`
- ⚠️ **Importante**: Este e-mail não pode ser editado depois

**Cliente** (opcional)
- Selecione "Todos" para aceitar de qualquer cliente
- Ou escolha um cliente específico para filtrar

**Prioridade** (padrão: Normal)
- **Alta**: Tickets criados terão prioridade alta
- **Normal**: Prioridade normal (padrão)
- **Baixa**: Prioridade baixa

**Observações** (opcional)
- Notas internas sobre este e-mail
- Exemplo: "E-mail principal de atendimento"

### Passo 3: Salvar

Clique em **"Salvar"**

✅ Pronto! O e-mail foi cadastrado e está ativo.

---

## 📋 Gerenciando E-mails

### Ver E-mails Cadastrados

Na guia "Recebimento", você verá uma tabela com todos os e-mails:

| E-mail | Cliente | Prioridade | Status | Verificado | Ações |
|--------|---------|------------|--------|------------|-------|
| atendimento@onegestao.com.br | Todos | Normal | Ativo | ✓ | ⋮ |

### Editar E-mail

1. Clique nos **3 pontos (⋮)** na linha do e-mail
2. Selecione **"Editar"**
3. Atualize as informações (exceto o e-mail)
4. Clique em **"Salvar"**

### Ativar/Desativar E-mail

1. Clique nos **3 pontos (⋮)**
2. Selecione **"Desativar"** ou **"Ativar"**

**E-mails inativos não receberão tickets!**

### Remover E-mail

1. Clique nos **3 pontos (⋮)**
2. Selecione **"Remover"**
3. Confirme a remoção

⚠️ **Atenção**: Esta ação não pode ser desfeita!

---

## 🔧 Configurando o SES para Receber

Após cadastrar o e-mail na interface, você precisa configurar o Amazon SES:

### 1. Verificar Domínio no SES

No console da AWS:

1. Acesse **Amazon SES** → **Verified identities**
2. Clique em **"Create identity"**
3. Selecione **"Domain"**
4. Digite o domínio: `onegestao.com.br`
5. Clique em **"Create identity"**

### 2. Configurar DNS

Adicione os registros DNS fornecidos pelo SES:

```
Tipo: MX
Nome: onegestao.com.br
Prioridade: 10
Valor: inbound-smtp.us-east-2.amazonaws.com

Tipo: TXT
Nome: _amazonses.onegestao.com.br
Valor: (valor fornecido pelo SES)

Tipo: CNAME (DKIM 1, 2, 3)
... (valores fornecidos pelo SES)
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

---

## 🧪 Testando

### 1. Enviar E-mail de Teste

Envie um e-mail para: `atendimento@onegestao.com.br`

**Assunto**: Teste de integração  
**Corpo**: Este é um teste de abertura automática de ticket

### 2. Verificar Logs (Opcional)

Se tiver acesso ao servidor:

```bash
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

Procure por:
```
✅ "E-mail encontrado no banco de dados"
✅ "Tenant identificado"
✅ "Ticket criado a partir de e-mail"
```

### 3. Verificar Ticket Criado

1. Vá em **Tickets** no menu
2. Deve aparecer um novo ticket com:
   - **Título**: Assunto do e-mail
   - **Descrição**: Corpo do e-mail
   - **Contato**: Remetente do e-mail
   - **Prioridade**: Conforme configurado

---

## ❓ Perguntas Frequentes

### P: Posso cadastrar múltiplos e-mails?

**R**: Sim! Você pode cadastrar quantos e-mails quiser. Todos criarão tickets no mesmo tenant.

Exemplo:
- `atendimento@onegestao.com.br`
- `suporte@onegestao.com.br`
- `comercial@onegestao.com.br`

### P: Posso usar o mesmo e-mail em diferentes clientes?

**R**: Não. Cada e-mail só pode ser cadastrado uma vez por tenant. Use o filtro "Cliente" para direcionar.

### P: O que significa "Verificado"?

**R**: Indica que o domínio foi verificado no Amazon SES e está pronto para receber e-mails.

### P: Posso usar e-mail do Gmail, Outlook, etc?

**R**: Sim, mas você precisa configurar um **encaminhamento** ou adicionar o domínio no SES. Veja `Setup/CONFIGURAR-ENCAMINHAMENTO-EMAIL.md`.

### P: E-mail desativado ainda aparece na lista?

**R**: Sim, mas não criará tickets. Para remover completamente, use "Remover".

### P: Posso definir prioridades diferentes por e-mail?

**R**: Sim! Configure a prioridade ao cadastrar cada e-mail.

Exemplo:
- `urgente@empresa.com` → Prioridade Alta
- `atendimento@empresa.com` → Prioridade Normal
- `feedback@empresa.com` → Prioridade Baixa

---

## 🎯 Casos de Uso

### Caso 1: E-mail Principal de Atendimento

**Cenário**: Empresa quer que `atendimento@empresa.com` crie tickets automaticamente.

**Configuração**:
- **E-mail**: `atendimento@empresa.com`
- **Cliente**: Todos
- **Prioridade**: Normal

### Caso 2: E-mail Urgente

**Cenário**: Empresa tem e-mail separado para casos urgentes.

**Configuração**:
- **E-mail**: `urgente@empresa.com`
- **Cliente**: Todos
- **Prioridade**: Alta

### Caso 3: E-mail por Cliente

**Cenário**: Cada cliente tem seu próprio e-mail de suporte.

**Configuração Cliente A**:
- **E-mail**: `suporte.clienteA@empresa.com`
- **Cliente**: Cliente A
- **Prioridade**: Normal

**Configuração Cliente B**:
- **E-mail**: `suporte.clienteB@empresa.com`
- **Cliente**: Cliente B
- **Prioridade**: Normal

---

## 🚨 Troubleshooting

### E-mail não criou ticket

**Verifique:**

1. ✅ E-mail está **ativo** na interface?
2. ✅ Domínio está **verificado** no SES?
3. ✅ Receipt Rule está configurada?
4. ✅ SNS Topic está apontando para a API?
5. ✅ Workers estão rodando? (`sudo supervisorctl status`)

### Ticket criado no tenant errado

**Causa**: E-mail cadastrado em múltiplos tenants.

**Solução**: Cada e-mail só pode estar em um tenant. Remova duplicatas.

### Ticket criado mas sem contato

**Causa**: Remetente não é um contato cadastrado.

**Solução**: Sistema cria contato automaticamente. Verifique em **Contatos**.

---

## 📚 Documentação Adicional

- **Mapeamento de e-mails**: `Setup/MAPEAR-EMAIL-CORPORATIVO.md`
- **Encaminhamento de e-mails**: `Setup/CONFIGURAR-ENCAMINHAMENTO-EMAIL.md`
- **Configuração AWS completa**: `Setup/AWS-INBOUND-CHECKLIST.md`
- **Implementação técnica**: `Setup/IMPLEMENTACAO-EMAIL-UI.md`

---

## ✅ Checklist Rápido

- [ ] Acessar **Configurações → Geral → E-mail**
- [ ] Clicar na guia **"Recebimento"**
- [ ] Clicar em **"+ Adicionar E-mail"**
- [ ] Preencher e-mail corporativo
- [ ] Configurar cliente e prioridade
- [ ] Salvar
- [ ] Verificar domínio no SES
- [ ] Configurar DNS
- [ ] Criar Receipt Rule no SES
- [ ] Testar enviando e-mail
- [ ] Verificar ticket criado

---

**Pronto!** Agora você pode gerenciar todos os e-mails de recebimento diretamente pela interface, sem precisar editar código! 🎉

