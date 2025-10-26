import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Settings, ArrowLeft, Edit, Mail, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/Components/ui/tabs';
import { User } from '@/types';

interface Props {
  user: User;
}

export default function Show({ user }: Props) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
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
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Inativo
      </Badge>
    );
  };

  const getTwoFactorBadge = (status?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success'> = {
      Ativo: 'success',
      Aguardando: 'default',
      Inativo: 'secondary',
    };

    return (
      <Badge variant={variants[status || 'Inativo']}>
        {status || 'Inativo'}
      </Badge>
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-600">Detalhes do usuário</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={route('settings.users.edit', user.id)}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <Head title={user.name} />

      <div className="space-y-6">
        <div>
          <Link href={route('settings.users.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="informacoes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>

          {/* Aba Informações */}
          <TabsContent value="informacoes" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Card Principal */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Dados Pessoais
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Informações básicas do usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Nome */}
                      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Nome completo</p>
                          <p className="text-lg font-semibold text-gray-900 mt-1">{user.name}</p>
                        </div>
                      </div>

                      {/* E-mail */}
                      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                          <Mail className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">E-mail</p>
                          <p className="text-lg font-semibold text-gray-900 mt-1">{user.email}</p>
                        </div>
                      </div>

                      {/* Tipo */}
                      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Tipo de usuário</p>
                          <div className="mt-1">{getRoleBadge(user.role)}</div>
                        </div>
                      </div>

                      {/* Data de criação */}
                      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Cadastrado em</p>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {formatDate(user.email_verified_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card Status */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-xl font-bold text-gray-900">Status</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Informações de acesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Status Ativo */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Status da conta</p>
                      {getStatusBadge(user.is_active)}
                    </div>

                    {/* 2FA */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Autenticação de dois fatores
                      </p>
                      {getTwoFactorBadge(user.two_factor_status)}
                    </div>

                    {/* Cliente */}
                    {user.client && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Cliente vinculado</p>
                        <Link href={route('clients.show', user.client.id)}>
                          <Button variant="outline" size="sm" className="w-full">
                            {user.client.name}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aba Atividades */}
          <TabsContent value="atividades">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Histórico de Atividades
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Ações recentes do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-sm font-medium text-gray-900">Nenhuma atividade registrada</p>
                  <p className="text-sm text-gray-500 mt-1">
                    O histórico de atividades será exibido aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
