<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Resposta no Ticket</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #059669;
            font-size: 16px;
        }
        .reply-content {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .reply-content h3 {
            margin: 0 0 15px 0;
            color: #374151;
        }
        .reply-meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .btn {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .btn:hover {
            background: #059669;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        .ticket-summary {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .ticket-summary strong {
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nova Resposta</h1>
            <div class="ticket-id">TKT-{{ $ticket->id }}</div>
        </div>

        <div class="content">
            <p>Olá! Uma nova resposta foi adicionada ao ticket <strong>#{{ $ticket->id }}</strong>.</p>

            <div class="ticket-summary">
                <strong>Ticket:</strong> {{ $ticket->title }}
            </div>

            <div class="reply-content">
                <h3>📩 Nova Resposta</h3>
                <div class="reply-meta">
                    <strong>Data:</strong> {{ $reply->created_at->format('d/m/Y H:i') }}
                </div>
                <div>{!! $reply->content !!}</div>
            </div>

            <div style="text-align: center;">
                <a href="{{ $ticketUrl }}" class="btn">Ver Ticket Completo</a>
            </div>

            <div class="info-box">
                <h3>💡 Como Responder</h3>
                <p style="margin: 0;">Para adicionar sua resposta, basta responder a este e-mail. Sua mensagem será automaticamente incluída no ticket.</p>
            </div>
        </div>

        <div class="footer">
            <p>Este é um e-mail automático do Sistema de Chamados Sincro8.</p>
            <p>Ticket #{{ $ticket->id }} - {{ $ticket->title }}</p>
            <p>Data: {{ now()->format('d/m/Y H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
