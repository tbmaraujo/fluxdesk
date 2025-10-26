import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Group } from '@/types';

interface Props {
  group: Group & { users_count?: number };
}

export default function Edit({ group }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: group.name || '',
    description: group.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('settings.groups.update', group.id));
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Grupo</h2>
            <p className="text-sm text-gray-600">Atualize os dados do grupo</p>
          </div>
        </div>
      }
    >
      <Head title={`Editar ${group.name}`} />

      <div className="space-y-6">
        <div>
          <Link href={route('settings.groups.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Informações do Grupo
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Atualize os dados conforme necessário
                  </CardDescription>
                </div>
                {group.users_count !== undefined && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {group.users_count} {group.users_count === 1 ? 'Usuário' : 'Usuários'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 gap-8">
                {/* Nome */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-gray-900">
                    Nome do Grupo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    placeholder="Ex: Suporte Técnico, Administrativo, etc."
                    className={`h-12 ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Descrição */}
                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold text-gray-900"
                  >
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                    placeholder="Descreva as responsabilidades e funções deste grupo..."
                    className={`min-h-[120px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-gray-600">
                    Explique qual o papel deste grupo no sistema
                  </p>
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Informação de usuários */}
                {group.users_count !== undefined && group.users_count > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Atenção:</strong> Este grupo possui{' '}
                      <strong>{group.users_count}</strong>{' '}
                      {group.users_count === 1 ? 'usuário associado' : 'usuários associados'}.
                      Alterações no nome ou descrição não afetarão os usuários existentes.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="mt-8 flex justify-end gap-2 border-t border-gray-100 pt-6">
                <Link href={route('settings.groups.index')}>
                  <Button type="button" variant="outline" size="lg">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="min-w-[180px]" disabled={processing}>
                  {processing ? 'Salvando...' : 'Atualizar Grupo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
