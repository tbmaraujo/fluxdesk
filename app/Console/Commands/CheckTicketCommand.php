<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckTicketCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ticket:check {id} {--raw}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica as informações de um ticket específico';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $id = $this->argument('id');
        $raw = $this->option('raw');

        // Busca o ticket com todas as relações necessárias
        $ticket = DB::table('tickets')
            ->leftJoin('users', 'tickets.user_id', '=', 'users.id')
            ->leftJoin('clients', 'tickets.client_id', '=', 'clients.id')
            ->leftJoin('users as assignee', 'tickets.assignee_id', '=', 'assignee.id')
            ->select(
                'tickets.*',
                'users.name as user_name',
                'users.client_id as user_client_id',
                'clients.name as client_name',
                'assignee.name as assignee_name'
            )
            ->where('tickets.id', $id)
            ->first();

        if (!$ticket) {
            $this->error("Ticket #{$id} não encontrado.");
            return 1;
        }

        if ($raw) {
            // Exibe os dados brutos
            $this->info(json_encode($ticket, JSON_PRETTY_PRINT));
            return 0;
        }

        // Exibe os dados formatados
        $this->info("=== Informações do Ticket #{$ticket->id} ===");
        $this->line("Título: {$ticket->title}");
        $this->line("Status: {$ticket->status}");
        $this->line("Prioridade: {$ticket->priority}");
        $this->line("Estágio: {$ticket->stage}");
        $this->line("Criado em: {$ticket->created_at}");
        $this->line("Atualizado em: {$ticket->updated_at}");
        $this->line("\n=== Informações do Solicitante ===");
        $this->line("ID: {$ticket->user_id}");
        $this->line("Nome: {$ticket->user_name}");
        $this->line("ID do Cliente (usuário): {$ticket->user_client_id}");
        $this->line("\n=== Informações do Cliente (ticket) ===");
        $this->line("ID do Cliente (ticket): {$ticket->client_id}");
        $this->line("Nome do Cliente: " . ($ticket->client_name ?: 'Nenhum cliente vinculado'));
        $this->line("\n=== Responsável ===");
        $this->line("ID: {$ticket->assignee_id}");
        $this->line("Nome: " . ($ticket->assignee_name ?: 'Não atribuído'));

        return 0;
    }
}
