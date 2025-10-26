<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>RAT - Ticket #{{ $ticket->id }}</title>
    <style>
        @page {
            margin: 20mm 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 9.5pt;
            line-height: 1.4;
            color: #374151;
        }
        
        /* Header */
        .header {
            border-bottom: 4px solid #1E40AF;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: table;
            width: 100%;
        }
        
        .header-left {
            display: table-cell;
            width: 40%;
            vertical-align: middle;
        }
        
        .logo-box {
            width: 140px;
            height: 60px;
            border: 2px dashed #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 8pt;
            background: #f9fafb;
        }
        
        .header-right {
            display: table-cell;
            width: 60%;
            vertical-align: middle;
            text-align: right;
        }
        
        .report-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 3px;
        }
        
        .report-subtitle {
            font-size: 11pt;
            color: #6b7280;
            font-weight: 500;
        }
        
        .ticket-info-bar {
            background: #f3f4f6;
            padding: 8px 12px;
            margin-bottom: 15px;
            border-left: 4px solid #1E40AF;
            display: table;
            width: 100%;
        }
        
        .ticket-number {
            display: table-cell;
            font-weight: bold;
            color: #1f2937;
            font-size: 11pt;
        }
        
        .ticket-status {
            display: table-cell;
            text-align: right;
            font-weight: 600;
            color: #059669;
            text-transform: uppercase;
            font-size: 9pt;
        }
        
        /* Section Headers */
        .section-header {
            background: #e5e7eb;
            padding: 8px 12px;
            margin: 20px 0 12px 0;
            font-weight: bold;
            font-size: 10pt;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Info Grid */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        
        .info-row {
            display: table-row;
        }
        
        .info-cell {
            display: table-cell;
            padding: 5px 8px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .info-label {
            width: 30%;
            font-weight: 600;
            color: #6b7280;
            font-size: 9pt;
        }
        
        .info-value {
            color: #1f2937;
        }
        
        /* Three Column Layout */
        .three-col {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .col {
            display: table-cell;
            padding: 8px;
            vertical-align: top;
            width: 33.33%;
        }
        
        .col-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 8pt;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        
        .col-value {
            color: #1f2937;
            font-size: 9.5pt;
        }
        
        /* Manual Fields */
        .manual-field {
            margin-bottom: 15px;
        }
        
        .field-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
            font-size: 9.5pt;
        }
        
        .field-input {
            border: 1px solid #d1d5db;
            background: #f9fafb;
            padding: 8px 10px;
            min-height: 35px;
            border-radius: 3px;
        }
        
        .field-textarea {
            min-height: 80px;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9pt;
        }
        
        table thead {
            background: #1E40AF;
            color: white;
        }
        
        table th {
            padding: 8px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 8.5pt;
        }
        
        table tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        table td {
            padding: 7px 6px;
            vertical-align: top;
        }
        
        /* Total Box */
        .total-box {
            background: #eff6ff;
            border: 2px solid #1E40AF;
            padding: 10px 15px;
            margin-top: 12px;
            text-align: right;
            border-radius: 4px;
        }
        
        .total-label {
            font-weight: 600;
            color: #1f2937;
            font-size: 10pt;
        }
        
        .total-value {
            font-weight: bold;
            color: #1E40AF;
            font-size: 14pt;
            margin-left: 10px;
        }
        
        /* Signatures */
        .signatures {
            margin-top: 25px;
            display: table;
            width: 100%;
        }
        
        .signature-block {
            display: table-cell;
            width: 48%;
            text-align: center;
            padding: 0 10px;
        }
        
        .signature-line {
            border-top: 2px solid #374151;
            margin-top: 60px;
            padding-top: 8px;
            font-weight: 600;
            color: #374151;
            font-size: 9.5pt;
        }
        
        /* Declaration */
        .declaration {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 12px;
            margin: 25px 0;
            text-align: center;
            font-size: 10pt;
            font-style: italic;
            color: #4b5563;
            border-radius: 4px;
        }
        
        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding: 8px 0;
            background: #fff;
        }
        
        .no-data {
            color: #9ca3af;
            font-style: italic;
            padding: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <div class="logo-box">
                [Logo da Empresa]
            </div>
        </div>
        <div class="header-right">
            <div class="report-title">Relatório de Atendimento Técnico</div>
            <div class="report-subtitle">RAT</div>
        </div>
    </div>

    {{-- Ticket Info Bar --}}
    <div class="ticket-info-bar">
        <div class="ticket-number">
            Ticket #{{ $ticket->id }} - {{ $ticket->title }}
        </div>
        <div class="ticket-status">
            @switch($ticket->status)
                @case('OPEN')
                    ABERTO
                    @break
                @case('IN_PROGRESS')
                    EM ANDAMENTO
                    @break
                @case('IN_REVIEW')
                    EM REVISÃO
                    @break
                @case('RESOLVED')
                    RESOLVIDO
                    @break
                @case('CLOSED')
                    FECHADO
                    @break
                @case('CANCELED')
                    CANCELADO
                    @break
                @default
                    {{ $ticket->status }}
            @endswitch
        </div>
    </div>

    {{-- Cliente Info --}}
    <div class="section-header">{{ $ticket->client->name ?? 'Cliente' }}</div>
    
    <div class="three-col">
        <div class="col">
            <div class="col-label">Endereço</div>
            <div class="col-value">{{ $ticket->client->address ?? 'Não informado' }}</div>
        </div>
        <div class="col">
            <div class="col-label">Solicitante</div>
            <div class="col-value">{{ $ticket->user->name ?? 'Não informado' }}</div>
        </div>
        <div class="col">
            <div class="col-label">Telefone</div>
            <div class="col-value">{{ $ticket->user->phone ?? 'Não informado' }}</div>
        </div>
    </div>

    {{-- Informações do Ticket --}}
    <div class="section-header">Informações do Ticket</div>
    
    <div class="info-grid">
        <div class="info-row">
            <div class="info-cell info-label">Responsável:</div>
            <div class="info-cell info-value">{{ $ticket->assignee->name ?? 'Não atribuído' }}</div>
            <div class="info-cell info-label">Aberto em:</div>
            <div class="info-cell info-value">{{ \Carbon\Carbon::parse($ticket->created_at)->format('d/m/Y H:i') }}</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Prioridade:</div>
            <div class="info-cell info-value">{{ $ticket->priority }}</div>
            <div class="info-cell info-label">Serviço:</div>
            <div class="info-cell info-value">{{ $ticket->service->name ?? 'Não informado' }}</div>
        </div>
    </div>

    {{-- Descrição do Problema --}}
    <div class="section-header">Descrição do Problema</div>
    <div class="field-input field-textarea">
        {!! strip_tags($ticket->description ?? 'Sem descrição', '<br>') !!}
    </div>

    {{-- Campos Manuais - Atendimento --}}
    <div class="section-header">Informações de Atendimento</div>
    
    <div class="three-col">
        <div class="col">
            <div class="manual-field">
                <div class="field-label">Data/Hora Início:</div>
                <div class="field-input">___/___/______ às ___:___</div>
            </div>
        </div>
        <div class="col">
            <div class="manual-field">
                <div class="field-label">Data/Hora Fim:</div>
                <div class="field-input">___/___/______ às ___:___</div>
            </div>
        </div>
        <div class="col">
            <div class="manual-field">
                <div class="field-label">Tempo Total:</div>
                <div class="field-input">_____ h _____ min</div>
            </div>
        </div>
    </div>

    {{-- Solução Aplicada --}}
    <div class="manual-field">
        <div class="field-label">Resumo da Solução Aplicada:</div>
        <div class="field-input field-textarea"></div>
    </div>


    {{-- Declaração --}}
    <div class="declaration">
        Declaro estar ciente do trabalho realizado e concordo com a realização do mesmo.
    </div>

    {{-- Assinaturas --}}
    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line">Assinatura do Técnico</div>
        </div>
        <div class="signature-block">
            <div class="signature-line">Assinatura do Cliente</div>
        </div>
    </div>

    {{-- Footer --}}
    <div class="footer">
        {{ $tenant->name ?? 'Sistema de Chamados' }} | RAT gerado em {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
