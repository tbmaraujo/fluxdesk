import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { User } from '@/types';
import { useState } from 'react';
import {
  Settings,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Badge } from '@/Components/ui/badge';

interface Props {
  users: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    search?: string;
  };
}

export default function Index({ users, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      route('settings.users.index'),
      { search },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleDelete = (user: User) => {
    if (
      confirm(
        `Tem certeza que deseja remover o usuário "${user.name}"?`
      )
    ) {
      router.delete(route('settings.users.destroy', user.id));
    }
  };

  const getRoleBadge = (role?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
      ADMIN: 'destructive',
      TECHNICIAN: 'default',
      CLIENT: 'secondary',
    };

    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      TECHNICIAN: 'Técnico',
      CLIENT: 'Cliente',
    };

    return (
      <Badge variant={variants[role || 'CLIENT'] || 'secondary'}>
        {labels[role || 'CLIENT'] || role}
      </Badge>
    );
  };

  const getStatusBadge = (isActive?: boolean) => {
    return isActive ? (
      <Badge variant="success">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const getTwoFactorBadge = (status?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success'> = {
      Ativo: 'success',
      Aguardando: 'default',
      Inativo: 'secondary',
    };

    return <Badge variant={variants[status || 'Inativo']}>{status || 'Inativo'}</Badge>;
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Usuários</h1>
          </div>
        </div>
      }
    >
      <Head title="Usuários" />

      <div className="space-y-6">
        {/* Barra de busca e ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>

          <Link href={route('settings.users.create')}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Usuário
            </Button>
          </Link>
        </div>

        {/* Tabela de usuários */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-white">
                <TableHead>Nome</TableHead>
                <TableHead>Grupos de permissões</TableHead>
                <TableHead>Grupos de atendentes</TableHead>
                <TableHead>Licenças</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">
                  Autenticação de dois fatores
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.length > 0 ? (
                users.data.map((user) => (
                  <TableRow
                    key={user.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-500">-</TableCell>
                    <TableCell className="text-gray-500">-</TableCell>
                    <TableCell className="text-gray-500">-</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-center">
                      {getTwoFactorBadge(user.two_factor_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(user.is_active)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.visit(route('settings.users.edit', user.id))
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-gray-500"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {users.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {users.data.length} de {users.total} usuário(s)
            </p>
            <div className="flex gap-2">
              {Array.from({ length: users.last_page }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === users.current_page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      router.get(route('settings.users.index', { page, search }))
                    }
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
