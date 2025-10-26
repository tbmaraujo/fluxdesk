import { Button } from '@/Components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail, Lock, Chrome, Building2 } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Acessar conta" />

            <div className="flex min-h-screen">
                {/* Coluna Esquerda - Brand */}
                <div className="hidden w-full bg-gradient-to-br from-primary to-primary/80 lg:flex lg:w-1/2">
                    <div className="flex w-full flex-col items-center justify-center p-12 text-white">
                        <div className="flex flex-col items-center justify-center">
                            <div className="mb-8">
                                <ApplicationLogo className="h-20 w-auto fill-current" />
                            </div>
                            <h1 className="mb-4 text-center text-4xl font-bold">
                                Sistema de Chamados
                            </h1>
                            <p className="max-w-md text-center text-lg text-white/90">
                                Gestão profissional de tickets e suporte técnico para sua
                                empresa
                            </p>
                            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <div className="text-3xl font-bold">24/7</div>
                                    <div className="text-sm text-white/80">Disponibilidade</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">100%</div>
                                    <div className="text-sm text-white/80">Seguro</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">∞</div>
                                    <div className="text-sm text-white/80">Multi-tenant</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita - Formulário */}
                <div className="flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="space-y-1 text-center">
                            <div className="mx-auto mb-4 lg:hidden">
                                <ApplicationLogo className="h-12 w-auto fill-current text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                Acessar conta
                            </CardTitle>
                            <CardDescription>
                                Digite suas credenciais para continuar
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {status && (
                                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                {/* Campo E-mail */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="pl-10"
                                            autoComplete="username"
                                            autoFocus
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                {/* Campo Senha */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Senha</Label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Esqueci minha senha
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className="pl-10"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                {/* Checkbox Manter Conectado */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked: boolean) =>
                                            setData('remember', checked)
                                        }
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-normal text-gray-600"
                                    >
                                        Mantenha-me conectado
                                    </Label>
                                </div>

                                {/* Botão Principal */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={processing}
                                >
                                    {processing ? 'Entrando...' : 'Acessar conta'}
                                </Button>

                                {/* Separador */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">
                                            ou acessar com
                                        </span>
                                    </div>
                                </div>

                                {/* Botões de Login Social */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled
                                    >
                                        <Chrome className="mr-2 h-4 w-4" />
                                        Google
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled
                                    >
                                        <Building2 className="mr-2 h-4 w-4" />
                                        Microsoft
                                    </Button>
                                </div>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-2">
                            <Separator />
                            <p className="text-center text-sm text-gray-600">
                                Não tem uma conta?{' '}
                                <a
                                    href="#"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Saiba mais...
                                </a>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
