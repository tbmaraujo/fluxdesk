import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, Loader2, Mail, MapPin, Phone, Plus, Settings, Trash2, User } from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { Address, Client, Contact, PageProps } from '@/types';

interface Props extends PageProps {
  client: Client & {
    addresses: Address[];
    contacts: Contact[];
    visible_to_clients: boolean | null;
  };
  isSuperAdmin: boolean;
}

export default function Show({ auth, client, isSuperAdmin }: Props) {
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const clientForm = useForm({
    name: client.name ?? '',
    trade_name: client.trade_name ?? '',
    legal_name: client.legal_name ?? '',
    document: client.document ?? '',
    state_registration: client.state_registration ?? '',
    municipal_registration: client.municipal_registration ?? '',
    workplace: client.workplace ?? '',
    notes: client.notes ?? '',
    visible_to_clients: client.visible_to_clients ?? false,
  });

  const addressForm = useForm({
    zip_code: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: ''
  });

  const contactForm = useForm({
    name: '',
    email: '',
    phone: '',
    job_title: '',
    contact_type: '',
    portal_access: false
  });

  const populateClientForm = () => {
    clientForm.setData({
      name: client.name ?? '',
      trade_name: client.trade_name ?? '',
      legal_name: client.legal_name ?? '',
      document: client.document ?? '',
      state_registration: client.state_registration ?? '',
      municipal_registration: client.municipal_registration ?? '',
      workplace: client.workplace ?? '',
      notes: client.notes ?? '',
      visible_to_clients: client.visible_to_clients ?? false,
    });
  };

  useEffect(() => {
    if (addressDialogOpen && editingAddress) {
      addressForm.setData({
        zip_code: editingAddress.zip_code ?? '',
        street: editingAddress.street ?? '',
        number: editingAddress.number ?? '',
        neighborhood: editingAddress.neighborhood ?? '',
        city: editingAddress.city ?? '',
        state: editingAddress.state ?? '',
        complement: editingAddress.complement ?? ''
      });
    }

    if (!addressDialogOpen) {
      addressForm.reset();
    }
  }, [addressDialogOpen, editingAddress]);

  useEffect(() => {
    if (contactDialogOpen && editingContact) {
      contactForm.setData({
        name: editingContact.name ?? '',
        email: editingContact.email ?? '',
        phone: editingContact.phone ?? '',
        job_title: editingContact.job_title ?? '',
        contact_type: editingContact.contact_type ?? '',
        portal_access: editingContact.portal_access ?? false
      });
    }

    if (!contactDialogOpen) {
      contactForm.reset();
    }
  }, [contactDialogOpen, editingContact]);

  useEffect(() => {
    populateClientForm();
  }, [client]);

  const handleAddressDialogOpenChange = (open: boolean) => {
    setAddressDialogOpen(open);
    if (!open) {
      setEditingAddress(null);
      addressForm.reset();
    }
  };

  const handleContactDialogOpenChange = (open: boolean) => {
    setContactDialogOpen(open);
    if (!open) {
      setEditingContact(null);
      contactForm.reset();
    }
  };

  const handleEditClientDialogOpenChange = (open: boolean) => {
    setEditClientDialogOpen(open);
    if (open) {
      populateClientForm();
      clientForm.clearErrors();
    } else {
      clientForm.clearErrors();
    }
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAddress) {
      addressForm.put(route('clients.addresses.update', { 
        client: client.id, 
        address: editingAddress.id 
      }), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
          setAddressDialogOpen(false);
          setEditingAddress(null);
          addressForm.reset();
        }
      });
    } else {
      addressForm.post(route('clients.addresses.store', client.id), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
          setAddressDialogOpen(false);
          addressForm.reset();
        }
      });
    }
  };

  const handleDeleteAddress = (addressId: number) => {
    if (confirm('Tem certeza que deseja remover este endereço?')) {
      router.delete(route('clients.addresses.destroy', { 
        client: client.id, 
        address: addressId 
      }), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
        }
      });
    }
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      contactForm.put(route('clients.contacts.update', { 
        client: client.id, 
        contact: editingContact.id 
      }), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
          setContactDialogOpen(false);
          setEditingContact(null);
          contactForm.reset();
        }
      });
    } else {
      contactForm.post(route('clients.contacts.store', client.id), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
          setContactDialogOpen(false);
          contactForm.reset();
        }
      });
    }
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm('Tem certeza que deseja remover este contato?')) {
      router.delete(route('clients.contacts.destroy', { 
        client: client.id, 
        contact: contactId 
      }), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['client'] });
        }
      });
    }
  };

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();

    clientForm.put(route('clients.update', client.id), {
      preserveScroll: true,
      onSuccess: () => {
        router.reload({ only: ['client'] });
        setEditClientDialogOpen(false);
        clientForm.clearErrors();
      },
    });
  };

  const handleCepBlur = async () => {
    const cep = addressForm.data.zip_code.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return;
    }

    setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado');
        setLoadingCep(false);
        return;
      }

      addressForm.setData({
        ...addressForm.data,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Cliente: ${client.name}`} />

      <div className="min-h-screen bg-gray-50/50 p-6">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit(route('clients.index'))}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <Badge variant="success" className="text-sm">Cliente Ativo</Badge>
              </div>
              {client.trade_name && (
                <p className="mt-1 text-base text-gray-600">{client.trade_name}</p>
              )}
              {client.document && (
                <p className="mt-1 text-sm text-gray-500">CNPJ/CPF: {client.document}</p>
              )}
            </div>

            <Button 
              onClick={() => handleEditClientDialogOpenChange(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
        </div>
        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="usuarios">Solicitantes</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes" className="space-y-6">
            {/* Card: Informações do Cliente */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dados do Cliente
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      Informações cadastrais e de contato
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditClientDialogOpenChange(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Seção: Dados Principais */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      Dados Principais
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nome Fantasia
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                          {client.trade_name || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Razão Social
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                          {client.legal_name || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          CNPJ/CPF
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                          {client.document || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Inscrição Estadual
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {client.state_registration || 'Isento'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Inscrição Municipal
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {client.municipal_registration || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Local de Atendimento
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {client.workplace || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seção: Configurações */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-400" />
                      Configurações
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {isSuperAdmin && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                              <input 
                                type="checkbox" 
                                id="visible_to_clients" 
                                checked={client.visible_to_clients || false}
                                disabled
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                              />
                              <label 
                                htmlFor="visible_to_clients" 
                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${client.visible_to_clients ? 'bg-blue-600' : 'bg-gray-300'}`}
                              ></label>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="visible_to_clients" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Visível para Clientes
                            </Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {client.visible_to_clients ? 'Visível' : 'Oculto'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção: Observações */}
                  {client.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Observações
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {client.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Endereços */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Endereços
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {client.addresses?.length || 0} endereço(s) cadastrado(s)
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressDialogOpen(true);
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Endereço
                  </Button>
                </div>
              </CardHeader>
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              <CardContent className="p-6">
                {client.addresses?.length > 0 ? (
                  <div className="space-y-4">
                    {client.addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {address.street}, {address.number || ''}
                                {address.complement && `, ${address.complement}`}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {address.neighborhood} - {address.city}/{address.state}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                CEP: {address.zip_code}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAddress(address);
                                setAddressDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum endereço cadastrado</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Adicione um endereço para este cliente.
                    </p>
                    <div className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Endereço
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card: Contatos */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Contatos
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {client.contacts?.length || 0} contato(s) cadastrado(s)
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingContact(null);
                      setContactDialogOpen(true);
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Contato
                  </Button>
                </div>
              </CardHeader>
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              <CardContent className="p-6">
                {client.contacts?.length > 0 ? (
                  <div className="space-y-4">
                    {client.contacts.map((contact) => (
                      <div key={contact.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {contact.name}
                              </p>
                              {contact.email && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {contact.email}
                                </p>
                              )}
                              {contact.phone && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {contact.phone}
                                </p>
                              )}
                              {contact.contact_type && (
                                <div className="mt-2">
                                  <Badge variant="outline">{contact.contact_type}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingContact(contact);
                                setContactDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum contato cadastrado</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Adicione um contato para este cliente.
                    </p>
                    <div className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingContact(null);
                          setContactDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Contato
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Solicitantes
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoas de contato que podem abrir chamados para este cliente
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingContact(null);
                      setContactDialogOpen(true);
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Solicitante
                  </Button>
                </div>
              </CardHeader>
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              <CardContent className="p-6">
                {client.contacts && client.contacts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nome
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            E-mail
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Telefone
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cargo
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tipo
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.contacts.map((contact) => (
                          <tr
                            key={contact.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                                  {contact.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {contact.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {contact.email || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {contact.phone || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {contact.job_title || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {contact.contact_type && (
                                <Badge variant="outline" className="text-xs">
                                  {contact.contact_type}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setContactDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Nenhum solicitante cadastrado
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Adicione pessoas de contato que poderão abrir chamados para este cliente
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingContact(null);
                        setContactDialogOpen(true);
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Primeiro Solicitante
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tickets
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  Chamados relacionados a este cliente
                </CardDescription>
              </CardHeader>
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              <CardContent className="p-6">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Endereço */}
      <Dialog open={addressDialogOpen} onOpenChange={handleAddressDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmitAddress}>
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do endereço do cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zip_code" className="text-right">
                  CEP
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="zip_code"
                    value={addressForm.data.zip_code}
                    onChange={(e) => addressForm.setData('zip_code', e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={loadingCep}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
              {loadingCep && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <p className="text-sm text-blue-600">Buscando endereço...</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="street" className="text-right">
                  Logradouro
                </Label>
                <Input
                  id="street"
                  value={addressForm.data.street}
                  onChange={(e) => addressForm.setData('street', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number" className="text-right">
                  Número
                </Label>
                <Input
                  id="number"
                  value={addressForm.data.number}
                  onChange={(e) => addressForm.setData('number', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="neighborhood" className="text-right">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  value={addressForm.data.neighborhood}
                  onChange={(e) => addressForm.setData('neighborhood', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  Cidade
                </Label>
                <Input
                  id="city"
                  value={addressForm.data.city}
                  onChange={(e) => addressForm.setData('city', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  Estado
                </Label>
                <Input
                  id="state"
                  value={addressForm.data.state}
                  onChange={(e) => addressForm.setData('state', e.target.value.toUpperCase())}
                  className="col-span-3"
                  maxLength={2}
                  placeholder="Ex: SP"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="complement" className="text-right">
                  Complemento
                </Label>
                <Input
                  id="complement"
                  value={addressForm.data.complement}
                  onChange={(e) => addressForm.setData('complement', e.target.value)}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleAddressDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={addressForm.processing}>
                {addressForm.processing ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Cliente */}
      <Dialog open={editClientDialogOpen} onOpenChange={handleEditClientDialogOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <form onSubmit={handleSubmitClient}>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações cadastradas do cliente.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_name" className="text-right">
                  Nome *
                </Label>
                <Input
                  id="client_name"
                  value={clientForm.data.name}
                  onChange={(e) => clientForm.setData('name', e.target.value)}
                  className="col-span-3"
                  required
                />
                {clientForm.errors.name && (
                  <p className="col-start-2 col-span-3 text-sm text-red-500">
                    {clientForm.errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_trade_name" className="text-right">
                  Nome Fantasia
                </Label>
                <Input
                  id="client_trade_name"
                  value={clientForm.data.trade_name}
                  onChange={(e) => clientForm.setData('trade_name', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_legal_name" className="text-right">
                  Razão Social
                </Label>
                <Input
                  id="client_legal_name"
                  value={clientForm.data.legal_name}
                  onChange={(e) => clientForm.setData('legal_name', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_document" className="text-right">
                  CPF/CNPJ
                </Label>
                <Input
                  id="client_document"
                  value={clientForm.data.document}
                  onChange={(e) => clientForm.setData('document', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_state_registration" className="text-right">
                  Inscrição Estadual
                </Label>
                <Input
                  id="client_state_registration"
                  value={clientForm.data.state_registration}
                  onChange={(e) => clientForm.setData('state_registration', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_municipal_registration" className="text-right">
                  Inscrição Municipal
                </Label>
                <Input
                  id="client_municipal_registration"
                  value={clientForm.data.municipal_registration}
                  onChange={(e) => clientForm.setData('municipal_registration', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_workplace" className="text-right">
                  Ponto de Trabalho
                </Label>
                <Input
                  id="client_workplace"
                  value={clientForm.data.workplace}
                  onChange={(e) => clientForm.setData('workplace', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="client_notes" className="text-right pt-2">
                  Anotações
                </Label>
                <Textarea
                  id="client_notes"
                  value={clientForm.data.notes}
                  onChange={(e) => clientForm.setData('notes', e.target.value)}
                  className="col-span-3"
                  rows={4}
                />
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <Label htmlFor="client_visible_to_clients" className="text-base">
                      Visível para clientes
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permite que este cliente acesse informações no portal.
                    </p>
                  </div>
                  <Switch
                    id="client_visible_to_clients"
                    checked={clientForm.data.visible_to_clients}
                    onCheckedChange={(checked) => clientForm.setData('visible_to_clients', checked)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditClientDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={clientForm.processing}>
                {clientForm.processing ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Contato */}
      <Dialog open={contactDialogOpen} onOpenChange={handleContactDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmitContact}>
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
              <DialogDescription>
                Adicione as informações de contato do cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome *
                </Label>
                <Input
                  id="name"
                  value={contactForm.data.name}
                  onChange={(e) => contactForm.setData('name', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.data.email}
                  onChange={(e) => contactForm.setData('email', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={contactForm.data.phone}
                  onChange={(e) => contactForm.setData('phone', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="job_title" className="text-right">
                  Cargo
                </Label>
                <Input
                  id="job_title"
                  value={contactForm.data.job_title}
                  onChange={(e) => contactForm.setData('job_title', e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Gerente de TI"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_type" className="text-right">
                  Tipo de Contato
                </Label>
                <Select
                  value={contactForm.data.contact_type}
                  onValueChange={(value) => contactForm.setData('contact_type', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solicitante">Solicitante</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="portal_access" className="text-right">
                  Acesso ao Portal
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Switch
                    id="portal_access"
                    checked={contactForm.data.portal_access}
                    onCheckedChange={(checked) => contactForm.setData('portal_access', checked)}
                  />
                  <Label htmlFor="portal_access" className="text-sm text-gray-600 dark:text-gray-400">
                    {contactForm.data.portal_access ? 'Habilitado (futuro)' : 'Desabilitado'}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleContactDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={contactForm.processing}>
                {contactForm.processing ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
