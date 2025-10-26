<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Store a newly created resource in storage (from ticket creation form).
     */
    public function storeFromTicket(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'contact_type' => 'nullable|string|max:255',
            'portal_access' => 'nullable|boolean',
            'client_id' => 'required|exists:clients,id',
        ]);

        // Adicionar tenant_id automaticamente
        $validated['tenant_id'] = auth()->user()->tenant_id;
        $validated['portal_access'] = $validated['portal_access'] ?? false;
        $validated['contact_type'] = $validated['contact_type'] ?? 'Solicitante';

        $contact = Contact::create($validated);

        return back()->with('success', 'Solicitante adicionado com sucesso!');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'contact_type' => 'nullable|string|max:255',
            'portal_access' => 'nullable|boolean',
        ]);

        // Adicionar tenant_id automaticamente
        $validated['tenant_id'] = auth()->user()->tenant_id;
        $validated['portal_access'] = $validated['portal_access'] ?? false;

        $client->contacts()->create($validated);

        return back()->with('success', 'Solicitante adicionado com sucesso!');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client, Contact $contact): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'contact_type' => 'nullable|string|max:255',
            'portal_access' => 'nullable|boolean',
        ]);

        $contact->update($validated);

        return back()->with('success', 'Solicitante atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client, Contact $contact): RedirectResponse
    {
        $contact->delete();

        return back()->with('success', 'Contato removido com sucesso!');
    }

    /**
     * Get contacts by client (for AJAX requests).
     */
    public function getByClient(Request $request)
    {
        $clientId = $request->input('client_id');
        
        if (!$clientId) {
            return response()->json(['contacts' => []]);
        }

        $contacts = Contact::where('client_id', $clientId)
            ->orderBy('name')
            ->get();

        return response()->json(['contacts' => $contacts]);
    }

    /**
     * Check if email is available (not already in use).
     */
    public function checkEmail(Request $request)
    {
        $email = $request->input('email');
        
        if (!$email) {
            return response()->json(['available' => true]);
        }

        // Check if email exists in contacts
        $existsInContacts = Contact::where('email', $email)->exists();
        
        // Check if email exists in users (to avoid conflict)
        $existsInUsers = \App\Models\User::where('email', $email)->exists();

        return response()->json([
            'available' => !$existsInContacts && !$existsInUsers
        ]);
    }
}
