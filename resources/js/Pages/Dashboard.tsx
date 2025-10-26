import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import {
    AlertTriangle,
    ArrowUp,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    TrendingUp,
    User as UserIcon,
    Users,
} from "lucide-react";

interface DashboardStats {
    pending_tickets: number;
    my_tickets: number;
    critical_sla: number;
}

interface DashboardCards {
    open_tickets: number;
    open_tickets_today: number;
    in_progress: number;
    my_in_progress: number;
    resolved_today: number;
    critical_sla: number;
}

interface Ticket {
    id: number;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    client?: {
        name: string;
    };
    assignee?: {
        name: string;
    };
    service: {
        name: string;
    };
}

interface Activity {
    type: string;
    icon: string;
    color: string;
    title: string;
    description: string;
    user: string;
    client?: string;
    time: string;
}

export default function Dashboard({
    auth,
    stats,
    cards,
    priority_tickets,
    my_active_tickets,
    recent_activity,
}: PageProps<{
    stats: DashboardStats;
    cards: DashboardCards;
    priority_tickets: Ticket[];
    my_active_tickets: Ticket[];
    recent_activity: Activity[];
}>) {
    const getPriorityBadge = (priority: string) => {
        const config = {
            URGENT: { label: "CRÍTICO", variant: "destructive" as const },
            HIGH: { label: "ALTO", variant: "destructive" as const },
            MEDIUM: { label: "MÉDIO", variant: "default" as const },
            LOW: { label: "BAIXO", variant: "secondary" as const },
        };
        return config[priority as keyof typeof config] || config.LOW;
    };

    const getStatusBadge = (status: string) => {
        const config = {
            OPEN: { 
                label: "ABERTO", 
                className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" 
            },
            IN_PROGRESS: { 
                label: "EM ANDAMENTO", 
                className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" 
            },
            PENDING: { 
                label: "PAUSADO", 
                className: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200" 
            },
        };
        return config[status as keyof typeof config] || { 
            label: status, 
            className: "bg-gray-100 text-gray-700 hover:bg-gray-100" 
        };
    };

    const getActivityIcon = (icon: string, color: string) => {
        const iconClass = `h-4 w-4 text-${color}-600`;
        switch (icon) {
            case "ticket":
                return <AlertTriangle className={iconClass} />;
            case "check":
                return <CheckCircle2 className={iconClass} />;
            case "comment":
                return <MessageSquare className={iconClass} />;
            case "clock":
                return <Clock className={iconClass} />;
            default:
                return <AlertTriangle className={iconClass} />;
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-gray-50/50 p-6">
                {/* Header da Página */}
                <div className="mb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                                <Badge
                                    variant="outline"
                                    className="gap-1.5 border-green-200 bg-green-50 text-green-700"
                                >
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    Online
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Visão geral dos chamados e atividades</p>
                        </div>
                    </div>
                </div>
                {/* Barra de Ação e Estatísticas */}
                <div className="flex items-center justify-between mb-6">
                    <Link href={route("tickets.create")}>
                        <Button 
                            className="h-9 gap-1.5 text-white hover:opacity-90"
                            style={{ backgroundColor: '#2563eb' }}
                        >
                            <span className="text-xl leading-none">+</span>
                            Novo Chamado
                        </Button>
                    </Link>
                    
                    <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-600">
                            Chamados pendentes:{" "}
                            <span className="font-semibold text-orange-600">{stats.pending_tickets}</span>
                        </span>
                        <span className="text-gray-600">
                            Meus chamados:{" "}
                            <span className="font-semibold text-blue-600">{stats.my_tickets}</span>
                        </span>
                        <span className="text-gray-600">
                            SLA crítico:{" "}
                            <span className="font-semibold text-red-600">{stats.critical_sla}</span>
                        </span>
                    </div>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Chamados Abertos */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Chamados Abertos</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{cards.open_tickets}</h3>
                                    {cards.open_tickets_today > 0 && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>+{cards.open_tickets_today} hoje</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Em Andamento */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Em Andamento</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{cards.in_progress}</h3>
                                    {cards.my_in_progress > 0 && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                                            <ArrowUp className="h-3 w-3" />
                                            <span>{cards.my_in_progress} seus</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resolvidos Hoje */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Resolvidos Hoje</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{cards.resolved_today}</h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Meta: 12</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SLA Crítico */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">SLA Crítico</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{cards.critical_sla}</h3>
                                    {cards.critical_sla > 0 && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                                            <Clock className="h-3 w-3" />
                                            <span>&lt; 2h restantes</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Layout de Duas Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Esquerda (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chamados Prioritários */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-base font-semibold">Chamados Prioritários</CardTitle>
                                <Link href={route("tickets.index")}>
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        Ver todos
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {priority_tickets.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        Nenhum chamado prioritário no momento
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {priority_tickets.map((ticket) => {
                                            const priorityInfo = getPriorityBadge(ticket.priority);
                                            return (
                                                <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                                                    <Badge variant={priorityInfo.variant} className="mt-0.5 text-xs px-2 py-0.5">
                                                        {priorityInfo.label}
                                                    </Badge>
                                                    <div className="flex-1 min-w-0">
                                                        <Link href={route("tickets.show", ticket.id)}>
                                                            <p className="font-medium text-sm text-gray-900 hover:text-blue-600 truncate">
                                                                #{ticket.id} - {ticket.title}
                                                            </p>
                                                        </Link>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            <span>Cliente: {ticket.client?.name || "-"}</span>
                                                            <span>•</span>
                                                            <span>Aberto há {new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
                                                        </div>
                                                    </div>
                                                    {ticket.assignee && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <UserIcon className="h-3 w-3" />
                                                            <span>{ticket.assignee.name}</span>
                                                        </div>
                                                    )}
                                                    <Link href={route("tickets.show", ticket.id)}>
                                                        <Button variant="ghost" size="sm" className="h-8 px-2">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Meus Chamados Ativos */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-base font-semibold">Meus Chamados Ativos</CardTitle>
                                <Link href={route("tickets.index")}>
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        Ver todos meus chamados
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {my_active_tickets.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        Você não tem chamados ativos no momento
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {my_active_tickets.map((ticket) => {
                                            const statusInfo = getStatusBadge(ticket.status);
                                            return (
                                                <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Link href={route("tickets.show", ticket.id)}>
                                                                <p className="font-medium text-sm text-gray-900 hover:text-blue-600">
                                                                    #{ticket.id} - {ticket.title}
                                                                </p>
                                                            </Link>
                                                            <Badge className={`text-xs px-2 py-0 ${statusInfo.className}`}>
                                                                {statusInfo.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <span>{ticket.client?.name || "Sem cliente"}</span>
                                                            <span>•</span>
                                                            <span>{ticket.service.name}</span>
                                                        </div>
                                                    </div>
                                                    <Link href={route("tickets.show", ticket.id)}>
                                                        <Button variant="ghost" size="sm" className="h-8 px-2">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Direita (1/3) - Atividade Recente */}
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recent_activity.map((activity, index) => (
                                        <div key={index}>
                                            <div className="flex gap-3">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${activity.color}-100 flex items-center justify-center`}>
                                                    {getActivityIcon(activity.icon, activity.color)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                                    <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                                                    {activity.client && (
                                                        <p className="text-xs text-gray-500 mt-0.5">Cliente: {activity.client}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                                </div>
                                            </div>
                                            {index < recent_activity.length - 1 && (
                                                <Separator className="my-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
