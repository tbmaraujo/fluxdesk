import { Head, Link } from '@inertiajs/react';
import { Settings, FileText } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Service } from '@/types';
import { Button } from '@/Components/ui/button';

interface IndexProps {
  services: Service[];
}

export default function ServicesIndex({ services }: IndexProps) {
  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Mesas de Serviço</h1>
          </div>
        </div>
      }
    >
      <Head title="Mesas de Serviço" />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Mesas de Serviço Disponíveis</CardTitle>
            <CardDescription>
              Clique em uma mesa de serviço para configurá-la
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Ticket</TableHead>
                    <TableHead className="text-center">Revisão Configurada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          {service.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.ticketType ? service.ticketType.name : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.review_type ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <Badge variant="secondary">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={route('settings.services.edit', service.id)}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-900">
                  Nenhuma mesa de serviço encontrada
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  As mesas de serviço são criadas automaticamente pelo sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
