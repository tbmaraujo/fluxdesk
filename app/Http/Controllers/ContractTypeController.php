<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractTypeRequest;
use App\Http\Requests\UpdateContractTypeRequest;
use App\Models\ContractType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContractTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $contractTypes = ContractType::query()
            ->where('tenant_id', $tenantId)
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->string('search')->toString();
                $query->where('name', 'like', "%{$term}%");
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Settings/ContractTypes/Index', [
            'contractTypes' => $contractTypes,
            'filters' => [
                'search' => $request->string('search')->toString(),
            ],
            'modalities' => [
                'Livre',
                'Horas',
                'Por Atendimento',
                'Horas Cumulativas',
                'SaaS/Produto',
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreContractTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['tenant_id'] = $request->user()->tenant_id;
        $data['is_active'] = $data['is_active'] ?? true;

        ContractType::create($data);

        return redirect()
            ->route('settings.contract-types.index')
            ->with('success', 'Tipo de contrato criado com sucesso!');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateContractTypeRequest $request, ContractType $contractType): RedirectResponse
    {
        $contractType->update($request->validated());

        return redirect()
            ->route('settings.contract-types.index')
            ->with('success', 'Tipo de contrato atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContractType $contractType): RedirectResponse
    {
        $contractType->delete();

        return redirect()
            ->route('settings.contract-types.index')
            ->with('success', 'Tipo de contrato removido com sucesso!');
    }
}
