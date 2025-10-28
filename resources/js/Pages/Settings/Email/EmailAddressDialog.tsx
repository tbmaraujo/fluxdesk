import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import type { Client, TenantEmailAddress } from '@/types';

interface EmailAddressDialogProps {
    open: boolean;
    onClose: () => void;
    email?: TenantEmailAddress | null;
    clients: Client[];
}

export default function EmailAddressDialog({
    open,
    onClose,
    email,
    clients,
}: EmailAddressDialogProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        email: email?.email || '',
        purpose: email?.purpose || 'incoming',
        priority: email?.priority || 'normal',
        client_filter: email?.client_filter || 'all',
        notes: email?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
            // Converter "all" para null antes de enviar
            transform: (formData: any) => ({
                ...formData,
                client_filter: formData.client_filter === 'all' ? null : formData.client_filter,
            }),
        };

        if (email) {
            put(route('settings.email.update', email.id), options);
        } else {
            post(route('settings.email.store'), options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {email ? 'Editar E-mail' : 'Adicionar E-mail'}
                    </DialogTitle>
                    <DialogDescription>
                        {email
                            ? 'Atualize as informações do e-mail de recebimento'
                            : 'Configure um novo e-mail para receber tickets automaticamente'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            E-mail <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="atendimento@empresa.com.br"
                            disabled={!!email} // Não permite editar e-mail existente
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                        {!email && (
                            <p className="text-xs text-gray-500">
                                Exemplo: atendimento@onegestao.com.br
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client_filter">Cliente</Label>
                        <Select
                            value={data.client_filter}
                            onValueChange={value => setData('client_filter', value)}
                        >
                            <SelectTrigger id="client_filter">
                                <SelectValue placeholder="Todos os clientes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os clientes</SelectItem>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Filtre tickets deste e-mail para um cliente específico
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <Select
                            value={data.priority}
                            onValueChange={value => setData('priority', value as 'high' | 'normal' | 'low')}
                        >
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Prioridade padrão dos tickets criados por este e-mail
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            value={data.notes || ''}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder="Notas internas sobre este e-mail..."
                            rows={3}
                        />
                        {errors.notes && (
                            <p className="text-sm text-red-500">{errors.notes}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

