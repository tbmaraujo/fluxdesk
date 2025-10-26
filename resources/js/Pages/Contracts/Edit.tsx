import { FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { ContractForm, ContractFormData } from './ContractForm';
import { Client, Contract, ContractType, PageProps } from '@/types';

const statusVariantMap: Record<string, 'success' | 'secondary'> = {
  Ativo: 'success',
  Inativo: 'secondary',
};

interface EditProps extends PageProps {
  contract: Contract;
  contractTypes: ContractType[];
  clients: Client[];
  options: {
    paymentMethods: string[];
    billingCycles: string[];
    closingCycles: string[];
    expirationTerms: string[];
    statuses: string[];
  };
}

export default function EditContract({ auth, contract, contractTypes, clients, options }: EditProps) {
  // Usar a versão ativa do contrato (aceita tanto camelCase quanto snake_case)
  const activeVersion = contract.activeVersion || (contract as any).active_version;

  console.log('🔍 DEBUG Edit Contract:', {
    contract,
    activeVersion,
    hasActiveVersion: !!activeVersion,
    monthlyValue: activeVersion?.monthly_value,
    startDate: activeVersion?.start_date,
  });

  // Função para formatar datas ISO para YYYY-MM-DD
  const formatDateForInput = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const form = useForm<ContractFormData>({
    contract_type_id: contract.contract_type_id?.toString() || '',
    name: contract.name || '',
    client_id: contract.client_id?.toString() || '',
    technical_notes: contract.technical_notes ?? '',
    start_date: formatDateForInput(activeVersion?.start_date),
    payment_day: activeVersion?.payment_day ? activeVersion.payment_day.toString() : '',
    monthly_value: activeVersion?.monthly_value ?? '',
    discount: activeVersion?.discount ?? '',
    payment_method: activeVersion?.payment_method ?? (options.paymentMethods[0] ?? ''),
    billing_cycle: activeVersion?.billing_cycle ?? (options.billingCycles[0] ?? ''),
    closing_cycle: activeVersion?.closing_cycle ?? (options.closingCycles[0] ?? ''),
    auto_renewal: activeVersion?.auto_renewal ?? false,
    status: activeVersion?.status ?? 'Ativo',
    renewal_date: formatDateForInput(activeVersion?.renewal_date),
    expiration_term: activeVersion?.expiration_term ?? (options.expirationTerms[0] ?? ''),
    // Campos específicos da modalidade "Horas"
    included_hours: activeVersion?.included_hours ?? '',
    extra_hour_value: activeVersion?.extra_hour_value ?? '',
    // Campos específicos da modalidade "Livre (Ilimitado)"
    scope_included: activeVersion?.scope_included ?? '',
    scope_excluded: activeVersion?.scope_excluded ?? '',
    fair_use_policy: activeVersion?.fair_use_policy ?? '',
    visit_limit: activeVersion?.visit_limit?.toString() ?? '',
    // Campos específicos da modalidade "Por Atendimento"
    included_tickets: activeVersion?.included_tickets?.toString() ?? '',
    extra_ticket_value: activeVersion?.extra_ticket_value ?? '',
    // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
    rollover_active: activeVersion?.rollover_active ?? false,
    rollover_days_window: activeVersion?.rollover_days_window?.toString() ?? '',
    rollover_hours_limit: activeVersion?.rollover_hours_limit ?? '',
    // Campos específicos da modalidade "SaaS/Produto"
    appointments_when_pending: activeVersion?.appointments_when_pending ?? false,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    form.put(route('contracts.update', contract.id), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Editar contrato · ${contract.name}`} />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit(route('contracts.show', contract.id))}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Editar contrato</h1>
                <Badge variant={statusVariantMap[activeVersion?.status ?? 'Ativo'] ?? 'secondary'} className="text-sm">
                  {activeVersion?.status ?? 'Ativo'}
                </Badge>
              </div>
              <p className="mt-1 text-base text-gray-600">{contract.name}</p>
              <p className="mt-1 text-sm text-gray-500">Atualize dados financeiros, vigência e informações do cliente.</p>
            </div>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <ContractForm
              mode="edit"
              form={{
                data: form.data,
                setData: form.setData,
                processing: form.processing,
                errors: form.errors as Partial<Record<keyof ContractFormData, string>>,
              }}
              contractTypes={contractTypes}
              clients={clients}
              options={options}
              onSubmit={handleSubmit}
              onCancelHref={route('contracts.show', contract.id)}
            />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
