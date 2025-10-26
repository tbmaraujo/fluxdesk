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
import { Card } from "@/Components/ui/card";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Label } from "@/Components/ui/label";
import {
    Search,
    Filter,
    Plus,
    Download,
    Ticket as TicketIcon,
    AlertTriangle,
    ArrowUp,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    X,
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

interface Technician {
    id: number;
    name: string;
}

interface Contact {
    id: number;
    name: string;
}

interface Stats {
    total: number;
    critical: number;
    high: number;
    my_tickets: number;
}

interface Filters {
    client_id?: string;
    period?: string;
    date_from?: string;
    date_to?: string;
    quick_filter?: string;
    search?: string;
    assignee_id?: string;
    contact_id?: string;
}

interface PaginatedTickets {
    data: Ticket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export default function Open({
    auth,
    tickets,
    stats,
    clients,
    technicians,
    contacts,
    filters,
}: PageProps<{
    tickets: PaginatedTickets;
    stats: Stats;
    clients: Client[];
    technicians: Technician[];
    contacts: Contact[];
    filters: Filters;
}>) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [quickFilter, setQuickFilter] = useState(filters.quick_filter || "all");
    
    // Estados para filtros avançados
    const [showClientFilter, setShowClientFilter] = useState(false);
    const [showPeriodFilter, setShowPeriodFilter] = useState(false);
    const [showResponsibleFilter, setShowResponsibleFilter] = useState(false);
    const [showContactFilter, setShowContactFilter] = useState(false);
    
    const [selectedClient, setSelectedClient] = useState(filters.client_id || "all");
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || "all");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [selectedAssignee, setSelectedAssignee] = useState(filters.assignee_id || "all");
    const [selectedContact, setSelectedContact] = useState(filters.contact_id || "all");

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        const params: Record<string, string> = {};
        if (value.trim()) {
            params.search = value.trim();
        }
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleQuickFilter = (filter: string) => {
        setQuickFilter(filter);
        setSearchTerm("");
        
        const params: Record<string, string> = {};
        if (filter !== "all") {
            params.quick_filter = filter;
        }
        
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get(
            route("tickets.open.index", {
                ...filters,
                page,
            }),
            {},
            {
                preserveState: true,
                preserveScroll: false,
            }
        );
    };

    const handleApplyClientFilter = () => {
        const params: Record<string, string> = {};
        if (selectedClient !== "all") {
            params.client_id = selectedClient;
        }
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
        setShowClientFilter(false);
    };

    const handleApplyPeriodFilter = () => {
        const params: Record<string, string> = {};
        if (selectedPeriod !== "all") {
            params.period = selectedPeriod;
        }
        if (dateFrom) {
            params.date_from = dateFrom;
        }
        if (dateTo) {
            params.date_to = dateTo;
        }
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
        setShowPeriodFilter(false);
    };

    const handleApplyResponsibleFilter = () => {
        const params: Record<string, string> = {};
        if (selectedAssignee !== "all") {
            params.assignee_id = selectedAssignee;
        }
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
        setShowResponsibleFilter(false);
    };

    const handleApplyContactFilter = () => {
        const params: Record<string, string> = {};
        if (selectedContact !== "all") {
            params.contact_id = selectedContact;
        }
        router.get(route("tickets.open.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });
        setShowContactFilter(false);
    };

    const handleClearFilters = () => {
        setSelectedClient("all");
        setSelectedPeriod("all");
        setDateFrom("");
        setDateTo("");
        setSelectedAssignee("all");
        setSelectedContact("all");
        setSearchTerm("");
        setQuickFilter("all");
        router.get(route("tickets.open.index"));
    };

    const hasActiveAdvancedFilters = 
        selectedClient !== "all" || 
        selectedPeriod !== "all" || 
        dateFrom || 
        dateTo ||
        selectedAssignee !== "all" ||
        selectedContact !== "all";

    const handleExportCsv = () => {
        // Construir URL com todos os filtros ativos
        const params = new URLSearchParams();
        
        if (quickFilter !== "all") {
            params.append("quick_filter", quickFilter);
        }
        if (searchTerm) {
            params.append("search", searchTerm);
        }
        if (selectedClient !== "all") {
            params.append("client_id", selectedClient);
        }
        if (selectedPeriod !== "all") {
            params.append("period", selectedPeriod);
        }
        if (dateFrom) {
            params.append("date_from", dateFrom);
        }
        if (dateTo) {
            params.append("date_to", dateTo);
        }
        if (selectedAssignee !== "all") {
            params.append("assignee_id", selectedAssignee);
        }
        if (selectedContact !== "all") {
            params.append("contact_id", selectedContact);
        }
        
        // Abrir em nova janela para download
        const url = route("tickets.open.export") + (params.toString() ? `?${params.toString()}` : "");
        window.open(url, "_blank");
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 60) {
            return `há ${diffInMinutes}m`;
        } else if (diffInMinutes < 1440) {
            return `há ${Math.floor(diffInMinutes / 60)}h`;
        } else {
            return `há ${Math.floor(diffInMinutes / 1440)}d`;
        }
    };

    const getPriorityBadgeStyles = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "crítica":
                return "bg-red-100 text-red-700 border-red-200";
            case "alta":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "normal":
            case "média":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "baixa":
                return "bg-gray-100 text-gray-700 border-gray-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(
            1,
            tickets.current_page - Math.floor(maxVisible / 2)
        );
        let endPage = Math.min(
            tickets.last_page,
            startPage + maxVisible - 1
        );

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === tickets.current_page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                    className="h-8 w-8 p-0"
                >
                    {i}
                </Button>
            );
        }

        return pages;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Tickets Abertos" />

            <div className="min-h-screen bg-gray-50/50 p-6">
                {/* Header com título e badge Online */}
                <div className="mb-6 flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Tickets Abertos
                    </h1>
                    <Badge
                        variant="outline"
                        className="gap-1.5 border-green-200 bg-green-50 text-green-700"
                    >
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Online
                    </Badge>
                </div>

                {/* Cards de Resumo */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Abertos */}
                    <Card className="border-none bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Abertos
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3">
                                <TicketIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    {/* Críticos */}
                    <Card className="border-none bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Críticos</p>
                                <p className="mt-1 text-3xl font-bold text-red-600">
                                    {stats.critical}
                                </p>
                            </div>
                            <div className="rounded-xl bg-red-50 p-3">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </Card>

                    {/* Alta Prioridade */}
                    <Card className="border-none bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Alta Prioridade
                                </p>
                                <p className="mt-1 text-3xl font-bold text-orange-600">
                                    {stats.high}
                                </p>
                            </div>
                            <div className="rounded-xl bg-orange-50 p-3">
                                <ArrowUp className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </Card>

                    {/* Meus Tickets */}
                    <Card className="border-none bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Meus Tickets
                                </p>
                                <p className="mt-1 text-3xl font-bold text-green-600">
                                    {stats.my_tickets}
                                </p>
                            </div>
                            <div className="rounded-xl bg-green-50 p-3">
                                <UserIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filtros Rápidos e Barra de Busca */}
                <Card className="mb-6 border-none bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Filtros Rápidos */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                                Filtros Rápidos:
                            </span>
                            <Button
                                variant={
                                    quickFilter === "critical"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => handleQuickFilter("critical")}
                                className={
                                    quickFilter === "critical"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : ""
                                }
                            >
                                Críticos ({stats.critical})
                            </Button>
                            <Button
                                variant={
                                    quickFilter === "high" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handleQuickFilter("high")}
                                className={
                                    quickFilter === "high"
                                        ? "bg-orange-600 hover:bg-orange-700"
                                        : ""
                                }
                            >
                                Alta ({stats.high})
                            </Button>
                            <Button
                                variant={
                                    quickFilter === "my_tickets"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => handleQuickFilter("my_tickets")}
                                className={
                                    quickFilter === "my_tickets"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : ""
                                }
                            >
                                Meus Tickets ({stats.my_tickets})
                            </Button>
                            <Button
                                variant={
                                    quickFilter === "all" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handleQuickFilter("all")}
                            >
                                Todos
                            </Button>
                        </div>

                        {/* Barra de Busca e Ações */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Buscar tickets..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtros
                                        {hasActiveAdvancedFilters && (
                                            <Badge variant="default" className="ml-1 h-5 px-1 text-xs">
                                                !
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setShowClientFilter(true)}>
                                        Por cliente
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowContactFilter(true)}>
                                        Por solicitante
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowPeriodFilter(true)}>
                                        Por período
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowResponsibleFilter(true)}>
                                        Por responsável
                                    </DropdownMenuItem>
                                    {hasActiveAdvancedFilters && (
                                        <>
                                            <DropdownMenuItem className="border-t" onClick={handleClearFilters}>
                                                <X className="mr-2 h-4 w-4" />
                                                Limpar filtros
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Link href={route("tickets.create")}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Ticket
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Tabela de Tickets */}
                <Card className="border-none bg-white shadow-sm">
                    {/* Header da Tabela */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Lista de Tickets
                            </h2>
                            <p className="text-sm text-gray-500">
                                Exibindo {tickets.from || 0} de {tickets.total}{" "}
                                tickets
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleExportCsv}
                                title="Exportar para CSV"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Tabela */}
                    {tickets.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 rounded-full bg-gray-100 p-6">
                                <TicketIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-gray-900">
                                Nenhum ticket encontrado
                            </h3>
                            <p className="text-sm text-gray-500">
                                Não há tickets abertos no momento.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-200 bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">
                                            ID
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Título
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Cliente
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Solicitante
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Mesa
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Prioridade
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Responsável
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            Atualizado
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                                            onClick={() =>
                                                router.visit(
                                                    route("tickets.show", ticket.id)
                                                )
                                            }
                                        >
                                            <TableCell className="font-mono text-sm font-medium text-gray-900">
                                                #{ticket.id.toString().padStart(4, "0")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-md">
                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                        {ticket.title}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                                {ticket.client?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                                {ticket.contact?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                                {ticket.service.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`border ${getPriorityBadgeStyles(ticket.priority)}`}
                                                >
                                                    {ticket.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {ticket.assignee ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                                                                {ticket.assignee.name
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .toUpperCase()
                                                                    .slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-gray-700">
                                                            {ticket.assignee.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        Não atribuído
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatRelativeTime(ticket.updated_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Paginação */}
                    {tickets.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                            <p className="text-sm text-gray-700">
                                Mostrando{" "}
                                <span className="font-medium">{tickets.from}</span> a{" "}
                                <span className="font-medium">{tickets.to}</span> de{" "}
                                <span className="font-medium">{tickets.total}</span>{" "}
                                resultados
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(tickets.current_page - 1)
                                    }
                                    disabled={tickets.current_page === 1}
                                    className="h-8"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                {renderPageNumbers()}
                                {tickets.last_page > 5 &&
                                    tickets.current_page < tickets.last_page - 2 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled
                                            className="h-8 w-8 p-0"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    )}
                                {tickets.last_page > 5 &&
                                    tickets.current_page < tickets.last_page - 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handlePageChange(tickets.last_page)
                                            }
                                            className="h-8 w-8 p-0"
                                        >
                                            {tickets.last_page}
                                        </Button>
                                    )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(tickets.current_page + 1)
                                    }
                                    disabled={tickets.current_page === tickets.last_page}
                                    className="h-8"
                                >
                                    Próximo
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal de Filtro por Cliente */}
            <Dialog open={showClientFilter} onOpenChange={setShowClientFilter}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrar por Cliente</DialogTitle>
                        <DialogDescription>
                            Selecione um cliente para filtrar os tickets
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="client">Cliente</Label>
                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                <SelectTrigger id="client">
                                    <SelectValue placeholder="Selecione um cliente" />
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowClientFilter(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyClientFilter}>
                            Aplicar Filtro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Filtro por Período */}
            <Dialog open={showPeriodFilter} onOpenChange={setShowPeriodFilter}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrar por Período</DialogTitle>
                        <DialogDescription>
                            Selecione um período para filtrar os tickets
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="period">Período Rápido</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger id="period">
                                    <SelectValue placeholder="Selecione um período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_from">Data Inicial</Label>
                            <Input
                                id="date_from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_to">Data Final</Label>
                            <Input
                                id="date_to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPeriodFilter(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyPeriodFilter}>
                            Aplicar Filtro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Filtro por Responsável */}
            <Dialog open={showResponsibleFilter} onOpenChange={setShowResponsibleFilter}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrar por Responsável</DialogTitle>
                        <DialogDescription>
                            Selecione um técnico responsável para filtrar os tickets
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignee">Responsável</Label>
                            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                <SelectTrigger id="assignee">
                                    <SelectValue placeholder="Selecione um responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id.toString()}>
                                            {tech.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResponsibleFilter(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyResponsibleFilter}>
                            Aplicar Filtro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Filtro por Solicitante */}
            <Dialog open={showContactFilter} onOpenChange={setShowContactFilter}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrar por Solicitante</DialogTitle>
                        <DialogDescription>
                            Selecione um solicitante para filtrar os tickets
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact">Solicitante</Label>
                            <Select value={selectedContact} onValueChange={setSelectedContact}>
                                <SelectTrigger id="contact">
                                    <SelectValue placeholder="Selecione um solicitante" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os solicitantes</SelectItem>
                                    {contacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id.toString()}>
                                            {contact.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowContactFilter(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyContactFilter}>
                            Aplicar Filtro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
