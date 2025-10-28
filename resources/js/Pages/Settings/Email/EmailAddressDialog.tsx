import { useState, useEffect } from 'react';
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
import type { Client, TenantEmailAddress, Service, Priority } from '@/types';

interface EmailAddressDialogProps {
    open: boolean;
    onClose: () => void;
    email?: TenantEmailAddress | null;
    clients: Client[];
    services: Service[];
    priorities: Priority[];
}

export default function EmailAddressDialog({
    open,
    onClose,
    email,
    clients,
    services,
    priorities,
}: EmailAddressDialogProps) {
    const [filteredPriorities, setFilteredPriorities] = useState<Priority[]>([]);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        email: email?.email || '',
        purpose: email?.purpose || 'incoming',
        service_id: email?.service_id?.toString() || '',
        priority_id: email?.priority_id?.toString() || '',
        client_filter: email?.client_filter || 'all',
        notes: email?.notes || '',
    });

    // Filtrar prioridades quando mesa de serviço mudar
    useEffect(() => {
        if (data.service_id) {
            const filtered = priorities.filter(
                p => p.service_id.toString() === data.service_id
            );
            setFilteredPriorities(filtered);
            
            // Se a prioridade selecionada não pertence à mesa selecionada, limpar
            if (data.priority_id) {
                const priorityBelongsToService = filtered.some(
                    p => p.id.toString() === data.priority_id
                );
                if (!priorityBelongsToService) {
                    setData('priority_id', '');
                }
            }
        } else {
            setFilteredPriorities([]);
            setData('priority_id', '');
        }
    }, [data.service_id]);

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
            <DialogContent className="sm:max-w-[600px]">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service_id">
                                Mesa de Serviço <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.service_id}
                                onValueChange={value => setData('service_id', value)}
                            >
                                <SelectTrigger id="service_id">
                                    <SelectValue placeholder="Selecione a mesa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(service => (
                                        <SelectItem key={service.id} value={service.id.toString()}>
                                            {service.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.service_id && (
                                <p className="text-sm text-red-500">{errors.service_id}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Mesa padrão para tickets deste e-mail
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority_id">
                                Prioridade <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.priority_id}
                                onValueChange={value => setData('priority_id', value)}
                                disabled={!data.service_id}
                            >
                                <SelectTrigger id="priority_id">
                                    <SelectValue placeholder={data.service_id ? "Selecione a prioridade" : "Selecione a mesa primeiro"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredPriorities.map(priority => (
                                        <SelectItem key={priority.id} value={priority.id.toString()}>
                                            {priority.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.priority_id && (
                                <p className="text-sm text-red-500">{errors.priority_id}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Prioridade padrão dos tickets
                            </p>
                        </div>
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
