import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Building2, Plus, Users, Power, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Tenant {
  id: number;
  name: string;
  cnpj: string | null;
  slug: string;
  domain: string | null;
  is_active: boolean;
  users_count: number;
  created_at: string;
}

interface Props {
  tenants: Tenant[];
}

export default function Index({ tenants }: Props) {
  const handleToggleStatus = (tenant: Tenant) => {
    if (
      confirm(
        `Deseja ${tenant.is_active ? 'desativar' : 'ativar'} o tenant "${tenant.name}"?`
      )
    ) {
      router.patch(route('superadmin.tenants.status', tenant.id));
    }
  };

  const handleDelete = (tenant: Tenant) => {
    if (
      confirm(
        `Tem certeza que deseja remover o tenant "${tenant.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      router.delete(route('superadmin.tenants.destroy', tenant.id));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Gestão de Tenants
          </h2>
          <Link href={route('superadmin.tenants.create')}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novo Tenant
            </Button>
          </Link>
        </div>
      }
    >
      <Head title="Gestão de Tenants" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Tenants
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <Power className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.filter(t => t.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.reduce((sum, t) => sum + t.users_count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenants Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tenants</CardTitle>
              <CardDescription>
                Gerencie todas as empresas cadastradas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Nenhum tenant cadastrado
                  </h3>
                  <p className="mb-4 text-sm text-gray-500">
                    Comece criando o primeiro tenant da plataforma.
                  </p>
                  <Link href={route('superadmin.tenants.create')}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Tenant
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          CNPJ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Usuários
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {tenants.map(tenant => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center">
                              <Building2 className="mr-3 h-5 w-5 text-gray-400" />
                              <div className="font-medium text-gray-900">
                                {tenant.name}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {tenant.cnpj ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {tenant.slug}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {tenant.users_count}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <Badge
                              variant={
                                tenant.is_active ? 'success' : 'secondary'
                              }
                            >
                              {tenant.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {format(
                              new Date(tenant.created_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(tenant)}
                                className="gap-1"
                              >
                                <Power className="h-3 w-3" />
                                {tenant.is_active ? 'Desativar' : 'Ativar'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(tenant)}
                                className="gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
