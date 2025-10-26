<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some example clients with complete data
        $clientsData = [
            [
                'name' => 'Acme Corporation',
                'trade_name' => 'Acme Corp',
                'legal_name' => 'Acme Corporation Ltda',
                'document' => '12.345.678/0001-90',
                'state_registration' => '123.456.789',
                'municipal_registration' => '987654',
                'workplace' => 'Matriz',
                'notes' => 'Cliente desde 2020. Contrato anual de suporte.',
                'tenant_id' => 1,
                'visible_to_clients' => true,
                'addresses' => [
                    [
                        'zip_code' => '20040-020',
                        'street' => 'Av. Rio Branco, 156',
                        'neighborhood' => 'Centro',
                        'city' => 'Rio de Janeiro',
                        'state' => 'RJ',
                        'complement' => 'Sala 1001',
                    ],
                ],
                'contacts' => [
                    ['name' => 'João Silva', 'email' => 'joao@acme.com', 'phone' => '(21) 3333-4444', 'contact_type' => 'Comercial'],
                    ['name' => 'Maria Santos', 'email' => 'maria@acme.com', 'phone' => '(21) 3333-4445', 'contact_type' => 'Técnico'],
                ],
                'users' => [
                    ['name' => 'João Silva', 'email' => 'joao@acme.com'],
                    ['name' => 'Maria Santos', 'email' => 'maria@acme.com'],
                ],
            ],
            [
                'name' => 'Globex Industries',
                'trade_name' => 'Globex',
                'legal_name' => 'Globex Industries S.A.',
                'document' => '98.765.432/0001-10',
                'state_registration' => '987.654.321',
                'municipal_registration' => '123456',
                'workplace' => 'Filial Niterói',
                'notes' => 'Cliente VIP. Atendimento prioritário.',
                'tenant_id' => 1,
                'visible_to_clients' => true,
                'addresses' => [
                    [
                        'zip_code' => '24020-125',
                        'street' => 'Rua da Conceição, 88',
                        'neighborhood' => 'Centro',
                        'city' => 'Niterói',
                        'state' => 'RJ',
                        'complement' => '3º andar',
                    ],
                ],
                'contacts' => [
                    ['name' => 'Pedro Oliveira', 'email' => 'pedro@globex.com', 'phone' => '(21) 2222-3333', 'contact_type' => 'Financeiro'],
                    ['name' => 'Ana Costa', 'email' => 'ana@globex.com', 'phone' => '(21) 2222-3334', 'contact_type' => 'Administrativo'],
                ],
                'users' => [
                    ['name' => 'Pedro Oliveira', 'email' => 'pedro@globex.com'],
                    ['name' => 'Ana Costa', 'email' => 'ana@globex.com'],
                ],
            ],
            [
                'name' => 'Soylent Corp',
                'trade_name' => 'Soylent',
                'legal_name' => 'Soylent Corporation do Brasil',
                'document' => '11.222.333/0001-44',
                'state_registration' => '111.222.333',
                'municipal_registration' => '444555',
                'workplace' => 'São Gonçalo',
                'notes' => 'Novo cliente. Em período de teste.',
                'tenant_id' => 1,
                'visible_to_clients' => true,
                'addresses' => [
                    [
                        'zip_code' => '24440-000',
                        'street' => 'Rua Feliciano Sodré, 45',
                        'neighborhood' => 'Centro',
                        'city' => 'São Gonçalo',
                        'state' => 'RJ',
                        'complement' => 'Loja 2',
                    ],
                ],
                'contacts' => [
                    ['name' => 'Carlos Souza', 'email' => 'carlos@soylent.com', 'phone' => '(21) 1111-2222', 'contact_type' => 'Comercial'],
                ],
                'users' => [
                    ['name' => 'Carlos Souza', 'email' => 'carlos@soylent.com'],
                ],
            ],
        ];

        foreach ($clientsData as $clientData) {
            $addresses = $clientData['addresses'] ?? [];
            $contacts = $clientData['contacts'] ?? [];
            // Removido: $users = $clientData['users'] ?? [];
            
            unset($clientData['addresses'], $clientData['contacts'], $clientData['users']);
            
            // Use updateOrCreate to avoid unique constraint violations
            $client = Client::updateOrCreate(
                ['name' => $clientData['name']], // Unique key
                $clientData
            );

            // Create addresses (delete existing and recreate)
            $client->addresses()->delete();
            foreach ($addresses as $addressData) {
                $client->addresses()->create($addressData);
            }

            // Create contacts (delete existing and recreate)
            $client->contacts()->delete();
            foreach ($contacts as $contactData) {
                $client->contacts()->create($contactData);
            }

            // Removido: criação de usuários (relacionamento não existe no modelo)
        }
    }
}
