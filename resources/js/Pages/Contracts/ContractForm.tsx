import { FormEvent, useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/Components/ui/button';
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
import { Textarea } from '@/Components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Client, ContractType } from '@/types';

export interface ContractFormData {
  contract_type_id: string;
  name: string;
  client_id: string;
  technical_notes: string;
  start_date: string;
  payment_day: string;
  monthly_value: string;
  discount: string;
  payment_method: string;
  billing_cycle: string;
  closing_cycle: string;
  auto_renewal: boolean;
  status: string;
  renewal_date: string;
  expiration_term: string;
  // Campos específicos da modalidade "Horas"
  included_hours?: string;
  extra_hour_value?: string;
  // Campos específicos da modalidade "Livre (Ilimitado)"
  scope_included?: string;
  scope_excluded?: string;
  fair_use_policy?: string;
  visit_limit?: string;
  // Campos específicos da modalidade "Por Atendimento"
  included_tickets?: string;
  extra_ticket_value?: string;
  // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
  rollover_active?: boolean;
  rollover_days_window?: string;
  rollover_hours_limit?: string;
  // Campos específicos da modalidade "SaaS/Produto"
  appointments_when_pending?: boolean;
  items?: Array<{
    name: string;
    unit_value: string;
    quantity: number;
    total_value: string;
  }>;
}

interface ContractFormProps {
  mode: 'create' | 'edit';
  form: {
    data: ContractFormData;
    setData: (key: keyof ContractFormData, value: ContractFormData[keyof ContractFormData]) => void;
    processing: boolean;
    errors: Partial<Record<keyof ContractFormData, string>>;
  };
  contractTypes: ContractType[];
  clients: Client[];
  options: {
    paymentMethods: string[];
    billingCycles: string[];
    closingCycles: string[];
    expirationTerms: string[];
    statuses: string[];
  };
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelHref: string;
}

export function ContractForm({
  mode,
  form,
  contractTypes,
  clients,
  options,
  onSubmit,
  onCancelHref,
}: ContractFormProps) {
  const { data, setData, errors, processing } = form;
  
  // Estado para armazenar a modalidade do tipo de contrato selecionado
  const [selectedModality, setSelectedModality] = useState<string | null>(null);

  // Estado para modal de adicionar item (SaaS/Produto)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    unit_value: '',
    quantity: 1,
  });

  // Atualizar modalidade quando o tipo de contrato mudar
  useEffect(() => {
    const selectedType = contractTypes.find(
      (type) => type.id.toString() === data.contract_type_id
    );
    setSelectedModality(selectedType?.modality || null);
  }, [data.contract_type_id, contractTypes]);

  // Calcular data de reajuste automaticamente baseado em Início + Expiração
  useEffect(() => {
    if (!data.start_date || !data.expiration_term || data.expiration_term === 'Indeterminado') {
      // Se não há data de início, ou expiração é indeterminada, limpar reajuste
      setData('renewal_date', '');
      return;
    }

    // Extrair número de meses do prazo (ex: "12 meses" -> 12)
    const monthsMatch = data.expiration_term.match(/(\d+)\s*meses?/i);
    if (!monthsMatch) {
      setData('renewal_date', '');
      return;
    }

    const months = parseInt(monthsMatch[1], 10);
    const startDate = new Date(data.start_date);
    
    // Adicionar meses à data de início
    const renewalDate = new Date(startDate);
    renewalDate.setMonth(renewalDate.getMonth() + months);

    // Formatar para YYYY-MM-DD (formato esperado pelo input type="date")
    const formattedDate = renewalDate.toISOString().split('T')[0];
    setData('renewal_date', formattedDate);
  }, [data.start_date, data.expiration_term]);

  return (
    <TooltipProvider>
      <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informações gerais
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Selecione tipo, cliente e defina as informações principais do contrato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="contract_type_id">Tipo de contrato</Label>
              <Select
                value={data.contract_type_id}
                onValueChange={(value) => setData('contract_type_id', value)}
              >
                <SelectTrigger id="contract_type_id">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contract_type_id && (
                <p className="text-sm text-red-500">{errors.contract_type_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do contrato</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                placeholder="Ex: Contrato ACME - Suporte Mensal"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={data.client_id}
                onValueChange={(value) => setData('client_id', value)}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-red-500">{errors.client_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_notes">Observações técnicas</Label>
              <Textarea
                id="technical_notes"
                value={data.technical_notes}
                onChange={(event) => setData('technical_notes', event.target.value)}
                placeholder="Detalhes importantes sobre escopo, SLAs e tecnologias envolvidas."
                className="min-h-[120px]"
              />
              {errors.technical_notes && (
                <p className="text-sm text-red-500">{errors.technical_notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Status e vigência
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Configure vigência, status e renovação automática.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={data.start_date}
                  onChange={(event) => setData('start_date', event.target.value)}
                />
                {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal_date">
                  Reajuste
                  <span className="ml-2 text-xs font-normal text-gray-500">(calculado automaticamente)</span>
                </Label>
                <Input
                  id="renewal_date"
                  type="date"
                  value={data.renewal_date}
                  disabled
                  className="cursor-not-allowed bg-gray-50 text-gray-600"
                />
                {errors.renewal_date && <p className="text-sm text-red-500">{errors.renewal_date}</p>}
                <p className="text-xs text-gray-500">
                  Data calculada com base no Início + Expiração
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expiration_term">Expiração</Label>
                <Select
                  value={data.expiration_term || ''}
                  onValueChange={(value) => setData('expiration_term', value)}
                >
                  <SelectTrigger id="expiration_term">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.expirationTerms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expiration_term && (
                  <p className="text-sm text-red-500">{errors.expiration_term}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={data.status}
                  onValueChange={(value) => setData('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.statuses.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Renovação automática</p>
                <p className="text-xs text-gray-500">
                  Quando ativo, o contrato permanece válido ao final da vigência.
                </p>
              </div>
              <Switch
                checked={data.auto_renewal}
                onCheckedChange={(checked) => setData('auto_renewal', checked)}
              />
            </div>
            {errors.auto_renewal && (
              <p className="text-sm text-red-500">{errors.auto_renewal}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Condições financeiras
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Defina valores, ciclos de faturamento e formas de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="payment_day">Dia de pagamento</Label>
              <Input
                id="payment_day"
                type="number"
                min={1}
                max={31}
                value={data.payment_day}
                onChange={(event) => setData('payment_day', event.target.value)}
              />
              {errors.payment_day && (
                <p className="text-sm text-red-500">{errors.payment_day}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_value">Valor mensal</Label>
              <Input
                id="monthly_value"
                value={data.monthly_value}
                onChange={(event) => setData('monthly_value', event.target.value)}
                placeholder="Ex: 4500,00"
              />
              {errors.monthly_value && (
                <p className="text-sm text-red-500">{errors.monthly_value}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                value={data.discount}
                onChange={(event) => setData('discount', event.target.value)}
                placeholder="Ex: 250,00"
              />
              {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-5 items-center gap-1.5">
                <Label htmlFor="payment_method">Forma de pagamento</Label>
              </div>
              <Select
                value={data.payment_method || ''}
                onValueChange={(value) => setData('payment_method', value)}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {options.paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-sm text-red-500">{errors.payment_method}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex h-5 items-center gap-1.5">
                <Label htmlFor="billing_cycle">Ciclo de faturamento</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define a frequência do faturamento do contrato.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={data.billing_cycle || ''}
                onValueChange={(value) => setData('billing_cycle', value)}
              >
                <SelectTrigger id="billing_cycle">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {options.billingCycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billing_cycle && (
                <p className="text-sm text-red-500">{errors.billing_cycle}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex h-5 items-center gap-1.5">
                <Label htmlFor="closing_cycle">Ciclo de fechamento</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define a frequência do fechamento dos cálculos da horas excedentes.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={data.closing_cycle || ''}
                onValueChange={(value) => setData('closing_cycle', value)}
              >
                <SelectTrigger id="closing_cycle">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {options.closingCycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.closing_cycle && (
                <p className="text-sm text-red-500">{errors.closing_cycle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção condicional: Especificação do Contrato - Modalidade "Horas" */}
      {selectedModality === 'Horas' && (
        <Card className="border border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Especificação do Contrato
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Configure os parâmetros específicos para contratos da modalidade "Horas".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="included_hours">
                  Horas por ciclo de fechamento
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  id="included_hours"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 40.00"
                  value={data.included_hours || ''}
                  onChange={(e) => setData('included_hours', e.target.value)}
                  className={cn(errors.included_hours && 'border-red-500')}
                />
                {errors.included_hours && (
                  <p className="text-sm text-red-500">{errors.included_hours}</p>
                )}
                <p className="text-xs text-gray-500">
                  Quantidade de horas incluídas no contrato por ciclo de fechamento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra_hour_value">
                  Valor da hora excedente (R$)
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  id="extra_hour_value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 150.00"
                  value={data.extra_hour_value || ''}
                  onChange={(e) => setData('extra_hour_value', e.target.value)}
                  className={cn(errors.extra_hour_value && 'border-red-500')}
                />
                {errors.extra_hour_value && (
                  <p className="text-sm text-red-500">{errors.extra_hour_value}</p>
                )}
                <p className="text-xs text-gray-500">
                  Valor cobrado por hora adicional além das horas incluídas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção condicional: Especificação do Contrato - Modalidade "Livre" */}
      {selectedModality === 'Livre' && (
        <Card className="border border-green-200 bg-green-50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Especificação do Contrato
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Configure os parâmetros específicos para contratos da modalidade "Livre (Ilimitado)".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="scope_included">
                Escopo incluso
              </Label>
              <Textarea
                id="scope_included"
                placeholder="Descreva o que está incluído no escopo do contrato..."
                value={data.scope_included || ''}
                onChange={(e) => setData('scope_included', e.target.value)}
                className={cn('min-h-[100px]', errors.scope_included && 'border-red-500')}
              />
              {errors.scope_included && (
                <p className="text-sm text-red-500">{errors.scope_included}</p>
              )}
              <p className="text-xs text-gray-500">
                Liste os serviços e atividades incluídos no contrato
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope_excluded">
                Escopo excluído
              </Label>
              <Textarea
                id="scope_excluded"
                placeholder="Descreva o que NÃO está incluído no escopo do contrato..."
                value={data.scope_excluded || ''}
                onChange={(e) => setData('scope_excluded', e.target.value)}
                className={cn('min-h-[100px]', errors.scope_excluded && 'border-red-500')}
              />
              {errors.scope_excluded && (
                <p className="text-sm text-red-500">{errors.scope_excluded}</p>
              )}
              <p className="text-xs text-gray-500">
                Liste os serviços e atividades que não fazem parte do contrato
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fair_use_policy">
                Política de uso justo
              </Label>
              <Textarea
                id="fair_use_policy"
                placeholder="Descreva as regras de uso justo do contrato..."
                value={data.fair_use_policy || ''}
                onChange={(e) => setData('fair_use_policy', e.target.value)}
                className={cn('min-h-[100px]', errors.fair_use_policy && 'border-red-500')}
              />
              {errors.fair_use_policy && (
                <p className="text-sm text-red-500">{errors.fair_use_policy}</p>
              )}
              <p className="text-xs text-gray-500">
                Defina limites razoáveis de uso para evitar abusos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_limit">
                Limite de visitas (opcional)
              </Label>
              <Input
                id="visit_limit"
                type="number"
                min="0"
                placeholder="Ex: 4"
                value={data.visit_limit || ''}
                onChange={(e) => setData('visit_limit', e.target.value)}
                className={cn(errors.visit_limit && 'border-red-500')}
              />
              {errors.visit_limit && (
                <p className="text-sm text-red-500">{errors.visit_limit}</p>
              )}
              <p className="text-xs text-gray-500">
                Número máximo de visitas presenciais por ciclo (deixe vazio para ilimitado)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção condicional: Especificação do Contrato - Modalidade "Por Atendimento" */}
      {selectedModality === 'Por Atendimento' && (
        <Card className="border border-orange-200 bg-orange-50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Especificação do contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Texto de ajuda/descrição longo */}
            <div className="rounded-md bg-white p-4 text-sm text-gray-700 leading-relaxed">
              <p>
                No campo "Tickets por ciclo de fechamento", informe o total de tickets que estão incluídos neste ciclo. 
                Por exemplo, se você preencher esse campo com 12 e seu ciclo de fechamento for trimestral, isso significa 
                que o seu cliente terá direito a usar 4 tickets por mês. No campo "Valor do ticket excedente", informe o 
                valor cobrado por cada ticket utilizado além do contratado. A cobrança de tickets excedentes será feita 
                no fim do ciclo de fechamento e não no fim do mês.
              </p>
            </div>

            {/* Grid com os dois campos */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="included_tickets">
                  Tickets por ciclo de fechamento
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  id="included_tickets"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={data.included_tickets || ''}
                  onChange={(e) => setData('included_tickets', e.target.value)}
                  className={cn(errors.included_tickets && 'border-red-500')}
                />
                {errors.included_tickets && (
                  <p className="text-sm text-red-500">{errors.included_tickets}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra_ticket_value">
                  Valor do ticket excedente
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="extra_ticket_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={data.extra_ticket_value || ''}
                    onChange={(e) => setData('extra_ticket_value', e.target.value)}
                    className={cn('pl-10', errors.extra_ticket_value && 'border-red-500')}
                  />
                </div>
                {errors.extra_ticket_value && (
                  <p className="text-sm text-red-500">{errors.extra_ticket_value}</p>
                )}
              </div>
            </div>

            {/* Box de valor total (como na imagem) */}
            <div className="flex justify-end">
              <div className="rounded-md bg-yellow-100 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">Valor total: </span>
                <span className="text-sm font-bold text-cyan-600">
                  R$ {parseFloat(data.extra_ticket_value || '0').toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção condicional: Especificação do Contrato - Modalidade "Horas Cumulativas" */}
      {selectedModality === 'Horas Cumulativas' && (
        <>
          {/* Card 1: Campos de Horas (herdados da modalidade "Horas") */}
          <Card className="border border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Especificação do Contrato
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Configure os parâmetros de horas para contratos da modalidade "Horas Cumulativas".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="included_hours_cumulative">
                    Horas por ciclo de fechamento
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="included_hours_cumulative"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 40.00"
                    value={data.included_hours || ''}
                    onChange={(e) => setData('included_hours', e.target.value)}
                    className={cn(errors.included_hours && 'border-red-500')}
                  />
                  {errors.included_hours && (
                    <p className="text-sm text-red-500">{errors.included_hours}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Quantidade de horas incluídas no contrato por ciclo de fechamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra_hour_value_cumulative">
                    Valor da hora excedente (R$)
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="extra_hour_value_cumulative"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 150.00"
                    value={data.extra_hour_value || ''}
                    onChange={(e) => setData('extra_hour_value', e.target.value)}
                    className={cn(errors.extra_hour_value && 'border-red-500')}
                  />
                  {errors.extra_hour_value && (
                    <p className="text-sm text-red-500">{errors.extra_hour_value}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Valor cobrado por hora adicional além das horas incluídas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Configuração de Acúmulo (Rollover) */}
          <Card className="border border-purple-200 bg-purple-50 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Configuração de Acúmulo (Rollover)
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Configure como as horas não utilizadas serão acumuladas para o próximo ciclo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Switch para habilitar rollover */}
              <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-white p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="rollover_active" className="text-base font-medium">
                    Habilitar acúmulo de horas?
                  </Label>
                  <p className="text-sm text-gray-500">
                    Permite que horas não utilizadas sejam transferidas para o próximo ciclo
                  </p>
                </div>
                <Switch
                  id="rollover_active"
                  checked={data.rollover_active || false}
                  onCheckedChange={(checked) => setData('rollover_active', checked)}
                />
              </div>

              {/* Campos condicionais - só aparecem se rollover estiver ativo */}
              {data.rollover_active && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rollover_days_window">
                      Janela de acúmulo (dias)
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Input
                      id="rollover_days_window"
                      type="number"
                      min="0"
                      placeholder="Ex: 90"
                      value={data.rollover_days_window || ''}
                      onChange={(e) => setData('rollover_days_window', e.target.value)}
                      className={cn(errors.rollover_days_window && 'border-red-500')}
                    />
                    {errors.rollover_days_window && (
                      <p className="text-sm text-red-500">{errors.rollover_days_window}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Número de dias que as horas acumuladas ficam disponíveis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollover_hours_limit">
                      Teto de acúmulo (horas)
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Input
                      id="rollover_hours_limit"
                      type="number"
                      min="0"
                      placeholder="Ex: 40"
                      value={data.rollover_hours_limit || ''}
                      onChange={(e) => setData('rollover_hours_limit', e.target.value)}
                      className={cn(errors.rollover_hours_limit && 'border-red-500')}
                    />
                    {errors.rollover_hours_limit && (
                      <p className="text-sm text-red-500">{errors.rollover_hours_limit}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Máximo de horas que podem ser acumuladas
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Seção condicional: Especificação do Contrato - Modalidade "SaaS/Produto" */}
      {selectedModality === 'SaaS/Produto' && (
        <Card className="border border-indigo-200 bg-indigo-50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Especificação do contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Switch: Apontamentos quando pendente de reajuste */}
            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-white p-4">
              <div className="space-y-0.5">
                <Label htmlFor="appointments_when_pending" className="text-base font-medium">
                  Apontamentos quando pendente de reajuste
                </Label>
                <p className="text-sm text-gray-500">
                  Permite criar apontamentos mesmo quando o contrato está pendente de reajuste
                </p>
              </div>
              <Switch
                id="appointments_when_pending"
                checked={data.appointments_when_pending || false}
                onCheckedChange={(checked) => setData('appointments_when_pending', checked)}
              />
            </div>

            {/* Card de Itens */}
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">Itens</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {data.items?.length || 0}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsItemDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Item
                </Button>
              </div>

              {/* Tabela de Itens */}
              {data.items && data.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor do item</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>R$ {parseFloat(item.unit_value).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {parseFloat(item.total_value).toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newItems = data.items?.filter((_, i) => i !== index) || [];
                              setData('items', newItems);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg
                    className="h-12 w-12 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-sm">Não há itens</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Adicionar Item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>
            <DialogDescription>
              Preencha os dados do item que será adicionado ao contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">
                Nome
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="item_name"
                placeholder="Nome"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item_unit_value">
                  Valor do item
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="item_unit_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newItem.unit_value}
                    onChange={(e) => setNewItem({ ...newItem, unit_value: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_quantity">
                  Quantidade
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  id="item_quantity"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsItemDialogOpen(false);
                setNewItem({ name: '', unit_value: '', quantity: 1 });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!newItem.name || !newItem.unit_value || !newItem.quantity) {
                  return;
                }

                const unitValue = parseFloat(newItem.unit_value);
                const totalValue = unitValue * newItem.quantity;

                const item = {
                  name: newItem.name,
                  unit_value: newItem.unit_value,
                  quantity: newItem.quantity,
                  total_value: totalValue.toFixed(2),
                };

                const currentItems = data.items || [];
                setData('items', [...currentItems, item]);

                setIsItemDialogOpen(false);
                setNewItem({ name: '', unit_value: '', quantity: 1 });
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="outline" className={cn('sm:w-auto')}>
          <Link href={onCancelHref}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={processing} className="sm:w-auto">
          {mode === 'create' ? 'Criar contrato' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
    </TooltipProvider>
  );
}
