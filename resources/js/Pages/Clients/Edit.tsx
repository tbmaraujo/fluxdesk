import { Head, useForm, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { Client, User } from '@/types';

interface Props {
  client: Client;
}

export default function Edit({ client }: Props) {
  const { auth } = usePage().props as { auth: { user: User } };
  const { data, setData, put, processing, errors } = useForm({
    name: client.name,
    trade_name: client.trade_name || '',
    legal_name: client.legal_name || '',
    document: client.document || '',
    state_registration: client.state_registration || '',
    municipal_registration: client.municipal_registration || '',
    workplace: client.workplace || '',
    notes: client.notes || '',
    visible_to_clients: client.visible_to_clients ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('clients.update', client.id));
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
        </div>
      }
    >
      <Head title={`Editar: ${client.name}`} />

      <div className="py-8">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            <Card className="rounded-2xl shadow-sm backdrop-blur-sm">
              <CardHeader className="p-6 md:p-8">
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>Atualize os dados cadastrais do cliente</CardDescription>
              </CardHeader>
              <Separator className="bg-gray-100" />
              <CardContent className="p-6 md:p-8">
                <div className="space-y-6">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="mt-1"
                      required
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Grid: Nome Fantasia e Razão Social */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="trade_name">Nome Fantasia</Label>
                      <Input
                        id="trade_name"
                        value={data.trade_name}
                        onChange={(e) => setData('trade_name', e.target.value)}
                        className="mt-1"
                      />
                      {errors.trade_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.trade_name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="legal_name">Razão Social</Label>
                      <Input
                        id="legal_name"
                        value={data.legal_name}
                        onChange={(e) => setData('legal_name', e.target.value)}
                        className="mt-1"
                      />
                      {errors.legal_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.legal_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Grid: CNPJ e Inscrições */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <Label htmlFor="document">CPF/CNPJ</Label>
                      <Input
                        id="document"
                        value={data.document}
                        onChange={(e) => setData('document', e.target.value)}
                        className="mt-1"
                      />
                      {errors.document && (
                        <p className="mt-1 text-sm text-red-600">{errors.document}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state_registration">Inscrição Estadual</Label>
                      <Input
                        id="state_registration"
                        value={data.state_registration}
                        onChange={(e) => setData('state_registration', e.target.value)}
                        className="mt-1"
                      />
                      {errors.state_registration && (
                        <p className="mt-1 text-sm text-red-600">{errors.state_registration}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="municipal_registration">Inscrição Municipal</Label>
                      <Input
                        id="municipal_registration"
                        value={data.municipal_registration}
                        onChange={(e) => setData('municipal_registration', e.target.value)}
                        className="mt-1"
                      />
                      {errors.municipal_registration && (
                        <p className="mt-1 text-sm text-red-600">{errors.municipal_registration}</p>
                      )}
                    </div>
                  </div>

                  {/* Ponto de Trabalho */}
                  <div>
                    <Label htmlFor="workplace">Ponto de Trabalho</Label>
                    <Input
                      id="workplace"
                      value={data.workplace}
                      onChange={(e) => setData('workplace', e.target.value)}
                      className="mt-1"
                    />
                    {errors.workplace && (
                      <p className="mt-1 text-sm text-red-600">{errors.workplace}</p>
                    )}
                  </div>

                  {/* Anotações */}
                  <div>
                    <Label htmlFor="notes">Anotações</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                    {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                  </div>

                  {/* Switch: Visível para clientes (apenas super admins) */}
                  {auth.user?.is_super_admin && (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <Label htmlFor="visible_to_clients" className="text-base">
                          Visível para clientes
                        </Label>
                        <p className="text-sm text-gray-500">
                          Cliente poderá visualizar informações no portal
                        </p>
                      </div>
                      <Switch
                        id="visible_to_clients"
                        checked={data.visible_to_clients ?? false}
                        onCheckedChange={(checked: boolean) => setData('visible_to_clients', checked)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="mt-6 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
