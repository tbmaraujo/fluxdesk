import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { User, Group } from '@/types';

interface Props {
  user: User;
  availableGroups: Group[];
}

export default function Edit({ user, availableGroups }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name || '',
    email: user.email || '',
    password: '',
    password_confirmation: '',
    group_ids: user.groups?.map(g => g.id) || [],
    is_active: user.is_active ?? true,
    two_factor_status: user.two_factor_status || 'Inativo',
  });

  const handleGroupToggle = (groupId: number) => {
    const currentGroups = data.group_ids || [];
    if (currentGroups.includes(groupId)) {
      setData('group_ids', currentGroups.filter(id => id !== groupId));
    } else {
      setData('group_ids', [...currentGroups, groupId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('settings.users.update', user.id));
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Usuário</h2>
            <p className="text-sm text-gray-600">Atualize os dados do usuário</p>
          </div>
        </div>
      }
    >
      <Head title={`Editar ${user.name}`} />

      <div className="space-y-6">
        <div>
          <Link href={route('settings.users.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl font-bold text-gray-900">
                Informações do Usuário
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Atualize os dados conforme necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Nome */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-gray-900">
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Digite o nome completo"
                    className={`h-12 ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* E-mail */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold text-gray-900">
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Digite o e-mail"
                    className={`h-12 ${errors.email ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base font-semibold text-gray-900">
                    Nova senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Deixe em branco para manter a senha atual"
                    className={`h-12 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-gray-600">
                    Preencha apenas se deseja alterar a senha
                  </p>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-3">
                  <Label
                    htmlFor="password_confirmation"
                    className="text-base font-semibold text-gray-900"
                  >
                    Confirmar nova senha
                  </Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="h-12"
                    disabled={!data.password}
                  />
                </div>

                {/* Grupos */}
                <div className="space-y-3 lg:col-span-2">
                  <Label className="text-base font-semibold text-gray-900">
                    Grupos de Atendimento
                  </Label>
                  <p className="text-sm text-gray-600">
                    Selecione os grupos aos quais este usuário pertence
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {availableGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                      >
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={data.group_ids?.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {group.name}
                          </label>
                          {group.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.group_ids && (
                    <p className="text-sm text-red-600">{errors.group_ids}</p>
                  )}
                </div>

                {/* Autenticação de dois fatores */}
                <div className="space-y-3">
                  <Label
                    htmlFor="two_factor_status"
                    className="text-base font-semibold text-gray-900"
                  >
                    Autenticação de dois fatores
                  </Label>
                  <Select
                    value={data.two_factor_status}
                    onValueChange={(value) => setData('two_factor_status', value)}
                  >
                    <SelectTrigger id="two_factor_status" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Aguardando">Aguardando</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Ativo/Inativo */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active" className="text-base font-semibold text-gray-900">
                        Status do usuário
                      </Label>
                      <p className="text-sm text-gray-600">
                        Usuário {data.is_active ? 'ativo' : 'inativo'} no sistema
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={data.is_active}
                      onCheckedChange={(checked) => setData('is_active', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="mt-8 flex justify-end gap-2 border-t border-gray-100 pt-6">
                <Link href={route('settings.users.index')}>
                  <Button type="button" variant="outline" size="lg">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="min-w-[180px]" disabled={processing}>
                  {processing ? 'Salvando...' : 'Atualizar Usuário'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
