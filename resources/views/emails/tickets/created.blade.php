<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Ticket Criado</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .ticket-id {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }
        .content {
            padding: 30px;
        }
        .info-box {
            background: #f9fafb;
            border-left: 4px solid #1E40AF;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #1E40AF;
            font-size: 16px;
        }
        .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            width: 120px;
            color: #6b7280;
        }
        .info-value {
            flex: 1;
            color: #111827;
        }
        .description {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .description h3 {
            margin: 0 0 15px 0;
            color: #374151;
        }
        .btn {
            display: inline-block;
            background: #1E40AF;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .btn:hover {
            background: #1E3A8A;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        .alert {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .alert strong {
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Novo Ticket Criado</h1>
            <div class="ticket-id">TKT-{{ $ticket->id }}</div>
        </div>

        <div class="content">
            <p>Olá! Um novo ticket foi criado no sistema de chamados.</p>

            <div class="info-box">
                <h3>📋 Informações do Ticket</h3>
                <div class="info-row">
                    <div class="info-label">Ticket:</div>
                    <div class="info-value">#{{ $ticket->id }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Título:</div>
                    <div class="info-value">{{ $ticket->title }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Status:</div>
                    <div class="info-value">{{ $ticket->status }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Prioridade:</div>
                    <div class="info-value">{{ $ticket->priority }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Criado em:</div>
                    <div class="info-value">{{ $ticket->created_at->format('d/m/Y H:i') }}</div>
                </div>
            </div>

            @if($ticket->description)
            <div class="description">
                <h3>📝 Descrição</h3>
                <div>{!! $ticket->description !!}</div>
            </div>
            @endif

            <div style="text-align: center;">
                <a href="{{ $ticketUrl }}" class="btn">Ver Ticket Completo</a>
            </div>

            <div class="alert">
                <strong>💡 Dica:</strong> Para responder a este ticket, basta responder a este e-mail. Sua resposta será automaticamente adicionada ao ticket.
            </div>
        </div>

        <div class="footer">
            <p>Este é um e-mail automático do Sistema de Chamados Sincro8.</p>
            <p>Por favor, não responda diretamente se não quiser adicionar uma resposta ao ticket.</p>
            <p>Data: {{ now()->format('d/m/Y H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
