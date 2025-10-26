<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>RAT - Ticket #{{ $ticket->id }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1f2937;
            padding: 30px;
            background: #fff;
        }
        
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 3px solid #1E40AF;
            padding-bottom: 15px;
        }
        
        .logo-section {
            display: table-cell;
            width: 30%;
            vertical-align: middle;
        }
        
        .logo-placeholder {
            width: 150px;
            height: 60px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 9pt;
            text-align: center;
        }
        
        .title-section {
            display: table-cell;
            width: 70%;
            vertical-align: middle;
            text-align: right;
        }
        
        .report-title {
            font-size: 18pt;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 5px;
        }
        
        .report-subtitle {
            font-size: 10pt;
            color: #666;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 13pt;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #E5E7EB;
        }
        
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        
        .info-row {
            display: table-row;
        }
        
        .info-label {
            display: table-cell;
            font-weight: bold;
            color: #555;
            width: 25%;
            padding: 6px 10px 6px 0;
        }
        
        .info-value {
            display: table-cell;
            color: #333;
            padding: 6px 0;
        }
        
        .description-box {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            padding: 12px;
            margin-top: 8px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        table thead {
            background-color: #1E40AF;
            color: white;
        }
        
        table th {
            padding: 10px 8px;
            text-align: left;
            font-size: 10pt;
            font-weight: bold;
        }
        
        table tbody tr {
            border-bottom: 1px solid #E5E7EB;
        }
        
        table tbody tr:nth-child(even) {
            background-color: #F9FAFB;
        }
        
        table td {
            padding: 8px;
            font-size: 10pt;
            vertical-align: top;
        }
        
        .total-hours {
            margin-top: 15px;
            text-align: right;
            font-size: 12pt;
        }
        
        .total-hours strong {
            color: #1E40AF;
            font-size: 14pt;
        }
        
        .signatures {
            margin-top: 50px;
            display: table;
            width: 100%;
        }
        
        .signature-block {
            display: table-cell;
            width: 45%;
            text-align: center;
            padding: 0 10px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 8px;
            font-weight: bold;
            color: #555;
        }
        
        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            text-align: center;
            font-size: 9pt;
            color: #999;
            border-top: 1px solid #E5E7EB;
            padding-top: 10px;
        }
        
        .no-data {
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    {{-- Cabeçalho --}}
    <div class="header">
        <div class="logo-section">
            <div class="logo-placeholder">
                [Logo da Empresa]
            </div>
        </div>
        <div class="title-section">
            <div class="report-title">Relatório de Atendimento Técnico</div>
            <div class="report-subtitle">RAT</div>
        </div>
    </div>

    {{-- Informações do Ticket --}}
    <div class="section">
        <div class="section-title">Informações do Ticket</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Número do Ticket:</div>
                <div class="info-value">#{{ $ticket->id }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Data de Abertura:</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($ticket->created_at)->format('d/m/Y H:i') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Cliente:</div>
                <div class="info-value">{{ $ticket->client->name ?? 'Não informado' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Solicitante:</div>
                <div class="info-value">{{ $ticket->user->name ?? 'Não informado' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Técnico Responsável:</div>
                <div class="info-value">{{ $ticket->assignee->name ?? 'Não atribuído' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Título:</div>
                <div class="info-value">{{ $ticket->title }}</div>
            </div>
        </div>
    </div>

    {{-- Descrição do Problema --}}
    <div class="section">
        <div class="section-title">Descrição do Problema</div>
        <div class="description-box">{{ $ticket->description ?? 'Sem descrição' }}</div>
    </div>

    {{-- Apontamentos --}}
    <div class="section">
        <div class="section-title">Apontamentos de Atendimento</div>
        
        @if($ticket->appointments && $ticket->appointments->count() > 0)
            <table>
                <thead>
                    <tr>
                        <th style="width: 12%;">Data</th>
                        <th style="width: 18%;">Técnico</th>
                        <th style="width: 10%;">Início</th>
                        <th style="width: 10%;">Fim</th>
                        <th style="width: 10%;">Duração</th>
                        <th style="width: 40%;">Descrição do Trabalho</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($ticket->appointments as $appointment)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($appointment->date)->format('d/m/Y') }}</td>
                            <td>{{ $appointment->user->name ?? 'N/A' }}</td>
                            <td>{{ $appointment->start_time }}</td>
                            <td>{{ $appointment->end_time }}</td>
                            <td>{{ floor($appointment->duration_in_minutes / 60) }}h {{ $appointment->duration_in_minutes % 60 }}min</td>
                            <td>{{ $appointment->description ?? 'Sem descrição' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
            
            <div class="total-hours">
                <strong>Total de Horas:</strong> {{ floor($totalMinutes / 60) }}h {{ $totalMinutes % 60 }}min
            </div>
        @else
            <p class="no-data">Nenhum apontamento registrado para este ticket.</p>
        @endif
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

    {{-- Rodapé --}}
    <div class="footer">
        <p>{{ $tenant->name ?? 'Sistema de Chamados' }} - Relatório gerado em {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
