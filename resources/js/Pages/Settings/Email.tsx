import { Head } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import GeneralTab from './Email/GeneralTab';
import IncomingTab from './Email/IncomingTab';
import AuthorizationsTab from './Email/AuthorizationsTab';
import OutgoingTab from './Email/OutgoingTab';
import type { Client, TenantEmailAddress } from '@/types';

interface EmailSettingsProps {
    emailAddresses: TenantEmailAddress[];
    clients: Client[];
}

export default function EmailSettings({ emailAddresses, clients }: EmailSettingsProps) {
    const incomingEmails = emailAddresses.filter(
        e => e.purpose === 'incoming' || e.purpose === 'both'
    );

    return (
        <AuthenticatedLayout>
            <Head title="Configurações de E-mail" />

            <div className="min-h-screen bg-gray-50/50 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Configurações de E-mail
                            </h1>
                            <p className="text-sm text-gray-500">
                                Configure e-mails de recebimento e envio de tickets
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="geral" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="geral">Geral</TabsTrigger>
                        <TabsTrigger value="recebimento">
                            Recebimento
                            {incomingEmails.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {incomingEmails.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="autorizacoes">Autorizações</TabsTrigger>
                        <TabsTrigger value="envio">Envio</TabsTrigger>
                    </TabsList>

                    <TabsContent value="geral" className="space-y-4">
                        <GeneralTab />
                    </TabsContent>

                    <TabsContent value="recebimento" className="space-y-4">
                        <IncomingTab emailAddresses={incomingEmails} clients={clients} />
                    </TabsContent>

                    <TabsContent value="autorizacoes" className="space-y-4">
                        <AuthorizationsTab />
                    </TabsContent>

                    <TabsContent value="envio" className="space-y-4">
                        <OutgoingTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}

