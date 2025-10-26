import { Head, Link, useForm, router } from "@inertiajs/react";
import { FormEventHandler, PropsWithChildren, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Separator } from "@/Components/ui/separator";
import TiptapEditor from "@/Components/TiptapEditor";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { PlusCircle, Save, X, Ticket as TicketIcon, Paperclip, FileText } from "lucide-react";
import axios from "axios";

interface Service {
    id: number;
    name: string;
}

interface Ticket {
    id: number;
    title: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    client_id: number;
}

interface Client {
    id: number;
    name: string;
    users: User[];
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
    const [isNewRequesterDialogOpen, setIsNewRequesterDialogOpen] =
        useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientUsers, setClientUsers] = useState<User[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        description: "",
        service_id: "",
        priority: "MEDIUM",
        parent_id: "",
        user_id: auth.user.id.toString(),
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
        client_id: "",
    });

    const handleClientChange = (clientId: string) => {
        setData("client_id", clientId);

        const client = clients.find((c) => c.id.toString() === clientId);
        setSelectedClient(client || null);

        if (client && client.users && client.users.length > 0) {
            setClientUsers(client.users);
        } else {
            setClientUsers([]);
        }

        if (client) {
            setRequesterData("client_id", clientId);
        }
    };

    const submitTicket: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Criar FormData manualmente
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('service_id', data.service_id);
        formData.append('priority', data.priority);
        formData.append('parent_id', data.parent_id);
        formData.append('user_id', data.user_id);
        
        // Adicionar anexos
        attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        // Usar router.post diretamente
        router.post(route("tickets.store"), formData, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setAttachments([]);
            },
        });
    };

    const submitNewRequester: FormEventHandler = (e) => {
        e.preventDefault();

        postRequester(route("users.store"), {
            preserveScroll: true,
            onSuccess: () => {
                resetRequesterForm();
                setIsNewRequesterDialogOpen(false);

                if (selectedClient) {
                    axios
                        .get(route("users.by-client"), {
                            params: { client_id: selectedClient.id },
                        })
                        .then((response) => {
                            setClientUsers(response.data.users);

                            if (response.data.users.length > 0) {
                                const newUser =
                                    response.data.users[
                                        response.data.users.length - 1
                                    ];
                                setData("user_id", newUser.id.toString());
                            }
                        });
                }
            },
        });
    };

    const checkEmailAvailability = async (email: string) => {
        try {
            const response = await axios.post(route("users.check-email"), {
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

        if (email.length > 5 && email.includes("@")) {
            const isAvailable = await checkEmailAvailability(email);
            if (!isAvailable) {
                console.log("Email já está em uso");
            }
        }
    };

    return (
        <AuthenticatedLayout title="Novo Chamado">
            <Head title="Novo Chamado" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="w-full py-6 px-6">
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href={route("tickets.index")}
                                    className="text-gray-500 hover:text-primary transition-colors"
                                >
                                    Tickets
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-gray-900 font-medium">
                                    Novo Chamado
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="mb-8 flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                            <TicketIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Novo Chamado
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Crie um novo ticket e defina os detalhes
                                iniciais.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submitTicket} className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
                                    <CardHeader className="p-6 md:p-8 pb-4">
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Informações do Solicitante
                                        </CardTitle>
                                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Dados do cliente e solicitante
                                        </CardDescription>
                                    </CardHeader>
                                    <Separator className="bg-gray-100" />
                                    <CardContent className="p-6 md:p-8 pt-6 space-y-5">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="client"
                                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Cliente
                                            </Label>
                                            <Select
                                                value={data.client_id}
                                                onValueChange={
                                                    handleClientChange
                                                }
                                            >
                                                <SelectTrigger className="w-full focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all">
                                                    <SelectValue placeholder="Selecione o cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem
                                                            key={client.id}
                                                            value={client.id.toString()}
                                                        >
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.client_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.client_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="requester"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Solicitante
                                                </Label>
                                                <Dialog
                                                    open={
                                                        isNewRequesterDialogOpen
                                                    }
                                                    onOpenChange={
                                                        setIsNewRequesterDialogOpen
                                                    }
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1.5 text-xs"
                                                            disabled={
                                                                !selectedClient
                                                            }
                                                        >
                                                            <PlusCircle className="h-3.5 w-3.5" />
                                                            <span>Novo</span>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Adicionar Novo
                                                                Solicitante
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Preencha os dados
                                                                do novo
                                                                solicitante para o
                                                                cliente{" "}
                                                                {
                                                                    selectedClient?.name
                                                                }
                                                                .
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <form
                                                            onSubmit={
                                                                submitNewRequester
                                                            }
                                                            className="space-y-4"
                                                        >
                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-name">
                                                                    Nome
                                                                </Label>
                                                                <Input
                                                                    id="requester-name"
                                                                    value={
                                                                        requesterData.name
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setRequesterData(
                                                                            "name",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Nome completo"
                                                                    required
                                                                    className="focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all"
                                                                />
                                                                {requesterErrors.name && (
                                                                    <p className="text-sm text-red-500">
                                                                        {
                                                                            requesterErrors.name
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="requester-email">
                                                                    Email
                                                                </Label>
                                                                <Input
                                                                    id="requester-email"
                                                                    type="email"
                                                                    value={
                                                                        requesterData.email
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleEmailChange(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="email@exemplo.com"
                                                                    required
                                                                    className="focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all"
                                                                />
                                                                {requesterErrors.email && (
                                                                    <p className="text-sm text-red-500">
                                                                        {
                                                                            requesterErrors.email
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setIsNewRequesterDialogOpen(
                                                                            false
                                                                        )
                                                                    }
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    disabled={
                                                                        requesterProcessing
                                                                    }
                                                                    className="bg-[#1E40AF] hover:bg-[#3B82F6] transition-all"
                                                                >
                                                                    {requesterProcessing
                                                                        ? "Salvando..."
                                                                        : "Salvar"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <Select
                                                value={data.user_id}
                                                onValueChange={(value) =>
                                                    setData("user_id", value)
                                                }
                                                disabled={
                                                    clientUsers.length === 0
                                                }
                                            >
                                                <SelectTrigger className="w-full focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all">
                                                    <SelectValue
                                                        placeholder={
                                                            clientUsers.length ===
                                                            0
                                                                ? "Selecione um cliente primeiro"
                                                                : "Selecione o solicitante"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clientUsers.map((user) => (
                                                        <SelectItem
                                                            key={user.id}
                                                            value={user.id.toString()}
                                                        >
                                                            {user.name} (
                                                            {user.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.user_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.user_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="parent"
                                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Ticket Pai{" "}
                                                <span className="text-gray-400 text-xs font-normal">
                                                    (opcional)
                                                </span>
                                            </Label>
                                            <Select
                                                value={data.parent_id || ""}
                                                onValueChange={(value) =>
                                                    setData("parent_id", value)
                                                }
                                            >
                                                <SelectTrigger className="w-full focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all">
                                                    <SelectValue placeholder="Nenhum (Ticket Principal)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {potentialParentTickets.map(
                                                        (ticket) => (
                                                            <SelectItem
                                                                key={ticket.id}
                                                                value={ticket.id.toString()}
                                                            >
                                                                #{ticket.id} -{" "}
                                                                {ticket.title}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.parent_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.parent_id}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
                                    <CardHeader className="p-6 md:p-8 pb-4">
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Detalhes do Chamado
                                        </CardTitle>
                                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Informações principais do ticket
                                        </CardDescription>
                                    </CardHeader>
                                    <Separator className="bg-gray-100" />
                                    <CardContent className="p-6 md:p-8 pt-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="service"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Mesa de Serviço
                                                </Label>
                                                <Select
                                                    value={data.service_id}
                                                    onValueChange={(value) =>
                                                        setData(
                                                            "service_id",
                                                            value
                                                        )
                                                    }
                                                    required
                                                >
                                                    <SelectTrigger
                                                        className="w-full focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all"
                                                        id="service"
                                                    >
                                                        <SelectValue placeholder="Selecione a mesa" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.map(
                                                            (service) => (
                                                                <SelectItem
                                                                    key={
                                                                        service.id
                                                                    }
                                                                    value={service.id.toString()}
                                                                >
                                                                    {
                                                                        service.name
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {errors.service_id && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.service_id}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="priority"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Prioridade
                                                </Label>
                                                <Select
                                                    value={data.priority}
                                                    onValueChange={(value) =>
                                                        setData(
                                                            "priority",
                                                            value
                                                        )
                                                    }
                                                    required
                                                >
                                                    <SelectTrigger
                                                        className="w-full focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all"
                                                        id="priority"
                                                    >
                                                        <SelectValue placeholder="Selecione a prioridade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LOW">
                                                            Baixa
                                                        </SelectItem>
                                                        <SelectItem value="MEDIUM">
                                                            Média
                                                        </SelectItem>
                                                        <SelectItem value="HIGH">
                                                            Alta
                                                        </SelectItem>
                                                        <SelectItem value="URGENT">
                                                            Crítica
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.priority && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.priority}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="title"
                                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Título
                                            </Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                value={data.title}
                                                onChange={(e) =>
                                                    setData(
                                                        "title",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Descreva o problema de forma resumida"
                                                required
                                                className="focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all"
                                            />
                                            {errors.title && (
                                                <p className="text-sm text-red-500">
                                                    {errors.title}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="description"
                                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Descrição Detalhada
                                            </Label>
                                            <TiptapEditor
                                                content={data.description}
                                                onChange={(content) =>
                                                    setData("description", content)
                                                }
                                                placeholder="Descreva o problema em detalhes, incluindo informações relevantes..."
                                            />
                                            {errors.description && (
                                                <p className="text-sm text-red-500">
                                                    {errors.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Anexos */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Anexos{" "}
                                                <span className="text-gray-400 text-xs font-normal">
                                                    (opcional)
                                                </span>
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                "file-upload"
                                                            )
                                                            ?.click()
                                                    }
                                                    className="gap-2"
                                                >
                                                    <Paperclip className="h-4 w-4" />
                                                    Adicionar Arquivos
                                                </Button>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(
                                                            e.target.files || []
                                                        );
                                                        setAttachments([
                                                            ...attachments,
                                                            ...files,
                                                        ]);
                                                    }}
                                                />
                                            </div>

                                            {/* Lista de anexos */}
                                            {attachments.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {attachments.map(
                                                        (file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                                    <span className="text-sm text-gray-700">
                                                                        {
                                                                            file.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        (
                                                                        {(
                                                                            file.size /
                                                                            1024
                                                                        ).toFixed(
                                                                            1
                                                                        )}{" "}
                                                                        KB)
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setAttachments(
                                                                            attachments.filter(
                                                                                (
                                                                                    _,
                                                                                    i
                                                                                ) =>
                                                                                    i !==
                                                                                    index
                                                                            )
                                                                        );
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>

                    <div className="sticky bottom-6 mt-8 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing}
                            className="gap-1.5 transition-all shadow-md hover:shadow-lg"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </Button>
                        <Button
                            disabled={processing}
                            onClick={() => {
                                const form =
                                    document.querySelector("form");
                                if (form) form.requestSubmit();
                            }}
                            className="bg-primary hover:bg-primary/90 text-white gap-1.5 transition-all shadow-md hover:shadow-lg"
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
