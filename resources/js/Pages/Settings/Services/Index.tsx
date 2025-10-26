import { Head, Link, router } from '@inertiajs/react';
import {
  Settings,
  FileText,
  Plus,
  Search,
  Users,
  Clock,
  GitBranch,
  ChevronRight,
  AlertCircle,
  FolderKanban,
  HelpCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Service } from '@/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface IndexProps {
  services: Service[];
}

// Mapear ícones e cores por nome de mesa de serviço
const serviceIcons: Record<
  string,
  { icon: typeof AlertCircle; color: string; bgColor: string }
> = {
  Incidentes: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  Projetos: {
    icon: FolderKanban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  Solicitações: {
    icon: HelpCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
};

// Função para obter ícone de uma mesa de serviço
const getServiceIcon = (serviceName: string) => {
  return serviceIcons[serviceName] || {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  };
};

export default function ServicesIndex({ services }: IndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Filtrar e ordenar mesas de serviço
  const filteredServices = useMemo(() => {
    let filtered = services.filter((service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    if (sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'tickets') {
      filtered = filtered.sort((a, b) => (b.tickets_count || 0) - (a.tickets_count || 0));
    }

    return filtered;
  }, [services, searchTerm, sortBy]);

  return (
    <AuthenticatedLayout>
      <Head title="Mesas de Serviço" />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header com título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mesas de Serviço</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure as filas de atendimento e regras de negócio
          </p>
        </div>

        <div className="space-y-6">
        {/* Barra de busca e ações */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar mesa de serviço..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button disabled className="whitespace-nowrap" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
        </div>

        {/* Header das mesas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Mesas de Serviço Disponíveis
              </h2>
              <p className="text-sm text-gray-500">
                {filteredServices.length}{' '}
                {filteredServices.length === 1 ? 'mesa configurada' : 'mesas configuradas'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="tickets">Nº de Tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de cards de mesas de serviço */}
        {filteredServices.length > 0 ? (
          <div className="space-y-3">
            {filteredServices.map((service) => {
              const { icon: Icon, color, bgColor } = getServiceIcon(service.name);

              return (
                <Card
                  key={service.id}
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      {/* Ícone e informações principais */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColor}`}
                        >
                          <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {service.ticketType
                              ? service.ticketType.name
                              : 'Gerenciamento de atendimentos'}
                          </p>
                        </div>
                      </div>

                      {/* Badges e informações */}
                      <div className="flex items-center gap-6 shrink-0">
                        {/* Badges de status */}
                        <div className="flex gap-2 items-center">
                          {service.is_active && (
                            <Badge variant="success" className="text-xs h-6 flex items-center">
                              Ativo
                            </Badge>
                          )}
                          {service.badges &&
                            service.badges.map((badge, index) => (
                              <Badge
                                key={index}
                                variant={badge.variant as any}
                                className="text-xs h-6 flex items-center"
                              >
                                {badge.label}
                              </Badge>
                            ))}
                        </div>

                        {/* SLA */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap h-6">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="leading-none">{service.sla_info}</span>
                        </div>

                        {/* Estatísticas */}
                        <div className="text-right min-w-[120px]">
                          <p className="text-2xl font-bold text-gray-900">
                            {service.tickets_count || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.tickets_count === 1 ? 'ticket' : 'tickets'} este mês
                          </p>
                        </div>

                        {/* Botão configurar */}
                        <Link href={route('settings.services.edit', service.id)}>
                          <Button variant="outline" size="sm" className="whitespace-nowrap">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-900">
                Nenhuma mesa de serviço encontrada
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm
                  ? 'Tente ajustar os termos de busca'
                  : 'As mesas de serviço são criadas automaticamente pelo sistema.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cards de navegação rápida */}
        <div className="grid gap-4 md:grid-cols-3 pt-4">
          {/* Equipes */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Equipes</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Gerencie as equipes responsáveis por cada mesa de serviço
                  </p>
                  <Link href={route('settings.groups.index')}>
                    <Button variant="ghost" size="sm" className="mt-3 px-0">
                      Configurar Equipes
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLAs */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">SLAs</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure os acordos de nível de serviço para cada tipo de ticket
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3 px-0" disabled>
                    Configurar SLAs
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fluxos */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <GitBranch className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Fluxos</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Defina os fluxos de aprovação e escalamento automático
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3 px-0" disabled>
                    Configurar Fluxos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
