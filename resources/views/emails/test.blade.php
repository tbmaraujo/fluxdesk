<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-mail de Teste</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #1E40AF;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        h1 {
            margin: 0;
            font-size: 24px;
        }
        h2 {
            color: #1E40AF;
            margin-top: 0;
        }
        ul {
            list-style: none;
            padding-left: 0;
        }
        ul li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="success-icon">✉️</div>
        <h1>E-mail de Teste</h1>
        <p>Sistema de Chamados - Sincro8 Tickets</p>
    </div>

    <div class="content">
        <h2>Configuração bem-sucedida!</h2>
        
        <p>Parabéns! Se você está lendo este e-mail, significa que a integração com o <strong>Amazon SES</strong> foi configurada corretamente.</p>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #1E40AF;">✓ O que foi testado:</h3>
            <ul>
                <li>Credenciais AWS configuradas corretamente</li>
                <li>Região do SES configurada</li>
                <li>E-mail remetente verificado</li>
                <li>Envio de e-mail via Amazon SES</li>
                <li>Renderização de templates HTML</li>
            </ul>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ol>
            <li>Verifique se o domínio está verificado no Amazon SES</li>
            <li>Configure notificações de tickets no sistema</li>
            <li>Teste o envio de e-mails em produção</li>
            <li>Monitore as métricas de entrega no AWS Console</li>
        </ol>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <strong>⚠️ Importante:</strong> Se você está no ambiente <strong>Sandbox</strong> do SES, só é possível enviar e-mails para endereços verificados. Solicite a saída do Sandbox no AWS Console para enviar para qualquer destinatário.
        </div>
    </div>

    <div class="footer">
        <p>Este é um e-mail automático de teste gerado pelo Sistema de Chamados Sincro8.</p>
        <p>Data e hora: {{ now()->format('d/m/Y H:i:s') }}</p>
    </div>
</body>
</html>
