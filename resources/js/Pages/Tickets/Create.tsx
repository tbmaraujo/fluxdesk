import { Head, Link, useForm, router } from "@inertiajs/react";
import { FormEventHandler, PropsWithChildren, useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import TiptapEditor from "@/Components/TiptapEditor";
import {
    Card,
    CardContent,
} from "@/Components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import { PlusCircle, Save, X, Ticket as TicketIcon, Paperclip, FileText, ArrowLeft, User, Settings, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import axios from "axios";
import PhoneInput from 'react-phone-number-input';
import { Textarea } from "@/Components/ui/textarea";

interface Priority {
    id: number;
    name: string;
    response_sla_time: number;
    resolution_sla_time: number;
}

interface Service {
    id: number;
    name: string;
    priorities?: Priority[];
}

interface Ticket {
    id: number;
    title: string;
}

interface Contact {
    id: number;
    name: string;
    email: string;
    phone?: string;
    job_title?: string;
    contact_type?: string;
    client_id: number;
}

interface Client {
    id: number;
    name: string;
    contacts: Contact[];
}

export default function Create({
    auth,
    services,
    clients,
    potentialParentTickets,
}: PropsWithChildren<
    PageProps<{
        services: Service[];
        clients: Client[];
        potentialParentTickets: Ticket[];
    }>
>) {
    const [isNewRequesterDialogOpen, setIsNewRequesterDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientContacts, setClientContacts] = useState<Contact[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [availablePriorities, setAvailablePriorities] = useState<Priority[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        description: "",
        service_id: "",
        priority: "",
        parent_id: "",
        contact_id: "",
        client_id: "",
    });

    const {
        data: requesterData,
        setData: setRequesterData,
        post: postRequester,
        processing: requesterProcessing,
        errors: requesterErrors,
        reset: resetRequesterForm,
    } = useForm({
        name: "",
        email: "",
        phone: "",
        notes: "",
        client_id: "",
        password: "",
        password_confirmation: "",
    });

    // Quando o modal abrir, setar o client_id automaticamente
    useEffect(() => {
        if (isNewRequesterDialogOpen && selectedClient) {
            setRequesterData("client_id", selectedClient.id.toString());
        }
    }, [isNewRequesterDialogOpen, selectedClient]);

    // Atualizar prioridades disponíveis quando Mesa de Serviço mudar
    useEffect(() => {
        if (data.service_id) {
            const selectedService = services.find(s => s.id.toString() === data.service_id);
            if (selectedService && selectedService.priorities && selectedService.priorities.length > 0) {
                setAvailablePriorities(selectedService.priorities);
                // Limpar prioridade selecionada se não estiver na lista
                if (data.priority && !selectedService.priorities.find(p => p.name === data.priority)) {
                    setData('priority', '');
                }
            } else {
                setAvailablePriorities([]);
                setData('priority', '');
            }
        } else {
            setAvailablePriorities([]);
            setData('priority', '');
        }
    }, [data.service_id]);

    const handleClientChange = (clientId: string) => {
        setData("client_id", clientId);
        setData("contact_id", ""); // Limpar seleção de solicitante

        const client = clients.find((c) => c.id.toString() === clientId);
        setSelectedClient(client || null);

        if (client) {
            setRequesterData("client_id", clientId);
            
            // Se o cliente já tem contatos carregados
            if (client.contacts && client.contacts.length > 0) {
                setClientContacts(client.contacts);
            } else {
                // Buscar contatos via AJAX
                axios
                    .get(route("contacts.by-client"), {
                        params: { client_id: clientId },
                    })
                    .then((response) => {
                        setClientContacts(response.data.contacts || []);
                    })
                    .catch((error) => {
                        console.error("Erro ao buscar contatos:", error);
                        setClientContacts([]);
                    });
            }
        } else {
            setClientContacts([]);
        }
    };

    const submitTicket: FormEventHandler = (e) => {
        e.preventDefault();
        
        console.log('🚀 Iniciando submit do ticket...');
        console.log('📝 Dados do formulário:', {
            title: data.title,
            description: data.description?.substring(0, 50) + '...',
            service_id: data.service_id,
            priority: data.priority,
            parent_id: data.parent_id,
            contact_id: data.contact_id,
            attachments_count: attachments.length
        });
        
        // Validação básica no frontend
        if (!data.title || !data.description || !data.service_id || !data.priority || !data.contact_id) {
            console.error('❌ Campos obrigatórios não preenchidos');
            alert('Por favor, preencha todos os campos obrigatórios (Cliente, Solicitante, Mesa de Serviço, Prioridade, Título e Descrição)');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('service_id', data.service_id);
        formData.append('priority', data.priority);
        formData.append('parent_id', data.parent_id);
        formData.append('contact_id', data.contact_id);
        
        attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        console.log('📤 Enviando requisição para:', route("tickets.store"));
        
        router.post(route("tickets.store"), formData, {
            forceFormData: true,
            onSuccess: () => {
                console.log('✅ Ticket criado com sucesso!');
                reset();
                setAttachments([]);
            },
            onError: (errors) => {
                console.error('❌ Erro ao criar ticket:', errors);
                // Exibir todos os erros em um alert
                const errorMessages = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join('\n');
                alert('Erro ao criar ticket:\n\n' + errorMessages);
            },
            onFinish: () => {
                console.log('🏁 Requisição finalizada');
            }
        });
    };

    const submitNewRequester: FormEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Impedir propagação do evento

        // Prevenir duplo submit
        if (requesterProcessing) {
            return;
        }

        // Garantir que client_id está definido
        if (!requesterData.client_id) {
            alert("Erro: Selecione um cliente antes de criar o solicitante.");
            return;
        }

        postRequester(route("contacts.store"), {
            preserveScroll: true,
            onSuccess: () => {
                resetRequesterForm();
                setIsNewRequesterDialogOpen(false);

                if (selectedClient) {
                    axios
                        .get(route("contacts.by-client"), {
                            params: { client_id: selectedClient.id },
                        })
                        .then((response) => {
                            setClientContacts(response.data.contacts);

                            if (response.data.contacts.length > 0) {
                                const newContact =
                                    response.data.contacts[
                                        response.data.contacts.length - 1
                                    ];
                                setData("contact_id", newContact.id.toString());
                            }
                        })
                        .catch((error) => {
                            console.error("❌ Erro ao recarregar usuários:", error);
                        });
                }
            },
            onError: (errors) => {
                console.error("❌ Erros de validação ao criar solicitante:");
                console.error(errors);
                alert("Erro ao criar solicitante. Verifique o console para detalhes.");
            },
        });
    };

    const checkEmailAvailability = async (email: string) => {
        try {
            const response = await axios.post(route("contacts.check-email"), {
                email,
            });

            return response.data.available;
        } catch (error) {
            console.error("Error checking email availability:", error);
            return false;
        }
    };

    const handleEmailChange = async (email: string) => {
        setRequesterData("email", email);
        setIsEmailAvailable(null); // Reset

        if (email.length > 5 && email.includes("@")) {
            setIsCheckingEmail(true);
            const isAvailable = await checkEmailAvailability(email);
            setIsEmailAvailable(isAvailable);
            setIsCheckingEmail(false);
        } else {
            setIsEmailAvailable(null);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Novo Chamado" />

            <div className="min-h-screen bg-gray-50/50 p-6">
                {/* Header da Página */}
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(route('tickets.open.index'))}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">Novo Chamado</h1>
                                <Badge
                                    variant="outline"
                                    className="gap-1.5 border-green-200 bg-green-50 text-green-700"
                                >
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    Online
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Preencha os dados para abrir um novo chamado</p>
                        </div>
                    </div>
                </div>
                    <form onSubmit={submitTicket} className="pb-24">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* COLUNA ESQUERDA */}
                            <div className="space-y-6">
                                {/* Informações do Cliente */}
                                <Card>
                                    <div className="border-b border-gray-100 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">Informações do Cliente</h2>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client" className="text-sm font-medium text-gray-900">
                                                Cliente <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.client_id} onValueChange={handleClientChange}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Selecione um cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.client_id && (
                                                <p className="text-sm text-red-500">{errors.client_id}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="requester" className="text-sm font-medium text-gray-900">
                                                    Solicitante <span className="text-red-500">*</span>
                                                </Label>
                                                <Dialog
                                                    open={isNewRequesterDialogOpen}
                                                    onOpenChange={setIsNewRequesterDialogOpen}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1.5 text-sm"
                                                            disabled={!selectedClient}
                                                        >
                                                            <PlusCircle className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-lg">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Adicionar Novo Solicitante
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Preencha os dados do novo solicitante para o cliente{" "}
                                                                {selectedClient?.name}.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={submitNewRequester} className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-name">Nome</Label>
                                                                <Input
                                                                    id="requester-name"
                                                                    value={requesterData.name}
                                                                    onChange={(e) => setRequesterData("name", e.target.value)}
                                                                    placeholder="Nome completo"
                                                                    required
                                                                />
                                                                {requesterErrors.name && (
                                                                    <p className="text-sm text-red-500">{requesterErrors.name}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-email">Email</Label>
                                                                <Input
                                                                    id="requester-email"
                                                                    type="email"
                                                                    value={requesterData.email}
                                                                    onChange={(e) => handleEmailChange(e.target.value)}
                                                                    placeholder="email@exemplo.com"
                                                                    required
                                                                    className={isEmailAvailable === false ? 'border-red-500' : isEmailAvailable === true ? 'border-green-500' : ''}
                                                                />
                                                                {isCheckingEmail && (
                                                                    <p className="text-sm text-gray-500">Verificando disponibilidade...</p>
                                                                )}
                                                                {isEmailAvailable === false && (
                                                                    <p className="text-sm text-red-500 font-medium">
                                                                        ⚠️ Este email já está cadastrado no sistema. Por favor, use outro email.
                                                                    </p>
                                                                )}
                                                                {isEmailAvailable === true && (
                                                                    <p className="text-sm text-green-600 font-medium">
                                                                        ✓ Email disponível
                                                                    </p>
                                                                )}
                                                                {requesterErrors.email && (
                                                                    <p className="text-sm text-red-500">{requesterErrors.email}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-phone">Telefone</Label>
                                                                <PhoneInput
                                                                    id="requester-phone"
                                                                    international
                                                                    defaultCountry="BR"
                                                                    value={requesterData.phone}
                                                                    onChange={(value) => setRequesterData("phone", value || "")}
                                                                    placeholder="(00) 00000-0000"
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all"
                                                                />
                                                                {requesterErrors.phone && (
                                                                    <p className="text-sm text-red-500">{requesterErrors.phone}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-notes">Observação</Label>
                                                                <Textarea
                                                                    id="requester-notes"
                                                                    value={requesterData.notes}
                                                                    onChange={(e) => setRequesterData("notes", e.target.value)}
                                                                    placeholder="Informações adicionais sobre o solicitante..."
                                                                    rows={3}
                                                                    className="resize-none"
                                                                />
                                                                {requesterErrors.notes && (
                                                                    <p className="text-sm text-red-500">{requesterErrors.notes}</p>
                                                                )}
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => setIsNewRequesterDialogOpen(false)}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    disabled={requesterProcessing || isCheckingEmail || isEmailAvailable === false}
                                                                >
                                                                    {requesterProcessing ? "Salvando..." : 
                                                                     isCheckingEmail ? "Verificando..." :
                                                                     isEmailAvailable === false ? "Email já existe" :
                                                                     "Salvar"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <Select
                                                value={data.contact_id}
                                                onValueChange={(value) => setData("contact_id", value)}
                                                disabled={clientContacts.length === 0}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue
                                                        placeholder={
                                                            clientContacts.length === 0
                                                                ? "Selecione um cliente primeiro"
                                                                : "Selecione um solicitante"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clientContacts.map((contact) => (
                                                        <SelectItem key={contact.id} value={contact.id.toString()}>
                                                            {contact.name} ({contact.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.contact_id && (
                                                <p className="text-sm text-red-500">{errors.contact_id}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Configurações */}
                                <Card>
                                    <div className="border-b border-gray-100 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                                <Settings className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">Configurações</h2>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="service" className="text-sm font-medium text-gray-900">
                                                Mesa de Serviço <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.service_id}
                                                onValueChange={(value) => setData("service_id", value)}
                                                required
                                            >
                                                <SelectTrigger className="h-11" id="service">
                                                    <SelectValue placeholder="Selecione a mesa de serviço" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {services.map((service) => (
                                                        <SelectItem key={service.id} value={service.id.toString()}>
                                                            {service.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.service_id && (
                                                <p className="text-sm text-red-500">{errors.service_id}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-sm font-medium text-gray-900">
                                                Prioridade <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.priority}
                                                onValueChange={(value) => setData("priority", value)}
                                                required
                                            >
                                                <SelectTrigger className="h-11" id="priority">
                                                    <SelectValue placeholder="Selecione a prioridade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePriorities.length > 0 ? (
                                                        availablePriorities.map((priority) => (
                                                            <SelectItem key={priority.id} value={priority.name}>
                                                                {priority.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="px-2 py-6 text-center text-sm text-gray-500">
                                                            Selecione uma Mesa de Serviço primeiro
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.priority && (
                                                <p className="text-sm text-red-500">{errors.priority}</p>
                                            )}
                                        </div>

                                        {potentialParentTickets.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="parent" className="text-sm font-medium text-gray-900">
                                                    Ticket Pai <span className="text-gray-400 text-xs">(Opcional)</span>
                                                </Label>
                                                <Select
                                                    value={data.parent_id || ""}
                                                    onValueChange={(value) => setData("parent_id", value)}
                                                >
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Nenhum ticket pai" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {potentialParentTickets.map((ticket) => (
                                                            <SelectItem key={ticket.id} value={ticket.id.toString()}>
                                                                #{ticket.id} - {ticket.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.parent_id && (
                                                    <p className="text-sm text-red-500">{errors.parent_id}</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* COLUNA DIREITA */}
                            <div className="space-y-6">
                                {/* Detalhes do Problema */}
                                <Card>
                                    <div className="border-b border-gray-100 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">Detalhes do Problema</h2>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-sm font-medium text-gray-900">
                                                Título do Chamado <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                value={data.title}
                                                onChange={(e) => setData("title", e.target.value)}
                                                placeholder="Descreva o problema de forma resumida"
                                                required
                                                className="h-11"
                                            />
                                            {errors.title && (
                                                <p className="text-sm text-red-500">{errors.title}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                                                Descrição Detalhada <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="prose max-w-none">
                                                <TiptapEditor
                                            content={data.description}
                                            onChange={(content) => setData("description", content)}
                                            placeholder=""
                                        />
                                    </div>
                                    {errors.description && (
                                        <p className="text-sm text-red-500">{errors.description}</p>
                                    )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Informações Adicionais */}
                                <Card>
                                    <div className="border-b border-gray-100 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                                <Info className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">Informações Adicionais</h2>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Data de Abertura</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date().toLocaleDateString('pt-BR', { 
                                                        day: '2-digit', 
                                                        month: '2-digit', 
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Técnico Responsável</p>
                                                <p className="text-sm font-medium text-gray-900">{auth.user.name}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900 mb-1">Dica para um bom chamado</p>
                                                    <p className="text-sm text-blue-700 leading-relaxed">
                                                        Seja específico na descrição, inclua prints se necessário e mencione o impacto no negócio para priorização adequada.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>

                    {/* Botões Fixos na Parte Inferior */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={processing}
                                className="gap-2 h-11 px-6"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </Button>
                            <Button
                                disabled={processing}
                                onClick={() => {
                                    const form = document.querySelector("form");
                                    if (form) form.requestSubmit();
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-8"
                            >
                                <Save className="w-4 h-4" />
                                {processing ? "Criando..." : "Criar Chamado"}
                            </Button>
                        </div>
                    </div>
            </div>
        </AuthenticatedLayout>
    );
}
