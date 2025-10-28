# Implementação: Interface de Configuração de E-mails

## 🎯 Objetivo

Criar uma interface administrativa em **Configurações → Geral → E-mail** onde cada tenant pode cadastrar seus próprios e-mails corporativos para recebimento de tickets.

---

## ✅ Backend Completo

### 1. Migration
- ✅ `database/migrations/2025_10_28_000000_create_tenant_email_addresses_table.php`
- Tabela: `tenant_email_addresses`
- Campos: `email`, `purpose`, `priority`, `client_filter`, `verified`, `active`, `notes`

### 2. Model
- ✅ `app/Models/TenantEmailAddress.php`
- Scopes: `active()`, `incoming()`, `outgoing()`, `verified()`
- Relacionamentos: `tenant()`, `client()`

### 3. Controller
- ✅ `app/Http/Controllers/TenantEmailAddressController.php`
- Métodos:
  - `index()` - Listar e-mails
  - `store()` - Criar e-mail
  - `update()` - Atualizar e-mail
  - `destroy()` - Remover e-mail
  - `verify()` - Marcar como verificado
  - `toggle()` - Ativar/desativar

### 4. Form Request
- ✅ `app/Http/Requests/TenantEmailAddressRequest.php`
- Validação completa com mensagens PT-BR

### 5. Routes
- ✅ `routes/web.php` - Rotas em `settings.email.*`

### 6. Service Atualizado
- ✅ `app/Services/EmailInboundService.php`
- Busca e-mail no banco **antes** de tentar outros métodos
- Mantém compatibilidade com métodos antigos

---

## 🚧 Frontend Pendente

### Estrutura de Páginas

```
resources/js/Pages/Settings/Email/
├── Index.tsx                    # Página principal com guias
├── Tabs/
│   ├── GeneralTab.tsx          # Guia "Geral"
│   ├── IncomingTab.tsx         # Guia "Recebimento" ⭐ PRINCIPAL
│   ├── AuthorizationsTab.tsx   # Guia "Autorizações"
│   └── OutgoingTab.tsx         # Guia "Envio"
└── Components/
    ├── EmailAddressDialog.tsx  # Dialog adicionar/editar
    ├── EmailAddressTable.tsx   # Tabela de e-mails
    └── VerifyEmailBadge.tsx    # Badge de verificação
```

### 1. Página Principal (Index.tsx)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import GeneralTab from './Tabs/GeneralTab';
import IncomingTab from './Tabs/IncomingTab';
import AuthorizationsTab from './Tabs/AuthorizationsTab';
import OutgoingTab from './Tabs/OutgoingTab';

export default function EmailSettings({ 
  emailAddresses, 
  clients 
}: {
  emailAddresses: TenantEmailAddress[];
  clients: Client[];
}) {
  return (
    <AuthenticatedLayout>
      <Head title="Configurações de E-mail" />
      
      <div className="container mx-auto py-6">
        <h1>Configurações de E-mail</h1>
        
        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="recebimento">Recebimento</TabsTrigger>
            <TabsTrigger value="autorizacoes">Autorizações</TabsTrigger>
            <TabsTrigger value="envio">Envio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral">
            <GeneralTab />
          </TabsContent>
          
          <TabsContent value="recebimento">
            <IncomingTab 
              emailAddresses={emailAddresses}
              clients={clients}
            />
          </TabsContent>
          
          <TabsContent value="autorizacoes">
            <AuthorizationsTab />
          </TabsContent>
          
          <TabsContent value="envio">
            <OutgoingTab />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
```

### 2. Guia "Recebimento" (IncomingTab.tsx) ⭐ PRINCIPAL

Esta é a guia mais importante para resolver o problema do usuário.

```tsx
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Plus } from 'lucide-react';
import EmailAddressTable from '../Components/EmailAddressTable';
import EmailAddressDialog from '../Components/EmailAddressDialog';

export default function IncomingTab({ emailAddresses, clients }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  
  const incomingEmails = emailAddresses.filter(
    e => e.purpose === 'incoming' || e.purpose === 'both'
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>E-mails de Recebimento</CardTitle>
              <CardDescription>
                Configure os e-mails que receberão tickets por e-mail
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar E-mail
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EmailAddressTable 
            emails={incomingEmails}
            clients={clients}
            onEdit={(email) => {
              setEditingEmail(email);
              setDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>
      
      <EmailAddressDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEmail(null);
        }}
        email={editingEmail}
        clients={clients}
      />
    </div>
  );
}
```

### 3. Tabela de E-mails (EmailAddressTable.tsx)

```tsx
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface EmailAddressTableProps {
  emails: TenantEmailAddress[];
  clients: Client[];
  onEdit: (email: TenantEmailAddress) => void;
}

export default function EmailAddressTable({ 
  emails, 
  clients, 
  onEdit 
}: EmailAddressTableProps) {
  
  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover este e-mail?')) {
      router.delete(route('settings.email.destroy', id));
    }
  };
  
  const handleToggle = (id: number) => {
    router.post(route('settings.email.toggle', id));
  };
  
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th>E-mail</th>
            <th>Direcionar para a mesa</th>
            <th>Cliente</th>
            <th>Prioridade</th>
            <th>Verificado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {emails.map(email => (
            <tr key={email.id} className="border-b">
              <td>{email.email}</td>
              <td>{email.service_name || 'Solicitações'}</td>
              <td>{email.client_filter || 'Todos'}</td>
              <td>
                <Badge variant={
                  email.priority === 'high' ? 'destructive' : 'secondary'
                }>
                  {email.priority}
                </Badge>
              </td>
              <td>
                {email.verified ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <XCircle className="text-gray-400" />
                )}
              </td>
              <td className="space-x-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onEdit(email)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleToggle(email.id)}
                >
                  {email.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDelete(email.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4. Dialog Adicionar/Editar (EmailAddressDialog.tsx)

```tsx
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface EmailAddressDialogProps {
  open: boolean;
  onClose: () => void;
  email?: TenantEmailAddress | null;
  clients: Client[];
}

export default function EmailAddressDialog({
  open,
  onClose,
  email,
  clients,
}: EmailAddressDialogProps) {
  const { data, setData, post, put, processing, errors } = useForm({
    email: email?.email || '',
    purpose: email?.purpose || 'incoming',
    priority: email?.priority || 'normal',
    client_filter: email?.client_filter || '',
    notes: email?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email) {
      put(route('settings.email.update', email.id), {
        onSuccess: () => onClose(),
      });
    } else {
      post(route('settings.email.store'), {
        onSuccess: () => onClose(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {email ? 'Editar E-mail' : 'Adicionar E-mail'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              placeholder="atendimento@onegestao.com.br"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="client_filter">Cliente</Label>
            <Select
              value={data.client_filter}
              onValueChange={value => setData('client_filter', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={data.priority}
              onValueChange={value => setData('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📋 Passos para Implementação Frontend

1. ✅ Criar estrutura de pastas
2. ⏳ Criar `Index.tsx` com as guias
3. ⏳ Implementar `IncomingTab.tsx` (guia principal)
4. ⏳ Criar `EmailAddressTable.tsx`
5. ⏳ Criar `EmailAddressDialog.tsx`
6. ⏳ Criar `GeneralTab.tsx` (configurações básicas de e-mail)
7. ⏳ Criar `AuthorizationsTab.tsx` (placeholder por enquanto)
8. ⏳ Criar `OutgoingTab.tsx` (configurações de envio)
9. ⏳ Adicionar link no menu de configurações
10. ⏳ Testar fluxo completo

---

## 🧪 Teste Completo

### 1. Cadastrar E-mail via Interface

1. Fazer login no sistema
2. Ir em **Configurações → Geral → E-mail**
3. Clicar na guia **"Recebimento"**
4. Clicar em **"Adicionar E-mail"**
5. Preencher:
   - **E-mail**: `atendimento@onegestao.com.br`
   - **Cliente**: `Todos`
   - **Prioridade**: `Normal`
6. Clicar em **"Salvar"**

### 2. Verificar no Banco

```sql
SELECT * FROM tenant_email_addresses 
WHERE email = 'atendimento@onegestao.com.br';
```

Deve retornar:
```
id | tenant_id | email                         | purpose   | active
1  | 1         | atendimento@onegestao.com.br | incoming  | true
```

### 3. Enviar E-mail de Teste

Enviar e-mail para `atendimento@onegestao.com.br`

### 4. Verificar Logs

```bash
tail -f /var/www/fluxdesk/current/storage/logs/laravel-$(date +%Y-%m-%d).log
```

Procurar por:
```
✅ "E-mail encontrado no banco de dados"
✅ "Tenant identificado"
✅ "Ticket criado a partir de e-mail"
```

### 5. Verificar Ticket Criado

No sistema, verificar se o ticket foi criado com:
- **Contato**: Remetente do e-mail
- **Assunto**: Assunto do e-mail
- **Descrição**: Corpo do e-mail

---

## 🎯 Vantagens da Solução

✅ **Auto-serviço**: Cliente configura seus próprios e-mails  
✅ **Sem deploy**: Alterações não exigem deploy do código  
✅ **Flexível**: Suporta múltiplos e-mails por tenant  
✅ **Filtros**: Pode direcionar por cliente, prioridade, etc  
✅ **Auditável**: Histórico de quais e-mails estão configurados  
✅ **Escalável**: Cada tenant gerencia seus e-mails independentemente

---

## 📚 Tipos TypeScript

Adicionar em `resources/js/types/index.d.ts`:

```typescript
interface TenantEmailAddress {
  id: number;
  tenant_id: number;
  email: string;
  purpose: 'incoming' | 'outgoing' | 'both';
  priority: 'high' | 'normal' | 'low';
  client_filter: string | null;
  verified: boolean;
  verified_at: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  tenant?: Tenant;
  client?: Client;
}
```

---

## 🚀 Deploy Backend

```bash
# No servidor EC2
cd /var/www/fluxdesk/current

# Pull das alterações
git pull origin main

# Rodar migration
php artisan migrate --force

# Limpar cache
php artisan optimize:clear

# Restart workers
sudo supervisorctl restart fluxdesk-worker:*
```

---

## 📖 Documentação para o Usuário

Criar guia em `Setup/USO-CONFIGURACAO-EMAIL-UI.md` explicando:
1. Como acessar as configurações
2. Como cadastrar novo e-mail
3. Como configurar o SES para receber nesse domínio
4. Como testar

---

## Status Atual

- ✅ **Backend**: 100% completo
- ⏳ **Frontend**: 0% completo (estrutura planejada)
- ⏳ **Testes**: Pendente
- ⏳ **Documentação**: Pendente

---

Próximo passo: Implementar o frontend conforme planejado acima.

