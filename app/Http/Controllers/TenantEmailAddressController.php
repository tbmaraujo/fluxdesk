<?php

namespace App\Http\Controllers;

use App\Http\Requests\TenantEmailAddressRequest;
use App\Models\Client;
use App\Models\TenantEmailAddress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantEmailAddressController extends Controller
{
    /**
     * Exibir página de configurações de e-mail.
     */
    public function index(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $emailAddresses = TenantEmailAddress::where('tenant_id', $tenantId)
            ->with(['client:id,name', 'service:id,name', 'priority:id,name,service_id'])
            ->orderBy('created_at', 'desc')
            ->get();

        $clients = Client::where('tenant_id', $tenantId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $services = \App\Models\Service::where('tenant_id', $tenantId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $priorities = \App\Models\Priority::where('tenant_id', $tenantId)
            ->select('id', 'name', 'service_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Email', [
            'emailAddresses' => $emailAddresses,
            'clients' => $clients,
            'services' => $services,
            'priorities' => $priorities,
        ]);
    }

    /**
     * Armazenar novo endereço de e-mail.
     */
    public function store(TenantEmailAddressRequest $request)
    {
        $validated = $request->validated();
        $validated['tenant_id'] = $request->user()->tenant_id;

        // Normalizar e-mail para lowercase
        $validated['email'] = strtolower($validated['email']);

        $emailAddress = TenantEmailAddress::create($validated);

        return redirect()->back()->with('success', 'E-mail adicionado com sucesso!');
    }

    /**
     * Atualizar endereço de e-mail existente.
     */
    public function update(TenantEmailAddressRequest $request, TenantEmailAddress $tenantEmailAddress)
    {
        // Verificar se o e-mail pertence ao tenant do usuário
        if ($tenantEmailAddress->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Não autorizado');
        }

        $validated = $request->validated();

        // Normalizar e-mail para lowercase
        if (isset($validated['email'])) {
            $validated['email'] = strtolower($validated['email']);
        }

        $tenantEmailAddress->update($validated);

        return redirect()->back()->with('success', 'E-mail atualizado com sucesso!');
    }

    /**
     * Remover endereço de e-mail.
     */
    public function destroy(Request $request, TenantEmailAddress $tenantEmailAddress)
    {
        // Verificar se o e-mail pertence ao tenant do usuário
        if ($tenantEmailAddress->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Não autorizado');
        }

        $tenantEmailAddress->delete();

        return redirect()->back()->with('success', 'E-mail removido com sucesso!');
    }

    /**
     * Marcar e-mail como verificado.
     */
    public function verify(Request $request, TenantEmailAddress $tenantEmailAddress)
    {
        // Verificar se o e-mail pertence ao tenant do usuário
        if ($tenantEmailAddress->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Não autorizado');
        }

        $tenantEmailAddress->update([
            'verified' => true,
            'verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'E-mail verificado com sucesso!');
    }

    /**
     * Alternar status ativo/inativo.
     */
    public function toggle(Request $request, TenantEmailAddress $tenantEmailAddress)
    {
        // Verificar se o e-mail pertence ao tenant do usuário
        if ($tenantEmailAddress->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Não autorizado');
        }

        $tenantEmailAddress->update([
            'active' => !$tenantEmailAddress->active,
        ]);

        $status = $tenantEmailAddress->active ? 'ativado' : 'desativado';

        return redirect()->back()->with('success', "E-mail {$status} com sucesso!");
    }
}

