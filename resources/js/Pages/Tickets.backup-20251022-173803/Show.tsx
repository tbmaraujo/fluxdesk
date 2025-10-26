import { Head, Link, useForm, router } from "@inertiajs/react";
import { PropsWithChildren, useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import { formatDate } from "@/lib/utils";
import { getStatusLabel, getPriorityLabel } from "@/lib/ticketTranslations";
import { Badge } from "@/Components/ui/badge";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Separator } from "@/Components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/Components/ui/collapsible";
import TiptapEditor from "@/Components/TiptapEditor";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/Components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { FileText, Download, Paperclip, X, User, Building2, Mail, Phone, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Users, Eye, Shield, UserCircle, MoreVertical, Link2, Copy, UserPlus, XOctagon, Search, UserMinus, ArrowRightLeft, CheckCircle2, RotateCcw, ClipboardCheck, ChevronDown, ChevronUp, Edit2, Trash2, Pause, Play } from "lucide-react";

interface Attachment {
    id: number;
    ticket_id: number | null;
    reply_id: number | null;
    user_id: number;
    filename: string;
    original_name: string;
    path: string;
    size: number;
    mime_type: string;
    created_at: string;
}

interface Reply {
    id: number;
    ticket_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    attachments?: Attachment[];
}

interface Contract {
    id: number;
    user_id: number;
    name: string;
    status: string;
    total_hours: number | null;
    created_at: string;
    updated_at: string;
    displacements?: ContractDisplacement[];
}

interface ContractDisplacement {
    id: number;
    contract_id: number;
    tenant_id: number;
    name: string;
    value: string;
    quantity_included: number;
    created_at: string;
    updated_at: string;
}

interface ReportType {
    id: number;
    name: string;
    description: string;
}

interface Displacement {
    id: number;
    name: string;
    cost: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Appointment {
    id: number;
    ticket_id: number;
    user_id: number;
    description: string;
    start_time: string;
    end_time: string;
    duration_in_minutes: number;
    is_billable: boolean;
    service_type: string | null;
    billing_type: string | null;
    travel_cost: number | null;
    contract_id: number | null;
    displacement_id: number | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    contract?: Contract;
    displacement?: Displacement;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Client {
    id: number;
    name: string;
    users: User[];
}

interface SLAStatus {
    deadline: string | null;
    remaining_minutes: number;
    is_breached: boolean;
    formatted: string;
}

interface SLAData {
    response_sla: SLAStatus | null;
    stage_sla: SLAStatus | null;
    resolution_sla: SLAStatus | null;
}

interface Ticket {
    id: number;
    title: string;
    description: string;
    status: string;
    stage: string;
    priority: string;
    user_id: number;
    contact_id?: number | null;
    assignee_id: number | null;
    service_id: number;
    client_id?: number | null;
    created_at: string;
    updated_at: string;
    sla_paused_at?: string | null;
    sla_pause_reason?: string | null;
    sla_total_paused_minutes?: number;
    current_stage?: {
        id: number;
        name: string;
        sla_time: number;
    };
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
        notes?: string | null;
        role?: string;
        is_active?: boolean;
        two_factor_status?: string;
        contracts?: Contract[];
    };
    contact?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
        job_title?: string;
        contact_type?: string;
    };
    client?: {
        id: number;
        name: string;
    };
    service: {
        id: number;
        name: string;
        stages?: Array<{
            id: number;
            name: string;
            sla_time: number;
        }>;
    };
    assignee: {
        id: number;
        name: string;
        email: string;
    } | null;
    replies: Reply[];
    appointments: Appointment[];
    attachments?: Attachment[];
}

export default function Show({
    auth,
    ticket,
    displacements,
    technicians,
    clients,
    contracts,
    slaData,
    totalAppointmentMinutes,
    reportTypes,
}: PropsWithChildren<
    PageProps<{
        ticket: Ticket;
        displacements: Displacement[] | undefined;
        technicians: User[];
        clients: Client[];
        contracts: Contract[];
        slaData: SLAData;
        totalAppointmentMinutes: number;
        reportTypes: ReportType[];
    }>
>) {

    // Verificação de segurança para garantir que os dados existem
    if (!ticket || !auth) {
        return (
            <div className="p-8">
                <h1 className="text-xl font-bold text-red-600">
                    Erro ao carregar chamado
                </h1>
                <p className="mt-2">
                    Não foi possível carregar os dados necessários. Por favor,
                    tente novamente.
                </p>
                <Link
                    href={route("tickets.index")}
                    className="mt-4 inline-block"
                >
                    <Button>Voltar para a Lista</Button>
                </Link>
            </div>
        );
    }
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case "LOW":
                return "gray";
            case "MEDIUM":
                return "info";
            case "HIGH":
                return "orange";
            case "URGENT":
                return "red";
            default:
                return "gray";
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "OPEN":
                return "success";
            case "IN_PROGRESS":
                return "info";
            case "IN_REVIEW":
                return "orange";
            case "RESOLVED":
                return "gray";
            case "CLOSED":
                return "red";
            default:
                return "gray";
        }
    };


    // Estados para controlar os modais de ações
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [searchTicketTerm, setSearchTicketTerm] = useState('');
    const [selectedGroupTicketId, setSelectedGroupTicketId] = useState<number | null>(null);
    const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Estados para AlertDialogs de confirmação
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [isStartServiceDialogOpen, setIsStartServiceDialogOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
    const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
    const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    
    // Estados para Transfer Dialog
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
    
    // Estados para Report Dialog
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [selectedReportTypeId, setSelectedReportTypeId] = useState<number | null>(null);
    
    // Estado para controlar seção SLA
    const [isSlaOpen, setIsSlaOpen] = useState(false);
    const [isPauseSLADialogOpen, setIsPauseSLADialogOpen] = useState(false);
    const [pauseReason, setPauseReason] = useState('');

    // Motivos predefinidos para pausa de SLA
    const pauseReasons = [
        "Aguardando resposta do cliente",
        "Aguardando peça/componente",
        "Aguardando aprovação",
        "Aguardando fornecedor externo",
        "Fora do horário de expediente",
        "Outro motivo",
    ];

    // Função para pausar SLA
    const handlePauseSLA = () => {
        if (!pauseReason) {
            alert('Por favor, selecione ou insira um motivo para pausar o SLA.');
            return;
        }

        router.post(route('tickets.pauseSLA', ticket.id), {
            reason: pauseReason,
        }, {
            onSuccess: () => {
                setIsPauseSLADialogOpen(false);
                setPauseReason('');
            },
        });
    };

    // Função para retomar SLA
    const handleResumeSLA = () => {
        router.post(route('tickets.resumeSLA', ticket.id));
    };
    
    // Função para gerar relatório
    const handleGenerateReport = () => {
        if (!selectedReportTypeId) return;
        
        // Abrir PDF em nova aba usando rota GET
        const pdfUrl = route('tickets.pdf', {
            ticket: ticket.id,
            report_type_id: selectedReportTypeId
        });
        
        window.open(pdfUrl, '_blank');
        
        // Fechar o modal
        setIsReportDialogOpen(false);
        setSelectedReportTypeId(null);
    };

    // Buscar tickets disponíveis para agrupamento
    const searchAvailableTickets = async (term: string) => {
        if (!term || term.length < 3) {
            setAvailableTickets([]);
            return;
        }
        
        setIsSearching(true);
        try {
            // Simulação - em produção, fazer request real
            // const response = await axios.get(`/api/tickets/search?q=${term}&status=OPEN`);
            // setAvailableTickets(response.data);
            setAvailableTickets([]);
        } catch (error) {
            console.error('Erro ao buscar tickets:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce da busca
    useEffect(() => {
        const timer = setTimeout(() => {
            searchAvailableTickets(searchTicketTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTicketTerm]);

    // Função para agrupar ticket
    const handleGroupTicket = () => {
        if (!selectedGroupTicketId) return;
        
        router.post(route('tickets.group', ticket.id), {
            grouped_ticket_id: selectedGroupTicketId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsGroupDialogOpen(false);
                setSelectedGroupTicketId(null);
                setSearchTicketTerm('');
            },
        });
    };

    // Função para duplicar ticket
    const handleDuplicateTicket = () => {
        router.post(route('tickets.duplicate', ticket.id), {}, {
            onError: () => {
                // Se houver erro, fechar o dialog
                setIsDuplicateDialogOpen(false);
            },
            // onSuccess: o Inertia vai redirecionar automaticamente para o novo ticket
        });
        // Não fechar o dialog aqui - deixar o Inertia redirecionar
    };

    // Função para iniciar atendimento (assumir ticket + definir estágio)
    const handleStartService = () => {
        if (!selectedStageId) return;
        
        router.post(route('tickets.startService', ticket.id), {
            stage_id: selectedStageId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsStartServiceDialogOpen(false);
                setSelectedStageId(null);
            },
        });
    };

    // Função para cancelar ticket
    const handleCancelTicket = () => {
        router.post(route('tickets.cancel', ticket.id), {}, {
            preserveScroll: true,
        });
        setIsCancelDialogOpen(false);
    };

    // Função para deixar ticket
    const handleUnassignTicket = () => {
        router.post(route('tickets.unassign', ticket.id), {}, {
            preserveScroll: true,
        });
        setIsUnassignDialogOpen(false);
    };

    // Função para transferir ticket
    const handleTransferTicket = () => {
        if (!selectedTechnicianId) return;
        
        router.post(route('tickets.transfer', ticket.id), {
            assignee_id: selectedTechnicianId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsTransferDialogOpen(false);
                setSelectedTechnicianId(null);
            },
        });
    };

    // Função para finalizar ticket
    const handleFinalizeTicket = () => {
        router.post(route('tickets.finalize', ticket.id), {}, {
            preserveScroll: true,
        });
        setIsFinalizeDialogOpen(false);
    };

    // Função para reabrir ticket
    const handleReopenTicket = () => {
        router.post(route('tickets.reopen', ticket.id), {}, {
            preserveScroll: true,
        });
        setIsReopenDialogOpen(false);
    };

    // Verificar se usuário é administrador
    const isAdmin = auth.user.is_super_admin || auth.user.groups?.some(g => g.name === 'Administradores');

    // Função para aprovar ticket
    const handleApproveTicket = () => {
        router.post(route('tickets.review', ticket.id), {
            action: 'approve',
        }, {
            preserveScroll: true,
        });
        setIsReviewDialogOpen(false);
    };

    // Função para reprovar ticket
    const handleRejectTicket = () => {
        router.post(route('tickets.review', ticket.id), {
            action: 'reject',
        }, {
            preserveScroll: true,
        });
        setIsReviewDialogOpen(false);
    };

    return (
        <>
            <AuthenticatedLayout
                user={auth.user}
                header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            #{ticket.id} - {ticket.title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Criado em {formatDate(ticket.created_at)}
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Badge variant={getStatusVariant(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge variant={getPriorityVariant(ticket.priority)}>
                            {getPriorityLabel(ticket.priority)}
                        </Badge>
                        {ticket.sla_paused_at && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                <Pause className="h-3 w-3 mr-1" />
                                SLA Pausado
                            </Badge>
                        )}
                        
                        {/* Menu de Ações do Ticket */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    <MoreVertical className="h-4 w-4 mr-2" />
                                    Ações do ticket
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Agrupar ticket
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => setIsDuplicateDialogOpen(true)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar ticket
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Relatório
                                </DropdownMenuItem>
                                
                                {!ticket.assignee_id ? (
                                    <DropdownMenuItem onClick={() => setIsStartServiceDialogOpen(true)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Iniciar Atendimento
                                    </DropdownMenuItem>
                                ) : (
                                    <>
                                        <DropdownMenuItem onClick={() => setIsUnassignDialogOpen(true)}>
                                            <UserMinus className="h-4 w-4 mr-2" />
                                            Deixar ticket
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => setIsTransferDialogOpen(true)}>
                                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                                            Transferir ticket
                                        </DropdownMenuItem>
                                    </>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                {ticket.status !== 'IN_REVIEW' && ticket.status !== 'CLOSED' && ticket.status !== 'CANCELED' && (
                                    <DropdownMenuItem 
                                        onClick={() => setIsFinalizeDialogOpen(true)}
                                        className="text-green-600 focus:text-green-600"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Finalizar ticket
                                    </DropdownMenuItem>
                                )}
                                
                                {ticket.status === 'IN_REVIEW' && isAdmin && (
                                    <DropdownMenuItem 
                                        onClick={() => setIsReviewDialogOpen(true)}
                                        className="text-purple-600 focus:text-purple-600"
                                    >
                                        <ClipboardCheck className="h-4 w-4 mr-2" />
                                        Revisar ticket
                                    </DropdownMenuItem>
                                )}
                                
                                {(ticket.status === 'CLOSED' || ticket.status === 'CANCELED' || ticket.status === 'IN_REVIEW') && isAdmin && (
                                    <DropdownMenuItem 
                                        onClick={() => setIsReopenDialogOpen(true)}
                                        className="text-blue-600 focus:text-blue-600"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reabrir ticket
                                    </DropdownMenuItem>
                                )}
                                
                                {ticket.status !== 'CLOSED' && ticket.status !== 'CANCELED' && ticket.status !== 'IN_REVIEW' && (
                                    <DropdownMenuItem 
                                        onClick={() => setIsCancelDialogOpen(true)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <XOctagon className="h-4 w-4 mr-2" />
                                        Cancelar ticket
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            }
        >
            <Head title={`Chamado #${ticket.id}`} />

            <div className="w-full">
                {/* Layout Grid: 2/3 conteúdo + 1/3 sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Principal - Tabs */}
                    <div className="lg:col-span-2 space-y-6">
                            <Tabs defaultValue="description" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                                    <TabsTrigger value="description" className="rounded-lg">
                                        Informações
                                    </TabsTrigger>
                                    <TabsTrigger value="communication" className="rounded-lg">
                                        Comunicação
                                    </TabsTrigger>
                                    <TabsTrigger value="appointments" className="rounded-lg">
                                        Apontamentos
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-lg">
                                        Histórico
                                    </TabsTrigger>
                                </TabsList>

                                {/* Aba Informações/Descrição */}
                                <TabsContent value="description" className="mt-6">
                                    <DescriptionPanel ticket={ticket} auth={auth} />
                                </TabsContent>

                                {/* Aba Comunicação */}
                                <TabsContent value="communication" className="mt-6">
                                    <CommunicationPanel ticket={ticket} auth={auth} />
                                </TabsContent>

                                {/* Aba Apontamentos */}
                                <TabsContent value="appointments" className="mt-6">
                                    <AppointmentsPanel
                                        ticket={ticket}
                                        auth={auth}
                                        displacements={displacements}
                                        contracts={contracts}
                                    />
                                </TabsContent>

                                {/* Aba Histórico */}
                                <TabsContent value="history" className="mt-6">
                                    <HistoryPanel ticket={ticket} />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Sidebar Direita - Cards Informativos */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Seção SLA Colapsável */}
                            <Collapsible
                                open={isSlaOpen}
                                onOpenChange={setIsSlaOpen}
                                className="w-full"
                            >
                                <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
                                    <CollapsibleTrigger asChild>
                                        <div className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors rounded-t-2xl">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-sm font-medium text-gray-900">SLA</h3>
                                                {ticket.sla_paused_at ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResumeSLA();
                                                        }}
                                                        title="Retomar SLA"
                                                    >
                                                        <Play className="h-3.5 w-3.5 text-green-600" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsPauseSLADialogOpen(true);
                                                        }}
                                                        title="Pausar SLA"
                                                    >
                                                        <Pause className="h-3.5 w-3.5 text-orange-600" />
                                                    </Button>
                                                )}
                                            </div>
                                            {isSlaOpen ? (
                                                <ChevronUp className="h-4 w-4 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            )}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="px-6 pb-6 space-y-4">
                                            <Separator />
                                            
                                            {/* Vencimento de atendimento */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Vencimento de atendimento
                                                </h4>
                                                {slaData.response_sla ? (
                                                    <div className="flex items-center gap-2">
                                                        {slaData.response_sla.remaining_minutes === 0 ? (
                                                            slaData.response_sla.is_breached ? (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            )
                                                        ) : (
                                                            <Clock className={`h-4 w-4 ${slaData.response_sla.is_breached ? 'text-red-500' : 'text-green-500'}`} />
                                                        )}
                                                        <span className={`text-sm font-medium ${slaData.response_sla.is_breached ? 'text-red-600' : 'text-green-600'}`}>
                                                            {slaData.response_sla.formatted}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Sem SLA configurado</p>
                                                )}
                                            </div>

                                            <Separator />

                                            {/* Vencimento do estágio */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Vencimento do estágio
                                                </h4>
                                                {slaData.stage_sla ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className={`h-4 w-4 ${slaData.stage_sla.is_breached ? 'text-red-500' : 'text-green-500'}`} />
                                                        <span className={`text-sm font-medium ${slaData.stage_sla.is_breached ? 'text-red-600' : 'text-green-600'}`}>
                                                            {slaData.stage_sla.formatted}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Sem SLA configurado</p>
                                                )}
                                            </div>

                                            <Separator />

                                            {/* Vencimento de solução */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Vencimento de solução
                                                </h4>
                                                {slaData.resolution_sla ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className={`h-4 w-4 ${slaData.resolution_sla.is_breached ? 'text-red-500' : 'text-green-500'}`} />
                                                        <span className={`text-sm font-medium ${slaData.resolution_sla.is_breached ? 'text-red-600' : 'text-green-600'}`}>
                                                            {slaData.resolution_sla.formatted}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Sem SLA configurado</p>
                                                )}
                                            </div>

                                            <Separator />

                                            {/* Horas apontadas */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Horas apontadas
                                                </h4>
                                                <p className="text-sm text-gray-900">
                                                    {totalAppointmentMinutes > 0
                                                        ? `${Math.floor(totalAppointmentMinutes / 60)}h ${totalAppointmentMinutes % 60}min`
                                                        : "0h 0min"}
                                                </p>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>

                            <TicketInfoCard ticket={ticket} technicians={technicians} />
                            <RequesterInfoCard ticket={ticket} />
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {/* Dialog para Agrupar Ticket */}
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" />
                            Agrupar Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Busque e selecione um ticket em aberto para agrupar este ticket.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Campo de Busca */}
                        <div className="space-y-2">
                            <Label htmlFor="search-ticket">
                                Buscar Ticket (digite ID ou título)
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-ticket"
                                    type="text"
                                    placeholder="Digite pelo menos 3 caracteres..."
                                    value={searchTicketTerm}
                                    onChange={(e) => setSearchTicketTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Digite o ID ou parte do título do ticket
                            </p>
                        </div>

                        {/* Lista de Tickets Encontrados */}
                        {searchTicketTerm.length >= 3 && (
                            <div className="border rounded-lg max-h-64 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        Buscando tickets...
                                    </div>
                                ) : availableTickets.length > 0 ? (
                                    <div className="divide-y">
                                        {availableTickets.map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => setSelectedGroupTicketId(t.id)}
                                                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedGroupTicketId === t.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">
                                                            Ticket #{t.id}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {t.title}
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {t.status}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {t.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {selectedGroupTicketId === t.id && (
                                                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p className="font-medium">Nenhum ticket encontrado</p>
                                        <p className="text-sm mt-1">
                                            Tente buscar por outro termo ou ID
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {searchTicketTerm.length < 3 && searchTicketTerm.length > 0 && (
                            <div className="text-center text-sm text-gray-500 py-4">
                                Digite pelo menos 3 caracteres para buscar...
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsGroupDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleGroupTicket}
                            disabled={!selectedGroupTicketId}
                        >
                            <Link2 className="h-4 w-4 mr-2" />
                            Agrupar Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog para Duplicar Ticket */}
            <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-primary" />
                            Duplicar Ticket
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja duplicar este ticket? Um novo ticket será criado com os mesmos dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDuplicateTicket}>
                            Duplicar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog para Pausar SLA */}
            <Dialog open={isPauseSLADialogOpen} onOpenChange={setIsPauseSLADialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pause className="h-5 w-5 text-orange-600" />
                            Pausar SLA
                        </DialogTitle>
                        <DialogDescription>
                            Selecione ou digite o motivo para pausar o SLA deste ticket.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pause-reason">Motivo da Pausa</Label>
                            <Select value={pauseReason} onValueChange={setPauseReason}>
                                <SelectTrigger id="pause-reason">
                                    <SelectValue placeholder="Selecione um motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pauseReasons.map((reason) => (
                                        <SelectItem key={reason} value={reason}>
                                            {reason}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {pauseReason === "Outro motivo" && (
                            <div className="space-y-2">
                                <Label htmlFor="custom-reason">Descreva o motivo</Label>
                                <Input
                                    id="custom-reason"
                                    placeholder="Digite o motivo..."
                                    value={pauseReason === "Outro motivo" ? '' : pauseReason}
                                    onChange={(e) => setPauseReason(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPauseSLADialogOpen(false);
                                setPauseReason('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handlePauseSLA}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={!pauseReason}
                        >
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar SLA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para Gerar Relatório */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Gerar Relatório
                        </DialogTitle>
                        <DialogDescription>
                            Selecione o tipo de relatório que deseja gerar para este ticket.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="report-type">Tipo de Relatório</Label>
                            <Select 
                                value={selectedReportTypeId?.toString() || ''} 
                                onValueChange={(value) => setSelectedReportTypeId(Number(value))}
                            >
                                <SelectTrigger id="report-type">
                                    <SelectValue placeholder="Selecione um tipo de relatório" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map((reportType) => (
                                        <SelectItem key={reportType.id} value={reportType.id.toString()}>
                                            {reportType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {reportTypes.find(rt => rt.id === selectedReportTypeId)?.description && (
                                <p className="text-sm text-gray-500">
                                    {reportTypes.find(rt => rt.id === selectedReportTypeId)?.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReportDialogOpen(false);
                                setSelectedReportTypeId(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGenerateReport}
                            disabled={!selectedReportTypeId}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Gerar Relatório
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para Iniciar Atendimento */}
            <Dialog open={isStartServiceDialogOpen} onOpenChange={setIsStartServiceDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <UserPlus className="h-6 w-6 text-primary" />
                            Iniciar Atendimento
                        </DialogTitle>
                        <DialogDescription>
                            Selecione o estágio inicial para começar o atendimento. Você será definido como responsável pelo ticket.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {ticket.service.stages && ticket.service.stages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {ticket.service.stages.map((stage) => (
                                    <button
                                        key={stage.id}
                                        onClick={() => setSelectedStageId(stage.id)}
                                        className={`
                                            flex items-center justify-center rounded-lg border-2 p-4 transition-all
                                            ${selectedStageId === stage.id
                                                ? 'border-primary bg-primary/10 font-semibold'
                                                : 'border-gray-200 hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <span className="text-sm">{stage.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">
                                    Nenhum estágio cadastrado para esta mesa de serviço.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsStartServiceDialogOpen(false);
                                setSelectedStageId(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleStartService}
                            disabled={!selectedStageId}
                            className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-gray-900"
                        >
                            Alterar estágio e assumir ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog para Cancelar Ticket */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <XOctagon className="h-5 w-5" />
                            Cancelar Ticket
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja cancelar este ticket? Esta ação só será permitida se não houver apontamentos registrados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleCancelTicket}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sim, cancelar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para Deixar Ticket */}
            <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <UserMinus className="h-5 w-5 text-orange-600" />
                            Deixar Ticket
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deixar este ticket? Ele ficará sem responsável atribuído.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleUnassignTicket}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Sim, deixar ticket
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog para Transferir Ticket */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                            Transferir Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Selecione o técnico para quem deseja transferir este ticket.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="technician-select">Técnico</Label>
                            <Select
                                value={selectedTechnicianId?.toString() || ''}
                                onValueChange={(value) => setSelectedTechnicianId(parseInt(value))}
                            >
                                <SelectTrigger id="technician-select">
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians && technicians.length > 0 ? (
                                        technicians
                                            .filter(tech => tech.id !== ticket.assignee_id)
                                            .map((tech) => (
                                                <SelectItem key={tech.id} value={tech.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {tech.name}
                                                    </div>
                                                </SelectItem>
                                            ))
                                    ) : (
                                        <SelectItem value="0" disabled>
                                            Nenhum técnico disponível
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Escolha o técnico que assumirá este ticket
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsTransferDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleTransferTicket}
                            disabled={!selectedTechnicianId}
                        >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transferir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog para Finalizar Ticket */}
            <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Finalizar Ticket
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Tem certeza que deseja finalizar este ticket?
                            </p>
                            <p className="font-medium text-gray-700">
                                O ticket será movido para o status "Em Revisão" e aguardará aprovação de um administrador.
                            </p>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-sm text-amber-800 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong>Atenção:</strong> É necessário ter pelo menos um apontamento de tempo registrado para finalizar o ticket.
                                    </span>
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleFinalizeTicket}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Sim, finalizar ticket
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para Reabrir Ticket */}
            <AlertDialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                            <RotateCcw className="h-5 w-5" />
                            Reabrir Ticket
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Tem certeza que deseja reabrir este ticket?
                            </p>
                            <p className="font-medium text-gray-700">
                                O ticket voltará ao status "Aberto" e estágio "Pendente", permitindo que seja trabalhado novamente.
                            </p>
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong>Permissão:</strong> Apenas administradores podem reabrir tickets fechados, cancelados ou em revisão.
                                    </span>
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleReopenTicket}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Sim, reabrir ticket
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog para Revisar Ticket (Aprovar ou Reprovar) */}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-600">
                            <ClipboardCheck className="h-5 w-5" />
                            Revisar Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Revise o ticket e decida se deseja aprovar ou reprovar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Card Aprovar */}
                        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-green-900 mb-1">
                                        Aprovar Ticket
                                    </h4>
                                    <p className="text-sm text-green-700">
                                        O ticket será marcado como <strong>Fechado</strong> e o atendimento será considerado concluído com sucesso.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card Reprovar */}
                        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-orange-900 mb-1">
                                        Reprovar Ticket
                                    </h4>
                                    <p className="text-sm text-orange-700">
                                        O ticket será <strong>reaberto</strong> e retornará ao responsável de origem para ajustes ou complementações.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Aviso de Permissão */}
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                            <p className="text-sm text-purple-800 flex items-start gap-2">
                                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    <strong>Permissão:</strong> Apenas administradores podem revisar tickets.
                                </span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsReviewDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleRejectTicket}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reprovar
                        </Button>
                        <Button 
                            onClick={handleApproveTicket}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Novo: Painel de Descrição/Informações Gerais
function DescriptionPanel({ ticket, auth }: { ticket: Ticket; auth: any }) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
            <CardHeader className="p-6 md:p-8 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                    Descrição do Problema
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                    Informação detalhada fornecida pelo solicitante
                </CardDescription>
            </CardHeader>
            <Separator className="bg-gray-100" />
            <CardContent className="p-6 md:p-8 pt-6">
                <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#1E40AF] text-white text-sm font-medium">
                            {getInitials(ticket.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="font-semibold text-gray-900">
                                {ticket.user.name}
                            </span>
                            <Badge variant="purple">Autor</Badge>
                            <span className="text-sm text-gray-500">
                                {formatDate(ticket.created_at)}
                            </span>
                        </div>
                        <div 
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: ticket.description }}
                        />
                        
                        {/* Anexos do Ticket */}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-[#1E40AF]" />
                                    Arquivos anexados ({ticket.attachments.length})
                                </h4>
                                <div className="space-y-2">
                                    {ticket.attachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={`/storage/${attachment.path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 p-3 rounded-lg border border-gray-200 hover:border-[#1E40AF] transition-all group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-500 group-hover:text-[#1E40AF]" />
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
                                                    {attachment.original_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({formatFileSize(attachment.size)})
                                                </span>
                                            </div>
                                            <Download className="h-4 w-4 text-gray-400 group-hover:text-[#1E40AF] transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Novo: Card de Informações do Ticket (Sidebar)
function TicketInfoCard({ ticket, technicians }: { ticket: Ticket; technicians: User[] }) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "OPEN":
                return <AlertCircle className="h-4 w-4 text-green-600" />;
            case "IN_PROGRESS":
                return <Clock className="h-4 w-4 text-blue-600" />;
            case "RESOLVED":
                return <CheckCircle className="h-4 w-4 text-gray-600" />;
            case "CLOSED":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "CANCELED":
                return <XCircle className="h-4 w-4 text-orange-600" />;
            case "PENDING":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case "ON_HOLD":
                return <Clock className="h-4 w-4 text-gray-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case "OPEN": return "Aberto";
            case "IN_PROGRESS": return "Em andamento";
            case "RESOLVED": return "Resolvido";
            case "CLOSED": return "Fechado";
            case "CANCELED": return "Cancelado";
            case "PENDING": return "Pendente";
            case "ON_HOLD": return "Em espera";
            default: return status;
        }
    };

    const translatePriority = (priority: string) => {
        switch (priority) {
            case "LOW": return "Baixa";
            case "MEDIUM": return "Média";
            case "HIGH": return "Alta";
            case "URGENT": return "Urgente";
            default: return priority;
        }
    };

    return (
        <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
            <CardHeader className="px-6 py-3">
                <CardTitle className="text-sm font-medium text-gray-900">
                    Informações do Ticket
                </CardTitle>
            </CardHeader>
            <Separator className="bg-gray-100" />
            <CardContent className="p-6">
                {/* Grid 2 colunas para otimizar espaço */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {/* Mesa de Serviço */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Mesa de Serviço
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                            {ticket.service.name}
                        </p>
                    </div>

                    {/* Prioridade */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Prioridade
                        </label>
                        <div className="flex items-center gap-2">
                            <Badge variant={
                                ticket.priority === "LOW" ? "gray" :
                                ticket.priority === "MEDIUM" ? "info" :
                                ticket.priority === "HIGH" ? "orange" : "red"
                            }>
                                {translatePriority(ticket.priority)}
                            </Badge>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Status
                        </label>
                        <div className="flex items-center gap-2">
                            {getStatusIcon(ticket.status)}
                            <span className="text-sm font-medium text-gray-900">
                                {translateStatus(ticket.status)}
                            </span>
                        </div>
                    </div>

                    {/* Estágio */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Estágio
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                            {ticket.current_stage?.name || ticket.stage}
                        </p>
                    </div>
                </div>

                <Separator className="bg-gray-100 my-4" />

                {/* Responsável (largura completa) */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Responsável
                    </label>
                    {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-[#1E40AF] text-white text-xs">
                                    {ticket.assignee.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {ticket.assignee.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {ticket.assignee.email}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Não atribuído</p>
                    )}
                </div>

                <Separator className="bg-gray-100 my-4" />

                {/* Datas (largura completa) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Criado: {formatDate(ticket.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Atualizado: {formatDate(ticket.updated_at)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Novo: Card de Informações do Solicitante (Sidebar)
function RequesterInfoCard({ ticket }: { ticket: Ticket }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Contact não tem roles, é sempre solicitante

    return (
        <>
            <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
                <CardHeader className="px-6 py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900">
                            Informações do Solicitante
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDetailsOpen(true)}
                            className="text-[#1E40AF] hover:text-[#3B82F6] hover:bg-blue-50"
                        >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Ver detalhes
                        </Button>
                    </div>
                </CardHeader>
                <Separator className="bg-gray-100" />
                <CardContent className="p-6 space-y-4">
                    {/* Avatar e Nome */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white font-semibold">
                                {ticket.contact ? getInitials(ticket.contact.name) : '??'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {ticket.contact?.name || 'Não informado'}
                            </p>
                            <Badge variant="purple" className="mt-1">Solicitante</Badge>
                        </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Email */}
                    {ticket.contact?.email && (
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <a 
                                href={`mailto:${ticket.contact.email}`}
                                className="text-[#1E40AF] hover:underline break-all"
                            >
                                {ticket.contact.email}
                            </a>
                        </div>
                    )}

                    {/* Cliente/Empresa */}
                    {ticket.client && (
                        <>
                            <Separator className="bg-gray-100" />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Empresa
                                </label>
                                <p className="text-sm font-medium text-gray-900">
                                    {ticket.client.name}
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Sheet com detalhes completos do solicitante */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-xl flex items-center gap-2">
                            <UserCircle className="h-6 w-6 text-[#1E40AF]" />
                            Perfil Completo do Solicitante
                        </SheetTitle>
                        <SheetDescription>
                            Todas as informações cadastradas deste usuário
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Avatar e informações principais */}
                        <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-[#1E40AF]/10 to-[#3B82F6]/10 rounded-xl">
                            <Avatar className="h-20 w-20">
                                <AvatarFallback className="bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white font-bold text-2xl">
                                    {ticket.contact ? getInitials(ticket.contact.name) : '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {ticket.contact?.name || 'Não informado'}
                                </h3>
                                <Badge variant="purple" className="mt-2">Solicitante</Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* Informações de Contato */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-[#1E40AF]" />
                                Contato
                            </h4>
                            
                            <div className="space-y-3 pl-6">
                                {ticket.contact?.email && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            E-mail
                                        </label>
                                        <a 
                                            href={`mailto:${ticket.contact.email}`}
                                            className="block text-sm text-[#1E40AF] hover:underline mt-1"
                                        >
                                            {ticket.contact.email}
                                        </a>
                                    </div>
                                )}

                                {ticket.contact?.phone && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Telefone
                                        </label>
                                        <a 
                                            href={`tel:${ticket.contact.phone}`}
                                            className="block text-sm text-[#1E40AF] hover:underline mt-1"
                                        >
                                            {ticket.contact.phone}
                                        </a>
                                    </div>
                                )}

                                {ticket.contact?.job_title && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Cargo
                                        </label>
                                        <p className="text-sm text-gray-900 mt-1">{ticket.contact.job_title}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Empresa */}
                        {ticket.client && (
                            <>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#1E40AF]" />
                                        Empresa
                                    </h4>
                                    <div className="pl-6">
                                        <p className="text-sm font-medium text-gray-900">
                                            {ticket.client.name}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Tipo de Contato */}
                        {ticket.contact?.contact_type && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-[#1E40AF]" />
                                    Tipo de Contato
                                </h4>
                                <div className="pl-6">
                                    <Badge variant="outline">{ticket.contact.contact_type}</Badge>
                                </div>
                            </div>
                        )}

                        {/* Observações */}
                        {ticket.user.notes && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">
                                        Observações
                                    </h4>
                                    <div className="pl-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {ticket.user.notes}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <SheetFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailsOpen(false)}
                            className="w-full"
                        >
                            Fechar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}

// Novo: Painel de Histórico
function HistoryPanel({ ticket }: { ticket: Ticket }) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const allActivities = [
        {
            id: `ticket-${ticket.id}`,
            type: 'created',
            user: ticket.user.name,
            timestamp: ticket.created_at,
            description: 'Criou o chamado',
        },
        ...ticket.replies.map(reply => ({
            id: `reply-${reply.id}`,
            type: 'reply',
            user: reply.user.name,
            timestamp: reply.created_at,
            description: 'Adicionou uma resposta',
        })),
        ...ticket.appointments.map(appointment => ({
            id: `appointment-${appointment.id}`,
            type: 'appointment',
            user: appointment.user.name,
            timestamp: appointment.created_at,
            description: `Registrou ${(appointment.duration_in_minutes / 60).toFixed(1)}h de trabalho`,
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
            <CardHeader className="p-6 md:p-8 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                    Linha do Tempo
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                    {allActivities.length} atividades registradas
                </CardDescription>
            </CardHeader>
            <Separator className="bg-gray-100" />
            <CardContent className="p-6 md:p-8 pt-6">
                <div className="space-y-4">
                    {allActivities.map((activity, index) => (
                        <div key={activity.id} className="flex gap-4">
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center">
                                <Avatar className="h-8 w-8 ring-2 ring-white">
                                    <AvatarFallback className={
                                        activity.type === 'created' ? 'bg-green-500 text-white' :
                                        activity.type === 'reply' ? 'bg-blue-500 text-white' :
                                        'bg-orange-500 text-white'
                                    }>
                                        {getInitials(activity.user)}
                                    </AvatarFallback>
                                </Avatar>
                                {index < allActivities.length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-200 mt-2 flex-1" />
                                )}
                            </div>
                            
                            {/* Activity content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.user}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {activity.description}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                        {formatDate(activity.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Componente do painel de comunicação
function CommunicationPanel({ ticket, auth }: { ticket: Ticket; auth: any }) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            {/* Card de Descrição do Problema */}
            <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
                <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Descrição do Problema
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        Informação original fornecida pelo solicitante
                    </CardDescription>
                </CardHeader>
                <Separator className="bg-gray-100" />
                <CardContent className="p-6 md:p-8 pt-6">
                    <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#1E40AF] text-white text-sm font-medium">
                                {getInitials(ticket.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                                <span className="font-semibold text-gray-900">
                                    {ticket.user.name}
                                </span>
                                <Badge variant="purple">Autor</Badge>
                                <span className="text-sm text-gray-500">
                                    {formatDate(ticket.created_at)}
                                </span>
                            </div>
                            <div 
                                className="prose prose-sm max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: ticket.description }}
                            />
                            
                            {/* Anexos do Ticket */}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        Anexos ({ticket.attachments.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {ticket.attachments.map((attachment) => (
                                            <a
                                                key={attachment.id}
                                                href={`/storage/${attachment.path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-lg border border-gray-200 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                        {attachment.original_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        ({formatFileSize(attachment.size)})
                                                    </span>
                                                </div>
                                                <Download className="h-4 w-4 text-gray-400 group-hover:text-[#1E40AF]" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card de Histórico de Interações */}
            <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
                <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Histórico de Interações
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        {ticket.replies && ticket.replies.length > 0 
                            ? `${ticket.replies.length} ${ticket.replies.length === 1 ? 'resposta' : 'respostas'}`
                            : 'Nenhuma resposta ainda'
                        }
                    </CardDescription>
                </CardHeader>
                <Separator className="bg-gray-100" />
                <CardContent className="p-6 md:p-8 pt-6">
                    {ticket.replies && ticket.replies.length > 0 ? (
                        <div className="space-y-4">
                            {ticket.replies.map((reply) => (
                                <div
                                    key={reply.id}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-start space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                                                {getInitials(reply.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <span className="font-semibold text-gray-900">
                                                    {reply.user.name}
                                                </span>
                                                {reply.user_id === ticket.user_id && (
                                                    <Badge variant="purple">Autor</Badge>
                                                )}
                                                {reply.user_id === ticket.assignee_id && (
                                                    <Badge variant="info">Técnico</Badge>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <div 
                                                className="prose prose-sm max-w-none text-gray-700"
                                                dangerouslySetInnerHTML={{ __html: reply.content }}
                                            />
                                            
                                            {/* Anexos da Resposta */}
                                            {reply.attachments && reply.attachments.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <Paperclip className="h-3.5 w-3.5" />
                                                        Anexos ({reply.attachments.length})
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {reply.attachments.map((attachment) => (
                                                            <a
                                                                key={attachment.id}
                                                                href={`/storage/${attachment.path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between bg-white hover:bg-gray-50 p-2.5 rounded-lg border border-gray-200 transition-colors group"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                                        {attachment.original_name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        ({formatFileSize(attachment.size)})
                                                                    </span>
                                                                </div>
                                                                <Download className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#1E40AF]" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-base">Não há respostas neste chamado ainda.</p>
                            <p className="text-sm mt-1">Seja o primeiro a responder!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card de Adicionar Resposta */}
            <Card className="rounded-2xl border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80">
                <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Adicionar Resposta
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        Responda ao chamado com informações adicionais
                    </CardDescription>
                </CardHeader>
                <Separator className="bg-gray-100" />
                <CardContent className="p-6 md:p-8 pt-6">
                    <ReplyForm ticket={ticket} />
                </CardContent>
            </Card>
        </div>
    );
}

// Componente do painel de apontamentos
function AppointmentsPanel({
    ticket,
    auth,
    displacements,
    contracts,
}: {
    ticket: Ticket;
    auth: any;
    displacements: Displacement[] | undefined;
    contracts: Contract[];
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [expandedAppointmentId, setExpandedAppointmentId] = useState<number | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    
    // Verificar se o usuário é administrador
    const isAdmin = auth.user.is_super_admin || auth.user.groups?.some((g: any) => g.name === 'Administradores');
    
    // Verificar se pode editar apontamento
    const canEdit = (appointment: Appointment) => {
        // Administrador pode editar sempre
        if (isAdmin) return true;
        // Usuário comum só pode editar se o ticket estiver aberto
        return ticket.status === 'OPEN';
    };
    
    // Verificar se pode excluir apontamento
    const canDelete = () => {
        // Só pode excluir se o ticket estiver aberto
        return ticket.status === 'OPEN';
    };
    
    // Função para excluir apontamento
    const handleDeleteAppointment = () => {
        if (appointmentToDelete) {
            router.delete(route('tickets.appointments.destroy', [ticket.id, appointmentToDelete]), {
                preserveScroll: true,
                onSuccess: () => {
                    setAppointmentToDelete(null);
                },
            });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const totalHours =
        ticket.appointments?.reduce(
            (total, appointment) => total + appointment.duration_in_minutes,
            0,
        ) || 0;
    const uniqueTechnicians = new Set(
        ticket.appointments?.map((app) => app.user.name) || [],
    ).size;

    return (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {uniqueTechnicians}
                        </div>
                        <p className="text-sm text-gray-500">Técnicos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {formatDuration(totalHours)}
                        </div>
                        <p className="text-sm text-gray-500">Horas Totais</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                            {ticket.appointments?.length || 0}
                        </div>
                        <p className="text-sm text-gray-500">
                            Total Apontamentos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            0
                        </div>
                        <p className="text-sm text-gray-500">Deslocamentos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Botão e Modal para Novo Apontamento */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Apontamentos de Tempo</CardTitle>
                        <Sheet
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                        >
                            <SheetTrigger asChild>
                                <Button>+ Novo Apontamento</Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-2xl">
                                <SheetHeader>
                                    <SheetTitle>Novo Apontamento</SheetTitle>
                                    <SheetDescription>
                                        Registre o tempo gasto trabalhando neste
                                        chamado.
                                    </SheetDescription>
                                </SheetHeader>
                                {/* Verificar se ticket e displacements existem antes de renderizar o formulário */}
                                {ticket && Array.isArray(displacements) ? (
                                    <AppointmentForm
                                        ticket={ticket}
                                        displacements={displacements}
                                        contracts={contracts}
                                        onClose={() => setIsDialogOpen(false)}
                                    />
                                ) : (
                                    <div className="p-4 text-red-600">
                                        Erro ao carregar dados necessários. Por
                                        favor, recarregue a página.
                                    </div>
                                )}
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {ticket.appointments && ticket.appointments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead>Atendente</TableHead>
                                    <TableHead>Data do apontamento</TableHead>
                                    <TableHead>Atendimento</TableHead>
                                    <TableHead>Contrato / Serviço</TableHead>
                                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ticket.appointments.map((appointment) => (
                                    <>
                                        <TableRow 
                                            key={appointment.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => setExpandedAppointmentId(
                                                expandedAppointmentId === appointment.id 
                                                    ? null 
                                                    : appointment.id
                                            )}
                                        >
                                            <TableCell>
                                                {expandedAppointmentId === appointment.id ? (
                                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                                                            {getInitials(appointment.user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">
                                                        {appointment.user.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm">
                                                        {formatDate(appointment.start_time)} - {new Date(appointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge variant="info" className="w-fit text-xs">
                                                        {formatDuration(appointment.duration_in_minutes)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {appointment.service_type || 'Remoto'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm">
                                                        {appointment.contract?.name || 'Serviço avulso'}
                                                    </span>
                                                    {appointment.is_billable && (
                                                        <Badge variant="success" className="w-fit text-xs">
                                                            Faturável
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit(appointment) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setAppointmentToEdit(appointment)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit2 className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    )}
                                                    {canDelete() && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setAppointmentToDelete(appointment.id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Linha expandida com descrição e deslocamento */}
                                        {expandedAppointmentId === appointment.id && (
                                            <TableRow key={`${appointment.id}-detail`}>
                                                <TableCell colSpan={6} className="bg-gray-50 border-t-0">
                                                    <div className="py-3 px-2 space-y-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-700 uppercase">
                                                                Descrição
                                                            </span>
                                                            <p className="text-sm text-gray-700 mt-1">
                                                                {appointment.description || 'Sem descrição'}
                                                            </p>
                                                        </div>
                                                        {appointment.displacement && (
                                                            <div>
                                                                <span className="text-xs font-semibold text-gray-700 uppercase">
                                                                    Deslocamento
                                                                </span>
                                                                <p className="text-sm text-gray-700 mt-1">
                                                                    {appointment.displacement.name} (R$ {parseFloat(appointment.displacement.cost.toString()).toFixed(2)})
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>Nenhum apontamento cadastrado.</p>
                            <p className="text-sm">
                                Clique em "Novo Apontamento" para registrar o
                                primeiro.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={!!appointmentToDelete} onOpenChange={() => setAppointmentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Excluir Apontamento
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este apontamento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteAppointment}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Dialog de Edição de Apontamento */}
            {appointmentToEdit && (
                <Sheet open={!!appointmentToEdit} onOpenChange={() => setAppointmentToEdit(null)}>
                    <SheetContent className="sm:max-w-2xl">
                        <SheetHeader>
                            <SheetTitle>Editar Apontamento</SheetTitle>
                            <SheetDescription>
                                Altere as informações do apontamento de tempo.
                            </SheetDescription>
                        </SheetHeader>
                        <AppointmentForm
                            ticket={ticket}
                            displacements={displacements}
                            contracts={contracts}
                            onClose={() => setAppointmentToEdit(null)}
                            appointment={appointmentToEdit}
                        />
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

// Componente de formulário para novo/editar apontamento
function AppointmentForm({
    ticket,
    displacements,
    contracts,
    onClose,
    appointment,
}: {
    ticket: Ticket;
    displacements: Displacement[] | undefined;
    contracts: Contract[];
    onClose: () => void;
    appointment?: Appointment;
}) {
    // Inicialização completa de todos os campos do formulário para evitar componentes não controlados
    const { data, setData, post, put, processing, errors, reset } = useForm({
        description: appointment?.description || "",
        start_time: appointment?.start_time ? new Date(appointment.start_time).toISOString().slice(0, 16) : "",
        end_time: appointment?.end_time ? new Date(appointment.end_time).toISOString().slice(0, 16) : "",
        is_billable: appointment?.is_billable ?? true,
        service_type: appointment?.service_type || "Remoto",
        billing_type: appointment?.billing_type || "Contrato",
        displacement_id: appointment?.displacement_id?.toString() || "",
        contract_id: appointment?.contract_id?.toString() || "",
    });

    // Estado para controlar quais deslocamentos mostrar
    const [availableDisplacements, setAvailableDisplacements] = useState<
        Array<{ id: number; name: string; cost: number | string }>
    >([]);

    // Atualizar deslocamentos disponíveis quando o contrato ou tipo de faturamento mudar
    useEffect(() => {
        if (data.service_type === "Externo") {
            if (data.billing_type === "Contrato" && data.contract_id) {
                // Buscar deslocamentos do contrato selecionado
                const selectedContract = contracts.find(
                    (c) => c.id.toString() === data.contract_id
                );
                if (selectedContract && selectedContract.displacements) {
                    setAvailableDisplacements(
                        selectedContract.displacements.map((d) => ({
                            id: d.id,
                            name: d.name,
                            cost: d.value,
                        }))
                    );
                } else {
                    setAvailableDisplacements([]);
                }
            } else {
                // Usar deslocamentos globais
                setAvailableDisplacements(
                    Array.isArray(displacements)
                        ? displacements.map((d) => ({
                              id: d.id,
                              name: d.name,
                              cost: d.cost,
                          }))
                        : []
                );
            }
        } else {
            setAvailableDisplacements([]);
        }
    }, [data.service_type, data.billing_type, data.contract_id, contracts, displacements]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (appointment) {
            // Editar apontamento existente
            put(route("tickets.appointments.update", [ticket.id, appointment.id]), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Erro ao editar apontamento:", errors);
                },
            });
        } else {
            // Criar novo apontamento
            post(route("tickets.appointments.store", ticket.id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Erro ao criar apontamento:", errors);
                },
            });
        }
    }

    return (
        <div className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos obrigatórios */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Início
                        </label>
                        <input
                            type="datetime-local"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.start_time}
                            onChange={(e) =>
                                setData("start_time", e.target.value)
                            }
                            required
                        />
                        {errors.start_time && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.start_time}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fim
                        </label>
                        <input
                            type="datetime-local"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.end_time}
                            onChange={(e) =>
                                setData("end_time", e.target.value)
                            }
                            required
                        />
                        {errors.end_time && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.end_time}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tipo de Serviço e Faturamento */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tipo de Serviço
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.service_type}
                            onChange={(e) =>
                                setData("service_type", e.target.value)
                            }
                            required
                        >
                            <option value="">Selecione o tipo</option>
                            <option value="Remoto">Remoto</option>
                            <option value="Externo">Externo</option>
                            <option value="Interno">Interno</option>
                        </select>
                        {errors.service_type && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.service_type}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tipo de Faturamento
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.billing_type}
                            onChange={(e) =>
                                setData("billing_type", e.target.value)
                            }
                            required
                        >
                            <option value="Contrato">Contrato</option>
                            <option value="Avulso">Avulso</option>
                        </select>
                        {errors.billing_type && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.billing_type}
                            </p>
                        )}
                    </div>
                </div>

                {/* Campo de Contrato (apenas se o tipo de faturamento for "Contrato") */}
                {data.billing_type === "Contrato" && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contrato
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.contract_id}
                            onChange={(e) =>
                                setData("contract_id", e.target.value)
                            }
                        >
                            <option value="">Selecione o contrato</option>
                            {Array.isArray(contracts) && contracts.length > 0 ? (
                                contracts.map((contract) => (
                                    <option
                                        key={contract.id}
                                        value={contract.id.toString()}
                                    >
                                        {contract.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    Nenhum contrato disponível
                                </option>
                            )}
                        </select>
                        {errors.contract_id && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.contract_id}
                            </p>
                        )}
                    </div>
                )}

                {/* Campo de Deslocamento (apenas se o tipo de serviço for "Externo") */}
                {data.service_type === "Externo" && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Deslocamento <span className="text-red-600">*</span>
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.displacement_id}
                            onChange={(e) =>
                                setData("displacement_id", e.target.value)
                            }
                            required={data.service_type === "Externo"}
                        >
                            <option value="">Selecione o deslocamento</option>
                            {availableDisplacements.length > 0 ? (
                                availableDisplacements.map((displacement) => (
                                    <option
                                        key={displacement.id}
                                        value={displacement.id.toString()}
                                    >
                                        {displacement.name} (R${" "}
                                        {parseFloat(
                                            displacement.cost.toString(),
                                        ).toFixed(2)}
                                        )
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    {data.billing_type === "Contrato" && data.contract_id
                                        ? "Nenhum deslocamento cadastrado neste contrato"
                                        : "Nenhum deslocamento disponível"}
                                </option>
                            )}
                        </select>
                        {errors.displacement_id && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.displacement_id}
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descrição do Trabalho
                    </label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] min-h-[100px]"
                        placeholder="Descreva o trabalho realizado..."
                        value={data.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData("description", e.target.value)}
                        required
                    />
                    {errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.description}
                        </p>
                    )}
                </div>

                {/* Checkbox faturável */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_billable"
                        checked={data.is_billable}
                        onChange={(e) =>
                            setData("is_billable", e.target.checked)
                        }
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <label
                        htmlFor="is_billable"
                        className="text-sm text-gray-700 dark:text-gray-300"
                    >
                        Tempo faturável
                    </label>
                </div>

                <SheetFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? "Salvando..." : "Salvar Apontamento"}
                    </Button>
                </SheetFooter>
            </form>
        </div>
    );
}

// Componente de formulário para nova resposta
function ReplyForm({ ticket }: { ticket: Ticket }) {
    const [attachments, setAttachments] = useState<File[]>([]);
    const { data, setData, post, processing, errors, reset } = useForm({
        content: "",
    });

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        // Criar FormData manualmente
        const formData = new FormData();
        formData.append('content', data.content);
        
        // Adicionar anexos
        attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        // Usar router.post diretamente
        router.post(route("tickets.replies.store", ticket.id), formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset("content");
                setAttachments([]);
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <TiptapEditor
                    content={data.content}
                    onChange={(content) => setData("content", content)}
                    placeholder="Digite sua resposta com informações adicionais..."
                />
                {errors.content && (
                    <p className="text-sm text-red-600 mt-2">
                        {errors.content}
                    </p>
                )}
            </div>

            {/* Anexos */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('reply-file-upload')?.click()}
                        className="gap-2"
                    >
                        <Paperclip className="h-4 w-4" />
                        Adicionar Arquivos
                    </Button>
                    <input
                        id="reply-file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setAttachments([...attachments, ...files]);
                        }}
                    />
                </div>

                {/* Lista de anexos */}
                {attachments.length > 0 && (
                    <div className="space-y-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        ({formatFileSize(file.size)})
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setAttachments(
                                            attachments.filter((_, i) => i !== index)
                                        );
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={processing || !data.content.trim()}
                    className="min-w-[120px] bg-[#1E40AF] hover:bg-[#3B82F6] transition-all"
                >
                    {processing ? "Enviando..." : "Enviar Resposta"}
                </Button>
            </div>
        </form>
    );
}

// Componente de botão para edição de ticket
function EditTicketButton({ ticket, technicians, clients }: { ticket: Ticket; technicians: User[]; clients: Client[] }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const { data, setData, put, processing, errors } = useForm({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        stage: ticket.stage,
        assignee_id: ticket.assignee_id ? ticket.assignee_id.toString() : '0',
        // Mantendo user_id do ticket original, não será editável
        user_id: ticket.user_id.toString(),
    });
    
    // UseEffect para recarregar os dados quando o modal abre ou o ticket muda
    useEffect(() => {
        if (isOpen && ticket) {
            // Reinicia os dados do formulário com os valores atuais do ticket
            setData({
                title: ticket.title || '',
                description: ticket.description || '',
                status: ticket.status || 'open',
                priority: ticket.priority || 'medium',
                stage: ticket.stage || 'new',
                assignee_id: ticket.assignee_id ? ticket.assignee_id.toString() : '0',
                user_id: ticket.user_id ? ticket.user_id.toString() : '',
            });
        }
    }, [isOpen, ticket, setData]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        // Preparar dados para envio - converter assignee_id="0" para null
        const formData = {
            _method: 'PUT', // Importante para o Laravel entender que é uma atualização
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            stage: data.stage,
            assignee_id: data.assignee_id === '0' ? null : data.assignee_id,
            // Não alteramos o user_id
        };
        
        // Enviar a requisição de atualização
        router.post(route('tickets.update', ticket.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Fechar o modal após sucesso
                setIsOpen(false);
                // Recarregar a página para atualizar os dados
                router.reload({ only: ['ticket'] });
            },
            onError: (errors) => {
                console.error('Erro ao atualizar o chamado:', errors);
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">Editar Chamado</Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Editar Chamado #{ticket.id}</SheetTitle>
                    <SheetDescription>Atualize as informações do chamado conforme necessário.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    {/* Informações de cliente e solicitante (não editáveis) */}
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="font-medium text-gray-700 mb-2">Informações do Solicitante</div>
                        <div className="text-sm flex gap-x-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Cliente:</span>
                                    <span className="text-amber-600 font-medium">
                                        {ticket.client?.name || 'Nenhum cliente vinculado'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="font-medium">Solicitante:</span> {ticket.contact?.name || 'N/A'}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Estas informações não podem ser modificadas
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Descrição do Problema</label>
                        <TiptapEditor
                            content={data.description}
                            onChange={(content) => setData('description', content)}
                            placeholder="Descreva o problema em detalhes..."
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Prioridade</label>
                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Baixa</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Estágio</label>
                        <Select value={data.stage} onValueChange={(value) => setData('stage', value)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDENTE">Pendente</SelectItem>
                                <SelectItem value="N1">N1</SelectItem>
                                <SelectItem value="N2">N2</SelectItem>
                                <SelectItem value="EXTERNO">Externo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Responsável (Técnico)</label>
                        <Select value={data.assignee_id || '0'} onValueChange={(value) => setData('assignee_id', value === '0' ? '' : value)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione um técnico" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Não atribuído</SelectItem>
                                {technicians.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id.toString()}>
                                        {tech.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <SheetFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[#1E40AF] hover:bg-[#3B82F6]">
                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
