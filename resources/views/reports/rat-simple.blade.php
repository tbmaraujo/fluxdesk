<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>RAT</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table th {
            background-color: #f0f0f0;
            padding: 8px;
            text-align: left;
            border: 1px solid #ccc;
        }
        table td {
            padding: 8px;
            border: 1px solid #ccc;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Relatorio de Atendimento Tecnico - RAT</div>
    </div>

    <div class="section">
        <div class="section-title">Informacoes do Ticket</div>
        <div class="info-row">
            <span class="label">Numero do Ticket:</span> #{{ $ticket->id }}
        </div>
        <div class="info-row">
            <span class="label">Data de Abertura:</span> {{ \Carbon\Carbon::parse($ticket->created_at)->format('d/m/Y H:i') }}
        </div>
        <div class="info-row">
            <span class="label">Cliente:</span> {{ $ticket->client->name ?? 'Nao informado' }}
        </div>
        <div class="info-row">
            <span class="label">Solicitante:</span> {{ $ticket->user->name ?? 'Nao informado' }}
        </div>
        <div class="info-row">
            <span class="label">Tecnico Responsavel:</span> {{ $ticket->assignee->name ?? 'Nao atribuido' }}
        </div>
        <div class="info-row">
            <span class="label">Titulo:</span> {{ $ticket->title }}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Descricao do Problema</div>
        <div>{{ $ticket->description ?? 'Sem descricao' }}</div>
    </div>

    <div class="section">
        <div class="section-title">Apontamentos de Atendimento</div>
        
        @if($ticket->appointments && $ticket->appointments->count() > 0)
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tecnico</th>
                        <th>Inicio</th>
                        <th>Fim</th>
                        <th>Duracao</th>
                        <th>Descricao</th>
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
                            <td>{{ $appointment->description ?? 'Sem descricao' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
            
            <div style="margin-top: 15px; text-align: right; font-weight: bold;">
                Total de Horas: {{ floor($totalMinutes / 60) }}h {{ $totalMinutes % 60 }}min
            </div>
        @else
            <p>Nenhum apontamento registrado para este ticket.</p>
        @endif
    </div>

    <div style="margin-top: 60px;">
        <table style="border: none;">
            <tr>
                <td style="width: 50%; text-align: center; border: none;">
                    <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 50px;">
                        Assinatura do Tecnico
                    </div>
                </td>
                <td style="width: 50%; text-align: center; border: none;">
                    <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 50px;">
                        Assinatura do Cliente
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; text-align: center; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 10px;">
        {{ $tenant->name ?? 'Sistema de Chamados' }} - Relatorio gerado em {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
