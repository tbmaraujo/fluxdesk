<?php

namespace App\Http\Middleware;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Carregar os grupos do usuário se estiver autenticado
        if ($user && !$user->relationLoaded('groups')) {
            $user->load('groups');
        }

        // Contar tickets em revisão, fechados e abertos para o tenant do usuário
        $reviewTicketsCount = 0;
        $closedTicketsCount = 0;
        $openTicketsCount = 0;
        if ($user && $user->tenant_id) {
            $reviewTicketsCount = Ticket::where('tenant_id', $user->tenant_id)
                ->where('status', 'IN_REVIEW')
                ->count();
            
            $closedTicketsCount = Ticket::where('tenant_id', $user->tenant_id)
                ->where('status', 'CLOSED')
                ->count();
            
            $openTicketsCount = Ticket::where('tenant_id', $user->tenant_id)
                ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
                ->count();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_super_admin' => $user->is_super_admin === true,
                    'groups' => $user->groups->map(fn($group) => [
                        'id' => $group->id,
                        'name' => $group->name,
                    ]),
                ] : null,
            ],
            'reviewTicketsCount' => $reviewTicketsCount,
            'closedTicketsCount' => $closedTicketsCount,
            'openTicketsCount' => $openTicketsCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ];
    }
}
