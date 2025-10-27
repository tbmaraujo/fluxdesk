<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractDisplacementController;
use App\Http\Controllers\ContractNotificationController;
use App\Http\Controllers\ContractTypeController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PriorityController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReplyController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketEmailController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get("/", function () {
    // Redirecionar usuários autenticados
    if (auth()->check()) {
        // Super Admin vai para painel de administração
        if (auth()->user()->isSuperAdmin()) {
            return redirect()->route('superadmin.tenants.index');
        }
        // Usuários normais vão para dashboard
        return redirect()->route('dashboard');
    }
    
    // Redirecionar visitantes para login
    return redirect()->route('login');
});

Route::get("/dashboard", [DashboardController::class, "index"])
    ->middleware(["auth", "prevent.superadmin", "verified"])
    ->name("dashboard");

Route::get("/shadcn-test", function () {
    return Inertia::render("ShadcnTest");
})->name("shadcn.test");

Route::middleware(["auth", "prevent.superadmin", "identify.tenant"])->group(function () {
    Route::get("/profile", [ProfileController::class, "edit"])->name(
        "profile.edit",
    );
    Route::patch("/profile", [ProfileController::class, "update"])->name(
        "profile.update",
    );
    Route::delete("/profile", [ProfileController::class, "destroy"])->name(
        "profile.destroy",
    );

    // Emails Ingeridos
    Route::get("/emails", [TicketEmailController::class, "index"])->name("emails.index");

    // Ticket routes - Rotas específicas ANTES do resource para evitar conflitos
    
    // Pré-Tickets
    Route::get("/tickets/pre-tickets", [
        TicketController::class,
        "preTicketsIndex",
    ])->name("tickets.pre-tickets.index");
    Route::get("/tickets/pre-tickets/export", [
        TicketController::class,
        "exportCsv",
    ])->name("tickets.pre-tickets.export");
    
    // Autorizações
    Route::get("/tickets/authorizations", [
        TicketController::class,
        "authorizationsIndex",
    ])->name("tickets.authorizations.index");
    Route::get("/tickets/authorizations/export", [
        TicketController::class,
        "exportCsv",
    ])->name("tickets.authorizations.export");
    
    // Tickets Abertos
    Route::get("/tickets/open", [
        TicketController::class,
        "openIndex",
    ])->name("tickets.open.index");
    Route::get("/tickets/open/export", [
        TicketController::class,
        "exportCsv",
    ])->name("tickets.open.export");
    
    // Tickets em Revisão
    Route::get("/tickets/review", [
        TicketController::class,
        "reviewIndex",
    ])->name("tickets.review.index");
    Route::get("/tickets/review/export", [
        TicketController::class,
        "exportCsv",
    ])->name("tickets.review.export");
    
    // Tickets Fechados
    Route::get("/tickets/closed", [
        TicketController::class,
        "closedIndex",
    ])->name("tickets.closed.index");
    Route::get("/tickets/closed/export", [
        TicketController::class,
        "exportCsv",
    ])->name("tickets.closed.export");
    
    // Ações de Pré-Tickets
    Route::post("/tickets/{ticket}/convert", [
        TicketController::class,
        "convertPreTicket",
    ])->name("tickets.convert");
    Route::post("/tickets/{ticket}/discard", [
        TicketController::class,
        "discardPreTicket",
    ])->name("tickets.discard");
    
    // Ações de Autorizações
    Route::post("/tickets/{ticket}/authorize", [
        TicketController::class,
        "authorizeTicket",
    ])->name("tickets.authorize");
    Route::post("/tickets/{ticket}/deny", [
        TicketController::class,
        "denyAuthorization",
    ])->name("tickets.deny");
    
    // Resource routes (CRUD padrão) - DEVE VIR POR ÚLTIMO
    Route::resource("tickets", TicketController::class);
    Route::post("/tickets/{ticket}/group", [
        TicketController::class,
        "group",
    ])->name("tickets.group");
    Route::post("/tickets/{ticket}/duplicate", [
        TicketController::class,
        "duplicate",
    ])->name("tickets.duplicate");
    Route::post("/tickets/{ticket}/assign", [
        TicketController::class,
        "assign",
    ])->name("tickets.assign");
    Route::post("/tickets/{ticket}/start-service", [
        TicketController::class,
        "startService",
    ])->name("tickets.startService");
    Route::post("/tickets/{ticket}/pause-sla", [
        TicketController::class,
        "pauseSLA",
    ])->name("tickets.pauseSLA");
    Route::post("/tickets/{ticket}/resume-sla", [
        TicketController::class,
        "resumeSLA",
    ])->name("tickets.resumeSLA");
    Route::get("/tickets/{ticket}/pdf", [
        \App\Http\Controllers\TicketPdfController::class,
        "show",
    ])->name("tickets.pdf");
    Route::post("/tickets/{ticket}/generate-report", [
        TicketController::class,
        "generateReport",
    ])->name("tickets.generateReport");
    Route::post("/tickets/{ticket}/cancel", [
        TicketController::class,
        "cancel",
    ])->name("tickets.cancel");
    Route::post("/tickets/{ticket}/unassign", [
        TicketController::class,
        "unassign",
    ])->name("tickets.unassign");
    Route::post("/tickets/{ticket}/transfer", [
        TicketController::class,
        "transfer",
    ])->name("tickets.transfer");
    Route::post("/tickets/{ticket}/finalize", [
        TicketController::class,
        "finalize",
    ])->name("tickets.finalize");
    Route::post("/tickets/{ticket}/reopen", [
        TicketController::class,
        "reopen",
    ])->name("tickets.reopen");
    Route::post("/tickets/{ticket}/review", [
        TicketController::class,
        "review",
    ])->name("tickets.review");

    // Contract routes
    Route::resource("contracts", ContractController::class);
    Route::patch("/contracts/{contract}/safe-fields", [
        ContractController::class,
        "updateSafeFields",
    ])->name("contracts.update-safe-fields");
    Route::get("/contracts/{contract}/addendum/create", [
        ContractController::class,
        "createAddendum",
    ])->name("contracts.addendum.create");
    Route::post("/contracts/{contract}/addendum", [
        ContractController::class,
        "storeAddendum",
    ])->name("contracts.addendum.store");
    Route::post("/contracts/{contract}/duplicate", [
        ContractController::class,
        "duplicate",
    ])->name("contracts.duplicate");
    Route::patch("/contracts/{contract}/cancel", [
        ContractController::class,
        "cancel",
    ])->name("contracts.cancel");

    // Contract Notification routes
    Route::post("/contracts/{contract}/notifications", [
        ContractNotificationController::class,
        "store",
    ])->name("contracts.notifications.store");
    Route::delete("/contracts/{contract}/notifications/{notification}", [
        ContractNotificationController::class,
        "destroy",
    ])->name("contracts.notifications.destroy");

    // Contract Displacement routes
    Route::post("/contracts/{contract}/displacements", [
        ContractDisplacementController::class,
        "store",
    ])->name("contracts.displacements.store");

    // Report routes
    Route::get("/reports", [
        \App\Http\Controllers\ReportController::class,
        "index",
    ])->name("reports.index");
    Route::delete("/contracts/{contract}/displacements/{displacement}", [
        ContractDisplacementController::class,
        "destroy",
    ])->name("contracts.displacements.destroy");

    // Reply routes
    Route::post("/tickets/{ticket}/replies", [
        ReplyController::class,
        "store",
    ])->name("tickets.replies.store");

    // Appointment routes
    Route::post("/tickets/{ticket}/appointments", [
        AppointmentController::class,
        "store",
    ])->name("tickets.appointments.store");
    
    Route::put("/tickets/{ticket}/appointments/{appointment}", [
        AppointmentController::class,
        "update",
    ])->name("tickets.appointments.update");
    
    Route::delete("/tickets/{ticket}/appointments/{appointment}", [
        AppointmentController::class,
        "destroy",
    ])->name("tickets.appointments.destroy");

    // Address routes (definir antes das rotas de clientes para evitar conflitos)
    Route::post("/clients/{client}/addresses", [
        AddressController::class,
        "store",
    ])->name("clients.addresses.store");
    Route::put("/clients/{client}/addresses/{address}", [
        AddressController::class,
        "update",
    ])->name("clients.addresses.update");
    Route::delete("/clients/{client}/addresses/{address}", [
        AddressController::class,
        "destroy",
    ])->name("clients.addresses.destroy");

    // Contact routes (definir antes das rotas de clientes para evitar conflitos)
    Route::post("/clients/{client}/contacts", [
        ContactController::class,
        "store",
    ])->name("clients.contacts.store");
    Route::put("/clients/{client}/contacts/{contact}", [
        ContactController::class,
        "update",
    ])->name("clients.contacts.update");
    Route::delete("/clients/{client}/contacts/{contact}", [
        ContactController::class,
        "destroy",
    ])->name("clients.contacts.destroy");

    // Contact routes (standalone - for ticket creation)
    Route::post("/contacts", [
        ContactController::class,
        "storeFromTicket",
    ])->name("contacts.store");
    Route::get("/contacts/by-client", [
        ContactController::class,
        "getByClient",
    ])->name("contacts.by-client");
    Route::post("/contacts/check-email", [
        ContactController::class,
        "checkEmail",
    ])->name("contacts.check-email");

    // Client routes - Definindo manualmente para evitar conflitos
    Route::get('/clients', [\App\Http\Controllers\ClientController::class, 'index'])->name('clients.index');
    Route::get('/clients/create', [\App\Http\Controllers\ClientController::class, 'create'])->name('clients.create');
    Route::post('/clients', [\App\Http\Controllers\ClientController::class, 'store'])->name('clients.store');
    Route::get('/clients/{client}', [\App\Http\Controllers\ClientController::class, 'show'])->name('clients.show');
    Route::get('/clients/{client}/edit', [\App\Http\Controllers\ClientController::class, 'edit'])->name('clients.edit');
    Route::put('/clients/{client}', [\App\Http\Controllers\ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [\App\Http\Controllers\ClientController::class, 'destroy'])->name('clients.destroy');

    // User routes
    Route::post("/users", [UserController::class, "store"])->name(
        "users.store",
    );
    Route::get("/users/by-client", [
        UserController::class,
        "getByClient",
    ])->name("users.by-client");
    Route::post("/users/check-email", [
        UserController::class,
        "checkEmail",
    ])->name("users.check-email");

    // Settings routes
    Route::get('/settings', function () {
        return Inertia::render('Settings/Index');
    })->name('settings.index');

    // Contract Types routes (dentro de settings)
    Route::prefix('settings')->name('settings.')->group(function () {
        // Contract Types
        Route::get('/contract-types', [ContractTypeController::class, 'index'])->name('contract-types.index');
        Route::post('/contract-types', [ContractTypeController::class, 'store'])->name('contract-types.store');
        Route::put('/contract-types/{contractType}', [ContractTypeController::class, 'update'])->name('contract-types.update');
        Route::delete('/contract-types/{contractType}', [ContractTypeController::class, 'destroy'])->name('contract-types.destroy');

        // Services
        Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
        Route::get('/services/{service}/edit', [ServiceController::class, 'edit'])->name('services.edit');
        Route::patch('/services/{service}', [ServiceController::class, 'update'])->name('services.update');
        
        // Service Clients
        Route::post('/services/{service}/clients', [ServiceController::class, 'attachClient'])->name('services.clients.attach');
        Route::delete('/services/{service}/clients/{client}', [ServiceController::class, 'detachClient'])->name('services.clients.detach');
        
        // Service Groups
        Route::post('/services/{service}/groups', [ServiceController::class, 'attachGroup'])->name('services.groups.attach');
        Route::delete('/services/{service}/groups/{group}', [ServiceController::class, 'detachGroup'])->name('services.groups.detach');

        // Priorities
        Route::post('/services/{service}/priorities', [PriorityController::class, 'store'])->name('services.priorities.store');
        Route::put('/services/{service}/priorities/{priority}', [PriorityController::class, 'update'])->name('services.priorities.update');
        Route::delete('/services/{service}/priorities/{priority}', [PriorityController::class, 'destroy'])->name('services.priorities.destroy');

        // Service Expedients
        Route::post('/services/expedients', [\App\Http\Controllers\ServiceExpedientController::class, 'store'])->name('services.expedients.store');
        Route::delete('/services/expedients/{serviceExpedient}', [\App\Http\Controllers\ServiceExpedientController::class, 'destroy'])->name('services.expedients.destroy');

        // Service Stages
        Route::post('/services/stages', [\App\Http\Controllers\ServiceStageController::class, 'store'])->name('services.stages.store');
        Route::put('/services/stages/{serviceStage}', [\App\Http\Controllers\ServiceStageController::class, 'update'])->name('services.stages.update');
        Route::delete('/services/stages/{serviceStage}', [\App\Http\Controllers\ServiceStageController::class, 'destroy'])->name('services.stages.destroy');

        // Users
        Route::resource('users', \App\Http\Controllers\Settings\UserController::class);

        // Groups
        Route::resource('groups', \App\Http\Controllers\Settings\GroupController::class);
    });

    // Service routes - Moved to settings group below
});

// Super Admin Routes
Route::middleware(['auth', 'superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/tenants', [SuperAdminController::class, 'index'])->name('tenants.index');
    Route::get('/tenants/create', [SuperAdminController::class, 'create'])->name('tenants.create');
    Route::post('/tenants', [SuperAdminController::class, 'store'])->name('tenants.store');
    Route::patch('/tenants/{tenant}/status', [SuperAdminController::class, 'updateStatus'])->name('tenants.status');
    Route::delete('/tenants/{tenant}', [SuperAdminController::class, 'destroy'])->name('tenants.destroy');
});

require __DIR__ . "/auth.php";
