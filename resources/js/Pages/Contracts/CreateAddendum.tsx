import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
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
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Separator } from '@/Components/ui/separator';
import { Textarea } from '@/Components/ui/textarea';
import { Contract } from '@/types';

interface CreateAddendumProps {
  contract: Contract;
}

type AddendumType = 'renewal' | 'during_term';
type AdjustmentType = 'manual' | 'percentage';

interface AddendumFormData {
  addendum_type: AddendumType;
  description: string;
  start_date: string;
  renewal_date: string;
  expiration_term: string;
  auto_renewal: boolean;
  status: string;
  adjustment_type: AdjustmentType;
  adjustment_percentage: string;
  monthly_value: string;
  discount: string;
  payment_day: string;
  due_day: string;
  payment_method: string;
  billing_cycle: string;
  closing_cycle: string;
  billing_type: string;
  contract_term: string;
  included_hours: string;
  extra_hour_value: string;
  scope_included: string;
  scope_excluded: string;
  fair_use_policy: string;
  visit_limit: string;
  included_tickets: string;
  extra_ticket_value: string;
  rollover_active: boolean;
  rollover_days_window: string;
  rollover_hours_limit: string;
  appointments_when_pending: boolean;
}

export default function CreateAddendum({ contract }: CreateAddendumProps) {
  // Aceitar tanto camelCase quanto snake_case do backend
  const activeVersion = contract.activeVersion || (contract as any).active_version;
  const [addendumType, setAddendumType] = useState<AddendumType>('renewal');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('manual');

  const { data, setData, post, processing, errors } = useForm<AddendumFormData>({
    addendum_type: 'renewal' as AddendumType,
    description: '',
    start_date: '',
    adjustment_type: 'manual' as AdjustmentType,
    adjustment_percentage: '',
    monthly_value: activeVersion?.monthly_value?.toString() || '',
    discount: activeVersion?.discount?.toString() || '',
    payment_day: activeVersion?.payment_day?.toString() || '',
    due_day: activeVersion?.due_day?.toString() || '',
    payment_method: activeVersion?.payment_method || '',
    billing_cycle: activeVersion?.billing_cycle || '',
    closing_cycle: activeVersion?.closing_cycle || '',
    billing_type: activeVersion?.billing_type || '',
    contract_term: activeVersion?.contract_term || '',
    auto_renewal: activeVersion?.auto_renewal || false,
    status: activeVersion?.status || 'Ativo',
    renewal_date: activeVersion?.renewal_date || '',
    expiration_term: activeVersion?.expiration_term || '',
    included_hours: activeVersion?.included_hours?.toString() || '',
    extra_hour_value: activeVersion?.extra_hour_value?.toString() || '',
    scope_included: activeVersion?.scope_included || '',
    scope_excluded: activeVersion?.scope_excluded || '',
    fair_use_policy: activeVersion?.fair_use_policy || '',
    visit_limit: activeVersion?.visit_limit?.toString() || '',
    included_tickets: activeVersion?.included_tickets?.toString() || '',
    extra_ticket_value: activeVersion?.extra_ticket_value?.toString() || '',
    rollover_active: activeVersion?.rollover_active || false,
    rollover_days_window: activeVersion?.rollover_days_window?.toString() || '',
    rollover_hours_limit: activeVersion?.rollover_hours_limit?.toString() || '',
    appointments_when_pending: activeVersion?.appointments_when_pending || false,
  });

  const handleAddendumTypeChange = (value: AddendumType) => {
    setAddendumType(value);
    setData('addendum_type', value);

    // Se mudar para "durante vigência", limpar campos pré-preenchidos
    if (value === 'during_term') {
      setData({
        ...data,
        addendum_type: value,
        description: '',
        start_date: '',
        monthly_value: '',
        discount: '',
        renewal_date: '',
      });
    } else {
      // Se mudar para "renovação", pré-preencher com dados da versão ativa
      setData({
        ...data,
        addendum_type: value,
        monthly_value: activeVersion?.monthly_value?.toString() || '',
        discount: activeVersion?.discount?.toString() || '',
        payment_day: activeVersion?.payment_day?.toString() || '',
        due_day: activeVersion?.due_day?.toString() || '',
        payment_method: activeVersion?.payment_method || '',
        billing_cycle: activeVersion?.billing_cycle || '',
        closing_cycle: activeVersion?.closing_cycle || '',
        billing_type: activeVersion?.billing_type || '',
        contract_term: activeVersion?.contract_term || '',
        auto_renewal: activeVersion?.auto_renewal || false,
        status: activeVersion?.status || 'Ativo',
        renewal_date: activeVersion?.renewal_date || '',
        expiration_term: activeVersion?.expiration_term || '',
        included_hours: activeVersion?.included_hours?.toString() || '',
        extra_hour_value: activeVersion?.extra_hour_value?.toString() || '',
      });
    }
  };

  const handleAdjustmentTypeChange = (value: AdjustmentType) => {
    setAdjustmentType(value);
    setData('adjustment_type', value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('contracts.addendum.store', contract.id), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Adendo</h1>
              <p className="text-sm text-gray-500">
                Contrato {contract.name} · Cliente {contract.client?.name ?? 'N/A'}
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => router.visit(route('contracts.show', contract.id))}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      }
    >
      <Head title="Novo Adendo" />

      <div className="px-6 pb-10">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={route('contracts.index')}>Contratos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={route('contracts.show', contract.id)}>
                  {contract.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>Novo Adendo</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de Tipo de Adendo */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Tipo de Adendo</CardTitle>
              <CardDescription>
                Selecione o tipo de adendo que deseja criar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={addendumType}
                onValueChange={handleAddendumTypeChange}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="flex items-start space-x-3 rounded-lg border-2 border-primary bg-white p-4 transition-all hover:shadow-md">
                  <RadioGroupItem value="renewal" id="renewal" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="renewal" className="cursor-pointer font-semibold">
                      Adendo no reajuste
                    </Label>
                    <p className="text-sm text-gray-500">
                      Renovação com reajuste de valores (manual ou percentual)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:shadow-md">
                  <RadioGroupItem value="during_term" id="during_term" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="during_term" className="cursor-pointer font-semibold">
                      Adendo durante vigência do contrato
                    </Label>
                    <p className="text-sm text-gray-500">
                      Alteração pontual durante o período de vigência
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Cenário A: Adendo no Reajuste (Renovação) */}
          {addendumType === 'renewal' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Reajuste</CardTitle>
                  <CardDescription>
                    Configure os dados da renovação do contrato
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição do adendo
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Ex: Reajuste anual IGPM 5%, Renovação contratual 2026, etc."
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">
                        Data de início
                        <span className="ml-1 text-red-500">*</span>
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={data.start_date}
                        onChange={(e) => setData('start_date', e.target.value)}
                        className={errors.start_date ? 'border-red-500' : ''}
                      />
                      {errors.start_date && (
                        <p className="text-sm text-red-500">{errors.start_date}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="renewal_date">Próximo reajuste</Label>
                      <Input
                        id="renewal_date"
                        type="date"
                        value={data.renewal_date}
                        onChange={(e) => setData('renewal_date', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tipo de Reajuste */}
                  <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <Label>Tipo de reajuste</Label>
                    <RadioGroup
                      value={adjustmentType}
                      onValueChange={handleAdjustmentTypeChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual" className="cursor-pointer font-normal">
                          Reajuste manual
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage" className="cursor-pointer font-normal">
                          Reajuste %
                        </Label>
                      </div>
                    </RadioGroup>

                    {adjustmentType === 'percentage' && (
                      <div className="space-y-2">
                        <Label htmlFor="adjustment_percentage">
                          Percentual de reajuste (%)
                          <span className="ml-1 text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="adjustment_percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Ex: 5.5"
                            value={data.adjustment_percentage}
                            onChange={(e) => setData('adjustment_percentage', e.target.value)}
                            className={`pr-8 ${errors.adjustment_percentage ? 'border-red-500' : ''}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        </div>
                        {errors.adjustment_percentage && (
                          <p className="text-sm text-red-500">{errors.adjustment_percentage}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          O valor mensal será calculado automaticamente com base no percentual informado
                        </p>
                      </div>
                    )}

                    {adjustmentType === 'manual' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="monthly_value">
                            Valor mensal
                            <span className="ml-1 text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              R$
                            </span>
                            <Input
                              id="monthly_value"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={data.monthly_value}
                              onChange={(e) => setData('monthly_value', e.target.value)}
                              className={`pl-10 ${errors.monthly_value ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {errors.monthly_value && (
                            <p className="text-sm text-red-500">{errors.monthly_value}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount">Desconto</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              R$
                            </span>
                            <Input
                              id="discount"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={data.discount}
                              onChange={(e) => setData('discount', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campos de Modalidade (se houver) */}
                  {contract.contractType?.modality === 'Horas' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="included_hours">Horas por ciclo de fechamento</Label>
                        <Input
                          id="included_hours"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={data.included_hours}
                          onChange={(e) => setData('included_hours', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="extra_hour_value">Valor hora excedente</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            R$
                          </span>
                          <Input
                            id="extra_hour_value"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={data.extra_hour_value}
                            onChange={(e) => setData('extra_hour_value', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Cenário B: Adendo Durante Vigência */}
          {addendumType === 'during_term' && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Alteração</CardTitle>
                <CardDescription>
                  Configure os dados da alteração durante a vigência do contrato
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descrição do adendo
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Ex: Alteração de escopo, Ajuste pontual de valores, etc."
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">
                      Data de início
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={data.start_date}
                      onChange={(e) => setData('start_date', e.target.value)}
                      className={errors.start_date ? 'border-red-500' : ''}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-red-500">{errors.start_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewal_date">Próximo reajuste</Label>
                    <Input
                      id="renewal_date"
                      type="date"
                      value={data.renewal_date}
                      onChange={(e) => setData('renewal_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_value">
                      Valor mensal
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <Input
                        id="monthly_value"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={data.monthly_value}
                        onChange={(e) => setData('monthly_value', e.target.value)}
                        className={`pl-10 ${errors.monthly_value ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.monthly_value && (
                      <p className="text-sm text-red-500">{errors.monthly_value}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Desconto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={data.discount}
                        onChange={(e) => setData('discount', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit(route('contracts.show', contract.id))}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Gerando...' : 'Gerar Adendo'}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
