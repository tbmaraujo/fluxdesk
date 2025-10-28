# Teste Completo: Interface de Configuração de E-mails

## 🎯 Objetivo

Testar todo o fluxo end-to-end da nova funcionalidade de configuração de e-mails via interface.

---

## 📋 Pré-requisitos

- ✅ Backend deployado com migration rodada
- ✅ Frontend compilado
- ✅ Amazon SES configurado
- ✅ Workers rodando (`sudo supervisorctl status`)

---

## 🚀 Deploy Completo

### No Servidor EC2

```bash
# Deploy completo
sudo bash /var/www/fluxdesk/current/Setup/install_and_deploy.sh deploy

# Verificar se migration rodou
cd /var/www/fluxdesk/current
php artisan migrate:status | grep tenant_email_addresses

# Deve mostrar:
# ✅ 2025_10_28_000000_create_tenant_email_addresses_table.php

# Verificar se workers estão rodando
sudo supervisorctl status

# Deve mostrar:
# fluxdesk-worker:fluxdesk-worker_00    RUNNING
# fluxdesk-worker:fluxdesk-worker_01    RUNNING
```

---

## 🧪 Teste 1: Acessar Interface

### Passos

1. Abrir navegador
2. Acessar: `https://app.fluxdesk.com.br/login`
3. Fazer login com tenant OneGestão (SLUG: `42262851012132`)
4. Clicar em **Configurações** no menu
5. Clicar em **E-mail** (seção Geral)

### Resultado Esperado

✅ Página abre com 4 guias:
- Geral
- Recebimento
- Autorizações
- Envio

✅ Guia "Recebimento" está vazia (nenhum e-mail cadastrado)

---

## 🧪 Teste 2: Cadastrar E-mail

### Passos

1. Na guia **"Recebimento"**, clicar em **"+ Adicionar E-mail"**
2. Preencher:
   - **E-mail**: `atendimento@onegestao.com.br`
   - **Cliente**: `Todos`
   - **Prioridade**: `Normal`
   - **Observações**: `E-mail principal de atendimento`
3. Clicar em **"Salvar"**

### Resultado Esperado

✅ Dialog fecha  
✅ Mensagem de sucesso aparece  
✅ E-mail aparece na tabela com:
- E-mail: `atendimento@onegestao.com.br`
- Cliente: `Todos`
- Prioridade: `Normal` (badge cinza)
- Status: `Ativo` (badge verde)
- Verificado: ❌ (ainda não verificado no SES)

### Verificar no Banco

```bash
# No servidor
cd /var/www/fluxdesk/current
php artisan tinker
```

```php
\App\Models\TenantEmailAddress::all();

// Deve retornar:
// [
//   {
//     "id": 1,
//     "tenant_id": X,
//     "email": "atendimento@onegestao.com.br",
//     "purpose": "incoming",
//     "priority": "normal",
//     "client_filter": null,
//     "verified": false,
//     "active": true,
//     ...
//   }
// ]
```

---

## 🧪 Teste 3: Editar E-mail

### Passos

1. Na linha do e-mail cadastrado, clicar nos **3 pontos (⋮)**
2. Selecionar **"Editar"**
3. Alterar:
   - **Prioridade**: `Alta`
   - **Observações**: `E-mail principal - URGENTE`
4. Clicar em **"Salvar"**

### Resultado Esperado

✅ Dialog fecha  
✅ Mensagem de sucesso  
✅ Tabela atualiza mostrando:
- Prioridade: `Alta` (badge vermelho)
- Observações aparecem abaixo do e-mail

---

## 🧪 Teste 4: Desativar/Ativar E-mail

### Passos

1. Clicar nos **3 pontos (⋮)**
2. Selecionar **"Desativar"**
3. Aguardar atualização
4. Clicar novamente nos **3 pontos (⋮)**
5. Selecionar **"Ativar"**

### Resultado Esperado

✅ Status muda para `Inativo` (badge cinza)  
✅ Depois volta para `Ativo` (badge verde)

---

## 🧪 Teste 5: Enviar E-mail e Criar Ticket

### Pré-requisito

Configure o domínio no SES (veja `Setup/MAPEAR-EMAIL-CORPORATIVO.md`)

### Passos

1. De outro e-mail, envie para: `atendimento@onegestao.com.br`
2. **Assunto**: `Teste de abertura automática via interface`
3. **Corpo**: `Este é um teste do novo sistema de configuração de e-mails.`

### Aguardar Processamento

```bash
# Acompanhar logs
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

### Resultado Esperado nos Logs

```
✅ "Processando e-mail recebido"
✅ "E-mail encontrado no banco de dados"
✅ "Tenant identificado"
✅ "Ticket criado a partir de e-mail"
```

### Verificar Ticket no Sistema

1. Ir em **Tickets** no menu
2. Deve aparecer novo ticket:
   - **Título**: `Teste de abertura automática via interface`
   - **Descrição**: `Este é um teste do novo sistema...`
   - **Contato**: Remetente do e-mail
   - **Prioridade**: `Alta` (conforme configurado)
   - **Status**: `Aberto`

---

## 🧪 Teste 6: Cadastrar Múltiplos E-mails

### Passos

1. Adicionar segundo e-mail:
   - **E-mail**: `suporte@onegestao.com.br`
   - **Prioridade**: `Normal`

2. Adicionar terceiro e-mail:
   - **E-mail**: `urgente@onegestao.com.br`
   - **Prioridade**: `Alta`

### Resultado Esperado

✅ Tabela mostra 3 e-mails  
✅ Badge no contador da guia mostra "3"  
✅ Cada e-mail com sua configuração

### Testar E-mails Diferentes

Enviar e-mails para cada endereço e verificar que todos criam tickets.

---

## 🧪 Teste 7: Filtrar por Cliente

### Pré-requisito

Ter múltiplos clientes cadastrados.

### Passos

1. Adicionar e-mail específico:
   - **E-mail**: `cliente-especifico@onegestao.com.br`
   - **Cliente**: Selecionar um cliente específico
   - **Prioridade**: `Normal`

2. Enviar e-mail para este endereço

### Resultado Esperado

✅ Ticket criado  
✅ Ticket associado ao cliente correto  
✅ Outros e-mails continuam funcionando com "Todos"

---

## 🧪 Teste 8: Remover E-mail

### Passos

1. Clicar nos **3 pontos (⋮)** de um e-mail de teste
2. Selecionar **"Remover"**
3. Confirmar remoção

### Resultado Esperado

✅ E-mail removido da tabela  
✅ Contador atualizado  
✅ E-mails para este endereço **não** criarão mais tickets

---

## 🧪 Teste 9: E-mail Inativo

### Passos

1. Desativar um e-mail (ex: `urgente@onegestao.com.br`)
2. Enviar e-mail para este endereço

### Resultado Esperado

❌ Ticket **NÃO** é criado  
✅ Logs mostram: `"E-mail encontrado mas está inativo"`

---

## 🧪 Teste 10: Validação de Formulário

### Passos

1. Tentar adicionar e-mail sem preencher
2. Tentar adicionar e-mail inválido (sem @)
3. Tentar adicionar e-mail duplicado

### Resultado Esperado

✅ Mensagens de erro apropriadas  
✅ Formulário não envia  
✅ E-mail duplicado: "Este e-mail já está cadastrado"

---

## 📊 Checklist de Teste

- [ ] Interface abre corretamente
- [ ] Guias funcionam
- [ ] Adicionar e-mail funciona
- [ ] E-mail aparece na tabela
- [ ] Dados salvos no banco
- [ ] Editar e-mail funciona
- [ ] Ativar/desativar funciona
- [ ] Enviar e-mail cria ticket
- [ ] Prioridade configurada é aplicada
- [ ] Múltiplos e-mails funcionam
- [ ] Filtro por cliente funciona
- [ ] Remover e-mail funciona
- [ ] E-mail inativo não cria ticket
- [ ] Validações do formulário funcionam
- [ ] Contador de e-mails atualiza

---

## 🐛 Troubleshooting

### Interface não carrega

**Verificar:**
```bash
# Assets compilados?
ls -la /var/www/fluxdesk/current/public/build/

# Nginx rodando?
systemctl status nginx

# Erros no console do navegador?
```

### E-mail não aparece após salvar

**Verificar:**
```bash
# Erro na API?
tail -n 100 /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log

# Migration rodou?
php artisan migrate:status | grep tenant_email
```

### E-mail enviado mas não cria ticket

**Verificar:**
```bash
# E-mail está ativo?
# Logs do SES?
# Workers rodando?
sudo supervisorctl status

# Logs de processamento?
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

---

## ✅ Sucesso!

Se todos os testes passaram, a funcionalidade está 100% operacional! 🎉

**Próximos passos:**
1. Treinar usuários (veja `Setup/USO-CONFIGURACAO-EMAIL-UI.md`)
2. Configurar domínios no SES conforme necessário
3. Monitorar criação de tickets por e-mail

---

## 📚 Documentação Relacionada

- **Uso**: `Setup/USO-CONFIGURACAO-EMAIL-UI.md`
- **Mapeamento**: `Setup/MAPEAR-EMAIL-CORPORATIVO.md`
- **Encaminhamento**: `Setup/CONFIGURAR-ENCAMINHAMENTO-EMAIL.md`
- **AWS**: `Setup/AWS-INBOUND-CHECKLIST.md`
- **Implementação**: `Setup/IMPLEMENTACAO-EMAIL-UI.md`

