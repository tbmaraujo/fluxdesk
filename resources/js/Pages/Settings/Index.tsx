import { Head, Link } from '@inertiajs/react';
import {
  Settings,
  Users,
  DollarSign,
  FileText,
  Wrench,
  ChevronRight,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/Components/ui/accordion';

export default function SettingsIndex() {
  const menuItems = [
    {
      group: 'Geral',
      icon: Settings,
      items: [
        { name: 'Dados da empresa', href: '#', description: 'Informações básicas' },
        { name: 'Personalização', href: '#', description: 'Logo e cores' },
        { name: 'E-mail', href: route('settings.email.index'), description: 'Configurações de e-mail' },
      ],
    },
    {
      group: 'Mesa de serviço',
      icon: Wrench,
      items: [
        {
          name: 'Mesas de Serviço',
          href: route('settings.services.index'),
          description: 'Configure as mesas de serviço',
        },
        { name: 'Prioridades', href: '#', description: 'Níveis de prioridade' },
        { name: 'Status', href: '#', description: 'Estados dos tickets' },
      ],
    },
    {
      group: 'Usuários',
      icon: Users,
      items: [
        {
          name: 'Usuários',
          href: route('settings.users.index'),
          description: 'Gerencie os usuários do sistema',
        },
        { name: 'Perfis', href: '#', description: 'Permissões e acessos' },
        {
          name: 'Grupos',
          href: route('settings.groups.index'),
          description: 'Organização de equipes',
        },
      ],
    },
    {
      group: 'Recurso',
      icon: FileText,
      items: [
        { name: 'Campos customizados', href: '#', description: 'Personalize formulários' },
        { name: 'Modelos de e-mail', href: '#', description: 'Templates de notificação' },
      ],
    },
    {
      group: 'Financeiro',
      icon: DollarSign,
      items: [
        {
          name: 'Tipos de Contrato',
          href: route('settings.contract-types.index'),
          description: 'Gerencie tipos de contrato',
        },
        { name: 'Formas de pagamento', href: '#', description: 'Métodos aceitos' },
      ],
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Configurações" />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-green-200 bg-green-50 text-green-700"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">Gerencie as configurações do sistema</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda: Accordion com menus */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Opções de Configuração</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Selecione uma categoria para gerenciar suas configurações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {menuItems.map((menu, index) => (
                    <AccordionItem 
                      key={menu.group} 
                      value={menu.group}
                      className="rounded-lg border border-gray-100 bg-white overflow-hidden"
                    >
                      <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            menu.group === 'Geral' ? 'bg-blue-100' :
                            menu.group === 'Mesa de serviço' ? 'bg-purple-100' :
                            menu.group === 'Usuários' ? 'bg-green-100' :
                            menu.group === 'Recurso' ? 'bg-orange-100' :
                            'bg-amber-100'
                          }`}>
                            <menu.icon className={`h-5 w-5 ${
                              menu.group === 'Geral' ? 'text-blue-600' :
                              menu.group === 'Mesa de serviço' ? 'text-purple-600' :
                              menu.group === 'Usuários' ? 'text-green-600' :
                              menu.group === 'Recurso' ? 'text-orange-600' :
                              'text-amber-600'
                            }`} />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-semibold text-gray-900">{menu.group}</span>
                            <p className="text-xs text-gray-500">{menu.items.length} {menu.items.length === 1 ? 'opção' : 'opções'}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-2 pt-2">
                          {menu.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="group block rounded-lg border border-gray-100 bg-white p-3 transition-all hover:bg-gray-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Card de resumo */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Resumo do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Versão do Sistema</p>
                          <h3 className="text-3xl font-bold text-gray-900">1.0.0</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Usuários Ativos</p>
                          <h3 className="text-3xl font-bold text-gray-900">--</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Mesas de Serviço</p>
                          <h3 className="text-3xl font-bold text-gray-900">--</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Wrench className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Tipos de Contrato</p>
                          <h3 className="text-3xl font-bold text-gray-900">--</h3>
                        </div>
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}