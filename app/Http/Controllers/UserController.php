<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Store a newly created user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => "required|string|email|max:255|unique:users",
            "client_id" => "required|exists:clients,id",
            "role" => "nullable|string|in:admin,user,technician",
        ]);

        // Set default role if not provided
        if (!isset($validated["role"])) {
            $validated["role"] = "user";
        }

        // Create a random password - the user will need to reset it
        $validated["password"] = Hash::make(
            \Illuminate\Support\Str::random(12),
        );

        $validated['tenant_id'] = $request->user()->tenant_id;

        $user = User::create($validated);

        return back()->with('success', 'Solicitante criado com sucesso!');
    }

    /**
     * Get users by client ID.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByClient(Request $request)
    {
        $validated = $request->validate([
            "client_id" => "required|exists:clients,id",
        ]);

        $users = User::where("client_id", $validated["client_id"])
            ->orderBy("name")
            ->get();

        return response()->json([
            "users" => $users,
        ]);
    }

    /**
     * Check if an email is available (not already in use).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkEmail(Request $request)
    {
        $validated = $request->validate([
            "email" => "required|string|email|max:255",
            "user_id" => "nullable|exists:users,id", // For excluding current user when updating
        ]);

        $query = User::where("email", $validated["email"]);

        // If user_id is provided, exclude that user from the check
        if (isset($validated["user_id"])) {
            $query->where("id", "!=", $validated["user_id"]);
        }

        $exists = $query->exists();

        return response()->json([
            "available" => !$exists,
        ]);
    }
}
