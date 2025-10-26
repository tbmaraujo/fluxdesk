import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Users, Plus, Search, Edit as EditIcon, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Group } from '@/types';
import { useState, FormEventHandler } from 'react';

interface Props {
  groups: {
    data: (Group & { users_count?: number })[];
    links: any;
    meta: any;
  };
  filters: {
    search?: string;
  };
}

export default function Index({ groups, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch: FormEventHandler = e => {
    e.preventDefault();
    router.get(
      route('settings.groups.index'),
      { search },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  const handleDelete = (group: Group & { users_count?: number }) => {
    if (group.users_count && group.users_count > 0) {
      alert(
        `Não é possível excluir este grupo pois há ${group.users_count} usuário(s) associado(s).`
      );
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      router.delete(route('settings.groups.destroy', group.id));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Grupos</h1>
          </div>
        </div>
      }
    >
      <Head title="Grupos" />

      <div className="space-y-6">
        {/* Barra de ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar grupos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </form>

          <Link href={route('settings.groups.create')}>
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              Novo Grupo
            </Button>
          </Link>
        </div>

        {/* Tabela de Grupos */}
        <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-xl font-bold text-gray-900">
              Lista de Grupos ({groups.meta?.total || groups.data.length})
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Gerencie os grupos de atendimento do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {groups.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/80">
                    <TableHead className="font-semibold">Nome do Grupo</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold text-center">Usuários</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.data.map(group => (
                    <TableRow key={group.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="font-medium text-gray-900">{group.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {group.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-medium">
                          {group.users_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={route('settings.groups.edit', group.id)}>
                            <Button variant="outline" size="sm">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Nenhum grupo encontrado
                </h3>
                <p className="mb-6 text-center text-sm text-gray-600">
                  {search
                    ? 'Tente ajustar sua pesquisa'
                    : 'Comece criando seu primeiro grupo de atendimento'}
                </p>
                {!search && (
                  <Link href={route('settings.groups.create')}>
                    <Button>
                      <Plus className="mr-2 h-5 w-5" />
                      Criar Primeiro Grupo
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {groups.data.length > 0 && groups.links && groups.links.length > 3 && (
          <div className="flex items-center justify-center gap-2">
            {groups.links.map((link: any, index: number) => (
              <Button
                key={index}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                onClick={() => link.url && router.get(link.url)}
                disabled={!link.url}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
