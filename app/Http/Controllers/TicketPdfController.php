<?php

namespace App\Http\Controllers;

use App\Models\ReportType;
use App\Models\Tenant;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\LaravelPdf\Facades\Pdf;

class TicketPdfController extends Controller
{
    /**
     * Generate and display PDF report for a ticket.
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, Ticket $ticket)
    {
        // Validar tipo de relatório
        $reportTypeId = $request->query('report_type_id');
        
        if (!$reportTypeId) {
            abort(400, 'report_type_id é obrigatório');
        }
        
        $reportType = ReportType::findOrFail($reportTypeId);
        
        // Verificar se é o relatório RAT
        if ($reportType->name === 'RAT') {
            return $this->generateRATReport($ticket);
        }
        
        // Caso seja outro tipo de relatório no futuro
        abort(400, 'Tipo de relatório não implementado.');
    }
    
    /**
     * Generate RAT (Relatório de Atendimento Técnico) PDF.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\Response
     */
    private function generateRATReport(Ticket $ticket)
    {
        // Carregar todos os dados necessários do ticket
        $ticket->load([
            'user',           // Solicitante
            'client',         // Cliente
            'assignee',       // Técnico responsável
            'service',        // Serviço
            'appointments.user', // Apontamentos com técnicos
        ]);
        
        // Buscar tenant atual
        $tenant = Tenant::find(Auth::user()->tenant_id);
        
        // Calcular total de minutos dos apontamentos
        $totalMinutes = $ticket->appointments->sum('duration_in_minutes');
        
        // Configurar o caminho do Chrome
        $chromePath = config('pdf.browsershot.chrome_path', '/home/thiago/.cache/puppeteer/chrome-headless-shell/linux-141.0.7390.122/chrome-headless-shell-linux64/chrome-headless-shell');
        
        // Gerar PDF usando Spatie (usa Chromium, suporte total a UTF-8)
        return Pdf::view('reports.rat-new', [
                'ticket' => $ticket,
                'tenant' => $tenant,
                'totalMinutes' => $totalMinutes,
            ])
            ->format('a4')
            ->withBrowsershot(function ($browsershot) use ($chromePath) {
                $browsershot
                    ->setChromePath($chromePath)
                    ->noSandbox()
                    ->setOption('args', ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']);
            })
            ->name('RAT_Ticket_' . $ticket->id . '_' . now()->format('Y-m-d_His') . '.pdf')
            ->download(); // Use ->inline() para visualizar no navegador
    }
}
