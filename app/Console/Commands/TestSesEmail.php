<?php

namespace App\Console\Commands;

use App\Mail\TestEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestSesEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test-ses {email : O endereço de e-mail para enviar o teste}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envia um e-mail de teste para verificar a configuração do Amazon SES';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        // Validar formato do e-mail
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('❌ Endereço de e-mail inválido!');
            return self::FAILURE;
        }

        $this->info('📧 Enviando e-mail de teste para: ' . $email);
        $this->newLine();

        // Verificar configurações
        $this->line('🔍 Verificando configurações...');
        $this->table(
            ['Configuração', 'Valor'],
            [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_FROM_NAME', config('mail.from.name')],
                ['AWS_DEFAULT_REGION', config('services.ses.region', env('AWS_DEFAULT_REGION'))],
                ['AWS_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID') ? '✓ Configurado' : '✗ Não configurado'],
                ['AWS_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY') ? '✓ Configurado' : '✗ Não configurado'],
            ]
        );

        // Verificar se as credenciais AWS estão configuradas
        if (!env('AWS_ACCESS_KEY_ID') || !env('AWS_SECRET_ACCESS_KEY')) {
            $this->error('❌ Credenciais AWS não configuradas!');
            $this->warn('Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no arquivo .env');
            return self::FAILURE;
        }

        // Verificar se o mailer está configurado para SES
        if (config('mail.default') !== 'ses') {
            $this->warn('⚠️  MAIL_MAILER não está configurado como "ses"');
            $this->warn('Mailer atual: ' . config('mail.default'));
            
            if (!$this->confirm('Deseja continuar mesmo assim?', false)) {
                return self::FAILURE;
            }
        }

        $this->newLine();
        $this->info('📤 Enviando e-mail...');

        try {
            Mail::to($email)->send(new TestEmail());

            $this->newLine();
            $this->info('✅ E-mail de teste enviado com sucesso!');
            $this->newLine();
            $this->line('📬 Verifique a caixa de entrada de: ' . $email);
            $this->line('🗑️  Não esqueça de verificar a pasta de spam!');
            $this->newLine();
            
            if (app()->environment('production')) {
                $this->warn('⚠️  ATENÇÃO: Você está em ambiente de PRODUÇÃO!');
            }

            $this->info('💡 Dica: No AWS SES Sandbox, você só pode enviar e-mails para endereços verificados.');
            $this->info('   Para enviar para qualquer destinatário, solicite a saída do Sandbox no AWS Console.');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->newLine();
            $this->error('❌ Erro ao enviar e-mail!');
            $this->error('Mensagem: ' . $e->getMessage());
            $this->newLine();

            // Dicas de troubleshooting
            $this->warn('🔧 Possíveis soluções:');
            $this->line('  1. Verifique se o e-mail remetente está verificado no Amazon SES');
            $this->line('  2. Verifique se as credenciais AWS estão corretas');
            $this->line('  3. Verifique se a região (AWS_DEFAULT_REGION) está correta');
            $this->line('  4. Se estiver no Sandbox, verifique se o destinatário está verificado');
            $this->line('  5. Verifique as permissões IAM do usuário AWS');

            return self::FAILURE;
        }
    }
}
