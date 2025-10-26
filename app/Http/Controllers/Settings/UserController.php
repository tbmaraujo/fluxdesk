<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        
        $users = User::where('tenant_id', $request->user()->tenant_id)
            ->with('groups')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Settings/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        $groups = \App\Models\Group::where('tenant_id', $request->user()->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        return Inertia::render('Settings/Users/Create', [
            'availableGroups' => $groups,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                }),
            ],
            'client_id' => 'required|exists:clients,id',
            'phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:1000',
            'password' => 'nullable|string|min:8|confirmed',
            'group_ids' => 'nullable|array',
            'group_ids.*' => 'exists:groups,id',
            'is_active' => 'nullable|boolean',
            'two_factor_status' => 'nullable|string|in:Aguardando,Ativo,Inativo',
        ]);

        // Buscar o usuário autenticado SEM global scopes (BelongsToTenant interfere)
        $authUser = \App\Models\User::withoutGlobalScopes()->find(auth()->id());
        
        if (!$authUser || !$authUser->tenant_id) {
            \Log::error('UserController::store - Usuário sem tenant_id', [
                'auth_id' => auth()->id(),
                'auth_user' => $authUser,
            ]);
            throw new \Exception('Usuário autenticado não possui tenant_id definido.');
        }
        
        $tenantId = $authUser->tenant_id;

        $userData = [
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'client_id' => $validated['client_id'],
            'phone' => $validated['phone'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'two_factor_status' => $validated['two_factor_status'] ?? 'Inativo',
        ];

        // Adicionar senha apenas se fornecida
        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        } else {
            // Senha padrão para solicitantes criados via modal
            $userData['password'] = Hash::make('password123');
        }

        // Criar usuário com tenant_id já setado no model para evitar sobrescrita do trait
        $user = new User();
        $user->tenant_id = $tenantId; // Setar PRIMEIRO para o evento creating não sobrescrever
        $user->fill($userData);
        $user->save();

        // Associar grupos
        if (!empty($validated['group_ids'])) {
            foreach ($validated['group_ids'] as $groupId) {
                $user->groups()->attach($groupId, ['tenant_id' => $request->user()->tenant_id]);
            }
        }

        return redirect()
            ->route('settings.users.index')
            ->with('success', 'Usuário criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Settings/Users/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, User $user): Response
    {
        $this->authorize('update', $user);

        $user->load('groups');

        $groups = \App\Models\Group::where('tenant_id', $request->user()->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        return Inertia::render('Settings/Users/Edit', [
            'user' => $user,
            'availableGroups' => $groups,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                })->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'group_ids' => 'nullable|array',
            'group_ids.*' => 'exists:groups,id',
            'is_active' => 'boolean',
            'two_factor_status' => 'string|in:Aguardando,Ativo,Inativo',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
            'two_factor_status' => $validated['two_factor_status'] ?? $user->two_factor_status,
        ]);

        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Sincronizar grupos
        if (isset($validated['group_ids'])) {
            $user->groups()->detach(); // Remove todos os grupos atuais
            foreach ($validated['group_ids'] as $groupId) {
                $user->groups()->attach($groupId, ['tenant_id' => $request->user()->tenant_id]);
            }
        }

        return redirect()
            ->route('settings.users.index')
            ->with('success', 'Usuário atualizado com sucesso!');
    }

    /**
     * Get users by client ID.
     */
    public function getByClient(Request $request)
    {
        $clientId = $request->input('client_id');
        
        if (!$clientId) {
            return response()->json(['users' => []]);
        }

        $users = User::where('tenant_id', $request->user()->tenant_id)
            ->where('client_id', $clientId)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json(['users' => $users]);
    }

    /**
     * Check if email is available.
     */
    public function checkEmail(Request $request)
    {
        $email = $request->input('email');
        
        if (!$email) {
            return response()->json(['available' => false]);
        }

        $exists = User::where('tenant_id', $request->user()->tenant_id)
            ->where('email', $email)
            ->exists();

        return response()->json(['available' => !$exists]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()
            ->route('settings.users.index')
            ->with('success', 'Usuário removido com sucesso!');
    }
}
