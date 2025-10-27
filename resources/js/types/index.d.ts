export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    client_id?: number;
    client?: Client;
    role?: string;
    groups?: Group[];
    is_super_admin?: boolean;
    is_active?: boolean;
    two_factor_status?: string;
}

export interface Client {
    id: number;
    name: string;
    trade_name?: string;
    legal_name?: string;
    document?: string;
    state_registration?: string;
    municipal_registration?: string;
    workplace?: string;
    notes?: string;
    visible_to_clients?: boolean | null;
    created_at?: string;
    updated_at?: string;
    users?: User[];
    addresses?: Address[];
    contacts?: Contact[];
}

export interface Group {
    id: number;
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ContractType {
    id: number;
    tenant_id: number;
    name: string;
    modality: 'Livre' | 'Horas' | 'Por Atendimento' | 'Horas Cumulativas' | 'SaaS/Produto';
    description?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ContractVersion {
    id: number;
    contract_id: number;
    tenant_id: number;
    user_id?: number | null;
    version: string;
    is_active_version: boolean;
    description?: string | null;
    activity_type?: string | null;
    // Campos de Status e Vigência
    start_date?: string | null;
    end_date?: string | null;
    renewal_date?: string | null;
    expiration_term?: string | null;
    auto_renewal: boolean;
    status: "Ativo" | "Inativo";
    // Campos de Condições Financeiras
    monthly_value?: string | null;
    payment_day?: number | null;
    due_day?: number | null;
    discount?: string | null;
    billing_cycle?: string | null;
    closing_cycle?: string | null;
    payment_method?: string | null;
    billing_type?: string | null;
    contract_term?: string | null;
    // Campos específicos da modalidade "Horas"
    included_hours?: string | null;
    extra_hour_value?: string | null;
    // Campos específicos da modalidade "Livre (Ilimitado)"
    scope_included?: string | null;
    scope_excluded?: string | null;
    fair_use_policy?: string | null;
    visit_limit?: number | null;
    // Campos específicos da modalidade "Por Atendimento"
    included_tickets?: number | null;
    extra_ticket_value?: string | null;
    // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
    rollover_active?: boolean;
    rollover_days_window?: number | null;
    rollover_hours_limit?: number | null;
    // Campos específicos da modalidade "SaaS/Produto"
    appointments_when_pending?: boolean;
    created_at: string;
    updated_at: string;
    // Relações
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export interface Contract {
    id: number;
    tenant_id: number;
    client_id: number;
    contract_type_id: number;
    name: string;
    technical_notes?: string | null;
    created_at: string;
    updated_at: string;
    // Relações
    client?: {
        id: number;
        name: string;
        document?: string;
    } | null;
    contractType?: {
        id: number;
        name: string;
        modality?: string;
    } | null;
    activeVersion?: ContractVersion;
    versions?: ContractVersion[];
    items?: ContractItem[];
    notifications?: ContractNotification[];
    displacements?: ContractDisplacement[];
}

export interface ContractNotification {
    id: number;
    contract_id: number;
    tenant_id: number;
    email: string;
    days_before: number;
    on_cancellation: boolean;
    on_adjustment: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContractDisplacement {
    id: number;
    contract_id: number;
    tenant_id: number;
    name: string;
    value: string;
    quantity_included: number;
    created_at: string;
    updated_at: string;
}

export interface Address {
    id: number;
    client_id: number;
    zip_code?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: number;
    tenant_id: number;
    client_id: number;
    name: string;
    email?: string;
    phone?: string;
    job_title?: string;
    contact_type?: string;
    portal_access?: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContractItem {
    id?: number;
    contract_id?: number;
    tenant_id?: number;
    name: string;
    unit_value: string;
    quantity: number;
    total_value: string;
    created_at?: string;
    updated_at?: string;
}

export interface Priority {
    id: number;
    tenant_id: number;
    service_id: number;
    name: string;
    response_sla_time: number;
    resolution_sla_time: number;
    created_at: string;
    updated_at: string;
}

export interface Service {
    id: number;
    tenant_id: number;
    name: string;
    ticket_type_id: number;
    review_type?: string | null;
    review_time_limit?: number | null;
    allow_reopen_after_review: boolean;
    created_at: string;
    updated_at: string;
    ticketType?: {
        id: number;
        name: string;
    };
    priorities?: Priority[];
    // Campos adicionados para a tela principal
    tickets_count?: number;
    is_active?: boolean;
    sla_info?: string;
    badges?: Array<{
        label: string;
        variant: 'success' | 'warning' | 'info' | 'secondary' | 'red' | 'gray' | 'orange' | 'purple';
    }>;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
