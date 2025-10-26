import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Separator } from "@/Components/ui/separator";
import {
    Eye,
    CalendarDays,
    Filter,
    X,
    User as UserIcon,
} from "lucide-react";

interface Ticket {
    id: number;
    title: string;
    status: string;
    stage: string;
    priority: string;
    created_at: string;
    updated_at: string;
    service: {
        id: number;
        name: string;
    };
    assignee: {
        id: number;
        name: string;
    } | null;
    user: {
        id: number;
        name: string;
    };
    contact?: {
        id: number;
        name: string;
    };
    client?: {
        id: number;
        name: string;
    };
}

interface Client {
    id: number;
    name: string;
}

interface Filters {
    client_id?: string;
    period?: string;
    date_from?: string;
    date_to?: string;
}

interface PaginatedTickets {
    data: Ticket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function Open({
    auth,
    tickets,
    clients,
    filters,
}: PageProps<{
    tickets: PaginatedTickets;
    clients: Client[];
    filters: Filters;
}>) {
    const [clientId, setClientId] = useState(filters.client_id || "all");
    const [period, setPeriod] = useState(filters.period || "all");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [isFiltering, setIsFiltering] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = () => {
        if (isFiltering) return;
        
        setIsFiltering(true);

        const params: Record<string, string> = {};
        
        if (clientId && clientId !== 'all') params.client_id = clientId;
        if (period && period !== 'all') params.period = period;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get(route("tickets.open.index"), params, {
            onFinish: () => setIsFiltering(false),
        });
    };

    const handleClearFilters = () => {
        setClientId("all");
        setPeriod("all");
        setDateFrom("");
        setDateTo("");
        router.get(route("tickets.open.index"));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case "LOW":
                return "secondary";
            case "MEDIUM":
                return "default";
            case "HIGH":
                return "destructive";
            case "URGENT":
                return "destructive";
            default:
                return "secondary";
        }
    };

    const translatePriority = (priority: string) => {
        switch (priority) {
            case "LOW":
                return "Baixa";
            case "MEDIUM":
                return "Média";
            case "HIGH":
                return "Alta";
            case "URGENT":
                return "Urgente";
            default:
                return priority;
        }
    };

    const hasActiveFilters =
        clientId !== "all" || period !== "all" || dateFrom || dateTo;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Tickets Abertos" />

            <div className="px-6 py-4">
                {/* Header Compacto */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Tickets Abertos</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {tickets.total} ticket{tickets.total !== 1 ? "s" : ""} aberto{tickets.total !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {hasActiveFilters && (
                            <Badge variant="default" className="ml-1 h-5 px-1 text-xs">
                                {[clientId !== "all", period !== "all", dateFrom, dateTo].filter(Boolean).length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Filtros Colapsáveis */}
                {showFilters && (
                    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Cliente
                                </label>
                                <Select value={clientId} onValueChange={setClientId}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os clientes</SelectItem>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id.toString()}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Período rápido
                                </label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Data inicial
                                </label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Data final
                                </label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <Button
                                onClick={handleFilter}
                                disabled={isFiltering}
                                size="sm"
                                className="h-8"
                            >
                                {isFiltering ? "Aplicando..." : "Aplicar filtros"}
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-8"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabela Compacta */}
                <div className="border rounded-lg bg-white overflow-hidden">
                    {tickets.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-gray-100 p-3 mb-3">
                                <Eye className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                                Nenhum ticket aberto
                            </h3>
                            <p className="text-xs text-gray-500">
                                Não há tickets abertos no momento.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="h-10 text-xs font-medium">ID</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Título</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Cliente</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Solicitante</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Mesa de Serviço</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Prioridade</TableHead>
                                        <TableHead className="h-10 text-xs font-medium">Atualizado em</TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                                            <TableCell className="font-mono text-xs py-3">
                                                #{ticket.id}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="max-w-xs">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {ticket.title}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs py-3">
                                                {ticket.client?.name || "-"}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-xs text-gray-600">
                                                        {ticket.contact?.name || "-"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs py-3">
                                                {ticket.service.name}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge
                                                    variant={getPriorityVariant(ticket.priority) as any}
                                                    className="text-xs px-2 py-0.5"
                                                >
                                                    {translatePriority(ticket.priority)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-600 py-3">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                    {formatDateTime(ticket.updated_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-3">
                                                <Link href={route("tickets.show", ticket.id)}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Paginação Compacta */}
                            {tickets.last_page > 1 && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="text-xs text-gray-500">
                                            Página {tickets.current_page} de {tickets.last_page} • {tickets.total} resultados
                                        </div>
                                        <div className="flex gap-2">
                                            {tickets.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route("tickets.open.index", {
                                                                ...filters,
                                                                page: tickets.current_page - 1,
                                                            })
                                                        )
                                                    }
                                                    className="h-8"
                                                >
                                                    Anterior
                                                </Button>
                                            )}
                                            {tickets.current_page < tickets.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route("tickets.open.index", {
                                                                ...filters,
                                                                page: tickets.current_page + 1,
                                                            })
                                                        )
                                                    }
                                                    className="h-8"
                                                >
                                                    Próximo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
