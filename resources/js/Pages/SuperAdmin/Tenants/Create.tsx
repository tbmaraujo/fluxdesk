import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { ArrowLeft, Building2, User } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    company_name: '',
    company_cnpj: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  // Log de erros para debug
  if (Object.keys(errors).length > 0) {
    console.log('Erros de validação:', errors);
  }

  const handleSubmit: FormEventHandler = e => {
    e.preventDefault();
    
    console.log('Formulário submetido com dados:', data);
    
    post(route('superadmin.tenants.store'), {
      onSuccess: () => {
        console.log('Tenant criado com sucesso!');
      },
      onError: (errors) => {
        console.error('Erros de validação:', errors);
      },
      onFinish: () => {
        console.log('Requisição finalizada');
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-4">
          <Link href={route('superadmin.tenants.index')}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Criar Novo Tenant
          </h2>
        </div>
      }
    >
      <Head title="Criar Novo Tenant" />

      <div className="py-12">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Erro Global */}
              {(errors as any).error && (
                <Card className="border-red-500 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-red-800">
                      {(errors as any).error}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Informações do Tenant */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>Informações da Empresa</CardTitle>
                  </div>
                  <CardDescription>
                    Dados da empresa que será cadastrada na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">
                        Nome da Empresa <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        type="text"
                        value={data.company_name}
                        onChange={e =>
                          setData('company_name', e.target.value)
                        }
                        placeholder="Ex: Empresa ABC LTDA"
                        className={errors.company_name ? 'border-red-500' : ''}
                        required
                      />
                      {errors.company_name && (
                        <p className="text-sm text-red-500">
                          {errors.company_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Este será o nome principal do tenant na plataforma.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_cnpj">
                        CNPJ <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company_cnpj"
                        type="text"
                        value={data.company_cnpj}
                        onChange={e => setData('company_cnpj', e.target.value)}
                        placeholder="Ex: 12.345.678/0001-99"
                        className={errors.company_cnpj ? 'border-red-500' : ''}
                        required
                      />
                      {errors.company_cnpj && (
                        <p className="text-sm text-red-500">
                          {errors.company_cnpj}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        O CNPJ precisa ser único na plataforma. Um código numérico único será gerado automaticamente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Administrador */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Administrador do Tenant</CardTitle>
                  </div>
                  <CardDescription>
                    Dados do primeiro usuário administrador deste tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_name">
                      Nome do Administrador{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admin_name"
                      type="text"
                      value={data.admin_name}
                      onChange={e => setData('admin_name', e.target.value)}
                      placeholder="Ex: João Silva"
                      className={errors.admin_name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.admin_name && (
                      <p className="text-sm text-red-500">
                        {errors.admin_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">
                      Email do Administrador{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={data.admin_email}
                      onChange={e => setData('admin_email', e.target.value)}
                      placeholder="admin@empresaabc.com"
                      className={errors.admin_email ? 'border-red-500' : ''}
                      required
                    />
                    {errors.admin_email && (
                      <p className="text-sm text-red-500">
                        {errors.admin_email}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Este será o login do administrador no sistema.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password">
                      Senha Inicial <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admin_password"
                      type="password"
                      value={data.admin_password}
                      onChange={e =>
                        setData('admin_password', e.target.value)
                      }
                      placeholder="Mínimo de 8 caracteres"
                      className={errors.admin_password ? 'border-red-500' : ''}
                      required
                      minLength={8}
                    />
                    {errors.admin_password && (
                      <p className="text-sm text-red-500">
                        {errors.admin_password}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      O administrador poderá alterar a senha no primeiro
                      acesso.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={route('superadmin.tenants.index')}>
                      <Button variant="outline" type="button">
                        Cancelar
                      </Button>
                    </Link>
                    <Button type="submit" disabled={processing}>
                      {processing ? 'Criando...' : 'Criar Tenant'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
