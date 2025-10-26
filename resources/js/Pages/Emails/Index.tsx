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
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Search,
    Mail,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TicketEmail {
    id: number;
    message_id: string;
    from: string;
    to: string | null;
    subject: string;
    status: "queued" | "processed" | "failed";
    error_message: string | null;
    received_at: string;
    created_at: string;
    ticket_id: number | null;
    tenant_id: number | null;
    ticket?: {
        id: number;
        title: string;
    } | null;
    tenant?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedTicketEmails {
    data: TicketEmail[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    status?: string;
    search?: string;
}

export default function Index({
    auth,
    ticketEmails,
    filters,
}: PageProps<{
    ticketEmails: PaginatedTicketEmails;
    filters: Filters;
}>) {
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");

    const handleSearch = () => {
        router.get(
            route("emails.index"),
            { search, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        router.get(
            route("emails.index"),
            { search, status: value },
            { preserveState: true }
        );
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        router.get(route("emails.index"));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "processed":
                return (
                    <Badge variant="default" className="bg-green-500">
                        Processado
                    </Badge>
                );
            case "queued":
                return <Badge variant="secondary">Na Fila</Badge>;
            case "failed":
                return <Badge variant="destructive">Falhou</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Mail className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Emails Ingeridos
                        </h2>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.reload()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            }
        >
            <Head title="Emails Ingeridos" />

            <div className="py-6">
                <div className="mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar por email, assunto ou message ID..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                handleSearch()
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="w-full md:w-48">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                Todos
                                            </SelectItem>
                                            <SelectItem value="queued">
                                                Na Fila
                                            </SelectItem>
                                            <SelectItem value="processed">
                                                Processado
                                            </SelectItem>
                                            <SelectItem value="failed">
                                                Falhou
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleSearch}>Buscar</Button>
                                {(search || statusFilter) && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>De</TableHead>
                                        <TableHead>Assunto</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Ticket</TableHead>
                                        <TableHead>Recebido em</TableHead>
                                        <TableHead className="text-right">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ticketEmails.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Nenhum email encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ticketEmails.data.map((email) => (
                                            <TableRow key={email.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {email.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {email.from}
                                                        </span>
                                                        {email.to && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Para: {email.to}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-md truncate">
                                                        {email.subject}
                                                    </div>
                                                    {email.error_message && (
                                                        <div className="text-xs text-red-600 mt-1">
                                                            {email.error_message}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(
                                                        email.status
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {email.ticket ? (
                                                        <Link
                                                            href={route(
                                                                "tickets.show",
                                                                email.ticket.id
                                                            )}
                                                            className="text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            #{email.ticket.id}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(
                                                            email.received_at
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href="#"
                                                            title="Ver detalhes"
                                                        >
                                                            Ver
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Paginação */}
                            {ticketEmails.last_page > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando {ticketEmails.from} a{" "}
                                        {ticketEmails.to} de{" "}
                                        {ticketEmails.total} registros
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                ticketEmails.current_page === 1
                                            }
                                            onClick={() =>
                                                router.get(
                                                    route("emails.index"),
                                                    {
                                                        page:
                                                            ticketEmails.current_page -
                                                            1,
                                                        search,
                                                        status: statusFilter,
                                                    },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Página {ticketEmails.current_page}{" "}
                                            de {ticketEmails.last_page}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                ticketEmails.current_page ===
                                                ticketEmails.last_page
                                            }
                                            onClick={() =>
                                                router.get(
                                                    route("emails.index"),
                                                    {
                                                        page:
                                                            ticketEmails.current_page +
                                                            1,
                                                        search,
                                                        status: statusFilter,
                                                    },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

