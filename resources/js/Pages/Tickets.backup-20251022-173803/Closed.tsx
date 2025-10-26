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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    XCircle,
    Eye,
    CalendarDays,
    Filter,
    X,
    Clock,
    Building2,
    User,
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

export default function Closed({
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

    const handleFilter = () => {
        if (isFiltering) return; // Previne múltiplos cliques
        
        setIsFiltering(true);
        
        // Remove valores vazios para não enviar parâmetros desnecessários
        const params: Record<string, string> = {};
        
        if (clientId && clientId !== 'all') params.client_id = clientId;
        if (period && period !== 'all') params.period = period;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        console.log('Aplicando filtros:', { clientId, period, dateFrom, dateTo, params });

        router.get(route("tickets.closed.index"), params, {
            onFinish: () => setIsFiltering(false),
        });
    };

    const handleClearFilters = () => {
        setClientId("all");
        setPeriod("all");
        setDateFrom("");
        setDateTo("");
        router.get(route("tickets.closed.index"));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPriorityVariant = (priority: string) => {
        if (!priority) return "default";
        
        const name = priority.toLowerCase();
        if (name.includes("urgent") || name === "urgent") return "destructive";
        if (name.includes("high") || name === "high") return "warning";
        if (name.includes("medium") || name === "medium") return "info";
        if (name.includes("low") || name === "low") return "secondary";
        return "default";
    };

    const translatePriority = (priority: string) => {
        const map: Record<string, string> = {
            LOW: "Baixa",
            MEDIUM: "Média",
            HIGH: "Alta",
            URGENT: "Urgente",
        };
        return map[priority] || priority;
    };

    const hasActiveFilters =
        clientId || period || dateFrom || dateTo;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
                            <XCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Tickets Fechados
                            </h2>
                            <p className="text-sm text-gray-600">
                                {tickets.total} ticket
                                {tickets.total !== 1 ? "s" : ""} finalizado
                                {tickets.total !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Tickets Fechados" />

            <div className="space-y-6">
                {/* Card de Filtros */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-primary" />
                                    Filtros
                                </CardTitle>
                                <CardDescription>
                                    Refine sua pesquisa com os filtros abaixo
                                </CardDescription>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Filtro Cliente */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    <Building2 className="mr-2 inline h-4 w-4" />
                                    Cliente
                                </label>
                                <Select
                                    value={clientId}
                                    onValueChange={setClientId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os clientes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Todos os clientes
                                        </SelectItem>
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
                            </div>

                            {/* Filtro Período Rápido */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    <Clock className="mr-2 inline h-4 w-4" />
                                    Período rápido
                                </label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Todos
                                        </SelectItem>
                                        <SelectItem value="7">
                                            Últimos 7 dias
                                        </SelectItem>
                                        <SelectItem value="15">
                                            Últimos 15 dias
                                        </SelectItem>
                                        <SelectItem value="30">
                                            Últimos 30 dias
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Data Inicial */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    <CalendarDays className="mr-2 inline h-4 w-4" />
                                    Data inicial
                                </label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                />
                            </div>

                            {/* Data Final */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    <CalendarDays className="mr-2 inline h-4 w-4" />
                                    Data final
                                </label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleFilter} disabled={isFiltering}>
                                <Filter className="mr-2 h-4 w-4" />
                                {isFiltering ? "Filtrando..." : "Aplicar filtros"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabela de Tickets */}
                <Card>
                    <CardContent className="p-0">
                        {tickets.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <XCircle className="mb-4 h-16 w-16 text-gray-300" />
                                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                    Nenhum ticket fechado
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Não há tickets fechados no momento.
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Solicitante</TableHead>
                                            <TableHead>Mesa de Serviço</TableHead>
                                            <TableHead>Prioridade</TableHead>
                                            <TableHead>Fechado em</TableHead>
                                            <TableHead className="text-right">
                                                Ações
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tickets.data.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="font-mono text-sm">
                                                    #{ticket.id}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div className="truncate font-medium">
                                                        {ticket.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.client?.name || (
                                                        <span className="text-gray-400">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        {ticket.user.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {ticket.service.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.priority ? (
                                                        <Badge
                                                            variant={getPriorityVariant(
                                                                ticket.priority
                                                            )}
                                                        >
                                                            {translatePriority(ticket.priority)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {formatDateTime(
                                                        ticket.updated_at
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={route(
                                                            "tickets.show",
                                                            ticket.id
                                                        )}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Paginação */}
                                {tickets.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            Mostrando{" "}
                                            <span className="font-medium">
                                                {(tickets.current_page - 1) *
                                                    tickets.per_page +
                                                    1}
                                            </span>{" "}
                                            até{" "}
                                            <span className="font-medium">
                                                {Math.min(
                                                    tickets.current_page *
                                                        tickets.per_page,
                                                    tickets.total
                                                )}
                                            </span>{" "}
                                            de{" "}
                                            <span className="font-medium">
                                                {tickets.total}
                                            </span>{" "}
                                            resultados
                                        </div>
                                        <div className="flex gap-2">
                                            {tickets.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                "tickets.closed.index",
                                                                {
                                                                    ...filters,
                                                                    page:
                                                                        tickets.current_page -
                                                                        1,
                                                                }
                                                            )
                                                        )
                                                    }
                                                >
                                                    Anterior
                                                </Button>
                                            )}
                                            {tickets.current_page <
                                                tickets.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                "tickets.closed.index",
                                                                {
                                                                    ...filters,
                                                                    page:
                                                                        tickets.current_page +
                                                                        1,
                                                                }
                                                            )
                                                        )
                                                    }
                                                >
                                                    Próxima
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
