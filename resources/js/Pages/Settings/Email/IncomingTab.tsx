import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Plus, MoreVertical, Pencil, Trash2, Power, CheckCircle2, XCircle, Info, Mail } from 'lucide-react';
import EmailAddressDialog from './EmailAddressDialog';
import type { Client, TenantEmailAddress, Service, Priority } from '@/types';

interface IncomingTabProps {
    emailAddresses: TenantEmailAddress[];
    clients: Client[];
    services: Service[];
    priorities: Priority[];
}

export default function IncomingTab({ emailAddresses, clients, services, priorities }: IncomingTabProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEmail, setEditingEmail] = useState<TenantEmailAddress | null>(null);

    const handleEdit = (email: TenantEmailAddress) => {
        setEditingEmail(email);
        setDialogOpen(true);
    };

    const handleDelete = (id: number, email: string) => {
        if (confirm(`Tem certeza que deseja remover o e-mail ${email}?`)) {
            router.delete(route('settings.email.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const handleToggle = (id: number) => {
        router.post(
            route('settings.email.toggle', id),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const getPriorityName = (email: TenantEmailAddress) => {
        return (email.priority as any)?.name || 'Não definida';
    };

    const getServiceName = (email: TenantEmailAddress) => {
        return (email.service as any)?.name || 'Não definida';
    };

    const getClientName = (clientFilter: string | null) => {
        if (!clientFilter) return 'Todos';
        const client = clients.find(c => c.id.toString() === clientFilter);
        return client?.name || 'Desconhecido';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>E-mails de Recebimento</CardTitle>
                            <CardDescription>
                                Configure os e-mails que receberão tickets automaticamente
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingEmail(null);
                                setDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar E-mail
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {emailAddresses.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                Nenhum e-mail cadastrado
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Comece adicionando um e-mail para receber tickets
                            </p>
                            <div className="mt-6">
                                <Button
                                    onClick={() => {
                                        setEditingEmail(null);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar Primeiro E-mail
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>E-mail</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Mesa de Serviço</TableHead>
                                        <TableHead>Prioridade</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Verificado</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {emailAddresses.map(email => (
                                        <TableRow key={email.id}>
                                            <TableCell className="font-medium">
                                                {email.email}
                                                {email.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {email.notes}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>{getClientName(email.client_filter)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{getServiceName(email)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{getPriorityName(email)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={email.active ? 'success' : 'secondary'}>
                                                    {email.active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {email.verified ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-gray-300" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(email)}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggle(email.id)}
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {email.active ? 'Desativar' : 'Ativar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(email.id, email.email)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remover
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Importante:</strong> Para que o SES receba e-mails neste domínio, você precisa
                    verificar o domínio no console da AWS e criar uma Receipt Rule. Veja a documentação em{' '}
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">Setup/MAPEAR-EMAIL-CORPORATIVO.md</code>
                </AlertDescription>
            </Alert>

            <EmailAddressDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingEmail(null);
                }}
                email={editingEmail}
                clients={clients}
                services={services}
                priorities={priorities}
            />
        </div>
    );
}

