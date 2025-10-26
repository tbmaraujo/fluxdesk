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
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Search,
    Filter,
    ChevronDown,
    Settings2,
    Eye,
} from "lucide-react";

interface Ticket {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    stage: string;
    user_id: number;
    assignee_id: number | null;
    service_id: number;
    client_id: number | null;
    created_at: string;
    updated_at: string;
    service: {
        id: number;
        name: string;
    };
    client?: {
        id: number;
        name: string;
    };
    contact?: {
        id: number;
        name: string;
        client: {
            id: number;
            name: string;
        };
    };
    assignee: {
        id: number;
        name: string;
    } | null;
    origin?: string;
}

export default function IndexNew({
    auth,
    tickets,
}: PageProps<{
    tickets: Ticket[];
}>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTab, setSelectedTab] = useState("open");

    // Tradução de prioridade
    const translatePriority = (priority: string) => {
        const map: Record<string, string> = {
            LOW: "Normal",
            MEDIUM: "Normal",
            HIGH: "Normal",
            URGENT: "Normal",
        };
        return map[priority] || "Normal";
    };

    // Tradução de status
    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            OPEN: "Aberto",
            IN_PROGRESS: "Em andamento",
            RESOLVED: "Resolvido",
            CLOSED: "Fechado",
            CANCELED: "Cancelado",
            PENDING: "Pendente",
        };
        return map[status] || status;
    };

    // Tradução de estágio
    const translateStage = (stage: string) => {
        const map: Record<string, string> = {
            PENDING: "Pendente",
            N1: "N1",
            N2: "N2",
            N3: "N3",
        };
        return map[stage] || stage;
    };

    // Agrupar tickets por estágio
    const groupedTickets = tickets.reduce((acc, ticket) => {
        const stage = ticket.stage || "PENDING";
        if (!acc[stage]) {
            acc[stage] = [];
        }
        acc[stage].push(ticket);
        return acc;
    }, {} as Record<string, Ticket[]>);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Tickets" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Tickets
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Buscar"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                        <Button variant="outline">Busca avançada</Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="bg-white border-b">
                        <TabsTrigger value="pretickets">
                            Pré-tickets
                        </TabsTrigger>
                        <TabsTrigger value="authorizations">
                            Autorizações
                        </TabsTrigger>
                        <TabsTrigger value="review">
                            Tickets em revisão
                        </TabsTrigger>
                        <TabsTrigger value="closed">
                            Tickets fechados
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Filtros */}
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Filtros
                        </Button>

                        {/* Estágio */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Estágio: Todos abertos
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    Todos abertos
                                </DropdownMenuItem>
                                <DropdownMenuItem>Pendente</DropdownMenuItem>
                                <DropdownMenuItem>N1</DropdownMenuItem>
                                <DropdownMenuItem>N2</DropdownMenuItem>
                                <DropdownMenuItem>N3</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Agrupar por */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings2 className="h-4 w-4 mr-1" />
                                    Agrupar por
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Estágio</DropdownMenuItem>
                                <DropdownMenuItem>Status</DropdownMenuItem>
                                <DropdownMenuItem>Prioridade</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Exibir colunas */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Exibir colunas
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Número</DropdownMenuItem>
                                <DropdownMenuItem>Título</DropdownMenuItem>
                                <DropdownMenuItem>Cliente</DropdownMenuItem>
                                <DropdownMenuItem>Origem</DropdownMenuItem>
                                <DropdownMenuItem>Prioridade</DropdownMenuItem>
                                <DropdownMenuItem>Status</DropdownMenuItem>
                                <DropdownMenuItem>Estágio</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tabela agrupada */}
                <div className="bg-white rounded-lg border">
                    {Object.entries(groupedTickets).map(
                        ([stage, stageTickets]) => (
                            <div key={stage} className="border-b last:border-b-0">
                                {/* Header do grupo */}
                                <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                                    <ChevronDown className="h-4 w-4" />
                                    <span className="font-medium text-gray-700">
                                        {translateStage(stage)} - (
                                        {stageTickets.length})
                                    </span>
                                </div>

                                {/* Tabela */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">
                                                Número
                                            </TableHead>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Origem</TableHead>
                                            <TableHead>Prioridade</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Estágio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stageTickets.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell>
                                                    <Link
                                                        href={route(
                                                            "tickets.show",
                                                            ticket.id,
                                                        )}
                                                        className="text-teal-600 hover:underline"
                                                    >
                                                        {ticket.id}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.title}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.contact?.client
                                                        ?.name ||
                                                        ticket.client?.name ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.origin ||
                                                        "Tiflux Web"}
                                                </TableCell>
                                                <TableCell>
                                                    {translatePriority(
                                                        ticket.priority,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {translateStatus(
                                                        ticket.status,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {translateStage(
                                                        ticket.stage,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
