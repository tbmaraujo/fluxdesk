# 📘 Modalidade "Horas Cumulativas" - Documentação Técnica

**Sistema:** Sincro8 Tickets  
**Módulo:** Contratos  
**Versão:** 1.0  
**Data:** Outubro 2025  

---

## 📋 Índice

1. [Conceito](#conceito)
2. [Implementação Backend](#implementação-backend)
3. [Implementação Frontend](#implementação-frontend)
4. [Lógica de Negócio](#lógica-de-negócio)
5. [Exemplo Prático](#exemplo-prático)
6. [Regras de Acúmulo](#regras-de-acúmulo)
7. [Fluxo de Cálculo](#fluxo-de-cálculo)
8. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 Conceito

A modalidade **"Horas Cumulativas"** é uma evolução da modalidade **"Horas"** que adiciona a capacidade de **acumular (rollover)** horas não utilizadas para o próximo ciclo.

### Características Principais:

- ✅ Herda todos os campos da modalidade "Horas"
- ✅ Adiciona sistema de acúmulo (rollover) de horas não utilizadas
- ✅ Permite configurar janela de validade do acúmulo
- ✅ Permite configurar teto máximo de acúmulo
- ✅ **NÃO altera** a regra de cobrança de horas excedentes

### Diferença vs. Modalidade "Horas":

| Aspecto | Horas | Horas Cumulativas |
|---------|-------|-------------------|
| **Horas incluídas** | ✅ Sim | ✅ Sim |
| **Valor hora excedente** | ✅ Sim | ✅ Sim |
| **Acúmulo de horas** | ❌ Não | ✅ **Sim** |
| **Janela de validade** | ❌ Não | ✅ **Sim** |
| **Teto de acúmulo** | ❌ Não | ✅ **Sim** |
| **Cobrança de excedentes** | ✅ Sim | ✅ Sim (igual) |

---

## 🔧 Implementação Backend

### Migration

**Arquivo:** `2025_10_20_165232_add_rollover_fields_to_contracts_table.php`

```php
Schema::table('contracts', function (Blueprint $table) {
    // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
    $table->boolean('rollover_active')->default(false)->after('extra_ticket_value');
    $table->integer('rollover_days_window')->nullable()->after('rollover_active');
    $table->integer('rollover_hours_limit')->nullable()->after('rollover_days_window');
});
```

### Campos Adicionados:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `rollover_active` | boolean | Habilita/desabilita acúmulo | `true` |
| `rollover_days_window` | integer | Janela de validade em dias | `90` |
| `rollover_hours_limit` | integer | Teto máximo de horas | `40` |

### Model Contract

**Arquivo:** `app/Models/Contract.php`

```php
protected $fillable = [
    // ... outros campos
    'included_hours',
    'extra_hour_value',
    // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
    'rollover_active',
    'rollover_days_window',
    'rollover_hours_limit',
];

protected $casts = [
    // ... outros casts
    'rollover_active' => 'boolean',
];
```

---

## 🎨 Implementação Frontend

### Estrutura de Cards

Quando a modalidade "Horas Cumulativas" é selecionada, o sistema exibe **DOIS cards sequenciais**:

#### Card 1: Especificação do Contrato (Azul)

```tsx
<Card className="border border-primary/20 bg-primary/5 shadow-sm">
  <CardHeader>
    <CardTitle>Especificação do Contrato</CardTitle>
    <CardDescription>
      Configure os parâmetros de horas para contratos da modalidade "Horas Cumulativas".
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Horas por ciclo de fechamento */}
    {/* Valor da hora excedente */}
  </CardContent>
</Card>
```

#### Card 2: Configuração de Acúmulo (Roxo)

```tsx
<Card className="border border-purple-200 bg-purple-50 shadow-sm">
  <CardHeader>
    <CardTitle>Configuração de Acúmulo (Rollover)</CardTitle>
    <CardDescription>
      Configure como as horas não utilizadas serão acumuladas para o próximo ciclo.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Switch: Habilitar acúmulo de horas? */}
    {/* Campos condicionais (se rollover_active === true): */}
    {/*   - Janela de acúmulo (dias) */}
    {/*   - Teto de acúmulo (horas) */}
  </CardContent>
</Card>
```

### Campos do Formulário

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Horas por ciclo** | Input numérico | ✅ Sim | Horas incluídas no contrato |
| **Valor hora excedente** | Input numérico | ✅ Sim | Valor cobrado por hora extra |
| **Habilitar acúmulo** | Switch | ❌ Não | Ativa/desativa rollover |
| **Janela de acúmulo** | Input numérico | ⚠️ Se rollover ativo | Dias de validade |
| **Teto de acúmulo** | Input numérico | ⚠️ Se rollover ativo | Máximo de horas |

### Interfaces TypeScript

**Arquivo:** `resources/js/types/index.d.ts`

```typescript
export interface Contract {
  // ... outros campos
  included_hours?: string | null;
  extra_hour_value?: string | null;
  // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
  rollover_active?: boolean;
  rollover_days_window?: number | null;
  rollover_hours_limit?: number | null;
}
```

**Arquivo:** `resources/js/Pages/Contracts/ContractForm.tsx`

```typescript
export interface ContractFormData {
  // ... outros campos
  included_hours?: string;
  extra_hour_value?: string;
  // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
  rollover_active?: boolean;
  rollover_days_window?: string;
  rollover_hours_limit?: string;
}
```

---

## 💼 Lógica de Negócio

### ⚠️ IMPORTANTE: Cobrança de Excedentes

**O rollover NÃO elimina a cobrança de horas excedentes.**

O acúmulo apenas **aumenta o limite disponível**, mas se o cliente ultrapassar esse limite aumentado, **será cobrado normalmente**.

### Fórmula de Cálculo

```
Horas Disponíveis no Ciclo = Horas Incluídas (contrato) + Horas Acumuladas Válidas

SE (Horas Usadas > Horas Disponíveis):
    Horas Excedentes = Horas Usadas - Horas Disponíveis
    Cobrança Extra = Horas Excedentes × Valor Hora Excedente
    Horas a Acumular = 0
    
SE (Horas Usadas ≤ Horas Disponíveis):
    Horas Excedentes = 0
    Cobrança Extra = R$ 0,00
    Horas Sobrando = Horas Disponíveis - Horas Usadas
    
    SE (Horas Acumuladas Atuais + Horas Sobrando ≤ Teto de Acúmulo):
        Horas a Acumular = Horas Sobrando
    SENÃO:
        Horas a Acumular = Teto de Acúmulo - Horas Acumuladas Atuais
        Horas Perdidas = Horas Sobrando - Horas a Acumular
```

### Ordem de Consumo (FIFO)

As horas são consumidas na seguinte ordem:

1. **Primeiro:** Horas acumuladas mais antigas (FIFO - First In, First Out)
2. **Depois:** Horas incluídas do ciclo atual

**Exemplo:**
- Horas acumuladas de março: 5h
- Horas incluídas de abril: 40h
- Total disponível: 45h
- Usadas em abril: 35h

**Consumo:**
1. Consome 5h acumuladas (de março)
2. Consome 30h incluídas (de abril)
3. Sobram 10h incluídas (de abril) → acumuladas para maio

---

## 📊 Exemplo Prático

### Cenário do Contrato

- **Modalidade:** Horas Cumulativas
- **Horas por ciclo:** 40 horas/mês
- **Valor hora excedente:** R$ 150,00
- **Rollover ativo:** Sim
- **Janela de acúmulo:** 90 dias
- **Teto de acúmulo:** 40 horas

---

### 📅 Janeiro

| Item | Valor |
|------|-------|
| Horas incluídas | 40h |
| Horas acumuladas | 0h |
| **Total disponível** | **40h** |
| Horas usadas | 30h |
| Horas excedentes | 0h |
| **Cobrança extra** | **R$ 0,00** |
| Horas sobrando | 10h |
| **Acumula para fevereiro** | **10h** |

---

### 📅 Fevereiro

| Item | Valor |
|------|-------|
| Horas incluídas | 40h |
| Horas acumuladas (de janeiro) | 10h |
| **Total disponível** | **50h** |
| Horas usadas | 55h |
| Horas excedentes | 5h (55h - 50h) |
| **Cobrança extra** | **R$ 750,00** (5h × R$ 150) |
| Horas sobrando | 0h |
| **Acumula para março** | **0h** |

**Explicação:**
- Cliente tinha 50h disponíveis (40h + 10h acumuladas)
- Usou 55h
- As **5h excedentes são cobradas imediatamente**
- O acúmulo aumentou o limite, mas não eliminou a cobrança

---

### 📅 Março

| Item | Valor |
|------|-------|
| Horas incluídas | 40h |
| Horas acumuladas | 0h |
| **Total disponível** | **40h** |
| Horas usadas | 35h |
| Horas excedentes | 0h |
| **Cobrança extra** | **R$ 0,00** |
| Horas sobrando | 5h |
| **Acumula para abril** | **5h** |

---

### 📅 Abril

| Item | Valor |
|------|-------|
| Horas incluídas | 40h |
| Horas acumuladas (de março) | 5h |
| **Total disponível** | **45h** |
| Horas usadas | 35h |
| Horas excedentes | 0h |
| **Cobrança extra** | **R$ 0,00** |
| Horas sobrando | 10h |
| **Acumula para maio** | **10h** |

**Detalhamento do Consumo:**

| Origem | Disponível | Consumido | Sobrou |
|--------|------------|-----------|--------|
| Acumuladas (março) | 5h | 5h | 0h |
| Incluídas (abril) | 40h | 30h | 10h |
| **TOTAL** | **45h** | **35h** | **10h** |

**Explicação:**
- Consumiu primeiro as 5h acumuladas de março (FIFO)
- Depois consumiu 30h das incluídas de abril
- Sobraram 10h das incluídas de abril
- Essas 10h são acumuladas para maio

---

### 📅 Maio (Previsão)

| Item | Valor |
|------|-------|
| Horas incluídas | 40h |
| Horas acumuladas (de abril) | 10h |
| **Total disponível** | **50h** |

---

## 📏 Regras de Acúmulo

### 1. Janela de Validade

**Conceito:** Período em que as horas acumuladas ficam disponíveis.

**Exemplo:** Janela de 90 dias
- Horas acumuladas em **janeiro** expiram em **abril** (~90 dias)
- Horas acumuladas em **fevereiro** expiram em **maio** (~90 dias)

**Regra:**
```
Data de Expiração = Data de Acúmulo + Janela de Dias
```

**Importante:**
- Horas expiradas **não podem mais** ser utilizadas
- Horas expiradas são **automaticamente removidas** do saldo

---

### 2. Teto de Acúmulo

**Conceito:** Limite máximo de horas que podem ser acumuladas.

**Exemplo:** Teto de 40 horas

**Cenário 1 - Dentro do Teto:**
- Horas acumuladas atuais: 30h
- Horas sobrando no ciclo: 5h
- Total: 35h ≤ 40h ✅
- **Resultado:** Acumula as 5h

**Cenário 2 - Excede o Teto:**
- Horas acumuladas atuais: 38h
- Horas sobrando no ciclo: 10h
- Total: 48h > 40h ❌
- **Resultado:** Acumula apenas 2h (40h - 38h), perde 8h

**Regra:**
```
SE (Horas Acumuladas Atuais + Horas Sobrando > Teto):
    Acumular = Teto - Horas Acumuladas Atuais
    Perder = Horas Sobrando - Acumular
SENÃO:
    Acumular = Horas Sobrando
    Perder = 0
```

---

### 3. Prioridade de Uso (FIFO)

**Conceito:** First In, First Out - Primeiro a entrar, primeiro a sair.

**Regra:** Sempre usa primeiro as horas **mais antigas**.

**Exemplo:**

**Saldo em Maio:**
- 5h acumuladas de março (mais antigas)
- 10h acumuladas de abril (mais recentes)
- 40h incluídas de maio (atuais)
- **Total:** 55h disponíveis

**Cliente usa 20h em maio:**

**Consumo (FIFO):**
1. Consome 5h de março (mais antigas) → Restam 0h de março
2. Consome 10h de abril (próximas) → Restam 0h de abril
3. Consome 5h de maio (atuais) → Restam 35h de maio

**Resultado:**
- Horas acumuladas consumidas: 15h (5h + 10h)
- Horas incluídas consumidas: 5h
- Horas incluídas restantes: 35h

---

## 🔄 Fluxo de Cálculo

### Fluxograma Simplificado

```
INÍCIO DO CICLO
    ↓
Carregar Horas Incluídas (contrato)
    ↓
Carregar Horas Acumuladas Válidas (não expiradas)
    ↓
Calcular Total Disponível = Incluídas + Acumuladas
    ↓
Cliente usa X horas
    ↓
Consumir horas (FIFO: acumuladas → incluídas)
    ↓
X > Total Disponível?
    ├─ SIM → Calcular Excedente
    │         Cobrar Excedente
    │         Acumular = 0
    │
    └─ NÃO → Excedente = 0
              Calcular Sobra = Total Disponível - X
              Sobra + Acumuladas Atuais > Teto?
              ├─ SIM → Acumular até o Teto
              │         Perder o resto
              │
              └─ NÃO → Acumular toda a Sobra
    ↓
Registrar Acúmulo com Data de Validade
    ↓
FIM DO CICLO
```

---

## ❓ Perguntas Frequentes

### 1. O rollover elimina a cobrança de horas excedentes?

**❌ NÃO.** O rollover apenas aumenta o limite disponível. Se o cliente ultrapassar esse limite (incluindo as horas acumuladas), será cobrado normalmente.

**Exemplo:**
- Disponível: 50h (40h + 10h acumuladas)
- Usadas: 55h
- **Cobrança:** 5h excedentes × R$ 150 = **R$ 750,00**

---

### 2. As horas acumuladas ficam disponíveis para sempre?

**❌ NÃO.** As horas acumuladas têm uma **janela de validade** (ex: 90 dias). Após esse período, elas **expiram** e não podem mais ser utilizadas.

---

### 3. Posso acumular horas infinitamente?

**❌ NÃO.** Existe um **teto de acúmulo** (ex: 40 horas). Horas que excedem esse limite são **perdidas**.

---

### 4. Em que ordem as horas são consumidas?

**Ordem FIFO (First In, First Out):**
1. Horas acumuladas mais antigas
2. Horas acumuladas mais recentes
3. Horas incluídas do ciclo atual

---

### 5. O que acontece se eu desabilitar o rollover depois?

Se o rollover for **desabilitado**:
- Horas já acumuladas **permanecem válidas** até expirarem
- Novas horas **não serão mais acumuladas**
- O contrato volta a funcionar como modalidade "Horas" normal

---

### 6. Qual a diferença entre "Horas" e "Horas Cumulativas"?

| Aspecto | Horas | Horas Cumulativas |
|---------|-------|-------------------|
| **Horas não usadas** | Perdidas | Acumuladas |
| **Flexibilidade** | Baixa | Alta |
| **Cobrança de excedentes** | Sim | Sim (igual) |
| **Complexidade** | Simples | Média |

---

### 7. Como funciona o cálculo em meses com demanda variável?

**Exemplo:**

**Mês 1 (baixa demanda):**
- Usa 20h das 40h disponíveis
- Acumula 20h para o próximo mês

**Mês 2 (alta demanda):**
- Tem 60h disponíveis (40h + 20h acumuladas)
- Usa 58h
- Não paga excedente
- Acumula 2h para o próximo mês

**Benefício:** Flexibilidade para compensar meses de alta e baixa demanda.

---

## 🎯 Benefícios do Rollover

### Para o Cliente:

✅ **Evita desperdício** de horas pagas mas não utilizadas  
✅ **Flexibilidade** para meses com demanda variável  
✅ **Maior valor percebido** do contrato  
✅ **Planejamento** mais eficiente de recursos  

### Para o Fornecedor:

✅ **Diferencial competitivo** no mercado  
✅ **Fidelização** de clientes  
✅ **Controle** através do teto e janela de validade  
✅ **Transparência** nas regras de acúmulo  

---

## ⚠️ Limitações do Rollover

### O Que o Rollover NÃO Faz:

❌ Não elimina a cobrança de horas excedentes  
❌ Não permite acúmulo infinito (tem teto)  
❌ Não mantém horas acumuladas para sempre (tem janela de expiração)  
❌ Não altera o valor da hora excedente  

---

## 🔐 Validações Recomendadas

### Backend (Laravel):

```php
// Validação ao criar/editar contrato
$validated = $request->validate([
    'rollover_active' => 'boolean',
    'rollover_days_window' => 'nullable|integer|min:1|max:365',
    'rollover_hours_limit' => 'nullable|integer|min:1|max:1000',
]);

// Regra de negócio
if ($validated['rollover_active']) {
    if (empty($validated['rollover_days_window']) || empty($validated['rollover_hours_limit'])) {
        throw new ValidationException('Janela e teto são obrigatórios quando rollover está ativo');
    }
}
```

### Frontend (React):

```typescript
// Validação condicional
if (data.rollover_active) {
  if (!data.rollover_days_window || !data.rollover_hours_limit) {
    setError('rollover_days_window', 'Campo obrigatório quando rollover está ativo');
    setError('rollover_hours_limit', 'Campo obrigatório quando rollover está ativo');
    return;
  }
}
```

---

## 📝 Notas de Implementação

### Considerações Futuras:

1. **Relatórios:**
   - Criar relatório de horas acumuladas por cliente
   - Criar relatório de horas expiradas
   - Criar relatório de horas perdidas (excederam o teto)

2. **Notificações:**
   - Alertar cliente quando horas estão próximas de expirar
   - Alertar quando acúmulo está próximo do teto
   - Notificar quando horas expiram

3. **Dashboard:**
   - Exibir saldo de horas acumuladas
   - Exibir data de expiração das horas
   - Exibir histórico de acúmulos

4. **API:**
   - Endpoint para consultar saldo de horas
   - Endpoint para consultar histórico de acúmulos
   - Endpoint para consultar horas expiradas

---

## 📚 Referências

- **Migration:** `database/migrations/2025_10_20_165232_add_rollover_fields_to_contracts_table.php`
- **Model:** `app/Models/Contract.php`
- **Interface:** `resources/js/types/index.d.ts`
- **Formulário:** `resources/js/Pages/Contracts/ContractForm.tsx`
- **Página Create:** `resources/js/Pages/Contracts/Create.tsx`

---

## 📞 Suporte

Para dúvidas ou sugestões sobre a modalidade "Horas Cumulativas", entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** Outubro 2025  
**Versão do documento:** 1.0  
**Autor:** Sistema Sincro8 Tickets
