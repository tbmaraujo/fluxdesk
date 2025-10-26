# 🧭 Code Style Guide — Sincro8 Tickets

**Projeto:** Sistema de Chamados (substituto do TI FLUX)  
**Stack:** Laravel 11 + Inertia.js (React + TypeScript) + Tailwind CSS + shadcn/ui + PostgreSQL  
**Data:** Outubro 2025  

---

## ⚙️ Ferramentas de Padronização

### 🧩 PHP CS Fixer
Base **PSR-12**, com:
- `array_syntax: short`, `ordered_imports: alpha`
- `no_unused_imports`, `binary_operator_spaces`
- Uma linha entre métodos (`class_attributes_separation`)
- Trailing comma em arrays multilinha  

### 🧠 ESLint + Prettier
Extensões:  
`@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:import/errors|warnings`, `prettier`

Principais regras:
- `no-unused-vars`, `no-explicit-any`, `prefer-const`, `no-var`
- Imports ordenados alfabeticamente
- `react/react-in-jsx-scope: off`
- `react/prop-types: off`

**Prettier (.prettierrc):**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 🎨 Tailwind CSS
- Conteúdo: `resources/**/*.tsx|js|vue|blade.php`  
- Paleta `primary(50-900)`  
- Plugins: `@tailwindcss/forms`, `@tailwindcss/typography`

---

## 📦 Convenções de Código

| Elemento | Padrão | Exemplo |
|-----------|---------|---------|
| Arquivos PHP | `PascalCase` | `TicketController.php` |
| React Components | `PascalCase.tsx` | `TicketCard.tsx` |
| Variáveis/Funções | `camelCase` | `createTicket()` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAX_TICKETS` |
| Tipos/Interfaces | `PascalCase` | `TicketData` |
| Banco de Dados | `snake_case` | `ticket_replies` |

---

## 🗂 Estrutura do Projeto

```
app/ (Controllers, Models, Services)
database/ (migrations, seeders, factories)
resources/js (Components, Pages, Layouts, Types)
routes/
tests/
```

---

## 🧠 Padrões de Código

### 1. TypeScript Estrito
Sempre tipar parâmetros e retornos.  
Proibido `any`.

### 2. Validação
- **Frontend:** Zod (`createTicketSchema`)  
- **Backend:** Form Request (`CreateTicketRequest` com `required|string|in|exists`)

### 3. Tratamento de Erros
Capturar `axios` + `ZodError` e lançar mensagens amigáveis.  
Controllers devolvem respostas estruturadas com `try/catch`.

### 4. Componentes React
Usar props tipadas, `Badge` para prioridade, `Button` para ações.  
Sem `console.log`, `var` ou props não tipadas.

### 5. Inertia Pages
Importar `Head`, usar `<Button asChild>` e grid responsivo.

### 6. Imports
Separar **externos → internos → locais**, em ordem alfabética, com linhas em branco.

### 7. PHP
PSR-12 + classes com `namespace`, `$fillable` definido, casts para enums.

### 8. Controllers
CRUD limpo e orientado a Services:

```php
public function store(CreateTicketRequest $r) {
  $this->ticketService->createTicket($r->validated(), auth()->id());
  return redirect()->route('tickets.index')
    ->with('success','Chamado criado!');
}
```

---

## 🎨 Tailwind / shadcn/ui

Exemplo de layout:
```tsx
<div className="flex min-h-screen flex-col bg-gray-50">
  <header className="border-b bg-white px-6 py-4 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-900">Sistema de Chamados</h1>
  </header>
  <main className="flex-1 px-6 py-8">
    <div className="mx-auto max-w-7xl">{children}</div>
  </main>
</div>
```

---

## 🔧 Scripts

**package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint resources/js --ext .ts,.tsx --fix",
    "format": "prettier --write resources/js/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}
```

**composer.json**
```json
{
  "scripts": {
    "cs-fix": "php-cs-fixer fix",
    "cs-check": "php-cs-fixer fix --dry-run"
  }
}
```

---

## 🧾 Commits (Conventional)

```bash
feat(tickets): add auto-assignment
fix(auth): resolve JWT issue
style(ui): apply prettier format
docs(readme): update guide
test(api): add service tests
chore(deps): update laravel
```

❌ Evite mensagens genéricas como “update” ou “fix bug”.

---

## ✅ Boas Práticas

- Tipagem e validação em todas as camadas  
- Tratamento de erros consistente  
- Imports limpos e ordenados  
- Código formatado (Prettier + ESLint + CS Fixer)  
- Enums para `status` e `priority`  
- Eloquent e Services em vez de SQL cru  
- Commits convencionais e descritivos  

---

## ❌ Não Fazer

- `any`, funções sem tipo, `var`, `console.log`  
- Ignorar erros de lint ou formatação  
- Commits fora do padrão  
- Acesso direto a `$_GET/$_POST`  
- Falta de validação ou tipagem  

---

## 🧩 Exemplo Simplificado

**TicketService.ts**
```ts
export class TicketService {
  async create(data: CreateTicketRequest) {
    createTicketSchema.parse(data);
    await axios.post('/api/tickets', data);
  }
}
```

**TicketController.php**
```php
public function index(): Response {
  $tickets = $this->ticketService->getAllTickets();
  return Inertia::render('Tickets/Index', [
    'tickets' => TicketResource::collection($tickets)
  ]);
}
```

---

> **Este guia define o padrão oficial de desenvolvimento do sistema Sincro8 Tickets.  
> Todos os desenvolvedores e agentes IA devem segui-lo integralmente.**
