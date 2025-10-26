# 📚 Pré-Tickets e Autorizações

**Sistema:** Sincro8 Tickets  
**Versão:** 1.0  
**Data:** Outubro 2025  
**Baseado em:** TI FLUX

---

## 📑 Índice

1. [Pré-Tickets](#1-pré-tickets)
2. [Autorizações](#2-autorizações)
3. [Fluxos de Trabalho](#3-fluxos-de-trabalho)
4. [Status e Transições](#4-status-e-transições)
5. [Implementação Técnica](#5-implementação-técnica)

---

## 1. Pré-Tickets

### 🎯 O Que É

A **Caixa de Pré-tickets** funciona como uma **sala de triagem** ou **caixa de entrada** para todas as solicitações que chegam antes de se tornarem um ticket oficial.

**Analogia:** É como a recepção de um hospital - nem todo mundo que chega precisa ser internado, alguns só precisam de uma orientação.

### 🔍 Por Que Existe

Serve para **filtrar** o que realmente precisa virar um chamado oficial. 

**Benefícios:**
- ✅ Evita spam
- ✅ Remove e-mails irrelevantes
- ✅ Filtra perguntas simples
- ✅ Mantém a fila principal limpa
- ✅ Foca técnicos apenas em trabalho válido

### ⚙️ Como Funciona

#### **Entrada:**
As solicitações (geralmente e-mails) caem primeiro na **Caixa de Pré-tickets**.

#### **Triagem:**
Alguém (técnico ou gerente) revisa essa caixa periodicamente.

#### **Decisão:**
Para cada pré-ticket, o responsável decide:

1. **✅ Converter em Ticket**
   - Se for um trabalho real/válido
   - Transforma o pré-ticket em um chamado oficial
   - Pode ser anexado a um ticket existente
   - Status muda de `PRE_TICKET` → `OPEN`

2. **❌ Descartar**
   - Se for spam, irrelevante ou já resolvido
   - O pré-ticket é marcado como descartado
   - Status muda de `PRE_TICKET` → `CANCELED`
   - Não polui a fila principal

### 📊 Estatísticas

A tela de Pré-Tickets exibe:
- **Total de Pré-Tickets:** Quantidade aguardando triagem
- **Recebidos Hoje:** Novos pré-tickets de hoje
- **Recebidos esta Semana:** Últimos 7 dias
- **Recebidos este Mês:** Últimos 30 dias

### 🎯 Casos de Uso

**Exemplo 1: E-mail de Cliente**
```
De: cliente@empresa.com
Assunto: Sistema travando

→ PRÉ-TICKET criado automaticamente
→ Técnico revisa: É um problema real?
→ SIM: Converte em TICKET
→ Responsável é atribuído e trabalho começa
```

**Exemplo 2: Spam**
```
De: spam@marketing.com
Assunto: Compre nosso produto!

→ PRÉ-TICKET criado automaticamente
→ Técnico revisa: É trabalho válido?
→ NÃO: Descarta
→ Não consome tempo da equipe
```

---

## 2. Autorizações

### 🎯 O Que É

**Autorizações** é um mecanismo que exige **aprovação formal** de uma pessoa específica (gestor, cliente ou gerente) antes que uma determinada ação possa acontecer.

**Analogia:** É como pedir aprovação do gerente antes de fazer uma compra cara com o cartão da empresa.

### 🔍 Por Que Existe

Para controlar ações que:
- 💰 **Geram custos** (compra de equipamentos, peças)
- ⚠️ **Têm impacto maior** (formatação de servidor, mudança de infraestrutura)
- 📋 **Precisam de validação formal** (compliance, segurança, política)
- 🔒 **Requerem autorização do cliente** (trabalhos fora do escopo contratado)

### ⚙️ Como Funciona

#### **1. Início da Solicitação:**
Uma ação que requer autorização é iniciada (pode ser manual ou automática).

#### **2. Status Pendente:**
O ticket/solicitação fica com status `PENDING_AUTHORIZATION`.

#### **3. Notificação:**
A pessoa designada como **aprovador** é notificada.

#### **4. Análise:**
O aprovador revisa:
- Detalhes da solicitação
- Justificativa
- Impacto (custo, tempo, risco)
- Cliente/prioridade

#### **5. Decisão:**

**A) ✅ APROVAR:**
- O fluxo continua normalmente
- Ticket muda de `PENDING_AUTHORIZATION` → `OPEN`
- Trabalho pode ser executado
- Histórico registra quem aprovou e quando

**B) ❌ NEGAR:**
- O fluxo é interrompido
- Ticket muda de `PENDING_AUTHORIZATION` → `CANCELED`
- Trabalho NÃO é executado
- Histórico registra quem negou, quando e motivo (idealmente)

### 📊 Estatísticas

A tela de Autorizações exibe:
- **Total de Autorizações:** Quantidade aguardando aprovação
- **Recebidas Hoje:** Novas solicitações de hoje
- **Recebidas esta Semana:** Últimos 7 dias
- **Urgentes:** Solicitações com prioridade crítica

### 🎯 Casos de Uso

**Exemplo 1: Compra de Equipamento**
```
Ticket: "Notebook do colaborador queimou"
Solução proposta: Comprar notebook novo (R$ 4.500)

→ Status: PENDING_AUTHORIZATION
→ Notificação enviada ao Gerente TI
→ Gerente analisa: Tem verba? É urgente?
→ APROVA
→ Status: OPEN
→ Técnico procede com a compra
```

**Exemplo 2: Formatação de Servidor**
```
Ticket: "Servidor de produção com problemas"
Solução proposta: Formatar servidor (downtime de 4h)

→ Status: PENDING_AUTHORIZATION
→ Notificação enviada ao Cliente
→ Cliente analisa: Pode ter 4h de parada?
→ NEGA (não pode parar agora)
→ Status: CANCELED
→ Técnico busca solução alternativa
```

**Exemplo 3: Trabalho Fora do Escopo**
```
Ticket: "Preciso de um site novo"
Análise: Fora do escopo do contrato de suporte

→ Status: PENDING_AUTHORIZATION
→ Notificação enviada ao Gerente de Contas
→ Gerente analisa: Cliente vai pagar extra?
→ APROVA (cliente aceitou orçamento)
→ Status: OPEN
→ Trabalho é iniciado
```

### ✅ Benefício Principal

- 🎯 Garante **controle**
- 📋 Assegura **conformidade**
- 💰 Evita **custos inesperados**
- 🔒 Previne **trabalhos não autorizados**
- 📊 Cria **trilha de auditoria**

---

## 3. Fluxos de Trabalho

### 📈 Fluxo Completo: Pré-Ticket → Ticket

```
┌─────────────────┐
│   E-MAIL/FORM   │
│   Solicitação   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PRE_TICKET    │ ← Aguardando Triagem
│   (Status)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Análise │
    └────┬────┘
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌──────────┐    ┌──────────┐
│ CONVERTER│    │ DESCARTAR│
└─────┬────┘    └─────┬────┘
      │               │
      ▼               ▼
┌──────────┐    ┌──────────┐
│   OPEN   │    │ CANCELED │
└──────────┘    └──────────┘
```

### 📈 Fluxo Completo: Autorização

```
┌─────────────────┐
│ AÇÃO REQUERENDO │
│  AUTORIZAÇÃO    │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ PENDING_AUTHORIZATION│ ← Aguardando Aprovação
│      (Status)        │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │ Análise │
    │Aprovador│
    └────┬────┘
         │
    ┌────┴──────────┐
    │               │
    ▼               ▼
┌──────────┐    ┌──────────┐
│ AUTORIZAR│    │  NEGAR   │
└─────┬────┘    └─────┬────┘
      │               │
      ▼               ▼
┌──────────┐    ┌──────────┐
│   OPEN   │    │ CANCELED │
└──────────┘    └──────────┘
```

---

## 4. Status e Transições

### 📊 Status de Tickets no Sistema

| Status | Descrição | Cor/Ícone |
|--------|-----------|-----------|
| `PRE_TICKET` | Aguardando triagem | 🟡 Amarelo |
| `PENDING_AUTHORIZATION` | Aguardando autorização | 🟠 Laranja |
| `OPEN` | Aberto e pronto para trabalho | 🔵 Azul |
| `IN_PROGRESS` | Em andamento | 🟣 Roxo |
| `IN_REVIEW` | Em revisão | 🟤 Marrom |
| `CLOSED` | Fechado | 🟢 Verde |
| `CANCELED` | Cancelado/Descartado | 🔴 Vermelho |

### 🔄 Transições Permitidas

**De `PRE_TICKET` pode ir para:**
- ✅ `OPEN` (converter)
- ❌ `CANCELED` (descartar)

**De `PENDING_AUTHORIZATION` pode ir para:**
- ✅ `OPEN` (autorizar)
- ❌ `CANCELED` (negar)

**De `OPEN` pode ir para:**
- ➡️ `IN_PROGRESS` (iniciar trabalho)
- ⏸️ `PENDING_AUTHORIZATION` (precisa de aprovação para algo)
- ❌ `CANCELED` (cancelar ticket)

---

## 5. Implementação Técnica

### 🗄️ Banco de Dados

**Tabela:** `tickets`

**Coluna de Status:** `status` (string)

**Valores possíveis:**
```sql
'PRE_TICKET'
'PENDING_AUTHORIZATION'
'OPEN'
'IN_PROGRESS'
'IN_REVIEW'
'CLOSED'
'CANCELED'
```

### 🔧 Backend (Laravel)

#### **Controllers**

**TicketController.php:**

```php
// Lista pré-tickets
public function preTicketsIndex(Request $request)

// Converte pré-ticket em ticket
public function convertPreTicket(Ticket $ticket)

// Descarta pré-ticket
public function discardPreTicket(Ticket $ticket)

// Lista tickets pendentes de autorização
public function authorizationsIndex(Request $request)

// Autoriza ticket
public function authorizeTicket(Ticket $ticket)

// Nega autorização
public function denyAuthorization(Ticket $ticket)
```

#### **Rotas**

```php
// Pré-Tickets
GET  /tickets/pre-tickets          → preTicketsIndex
GET  /tickets/pre-tickets/export   → exportCsv
POST /tickets/{ticket}/convert     → convertPreTicket
POST /tickets/{ticket}/discard     → discardPreTicket

// Autorizações
GET  /tickets/authorizations        → authorizationsIndex
GET  /tickets/authorizations/export → exportCsv
POST /tickets/{ticket}/authorize    → authorizeTicket
POST /tickets/{ticket}/deny         → denyAuthorization
```

### 🎨 Frontend (React + TypeScript)

#### **Páginas**

**PreTickets.tsx:**
- Rota: `/tickets/pre-tickets`
- Cards: Total, Hoje, Semana, Mês
- Filtros: Cliente, Solicitante, Período
- Ações: Converter, Descartar
- Exportação: CSV

**Authorizations.tsx:**
- Rota: `/tickets/authorizations`
- Cards: Total, Hoje, Semana, Urgentes
- Filtros: Cliente, Solicitante, Período, Responsável
- Ações: Autorizar, Negar
- Exportação: CSV

### 📋 Exemplo de Uso das Ações

#### **Converter Pré-Ticket:**
```typescript
const handleConvert = (ticketId: number) => {
  router.post(route('tickets.convert', ticketId), {}, {
    onSuccess: () => {
      // Sucesso: Pré-ticket convertido em ticket
    }
  });
};
```

#### **Descartar Pré-Ticket:**
```typescript
const handleDiscard = (ticketId: number) => {
  if (confirm('Deseja realmente descartar este pré-ticket?')) {
    router.post(route('tickets.discard', ticketId), {}, {
      onSuccess: () => {
        // Sucesso: Pré-ticket descartado
      }
    });
  }
};
```

#### **Autorizar Ticket:**
```typescript
const handleAuthorize = (ticketId: number) => {
  router.post(route('tickets.authorize', ticketId), {}, {
    onSuccess: () => {
      // Sucesso: Ticket autorizado
    }
  });
};
```

#### **Negar Autorização:**
```typescript
const handleDeny = (ticketId: number) => {
  if (confirm('Deseja realmente negar esta autorização?')) {
    router.post(route('tickets.deny', ticketId), {}, {
      onSuccess: () => {
        // Sucesso: Autorização negada
      }
    });
  }
};
```

---

## 📝 Notas Importantes

### ⚠️ Permissões

- Apenas usuários com role `ADMIN` ou `TECHNICIAN` podem:
  - Converter/descartar pré-tickets
  - Autorizar/negar autorizações

### 📧 Notificações (Futuro)

Implementar notificações por e-mail/sistema quando:
- Novo pré-ticket é criado
- Autorização é solicitada
- Autorização é aprovada/negada
- Pré-ticket é convertido

### 📊 Relatórios (Futuro)

Métricas úteis:
- Taxa de conversão de pré-tickets
- Tempo médio de triagem
- Taxa de aprovação de autorizações
- Tempo médio de resposta de aprovadores

### 🔄 Histórico

Todas as ações devem ser registradas:
- Quem converteu/descartou
- Quem autorizou/negou
- Data e hora
- Motivo (opcional mas recomendado)

---

## 🎓 Treinamento da Equipe

### Para Técnicos (Pré-Tickets):

1. **Revisar diariamente** a caixa de pré-tickets
2. **Avaliar rapidamente** cada solicitação
3. **Converter** trabalhos válidos
4. **Descartar** spam e irrelevantes
5. **Não deixar acumular** - processar no máximo em 24h

### Para Aprovadores (Autorizações):

1. **Responder rapidamente** às solicitações
2. **Avaliar impacto** (custo, tempo, risco)
3. **Justificar decisão** quando negar
4. **Definir SLA** de resposta (ex: 4h para urgentes)

---

## 🔗 Referências

- [Guia TI FLUX - Pré-Tickets](https://guia-de-uso.tiflux.com/sistema/configuracoes/configuracoes-gerais/untitled/caixa-de-pre-tickets)
- [Guia TI FLUX - Autorizações](https://guia-de-uso.tiflux.com/sistema/configuracoes/importar/autorizacoes)

---

**Documento criado em:** 23 de Outubro de 2025  
**Última atualização:** 23 de Outubro de 2025  
**Versão:** 1.0
