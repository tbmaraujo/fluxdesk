<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $groups = Group::where('tenant_id', $request->user()->tenant_id)
            ->withCount('users')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('description', 'ILIKE', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Settings/Groups/Index', [
            'groups' => $groups,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Settings/Groups/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('groups')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                }),
            ],
            'description' => 'nullable|string|max:1000',
        ]);

        Group::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('settings.groups.index')
            ->with('success', 'Grupo criado com sucesso!');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Group $group): Response
    {
        // Verificar se o grupo pertence ao tenant
        if ($group->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $group->loadCount('users');

        return Inertia::render('Settings/Groups/Edit', [
            'group' => $group,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group): RedirectResponse
    {
        // Verificar se o grupo pertence ao tenant
        if ($group->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('groups')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                })->ignore($group->id),
            ],
            'description' => 'nullable|string|max:1000',
        ]);

        $group->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('settings.groups.index')
            ->with('success', 'Grupo atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group): RedirectResponse
    {
        // Verificar se o grupo pertence ao tenant
        if ($group->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        // Verificar se há usuários associados
        $usersCount = $group->users()->count();
        if ($usersCount > 0) {
            return redirect()
                ->route('settings.groups.index')
                ->with('error', "Não é possível excluir este grupo pois há {$usersCount} usuário(s) associado(s).");
        }

        $group->delete();

        return redirect()
            ->route('settings.groups.index')
            ->with('success', 'Grupo removido com sucesso!');
    }
}
