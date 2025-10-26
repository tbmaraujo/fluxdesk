import { FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronLeft, FilePlus2 } from 'lucide-react';

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
import { Card, CardContent } from '@/Components/ui/card';
import { ContractForm, ContractFormData } from './ContractForm';
import { Client, ContractType } from '@/types';

interface CreateProps {
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

export default function CreateContract({ contractTypes, clients, options }: CreateProps) {
  const form = useForm<ContractFormData>({
    contract_type_id: contractTypes[0]?.id.toString() ?? '',
    name: '',
    client_id: clients[0]?.id.toString() ?? '',
    technical_notes: '',
    start_date: '',
    payment_day: '',
    monthly_value: '',
    discount: '',
    payment_method: options.paymentMethods[0] ?? '',
    billing_cycle: options.billingCycles[0] ?? '',
    closing_cycle: options.closingCycles[0] ?? '',
    auto_renewal: true,
    status: options.statuses[0] ?? 'Ativo',
    renewal_date: '',
    expiration_term: options.expirationTerms[0] ?? '',
    // Campos específicos da modalidade "Horas"
    included_hours: '',
    extra_hour_value: '',
    // Campos específicos da modalidade "Livre (Ilimitado)"
    scope_included: '',
    scope_excluded: '',
    fair_use_policy: '',
    visit_limit: '',
    // Campos específicos da modalidade "Por Atendimento"
    included_tickets: '',
    extra_ticket_value: '',
    // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
    rollover_active: false,
    rollover_days_window: '',
    rollover_hours_limit: '',
    // Campos específicos da modalidade "SaaS/Produto"
    appointments_when_pending: false,
    items: [],
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    form.post(route('contracts.store'), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <FilePlus2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo contrato</h1>
              <p className="text-sm text-gray-500">Cadastre contratos com dados financeiros, ajustes e vigência definida.</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => router.visit(route('contracts.index'))}>
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      }
    >
      <Head title="Novo contrato" />

      <div className="px-6 pb-10">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={route('contracts.index')}>Contratos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Novo contrato</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <ContractForm
              mode="create"
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
              onCancelHref={route('contracts.index')}
            />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
