import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Plus, Search, Filter, X, MoreHorizontal, CheckCircle2, XCircle, Calendar, TrendingUp } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import {
  Card,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Contract, ContractType, Client, PageProps } from '@/types';
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters';

interface PaginatedContracts {
  data: Contract[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  upcoming_renewals: number;
}

interface Filters {
  search?: string;
  status?: string;
  contract_type_id?: string;
  client_id?: string;
  show_expired?: boolean;
}

interface IndexProps extends PageProps {
  contracts: PaginatedContracts;
  stats: Stats;
  contractTypes: ContractType[];
  clients: Client[];
  filters: Filters;
}

const statusVariantMap: Record<string, 'success' | 'secondary'> = {
  Ativo: 'success',
  Inativo: 'secondary',
};

export default function ContractsIndex({
  auth,
  contracts,
  stats,
  contractTypes,
  clients,
  filters,
}: IndexProps) {
  // Helper para obter activeVersion aceando camelCase ou snake_case
  const getActiveVersion = (contract: Contract) => {
    return contract.activeVersion || (contract as any).active_version;
  };

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [quickFilter, setQuickFilter] = useState(filters.status || 'all');

  // Estados para filtros avançados (modais)
  const [showClientFilter, setShowClientFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const [selectedClient, setSelectedClient] = useState(filters.client_id || 'all');
  const [selectedType, setSelectedType] = useState(filters.contract_type_id || 'all');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params: Record<string, string> = {};
    if (value.trim()) {
      params.search = value.trim();
    }
    router.get(route('contracts.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    setSearchTerm('');

    const params: Record<string, string> = {};
    if (filter !== 'all') {
      params.status = filter;
    }

    router.get(route('contracts.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (page: number) => {
    router.get(
      route('contracts.index', {
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

  const handleApplyClientFilter = () => {
    const params: Record<string, string> = {};
    if (selectedClient !== 'all') {
      params.client_id = selectedClient;
    }
    router.get(route('contracts.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
    setShowClientFilter(false);
  };

  const handleApplyTypeFilter = () => {
    const params: Record<string, string> = {};
    if (selectedType !== 'all') {
      params.contract_type_id = selectedType;
    }
    router.get(route('contracts.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
    setShowTypeFilter(false);
  };

  const handleClearFilters = () => {
    setSelectedClient('all');
    setSelectedType('all');
    setSearchTerm('');
    setQuickFilter('all');
    router.get(route('contracts.index'));
  };

  const hasActiveAdvancedFilters = selectedClient !== 'all' || selectedType !== 'all';

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, contracts.current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(contracts.last_page, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === contracts.current_page ? 'default' : 'outline'}
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
      <Head title="Contratos" />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header com título e badge Online */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
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
          {/* Total de Contratos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Contratos</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Contratos Ativos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Próximos Reajustes */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximos Reajustes</p>
                <p className="mt-1 text-3xl font-bold text-orange-600">{stats.upcoming_renewals}</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Contratos Inativos */}
          <Card className="border-none bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="mt-1 text-3xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <XCircle className="h-6 w-6 text-gray-600" />
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
                variant={quickFilter === 'Ativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('Ativo')}
                className={quickFilter === 'Ativo' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Ativos ({stats.active})
              </Button>
              <Button
                variant={quickFilter === 'Inativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter('Inativo')}
                className={quickFilter === 'Inativo' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                Inativos ({stats.inactive})
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
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    {hasActiveAdvancedFilters && (
                      <Badge variant="default" className="ml-1 h-5 px-1 text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowClientFilter(true)}>
                    Por cliente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTypeFilter(true)}>
                    Por tipo
                  </DropdownMenuItem>
                  {hasActiveAdvancedFilters && (
                    <>
                      <DropdownMenuItem className="border-t" onClick={handleClearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href={route('contracts.create')}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Contrato
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Tabela de Contratos */}
        <Card className="border-none bg-white shadow-sm">
          {/* Header da Tabela */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Contratos</h2>
              <p className="text-sm text-gray-500">
                Exibindo {contracts.from || 0} de {contracts.total} contratos
              </p>
            </div>
          </div>

          {/* Tabela */}
          {contracts.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-gray-900">Nenhum contrato encontrado</h3>
              <p className="text-sm text-gray-500">Não há contratos cadastrados no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Reajuste</TableHead>
                    <TableHead className="font-semibold text-gray-700">Expiração</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.data.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                      onClick={() => router.visit(route('contracts.show', contract.id))}
                    >
                      <TableCell>
                        <div className="max-w-md">
                          <p className="truncate text-sm font-medium text-gray-900">{contract.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {contract.client?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariantMap[getActiveVersion(contract)?.status ?? 'Ativo'] ?? 'secondary'
                          }
                        >
                          {getActiveVersion(contract)?.status ?? 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {contract.contractType?.name ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {getActiveVersion(contract)?.renewal_date
                          ? formatDateBR(getActiveVersion(contract)!.renewal_date)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {getActiveVersion(contract)?.expiration_term ?? 'Indeterminado'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-gray-900">
                        {formatCurrencyBRL(Number(getActiveVersion(contract)?.monthly_value ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          {contracts.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{contracts.from}</span> a{' '}
                <span className="font-medium">{contracts.to}</span> de{' '}
                <span className="font-medium">{contracts.total}</span> resultados
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(contracts.current_page - 1)}
                  disabled={contracts.current_page === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {renderPageNumbers()}
                {contracts.last_page > 5 && contracts.current_page < contracts.last_page - 2 && (
                  <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
                {contracts.last_page > 5 && contracts.current_page < contracts.last_page - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(contracts.last_page)}
                    className="h-8 w-8 p-0"
                  >
                    {contracts.last_page}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(contracts.current_page + 1)}
                  disabled={contracts.current_page === contracts.last_page}
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

      {/* Modal de Filtro por Cliente */}
      <Dialog open={showClientFilter} onOpenChange={setShowClientFilter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Cliente</DialogTitle>
            <DialogDescription>Selecione um cliente para filtrar os contratos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientFilter(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyClientFilter}>Aplicar Filtro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtro por Tipo */}
      <Dialog open={showTypeFilter} onOpenChange={setShowTypeFilter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Tipo de Contrato</DialogTitle>
            <DialogDescription>Selecione um tipo para filtrar os contratos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Contrato</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeFilter(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyTypeFilter}>Aplicar Filtro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
