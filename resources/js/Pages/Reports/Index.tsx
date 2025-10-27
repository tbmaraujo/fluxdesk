import { Head } from '@inertiajs/react';
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';

interface Stats {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  active_contracts: number;
}

interface ReportsIndexProps {
  stats: Stats;
}

export default function ReportsIndex({ stats }: ReportsIndexProps) {
  const reportCategories = [
    {
      title: 'Relatórios de Tickets',
      description: 'Análises e estatísticas sobre tickets',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      reports: [
        {
          name: 'RAT - Relatório de Atendimento Técnico',
          description: 'Relatório detalhado de atendimentos realizados',
          href: '#',
          badge: 'Em desenvolvimento',
        },
        {
          name: 'Tickets por Status',
          description: 'Distribuição de tickets por status',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Tickets por Prioridade',
          description: 'Análise de tickets por nível de prioridade',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Tempo Médio de Resolução',
          description: 'Análise de SLA e tempo de atendimento',
          href: '#',
          badge: 'Em breve',
        },
      ],
    },
    {
      title: 'Relatórios de Produtividade',
      description: 'Performance e produtividade da equipe',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      reports: [
        {
          name: 'Desempenho por Técnico',
          description: 'Análise individual de produtividade',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Apontamentos de Horas',
          description: 'Consolidado de horas trabalhadas',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Taxa de Resolução no Primeiro Contato',
          description: 'FCR - First Contact Resolution',
          href: '#',
          badge: 'Em breve',
        },
      ],
    },
    {
      title: 'Relatórios de Contratos',
      description: 'Análises sobre contratos e consumo',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      reports: [
        {
          name: 'Consumo de Horas por Contrato',
          description: 'Saldo e consumo de horas contratadas',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Contratos Próximos ao Vencimento',
          description: 'Contratos que expiram nos próximos 30 dias',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Histórico de Aditivos',
          description: 'Relatório de aditivos contratuais',
          href: '#',
          badge: 'Em breve',
        },
      ],
    },
    {
      title: 'Relatórios Gerenciais',
      description: 'Visão executiva e dashboards',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      reports: [
        {
          name: 'Dashboard Executivo',
          description: 'Visão geral dos principais indicadores',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Relatório de Satisfação',
          description: 'Pesquisas e feedback dos clientes',
          href: '#',
          badge: 'Em breve',
        },
        {
          name: 'Análise de Tendências',
          description: 'Projeções e tendências de atendimento',
          href: '#',
          badge: 'Em breve',
        },
      ],
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Relatórios" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="mt-2 text-sm text-gray-600">
              Análises, estatísticas e relatórios gerenciais do sistema
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_tickets}</div>
                <p className="text-xs text-muted-foreground">Todos os tickets registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.open_tickets}</div>
                <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Fechados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.closed_tickets}</div>
                <p className="text-xs text-muted-foreground">Concluídos com sucesso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_contracts}</div>
                <p className="text-xs text-muted-foreground">Contratos vigentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Categories */}
          <div className="space-y-6">
            {reportCategories.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${category.bgColor}`}>
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {category.reports.map((report, reportIdx) => (
                      <div
                        key={reportIdx}
                        className="flex items-start justify-between rounded-lg border p-4 transition-all hover:border-gray-400 hover:shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{report.name}</h3>
                            {report.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {report.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8 px-2 text-xs"
                            disabled={report.badge !== undefined}
                          >
                            Gerar Relatório
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Novos Relatórios em Desenvolvimento</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Estamos trabalhando para disponibilizar novos relatórios e análises. Os relatórios
                    marcados como "Em breve" estarão disponíveis em atualizações futuras do sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

