import { Head, router, useForm } from '@inertiajs/react';
import { Settings, Plus, Trash2, Edit as EditIcon, Clock, Users } from 'lucide-react';
import { useState } from 'react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Priority, Service, Client, Group } from '@/types';

interface ServiceExpedient {
  id: number;
  service_id: number;
  tenant_id: number;
  days_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

interface ServiceStage {
  id: number;
  service_id: number;
  tenant_id: number;
  name: string;
  sla_time: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  service: Service & {
    clients?: Client[];
    groups?: Group[];
    expedients?: ServiceExpedient[];
    stages?: ServiceStage[];
  };
  availableClients: Client[];
  availableGroups: Group[];
}

export default function Edit({ service, availableClients, availableGroups }: Props) {
  const { data, setData, patch, processing, errors } = useForm({
    review_type: service.review_type || '',
    review_time_limit: service.review_time_limit || 0,
    allow_reopen_after_review: service.allow_reopen_after_review || false,
  });

  // Estados para modal de prioridade
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);

  // Estado para adicionar cliente
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Estado para adicionar grupo
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Estados para expediente
  const [showExpedientDialog, setShowExpedientDialog] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);  

  const {
    data: expedientData,
    setData: setExpedientData,
    post: postExpedient,
    processing: processingExpedient,
    reset: resetExpedient,
    errors: expedientErrors,
  } = useForm({
    days_of_week: '',
    start_time: '08:00',
    end_time: '18:00',
  });

  // Estados para estágio
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<ServiceStage | null>(null);

  const {
    data: stageData,
    setData: setStageData,
    post: postStage,
    put: putStage,
    processing: processingStage,
    reset: resetStage,
    errors: stageErrors,
  } = useForm({
    name: '',
    sla_time: '0000:00',
  });

  const {
    data: priorityData,
    setData: setPriorityData,
    post: postPriority,
    put: putPriority,
    processing: processingPriority,
    reset: resetPriority,
    errors: priorityErrors,
  } = useForm({
    name: '',
    response_sla_time: '0000:00',
    resolution_sla_time: '0000:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('settings.services.update', service.id), {
      preserveScroll: true,
    });
  };

  const handleOpenPriorityDialog = (priority?: Priority) => {
    if (priority) {
      setEditingPriority(priority);
      setPriorityData({
        name: priority.name,
        response_sla_time: minutesToTimeFormat(priority.response_sla_time),
        resolution_sla_time: minutesToTimeFormat(priority.resolution_sla_time),
      });
    } else {
      setEditingPriority(null);
      resetPriority();
    }
    setShowPriorityDialog(true);
  };

  const handleClosePriorityDialog = () => {
    setShowPriorityDialog(false);
    setEditingPriority(null);
    resetPriority();
  };

  const handleSubmitPriority = (e: React.FormEvent) => {
    e.preventDefault();

    // Converter formato HHHH:mm para minutos antes de enviar
    const dataToSend = {
      name: priorityData.name,
      response_sla_time: timeFormatToMinutes(priorityData.response_sla_time),
      resolution_sla_time: timeFormatToMinutes(priorityData.resolution_sla_time),
    };

    if (editingPriority) {
      router.put(
        route('settings.services.priorities.update', [service.id, editingPriority.id]),
        dataToSend,
        {
          preserveScroll: true,
          onSuccess: () => handleClosePriorityDialog(),
        }
      );
    } else {
      router.post(route('settings.services.priorities.store', service.id), dataToSend, {
        preserveScroll: true,
        onSuccess: () => handleClosePriorityDialog(),
      });
    }
  };

  const handleDeletePriority = (priorityId: number) => {
    if (confirm('Tem certeza que deseja remover esta prioridade?')) {
      router.delete(route('settings.services.priorities.destroy', [service.id, priorityId]), {
        preserveScroll: true,
      });
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Converte minutos para formato HHHH:mm
  const minutesToTimeFormat = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(4, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Converte formato HHHH:mm para minutos
  const timeFormatToMinutes = (time: string): number => {
    const parts = time.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0]) || 0;
    const mins = parseInt(parts[1]) || 0;
    return hours * 60 + mins;
  };

  // Funções para gerenciar clientes
  const handleAddClient = () => {
    if (!selectedClientId) return;

    router.post(
      route('settings.services.clients.attach', service.id),
      { client_id: selectedClientId },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedClientId('');
        },
      }
    );
  };

  const handleRemoveClient = (clientId: number) => {
    if (confirm('Tem certeza que deseja remover este cliente desta mesa de serviço?')) {
      router.delete(route('settings.services.clients.detach', [service.id, clientId]), {
        preserveScroll: true,
      });
    }
  };

  // Filtrar clientes disponíveis (não associados)
  const unassignedClients = availableClients.filter(
    (client) => !service.clients?.some((c) => c.id === client.id)
  );

  // Funções para gerenciar grupos
  const handleAddGroup = () => {
    if (!selectedGroupId) return;

    router.post(
      route('settings.services.groups.attach', service.id),
      { group_id: selectedGroupId },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedGroupId('');
        },
      }
    );
  };

  const handleRemoveGroup = (groupId: number) => {
    if (confirm('Tem certeza que deseja remover este grupo desta mesa de serviço?')) {
      router.delete(route('settings.services.groups.detach', [service.id, groupId]), {
        preserveScroll: true,
      });
    }
  };

  // Filtrar grupos disponíveis (não associados)
  const unassignedGroups = availableGroups.filter(
    (group) => !service.groups?.some((g) => g.id === group.id)
  );

  // Funções de expediente
  const handleOpenExpedientDialog = () => {
    resetExpedient();
    setSelectedDays([]);
    setShowExpedientDialog(true);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmitExpedient = (e: React.FormEvent) => {
    e.preventDefault();
    const daysOfWeek = selectedDays.join(',');
    
    router.post(
      route('settings.services.expedients.store'),
      {
        service_id: service.id,
        days_of_week: daysOfWeek,
        start_time: expedientData.start_time,
        end_time: expedientData.end_time,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowExpedientDialog(false);
          resetExpedient();
          setSelectedDays([]);
        },
      }
    );
  };

  const handleDeleteExpedient = (expedientId: number) => {
    if (confirm('Tem certeza que deseja remover este expediente?')) {
      router.delete(
        route('settings.services.expedients.destroy', expedientId),
        { preserveScroll: true }
      );
    }
  };

  const daysOfWeekOptions = [
    { value: 'SEG', label: 'Segunda' },
    { value: 'TER', label: 'Terça' },
    { value: 'QUA', label: 'Quarta' },
    { value: 'QUI', label: 'Quinta' },
    { value: 'SEX', label: 'Sexta' },
    { value: 'SAB', label: 'Sábado' },
    { value: 'DOM', label: 'Domingo' },
  ];

  // Funções de estágio
  const handleOpenStageDialog = (stage?: ServiceStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageData({
        name: stage.name,
        sla_time: minutesToTimeFormat(stage.sla_time),
      });
    } else {
      setEditingStage(null);
      resetStage();
    }
    setShowStageDialog(true);
  };

  const handleCloseStageDialog = () => {
    setShowStageDialog(false);
    setEditingStage(null);
    resetStage();
  };

  const handleSubmitStage = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStage) {
      // Editar estágio existente
      putStage(route('settings.services.stages.update', editingStage.id), {
        preserveScroll: true,
        onSuccess: () => {
          handleCloseStageDialog();
        },
      });
    } else {
      // Criar novo estágio
      router.post(
        route('settings.services.stages.store'),
        {
          service_id: service.id,
          name: stageData.name,
          sla_time: stageData.sla_time,
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            handleCloseStageDialog();
          },
        }
      );
    }
  };

  const handleDeleteStage = (stageId: number) => {
    if (confirm('Tem certeza que deseja remover este estágio?')) {
      router.delete(route('settings.services.stages.destroy', stageId), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
            <p className="text-sm text-gray-600">Configurações da mesa de serviço</p>
          </div>
        </div>
      }
    >
      <Head title={`${service.name} - Configurações`} />

      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="revisao" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-auto justify-start">
              <TabsTrigger value="informacoes" className="whitespace-nowrap">
                Informações básicas
              </TabsTrigger>
              <TabsTrigger value="prioridades" className="whitespace-nowrap">
                Prioridades
              </TabsTrigger>
              <TabsTrigger value="clientes" className="whitespace-nowrap">
                Clientes
              </TabsTrigger>
              <TabsTrigger value="grupos" className="whitespace-nowrap">
                Grupos de atendentes
              </TabsTrigger>
              <TabsTrigger value="mesas" className="whitespace-nowrap">
                Mesas de serviço
              </TabsTrigger>
              <TabsTrigger value="expediente" className="whitespace-nowrap">
                Expediente
              </TabsTrigger>
              <TabsTrigger value="estagio" className="whitespace-nowrap">
                Estágio
              </TabsTrigger>
              <TabsTrigger value="status" className="whitespace-nowrap">
                Status
              </TabsTrigger>
              <TabsTrigger value="reabertura" className="whitespace-nowrap">
                Reabertura de tickets
              </TabsTrigger>
              <TabsTrigger value="secoes" className="whitespace-nowrap">
                Seções do ticket
              </TabsTrigger>
              <TabsTrigger value="revisao" className="whitespace-nowrap">
                Revisão
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Aba Revisão */}
          <TabsContent value="revisao">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-xl font-bold text-gray-900">Revisão</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Configure as opções de revisão de tickets para esta mesa de serviço.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Tipo de revisão */}
                    <div className="space-y-3">
                      <Label htmlFor="review_type" className="text-base font-semibold text-gray-900">
                        Tipo de revisão
                      </Label>
                      <Select
                        value={data.review_type}
                        onValueChange={(value) => setData('review_type', value)}
                      >
                        <SelectTrigger id="review_type" className="h-12">
                          <SelectValue placeholder="Selecione o tipo de revisão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="requester">Revisão por solicitante</SelectItem>
                          <SelectItem value="permission">
                            Revisão por usuário com permissão
                          </SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.review_type && (
                        <p className="text-sm text-red-600">{errors.review_type}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Define quem pode solicitar a revisão de um ticket.
                      </p>
                    </div>

                    {/* Tempo limite de revisão */}
                    <div className="space-y-3">
                      <Label htmlFor="review_time_limit" className="text-base font-semibold text-gray-900">
                        Tempo limite de revisão (dias)
                      </Label>
                      <Input
                        id="review_time_limit"
                        type="number"
                        min="0"
                        value={data.review_time_limit}
                        onChange={(e) =>
                          setData('review_time_limit', parseInt(e.target.value) || 0)
                        }
                        className={`h-12 ${errors.review_time_limit ? 'border-red-500' : ''}`}
                      />
                      {errors.review_time_limit && (
                        <p className="text-sm text-red-600">{errors.review_time_limit}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Número de dias após o fechamento do ticket em que a revisão pode ser
                        solicitada. Use 0 para sem limite.
                      </p>
                    </div>
                  </div>

                  {/* Permitir reabertura após revisão */}
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="allow_reopen_after_review" className="text-base font-semibold text-gray-900">
                          Aplicar a configuração de reabertura de tickets
                        </Label>
                        <p className="text-sm text-gray-600">
                          Quando ativado, as regras de reabertura de tickets também se aplicam à
                          revisão.
                        </p>
                      </div>
                      <Switch
                        id="allow_reopen_after_review"
                        checked={data.allow_reopen_after_review}
                        onCheckedChange={(checked) =>
                          setData('allow_reopen_after_review', checked)
                        }
                        className="ml-6"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button 
                      type="submit" 
                      disabled={processing}
                      size="lg"
                      className="min-w-[180px] font-semibold"
                    >
                      {processing ? 'Salvando...' : 'Salvar configurações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outras abas (placeholders) */}
          <TabsContent value="informacoes">
            <Card>
              <CardHeader>
                <CardTitle>Informações básicas</CardTitle>
                <CardDescription>Em desenvolvimento...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="prioridades">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Prioridades</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Configure as prioridades e seus tempos de SLA para esta mesa de serviço
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenPriorityDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Prioridade
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {service.priorities && service.priorities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Nome</TableHead>
                          <TableHead className="text-center">Vencimento de atendimento</TableHead>
                          <TableHead className="text-center">Vencimento de solução</TableHead>
                          <TableHead className="text-right w-[120px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {service.priorities.map((priority) => (
                          <TableRow key={priority.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">
                              {priority.name}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                                <Clock className="h-4 w-4" />
                                {formatTime(priority.response_sla_time)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium">
                                <Clock className="h-4 w-4" />
                                {formatTime(priority.resolution_sla_time)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenPriorityDialog(priority)}
                                  className="hover:bg-primary/10 hover:text-primary"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePriority(priority.id)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                      <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma prioridade cadastrada
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mb-6">
                      Clique no botão "Prioridade" para criar a primeira prioridade e definir os
                      tempos de SLA.
                    </p>
                    <Button onClick={() => handleOpenPriorityDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Prioridade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clientes">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-xl font-bold text-gray-900">Clientes</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Associe clientes para que tenham acesso a esta mesa de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Formulário para adicionar cliente */}
                {unassignedClients.length > 0 && (
                  <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Adicionar Cliente
                    </h3>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedClients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleAddClient}
                        disabled={!selectedClientId}
                        size="lg"
                        className="min-w-[140px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista de clientes associados */}
                {service.clients && service.clients.length > 0 ? (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Clientes Associados ({service.clients.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Cliente</TableHead>
                            <TableHead className="text-right w-[120px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {service.clients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-gray-900">
                                {client.name}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveClient(client.id)}
                                    className="hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                      <Settings className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum cliente associado
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      {unassignedClients.length > 0
                        ? 'Selecione um cliente acima para associá-lo a esta mesa de serviço.'
                        : 'Todos os clientes já estão associados ou não há clientes cadastrados.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grupos">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-xl font-bold text-gray-900">Grupos de Atendentes</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Associe grupos de atendentes que terão acesso a esta mesa de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Formulário para adicionar grupo */}
                {unassignedGroups.length > 0 && (
                  <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Adicionar Grupo
                    </h3>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione um grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{group.name}</span>
                                  {group.description && (
                                    <span className="text-xs text-gray-500">{group.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleAddGroup}
                        disabled={!selectedGroupId}
                        size="lg"
                        className="min-w-[140px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista de grupos associados */}
                {service.groups && service.groups.length > 0 ? (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Grupos Associados ({service.groups.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Grupo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right w-[120px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {service.groups.map((group) => (
                            <TableRow key={group.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  {group.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {group.description || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveGroup(group.id)}
                                    className="hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum grupo associado
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      {unassignedGroups.length > 0
                        ? 'Selecione um grupo acima para associá-lo a esta mesa de serviço.'
                        : 'Todos os grupos já estão associados ou não há grupos cadastrados.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mesas">
            <Card>
              <CardHeader>
                <CardTitle>Mesas de serviço</CardTitle>
                <CardDescription>Em desenvolvimento...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="expediente">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Expediente</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Configure o horário de expediente da mesa de serviço
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleOpenExpedientDialog}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Expediente
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {service.expedients && service.expedients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dia(s)</TableHead>
                        <TableHead className="text-center">Início</TableHead>
                        <TableHead className="text-center">Fim</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {service.expedients.map((expedient) => (
                        <TableRow key={expedient.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {expedient.days_of_week}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{expedient.start_time}</TableCell>
                          <TableCell className="text-center">{expedient.end_time}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpedient(expedient.id)}
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
                    <Clock className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm font-medium text-gray-900">
                      Nenhum expediente cadastrado
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Clique em "+ Expediente" para adicionar um horário de expediente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estagio">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Estágio</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Configure os estágios do fluxo de trabalho e seus SLAs
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleOpenStageDialog()}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Estágio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {service.stages && service.stages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-center">Vencimento de estágio</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {service.stages.map((stage) => (
                        <TableRow key={stage.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4 text-gray-400" />
                              {stage.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {minutesToTimeFormat(stage.sla_time)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStageDialog(stage)}
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStage(stage.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Settings className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm font-medium text-gray-900">
                      Nenhum estágio cadastrado
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Clique em "+ Estágio" para adicionar um estágio ao fluxo de trabalho
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Em desenvolvimento...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="reabertura">
            <Card>
              <CardHeader>
                <CardTitle>Reabertura de tickets</CardTitle>
                <CardDescription>Em desenvolvimento...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="secoes">
            <Card>
              <CardHeader>
                <CardTitle>Seções do ticket</CardTitle>
                <CardDescription>Em desenvolvimento...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Prioridade */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingPriority ? 'Editar Prioridade' : 'Nova Prioridade'}
            </DialogTitle>
            <DialogDescription>
              Configure o nome e os tempos de SLA para esta prioridade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPriority} className="space-y-6 pt-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="priority_name" className="text-base font-semibold">
                Nome da Prioridade *
              </Label>
              <Input
                id="priority_name"
                type="text"
                value={priorityData.name}
                onChange={(e) => setPriorityData('name', e.target.value)}
                placeholder="Ex: Baixa, Média, Alta, Urgente"
                className={`h-12 ${priorityErrors.name ? 'border-red-500' : ''}`}
                required
              />
              {priorityErrors.name && (
                <p className="text-sm text-red-600">{priorityErrors.name}</p>
              )}
              <p className="text-sm text-gray-600">
                Defina um nome claro e descritivo para a prioridade.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Vencimento de atendimento */}
              <div className="space-y-2">
                <Label htmlFor="response_sla_time" className="text-base font-semibold text-gray-900">
                  Vencimento de atendimento *
                </Label>
                <Input
                  id="response_sla_time"
                  type="text"
                  value={priorityData.response_sla_time}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir apenas números e :
                    const sanitized = value.replace(/[^0-9:]/g, '');
                    setPriorityData('response_sla_time', sanitized);
                  }}
                  placeholder="0000:00"
                  pattern="[0-9]{4}:[0-9]{2}"
                  maxLength={7}
                  className={`h-12 font-mono ${priorityErrors.response_sla_time ? 'border-red-500' : ''}`}
                  required
                />
                {priorityErrors.response_sla_time && (
                  <p className="text-sm text-red-600">{priorityErrors.response_sla_time}</p>
                )}
                <p className="text-sm text-gray-600">
                  Formato: HHHH:mm (ex: 0002:30 para 2h30min)
                </p>
              </div>

              {/* Vencimento de solução */}
              <div className="space-y-2">
                <Label htmlFor="resolution_sla_time" className="text-base font-semibold text-gray-900">
                  Vencimento de solução *
                </Label>
                <Input
                  id="resolution_sla_time"
                  type="text"
                  value={priorityData.resolution_sla_time}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir apenas números e :
                    const sanitized = value.replace(/[^0-9:]/g, '');
                    setPriorityData('resolution_sla_time', sanitized);
                  }}
                  placeholder="0000:00"
                  pattern="[0-9]{4}:[0-9]{2}"
                  maxLength={7}
                  className={`h-12 font-mono ${priorityErrors.resolution_sla_time ? 'border-red-500' : ''}`}
                  required
                />
                {priorityErrors.resolution_sla_time && (
                  <p className="text-sm text-red-600">{priorityErrors.resolution_sla_time}</p>
                )}
                <p className="text-sm text-gray-600">
                  Formato: HHHH:mm (ex: 0024:00 para 24 horas)
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClosePriorityDialog}
                disabled={processingPriority}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={processingPriority} size="lg">
                {processingPriority
                  ? 'Salvando...'
                  : editingPriority
                    ? 'Atualizar Prioridade'
                    : 'Criar Prioridade'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Expediente */}
      <Dialog open={showExpedientDialog} onOpenChange={setShowExpedientDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Clock className="h-6 w-6 text-primary" />
              Adicionar Expediente
            </DialogTitle>
            <DialogDescription>
              Selecione os dias da semana e os horários de funcionamento da mesa de serviço.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitExpedient} className="space-y-6 pt-4">
            {/* Seleção de dias da semana */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Dias da Semana *</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {daysOfWeekOptions.map((day) => (
                  <div
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    className={`
                      flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all
                      ${selectedDays.includes(day.value)
                        ? 'border-primary bg-primary/10 font-semibold'
                        : 'border-gray-200 hover:border-primary/50'
                      }
                    `}
                  >
                    <span className="text-sm">{day.label}</span>
                  </div>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-sm text-amber-600">Selecione pelo menos um dia da semana</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Horário de Início */}
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-base font-semibold">
                  Horário de Início *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={expedientData.start_time}
                  onChange={(e) => setExpedientData('start_time', e.target.value)}
                  className={`h-12 ${expedientErrors.start_time ? 'border-red-500' : ''}`}
                  required
                />
                {expedientErrors.start_time && (
                  <p className="text-sm text-red-600">{expedientErrors.start_time}</p>
                )}
              </div>

              {/* Horário de Fim */}
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-base font-semibold">
                  Horário de Fim *
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={expedientData.end_time}
                  onChange={(e) => setExpedientData('end_time', e.target.value)}
                  className={`h-12 ${expedientErrors.end_time ? 'border-red-500' : ''}`}
                  required
                />
                {expedientErrors.end_time && (
                  <p className="text-sm text-red-600">{expedientErrors.end_time}</p>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExpedientDialog(false)}
                size="lg"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={processingExpedient || selectedDays.length === 0} 
                size="lg"
              >
                {processingExpedient ? 'Salvando...' : 'Adicionar Expediente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar/Editar Estágio */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              {editingStage ? 'Editar Estágio' : 'Adicionar Estágio'}
            </DialogTitle>
            <DialogDescription>
              Configure o nome e o tempo de SLA para este estágio do fluxo de trabalho.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitStage} className="space-y-6 pt-4">
            {/* Nome do Estágio */}
            <div className="space-y-2">
              <Label htmlFor="stage_name" className="text-base font-semibold">
                Nome do Estágio *
              </Label>
              <Input
                id="stage_name"
                type="text"
                value={stageData.name}
                onChange={(e) => setStageData('name', e.target.value)}
                placeholder="Ex: Pendente, N1, N2, Externo"
                className={`h-12 ${stageErrors.name ? 'border-red-500' : ''}`}
                required
              />
              {stageErrors.name && (
                <p className="text-sm text-red-600">{stageErrors.name}</p>
              )}
              <p className="text-sm text-gray-600">
                Defina um nome claro e descritivo para o estágio.
              </p>
            </div>

            {/* Vencimento de estágio */}
            <div className="space-y-2">
              <Label htmlFor="sla_time" className="text-base font-semibold text-gray-900">
                Vencimento de estágio *
              </Label>
              <Input
                id="sla_time"
                type="text"
                value={stageData.sla_time}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir apenas números e :
                  const sanitized = value.replace(/[^0-9:]/g, '');
                  setStageData('sla_time', sanitized);
                }}
                placeholder="0000:00"
                pattern="[0-9]{4}:[0-9]{2}"
                maxLength={7}
                className={`h-12 ${stageErrors.sla_time ? 'border-red-500' : ''}`}
                required
              />
              {stageErrors.sla_time && (
                <p className="text-sm text-red-600">{stageErrors.sla_time}</p>
              )}
              <p className="text-sm text-gray-600">
                Formato: <strong>0000:00</strong> (horas:minutos). Exemplo: 0024:00 = 24 horas
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseStageDialog}
                size="lg"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={processingStage} size="lg">
                {processingStage
                  ? 'Salvando...'
                  : editingStage
                    ? 'Atualizar Estágio'
                    : 'Adicionar Estágio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
