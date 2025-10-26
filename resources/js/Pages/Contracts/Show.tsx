import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  CalendarRange,
  Car,
  Copy,
  Download,
  FileText,
  FilePlus,
  Mail,
  MoreVertical,
  PencilLine,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  User as UserIcon,
  Wallet,
  XCircle,
  AlertCircle,
  ClipboardList,
  Clock,
  Ticket,
  Infinity,
  Package,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Separator } from '@/Components/ui/separator';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/Components/ui/tooltip';
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters';
import { Contract, ContractItem, ContractVersion, PageProps } from '@/types';

const statusVariantMap: Record<string, 'success' | 'secondary'> = {
  Ativo: 'success',
  Inativo: 'secondary',
};

interface ShowProps extends PageProps {
  contract: Contract;
  hasAppointments: boolean;
}

export default function ShowContract({ auth, contract, hasAppointments }: ShowProps) {
  // Aceitar tanto camelCase quanto snake_case do backend
  const activeVersion = contract.activeVersion || (contract as any).active_version;
  const contractType = contract.contractType || (contract as any).contract_type;
  const versions = contract.versions || (contract as any).versions || [];
  const items = contract.items || (contract as any).items || [];
  
  console.log('🔍 DEBUG Contract:', { 
    contractId: contract?.id,
    hasActiveVersion: !!activeVersion,
    activeVersion,
    contractType,
    client: contract?.client,
    monthlyValue: activeVersion?.monthly_value,
    dueDay: activeVersion?.due_day,
    fullContract: contract
  });
  
  const [isEditingDueDay, setIsEditingDueDay] = useState(false);
  const [dueDay, setDueDay] = useState(activeVersion?.due_day?.toString() || '');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  // Calcular duração e progresso do contrato
  const calculateContractProgress = () => {
    if (!activeVersion?.start_date) return { duration: 0, progress: 0, remainingMonths: 0 };
    
    const startDate = new Date(activeVersion.start_date);
    const endDate = activeVersion.expiration_term ? new Date(activeVersion.expiration_term) : null;
    const today = new Date();
    
    if (!endDate) return { duration: 0, progress: 0, remainingMonths: 0 };
    
    // Calcular duração total em meses
    const totalMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    // Calcular meses decorridos
    const elapsedMonths = Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    // Calcular progresso (0-100%)
    const progress = Math.min(Math.max((elapsedMonths / totalMonths) * 100, 0), 100);
    
    // Calcular meses restantes
    const remainingMonths = Math.max(totalMonths - elapsedMonths, 0);
    
    return { 
      duration: totalMonths, 
      progress: Math.round(progress), 
      remainingMonths: Math.round(remainingMonths) 
    };
  };

  const contractProgress = calculateContractProgress();

  const { data: notificationData, setData: setNotificationData, post: postNotification, processing: processingNotification, reset: resetNotification, errors: notificationErrors } = useForm({
    email: '',
    days_before: 0,
    on_cancellation: false,
    on_adjustment: false,
  });

  const { data: displacementData, setData: setDisplacementData, post: postDisplacement, processing: processingDisplacement, reset: resetDisplacement, errors: displacementErrors } = useForm({
    name: '',
    value: '',
    quantity_included: 0,
  });

  const handleUpdateSafeField = (field: 'due_day' | 'auto_renewal', value: string | boolean) => {
    router.patch(
      route('contracts.update-safe-fields', contract.id),
      { [field]: value },
      {
        preserveScroll: true,
        onSuccess: () => {
          if (field === 'due_day') {
            setIsEditingDueDay(false);
          }
        },
      }
    );
  };

  const handleSubmitNotification = (e: React.FormEvent) => {
    e.preventDefault();
    postNotification(route('contracts.notifications.store', contract.id), {
      preserveScroll: true,
      onSuccess: () => {
        resetNotification();
        setShowNotificationForm(false);
      },
    });
  };

  const handleDeleteNotification = (notificationId: number) => {
    if (confirm('Tem certeza que deseja remover esta notificação?')) {
      router.delete(route('contracts.notifications.destroy', [contract.id, notificationId]), {
        preserveScroll: true,
      });
    }
  };

  const handleSubmitDisplacement = (e: React.FormEvent) => {
    e.preventDefault();
    postDisplacement(route('contracts.displacements.store', contract.id), {
      preserveScroll: true,
      onSuccess: () => {
        resetDisplacement();
      },
    });
  };

  const handleDeleteDisplacement = (displacementId: number) => {
    if (confirm('Tem certeza que deseja remover este deslocamento?')) {
      router.delete(route('contracts.displacements.destroy', [contract.id, displacementId]), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Contrato · ${contract.name}`} />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit(route('contracts.index'))}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Contrato #{contract.id}</h1>
                <Badge 
                  variant={activeVersion?.status === 'Ativo' ? 'success' : 'secondary'}
                  className="text-sm"
                >
                  {activeVersion?.status ?? 'Ativo'}
                </Badge>
              </div>
              <p className="mt-1 text-base text-gray-600">
                {contract.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Cliente: {contract.client?.name ?? '-'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const win = window.open(route('contracts.index'), '_blank');
                  if (win) win.focus();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(route('contracts.edit', contract.id))}
                        disabled={hasAppointments}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {hasAppointments && (
                    <TooltipContent className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Não é possível editar, pois este contrato já possui apontamentos. Use a função "Gerar Adendo" para alterações.
                        </p>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.visit(route('tickets.create'))}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Ticket
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => router.visit(route('contracts.addendum.create', contract.id))}
                    disabled={!hasAppointments}
                    className="gap-2"
                  >
                    <FilePlus className="h-4 w-4" />
                    Gerar Adendo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsProcessing(true);
                      router.post(route('contracts.duplicate', contract.id), {}, {
                        preserveScroll: true,
                        onFinish: () => setIsProcessing(false),
                      });
                    }}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar contrato
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="gap-2 text-orange-600 focus:text-orange-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar contrato
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="gap-2 text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover contrato
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <Tabs defaultValue="informacoes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes" className="space-y-6">
            {/* Grid principal de 2 colunas */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* COLUNA ESQUERDA */}
              <div className="space-y-6">
                {/* Card Resumo Financeiro */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-green-100 p-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">Resumo Financeiro</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Valor Mensal</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrencyBRL(Number(activeVersion?.monthly_value ?? 0))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Faturamento */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">Faturamento</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {activeVersion?.billing_type && (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Tipo de Faturamento</span>
                            <span className="text-sm font-medium text-gray-900">{activeVersion.billing_type}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Dia de Vencimento</span>
                        <span className="text-sm font-medium text-gray-900">
                          {activeVersion?.due_day ? `Todo dia ${activeVersion.due_day}` : '-'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Forma de Pagamento</span>
                        <span className="text-sm font-medium text-gray-900">
                          {activeVersion?.payment_method ?? '-'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Ciclo de Faturamento</span>
                        <span className="text-sm font-medium text-gray-900">
                          {activeVersion?.billing_cycle ?? '-'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Ciclo de Fechamento</span>
                        <span className="text-sm font-medium text-gray-900">
                          {activeVersion?.closing_cycle ?? '-'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* COLUNA DIREITA */}
              <div className="space-y-6">
                {/* Card Vigência do Contrato */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <CalendarRange className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">Vigência do Contrato</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de Início</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeVersion?.start_date ? formatDateBR(activeVersion.start_date) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de Término</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeVersion?.expiration_term ? formatDateBR(activeVersion.expiration_term) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duração</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {contractProgress.duration > 0 ? `${contractProgress.duration} ${contractProgress.duration === 1 ? 'mês' : 'meses'}` : '-'}
                        </p>
                      </div>
                    </div>

                    {contractProgress.duration > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Progresso do Contrato</span>
                          <span className="text-sm font-semibold text-blue-600">{contractProgress.progress}% concluído</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300" style={{ width: `${contractProgress.progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          {contractProgress.remainingMonths > 0 
                            ? `Restam ${contractProgress.remainingMonths} ${contractProgress.remainingMonths === 1 ? 'mês' : 'meses'} para o término`
                            : 'Contrato finalizado'}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Renovação Automática */}
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="space-y-0.5">
                        <label htmlFor="auto_renewal" className="text-sm font-medium text-gray-900">
                          Renovação Automática
                        </label>
                        <p className="text-xs text-gray-500">
                          {activeVersion?.auto_renewal ? 'O contrato será renovado automaticamente' : 'O contrato não será renovado automaticamente'}
                        </p>
                      </div>
                      <Switch
                        id="auto_renewal"
                        checked={activeVersion?.auto_renewal ?? false}
                        onCheckedChange={(checked) => {
                          if (contract?.id) {
                            handleUpdateSafeField('auto_renewal', checked);
                          }
                        }}
                        disabled={!contract?.id}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Card Informações do Cliente */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <UserIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">Informações do Cliente</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Razão Social</p>
                        <p className="text-sm font-medium text-gray-900">{contract.client?.name ?? '-'}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                        <p className="text-sm font-medium text-gray-900">{contract.client?.document ?? '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Card Observações Técnicas (full width) */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-yellow-100 p-2">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Observações Técnicas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {contract.technical_notes ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                    {contract.technical_notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma observação técnica registrada.</p>
                )}
              </CardContent>
            </Card>

            {/* Card Detalhamento do Contrato (full width) */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Detalhamento do Contrato</CardTitle>
                </div>
                <CardDescription>
                  Especificações conforme modalidade {contractType?.name ? `"${contractType.name}"` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Renderização dinâmica por modalidade */}
                {(() => {
                  const modality = contractType?.modality?.toLowerCase();

                  // Modalidade: Horas
                  if (modality === 'horas') {
                    return (
                      <div className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Horas Incluídas por Ciclo</p>
                              <p className="text-2xl font-bold text-blue-600 mt-1">
                                {activeVersion?.included_hours ? `${activeVersion.included_hours}h` : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Valor Hora Extra</p>
                              <p className="text-2xl font-bold text-orange-600 mt-1">
                                {activeVersion?.extra_hour_value ? formatCurrencyBRL(Number(activeVersion.extra_hour_value)) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {activeVersion?.rollover_active && (
                          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                            <div className="flex items-start gap-3">
                              <RefreshCw className="h-5 w-5 text-purple-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-purple-900 mb-2">Horas Cumulativas (Rollover) Ativo</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="text-xs text-purple-700">Janela de acúmulo</p>
                                    <p className="text-sm font-medium text-purple-900">
                                      {activeVersion.rollover_days_window ? `${activeVersion.rollover_days_window} dias` : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700">Limite de horas acumuláveis</p>
                                    <p className="text-sm font-medium text-purple-900">
                                      {activeVersion.rollover_hours_limit ? `${activeVersion.rollover_hours_limit}h` : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Modalidade: Por Atendimento
                  if (modality === 'por atendimento') {
                    return (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                          <Ticket className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Atendimentos Incluídos</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              {activeVersion?.included_tickets ?? '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                          <Ticket className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Valor por Atendimento Extra</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                              {activeVersion?.extra_ticket_value ? formatCurrencyBRL(Number(activeVersion.extra_ticket_value)) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Modalidade: Livre (Ilimitado)
                  if (modality === 'livre' || modality === 'ilimitado') {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                          <Infinity className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 mb-2">Atendimento Ilimitado</p>
                            <p className="text-xs text-green-700">Este contrato permite atendimentos ilimitados dentro do escopo contratado.</p>
                          </div>
                        </div>
                        {activeVersion?.scope_included && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Escopo Incluído:</p>
                            <p className="whitespace-pre-line text-sm text-gray-700 rounded-lg bg-gray-50 p-3">
                              {activeVersion.scope_included}
                            </p>
                          </div>
                        )}
                        {activeVersion?.scope_excluded && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Escopo Excluído:</p>
                            <p className="whitespace-pre-line text-sm text-gray-700 rounded-lg bg-gray-50 p-3">
                              {activeVersion.scope_excluded}
                            </p>
                          </div>
                        )}
                        {activeVersion?.fair_use_policy && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Política de Uso Justo:</p>
                            <p className="whitespace-pre-line text-sm text-gray-700 rounded-lg bg-gray-50 p-3">
                              {activeVersion.fair_use_policy}
                            </p>
                          </div>
                        )}
                        {activeVersion?.visit_limit && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">Limite de visitas presenciais:</span>
                            <span className="font-semibold text-blue-600">{activeVersion.visit_limit} visitas/mês</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Modalidade: SaaS/Produto
                  if (modality === 'saas' || modality === 'produto') {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Itens/Produtos do Contrato</p>
                            <p className="text-xs text-blue-700">
                              Produtos ou serviços incluídos na mensalidade
                            </p>
                          </div>
                        </div>
                        {items && items.length > 0 ? (
                          <div className="space-y-2">
                            {items.map((item: ContractItem, index: number) => (
                              <div key={item.id || index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.name || '-'}</p>
                                  <p className="text-xs text-gray-500 mt-1">Qtd: {item.quantity ?? 1}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xs text-gray-500 mb-1">Unitário</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.unit_value ? formatCurrencyBRL(Number(item.unit_value)) : '-'}
                                  </p>
                                  {item.total_value && (
                                    <>
                                      <p className="text-xs text-gray-500 mt-2 mb-1">Total</p>
                                      <p className="text-sm font-bold text-blue-600">
                                        {formatCurrencyBRL(Number(item.total_value))}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">Nenhum item cadastrado.</p>
                        )}
                        {activeVersion?.appointments_when_pending && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs text-amber-800">
                              <strong>Atenção:</strong> Permite apontamentos mesmo com itens pendentes de faturamento.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Modalidade não identificada ou sem especificação
                  return (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">
                        Modalidade não identificada ou sem configuração específica.
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Serviços do Contrato</CardTitle>
                <CardDescription>
                  Lista de serviços inclusos neste contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Em desenvolvimento...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Histórico de valores</CardTitle>
                <CardDescription>
                  Todas as versões e adendos criados para este contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adendo</TableHead>
                      <TableHead>Atualizado por</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Valor mensal</TableHead>
                      <TableHead>Data de início</TableHead>
                      <TableHead>Atividade</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions && versions.length > 0 ? (
                      versions.map((version: ContractVersion) => (
                        <TableRow key={version.id}>
                          <TableCell className="font-medium text-primary">
                            {version.version}
                          </TableCell>
                          <TableCell>{version.user?.name ?? '-'}</TableCell>
                          <TableCell>{formatDateBR(version.created_at)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {version.monthly_value ? formatCurrencyBRL(Number(version.monthly_value)) : '-'}
                          </TableCell>
                          <TableCell>
                            {version.start_date ? formatDateBR(version.start_date) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{version.activity_type ?? 'N/A'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {version.description ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          Nenhuma versão encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Documentos relacionados ao contrato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Em desenvolvimento...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>
                      Configure regras de notificação por e-mail para eventos do contrato.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowNotificationForm(!showNotificationForm)}
                    size="sm"
                    variant={showNotificationForm ? "outline" : "default"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showNotificationForm ? 'Cancelar' : 'Adicionar E-mail'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showNotificationForm && (
                  <form onSubmit={handleSubmitNotification} className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          E-mail *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={notificationData.email}
                          onChange={(e) => setNotificationData('email', e.target.value)}
                          placeholder="exemplo@email.com"
                          required
                          className={notificationErrors.email ? 'border-red-500' : ''}
                        />
                        {notificationErrors.email && (
                          <p className="text-sm text-red-600">{notificationErrors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="days_before" className="text-sm font-medium">
                          Dias antes *
                        </label>
                        <Input
                          id="days_before"
                          type="number"
                          min="0"
                          max="365"
                          value={notificationData.days_before}
                          onChange={(e) => setNotificationData('days_before', parseInt(e.target.value) || 0)}
                          required
                          className={notificationErrors.days_before ? 'border-red-500' : ''}
                        />
                        {notificationErrors.days_before && (
                          <p className="text-sm text-red-600">{notificationErrors.days_before}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div className="space-y-0.5">
                          <label htmlFor="on_cancellation" className="text-sm font-medium">
                            Cancelamento
                          </label>
                          <p className="text-xs text-gray-500">
                            Notificar sobre cancelamento
                          </p>
                        </div>
                        <Switch
                          id="on_cancellation"
                          checked={notificationData.on_cancellation}
                          onCheckedChange={(checked) => setNotificationData('on_cancellation', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div className="space-y-0.5">
                          <label htmlFor="on_adjustment" className="text-sm font-medium">
                            Reajuste
                          </label>
                          <p className="text-xs text-gray-500">
                            Notificar sobre reajuste
                          </p>
                        </div>
                        <Switch
                          id="on_adjustment"
                          checked={notificationData.on_adjustment}
                          onCheckedChange={(checked) => setNotificationData('on_adjustment', checked)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetNotification();
                          setShowNotificationForm(false);
                        }}
                        disabled={processingNotification}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={processingNotification}>
                        {processingNotification ? 'Salvando...' : 'Salvar Notificação'}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {contract.notifications && contract.notifications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Dias antes</TableHead>
                          <TableHead className="text-center">Cancelamento</TableHead>
                          <TableHead className="text-center">Reajuste</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.notifications.map((notification) => (
                          <TableRow key={notification.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {notification.email}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{notification.days_before}</TableCell>
                            <TableCell className="text-center">
                              {notification.on_cancellation ? (
                                <Badge variant="success">Ativo</Badge>
                              ) : (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {notification.on_adjustment ? (
                                <Badge variant="success">Ativo</Badge>
                              ) : (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-sm font-medium text-gray-900">Nenhuma notificação cadastrada</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Clique em "Adicionar E-mail" para criar uma nova regra de notificação.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deslocamentos">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Deslocamentos</CardTitle>
                <CardDescription>
                  Configure os deslocamentos inclusos no contrato.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmitDisplacement} className="rounded-lg border border-primary/20 bg-primary/5 p-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="displacement_name" className="text-sm font-medium">
                        Nome *
                      </label>
                      <Input
                        id="displacement_name"
                        type="text"
                        value={displacementData.name}
                        onChange={(e) => setDisplacementData('name', e.target.value)}
                        placeholder="Ex: Visita Padrão"
                        required
                        className={displacementErrors.name ? 'border-red-500' : ''}
                      />
                      {displacementErrors.name && (
                        <p className="text-sm text-red-600">{displacementErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="displacement_value" className="text-sm font-medium">
                        Valor *
                      </label>
                      <Input
                        id="displacement_value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={displacementData.value}
                        onChange={(e) => setDisplacementData('value', e.target.value)}
                        placeholder="0,00"
                        required
                        className={displacementErrors.value ? 'border-red-500' : ''}
                      />
                      {displacementErrors.value && (
                        <p className="text-sm text-red-600">{displacementErrors.value}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="displacement_quantity" className="text-sm font-medium">
                        Quantidade *
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="displacement_quantity"
                          type="number"
                          min="0"
                          value={displacementData.quantity_included}
                          onChange={(e) => setDisplacementData('quantity_included', parseInt(e.target.value) || 0)}
                          required
                          className={displacementErrors.quantity_included ? 'border-red-500' : ''}
                        />
                        <Button type="submit" disabled={processingDisplacement} className="whitespace-nowrap">
                          <Plus className="h-4 w-4 mr-2" />
                          {processingDisplacement ? 'Salvando...' : 'Adicionar'}
                        </Button>
                      </div>
                      {displacementErrors.quantity_included && (
                        <p className="text-sm text-red-600">{displacementErrors.quantity_included}</p>
                      )}
                    </div>
                  </div>
                </form>

                <div className="space-y-4">
                  {contract.displacements && contract.displacements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-center">Quantidade inclusa no período</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.displacements.map((displacement) => (
                          <TableRow key={displacement.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                {displacement.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrencyBRL(Number(displacement.value))}
                            </TableCell>
                            <TableCell className="text-center">{displacement.quantity_included}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDisplacement(displacement.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Car className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-sm font-medium text-gray-900">Nenhum deslocamento cadastrado</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Preencha o formulário acima para adicionar um deslocamento.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Confirmação - Cancelar Contrato */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <XCircle className="h-5 w-5" />
              Cancelar Contrato
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este contrato?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-600" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-orange-900">Esta ação irá:</p>
                  <ul className="list-inside list-disc space-y-1 text-orange-800">
                    <li>Alterar o status da versão ativa para "Cancelado"</li>
                    <li>Desativar a renovação automática</li>
                    <li>Manter o histórico do contrato preservado</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              O contrato não será excluído e você poderá visualizar seu histórico posteriormente.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsProcessing(true);
                router.patch(
                  route('contracts.cancel', contract.id),
                  {},
                  {
                    preserveScroll: true,
                    onFinish: () => {
                      setIsProcessing(false);
                      setIsCancelDialogOpen(false);
                    },
                  }
                );
              }}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Cancelando...' : 'Sim, cancelar contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação - Remover Contrato */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Remover Contrato
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível e removerá permanentemente este contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-red-900">ATENÇÃO: Esta ação irá:</p>
                  <ul className="list-inside list-disc space-y-1 text-red-800">
                    <li>Excluir permanentemente o contrato</li>
                    <li>Remover todo o histórico de versões</li>
                    <li>Apagar todos os dados relacionados</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              Tem certeza absoluta que deseja continuar?
            </p>
            <p className="text-sm text-gray-600">
              Esta operação não pode ser desfeita. Todos os dados serão perdidos permanentemente.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsProcessing(true);
                router.delete(route('contracts.destroy', contract.id), {
                  onFinish: () => {
                    setIsProcessing(false);
                    setIsDeleteDialogOpen(false);
                  },
                });
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Removendo...' : 'Sim, remover permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
