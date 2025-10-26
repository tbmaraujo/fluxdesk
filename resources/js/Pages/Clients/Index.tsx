import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Plus, Search, Filter, X, MoreHorizontal, Building2, UserCheck, FolderOpen, UserX } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import {
  Card,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Client, PageProps } from '@/types';

interface PaginatedClients {
  data: Client[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Stats {
  total: number;
  with_contracts: number;
  with_contacts: number;
  without_contracts: number;
}

interface Filters {
  search?: string;
  filter?: string;
}

interface IndexProps extends PageProps {
  clients: PaginatedClients;
  stats: Stats;
  filters: Filters;
}

export default function ClientsIndex({
  auth,
  clients,
  stats,
  filters,
}: IndexProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [quickFilter, setQuickFilter] = useState(filters.filter || 'all');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params: Record<string, string> = {};
    if (value.trim()) {
      params.search = value.trim();
    }
    router.get(route('clients.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    setSearchTerm('');

    const params: Record<string, string> = {};
    if (filter !== 'all') {
      params.filter = filter;
    }

    router.get(route('clients.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (page: number) => {
    router.get(
      route('clients.index', {
        ...filters,
        page,
      }),
      {},
      {
        preserveState: true,
        preserveScroll: false,
      }
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setQuickFilter('all');
    router.get(route('clients.index'));
  };

  const hasActiveAdvancedFilters = false; // Sem filtros avançados por enquanto

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, clients.current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(clients.last_page, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === clients.current_page ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    return pages;
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Clientes" />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header com título e badge Online */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <Badge
            variant="outline"
            className="gap-1.5 border-green-200 bg-green-50 text-green-700"
          >
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </Badge>
        </div>

        {/* Cards de Resumo */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total de Clientes */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Com Contratos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Contratos</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{stats.with_contracts}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Com Contatos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Contatos</p>
                <p className="mt-1 text-3xl font-bold text-purple-600">{stats.with_contacts}</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Sem Contratos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Contratos</p>
                <p className="mt-1 text-3xl font-bold text-gray-600">{stats.without_contracts}</p>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <UserX className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros Rápidos e Barra de Busca */}
        <Card className="mb-6 border-none bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Filtros Rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtros Rápidos:</span>
              <Button
                variant={quickFilter === 'with_contracts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('with_contracts')}
                className={quickFilter === 'with_contracts' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Com Contratos ({stats.with_contracts})
              </Button>
              <Button
                variant={quickFilter === 'without_contracts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('without_contracts')}
                className={quickFilter === 'without_contracts' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                Sem Contratos ({stats.without_contracts})
              </Button>
              <Button
                variant={quickFilter === 'with_contacts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('with_contacts')}
                className={quickFilter === 'with_contacts' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Com Contatos ({stats.with_contacts})
              </Button>
              <Button
                variant={quickFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('all')}
              >
                Todos
              </Button>
            </div>

            {/* Barra de Busca e Ações */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {(searchTerm || quickFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              )}
              <Link href={route('clients.create')}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Tabela de Clientes */}
        <Card className="border-none bg-white shadow-sm">
          {/* Header da Tabela */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
              <p className="text-sm text-gray-500">
                Exibindo {clients.from || 0} de {clients.total} clientes
              </p>
            </div>
          </div>

          {/* Tabela */}
          {clients.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-gray-900">Nenhum cliente encontrado</h3>
              <p className="text-sm text-gray-500">Não há clientes cadastrados no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Razão Social</TableHead>
                    <TableHead className="font-semibold text-gray-700">Documento</TableHead>
                    <TableHead className="font-semibold text-gray-700">Local de Trabalho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.data.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                      onClick={() => router.visit(route('clients.show', client.id))}
                    >
                      <TableCell>
                        <div className="max-w-md">
                          <p className="truncate text-sm font-medium text-gray-900">{client.name}</p>
                          {client.trade_name && (
                            <p className="truncate text-xs text-gray-500">{client.trade_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {client.legal_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {client.document || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {client.workplace || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          {clients.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{clients.from}</span> a{' '}
                <span className="font-medium">{clients.to}</span> de{' '}
                <span className="font-medium">{clients.total}</span> resultados
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(clients.current_page - 1)}
                  disabled={clients.current_page === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {renderPageNumbers()}
                {clients.last_page > 5 && clients.current_page < clients.last_page - 2 && (
                  <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
                {clients.last_page > 5 && clients.current_page < clients.last_page - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(clients.last_page)}
                    className="h-8 w-8 p-0"
                  >
                    {clients.last_page}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(clients.current_page + 1)}
                  disabled={clients.current_page === clients.last_page}
                  className="h-8"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
