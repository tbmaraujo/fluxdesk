<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'zip_code' => 'nullable|string|max:10',
            'street' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:20',
            'neighborhood' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:2',
            'complement' => 'nullable|string|max:255',
        ]);

        $client->addresses()->create($validated);

        return back()->with('success', 'Endereço adicionado com sucesso!');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client, Address $address): RedirectResponse
    {
        $validated = $request->validate([
            'zip_code' => 'nullable|string|max:10',
            'street' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:20',
            'neighborhood' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:2',
            'complement' => 'nullable|string|max:255',
        ]);

        $address->update($validated);

        return back()->with('success', 'Endereço atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client, Address $address): RedirectResponse
    {
        $address->delete();

        return back()->with('success', 'Endereço removido com sucesso!');
    }
}
