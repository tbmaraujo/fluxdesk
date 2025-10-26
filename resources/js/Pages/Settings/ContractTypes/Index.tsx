import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Edit, FileText, Plus, Search, Trash2 } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Textarea } from '@/Components/ui/textarea';
import { ContractType } from '@/types';

interface PaginatedContractTypes {
  data: ContractType[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface IndexProps {
  contractTypes: PaginatedContractTypes;
  modalities: string[];
  filters: {
    search?: string;
  };
}

export default function ContractTypesIndex({ contractTypes, modalities, filters }: IndexProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContractType | null>(null);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: '',
    modality: '',
    description: '',
  });

  const submitFilters = () => {
    router.get(
      route('settings.contract-types.index'),
      { search },
      {
        preserveScroll: true,
        preserveState: true,
      }
    );
  };

  const openCreateModal = () => {
    reset();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (contractType: ContractType) => {
    setEditingType(contractType);
    setData({
      name: contractType.name,
      modality: contractType.modality,
      description: contractType.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('settings.contract-types.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      },
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    put(route('settings.contract-types.update', editingType.id), {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingType(null);
        reset();
      },
    });
  };

  const handleDelete = (contractType: ContractType) => {
    if (confirm(`Tem certeza que deseja excluir o tipo "${contractType.name}"?`)) {
      router.delete(route('settings.contract-types.destroy', contractType.id), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Tipos de Contrato</h1>
          </div>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Tipo de contrato
          </Button>
        </div>
      }
    >
      <Head title="Tipos de Contrato" />

      <div className="px-6 pb-10">
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Buscar tipos de contrato</CardTitle>
              <CardDescription>
                Utilize a busca para encontrar tipos específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        submitFilters();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={submitFilters}>Buscar</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-600">Nome</TableHead>
                  <TableHead className="text-gray-600">Modalidade</TableHead>
                  <TableHead className="text-right text-gray-600">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractTypes.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-sm text-gray-500">
                      Nenhum tipo de contrato encontrado.
                    </TableCell>
                  </TableRow>
                )}

                {contractTypes.data.map((contractType) => (
                  <TableRow
                    key={contractType.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <TableCell className="font-medium text-primary">
                      {contractType.name}
                    </TableCell>
                    <TableCell>{contractType.modality}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(contractType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contractType)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {contractTypes.last_page > 1 && (
              <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {contractTypes.from ?? 0} até {contractTypes.to ?? contractTypes.data.length} de {contractTypes.total} tipos
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={contractTypes.current_page <= 1}
                    onClick={() =>
                      router.get(
                        route('settings.contract-types.index'),
                        {
                          ...filters,
                          page: contractTypes.current_page - 1,
                        },
                        {
                          preserveScroll: true,
                          preserveState: true,
                        }
                      )
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={contractTypes.current_page >= contractTypes.last_page}
                    onClick={() =>
                      router.get(
                        route('settings.contract-types.index'),
                        {
                          ...filters,
                          page: contractTypes.current_page + 1,
                        },
                        {
                          preserveScroll: true,
                          preserveState: true,
                        }
                      )
                    }
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo tipo de contrato</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo tipo de contrato
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Ex: Plano Suporte Gold"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-modality">Modalidade *</Label>
                <Select value={data.modality} onValueChange={(value) => setData('modality', value)}>
                  <SelectTrigger id="create-modality">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map((modality) => (
                      <SelectItem key={modality} value={modality}>
                        {modality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.modality && <p className="text-sm text-red-500">{errors.modality}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Descrição</Label>
                <Textarea
                  id="create-description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Descrição opcional"
                  rows={3}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processing}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tipo de contrato</DialogTitle>
            <DialogDescription>
              Atualize os dados do tipo de contrato
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Ex: Plano Suporte Gold"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-modality">Modalidade *</Label>
                <Select value={data.modality} onValueChange={(value) => setData('modality', value)}>
                  <SelectTrigger id="edit-modality">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map((modality) => (
                      <SelectItem key={modality} value={modality}>
                        {modality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.modality && <p className="text-sm text-red-500">{errors.modality}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Descrição opcional"
                  rows={3}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processing}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
