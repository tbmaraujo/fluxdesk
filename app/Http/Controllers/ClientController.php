<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Calcular estatísticas
        $totalClients = Client::query()->count();
        
        $clientsWithContracts = Client::query()
            ->has('contracts')
            ->count();
        
        $clientsWithContacts = Client::query()
            ->has('contacts')
            ->count();
        
        $clientsWithoutContracts = Client::query()
            ->doesntHave('contracts')
            ->count();
        
        $query = Client::query();

        // Busca por nome
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('legal_name', 'like', '%' . $request->search . '%')
                ->orWhere('document', 'like', '%' . $request->search . '%');
        }

        // Filtro por tipo
        if ($request->filled('filter')) {
            $filter = $request->string('filter')->toString();
            
            if ($filter === 'with_contracts') {
                $query->has('contracts');
            } elseif ($filter === 'without_contracts') {
                $query->doesntHave('contracts');
            } elseif ($filter === 'with_contacts') {
                $query->has('contacts');
            }
        }

        $clients = $query->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'stats' => [
                'total' => $totalClients,
                'with_contracts' => $clientsWithContracts,
                'with_contacts' => $clientsWithContacts,
                'without_contracts' => $clientsWithoutContracts,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'filter' => $request->string('filter')->toString(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Clients/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'document' => 'nullable|string|max:255',
            'state_registration' => 'nullable|string|max:255',
            'municipal_registration' => 'nullable|string|max:255',
            'workplace' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'visible_to_clients' => 'sometimes|boolean',
        ]);

        if (! $request->user()?->isSuperAdmin()) {
            unset($validated['visible_to_clients']);
        }

        Client::create($validated);

        return redirect()->route('clients.index')->with('success', 'Cliente criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Client $client): Response
    {
        $client->load(['addresses', 'contacts']);

        // Verifica se o usuário é super admin
        $currentUser = auth()->user();
        $isSuperAdmin = $currentUser?->isSuperAdmin() ?? false;

        return Inertia::render('Clients/Show', [
            'client' => array_merge($client->toArray(), [
                // Inclui visible_to_clients apenas para super admins
                'visible_to_clients' => $isSuperAdmin ? $client->visible_to_clients : null,
            ]),
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Client $client): Response
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'document' => 'nullable|string|max:255',
            'state_registration' => 'nullable|string|max:255',
            'municipal_registration' => 'nullable|string|max:255',
            'workplace' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'visible_to_clients' => 'sometimes|boolean',
        ]);

        if (! $request->user()?->isSuperAdmin()) {
            unset($validated['visible_to_clients']);
        }

        $client->update($validated);

        return redirect()->route('clients.show', $client)->with('success', 'Cliente atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Cliente removido com sucesso!');
    }
}
