<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SesWebhookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * Valida o segredo do webhook (X-SES-Secret) ou permite SNS headers
     */
    public function authorize(): bool
    {
        // Se é uma requisição SNS (tem header x-amz-sns-message-type), permitir
        $snsType = $this->header('x-amz-sns-message-type');
        if ($snsType) {
            return true;
        }

        // Caso contrário, validar o segredo do webhook
        $webhookSecret = trim((string) $this->header('X-SES-Secret', ''));
        $expectedSecret = (string) config('services.ses.webhook_secret');

        return $webhookSecret !== '' && $webhookSecret === $expectedSecret;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Se for SNS, validação mínima (o corpo é JSON livre)
        if ($this->header('x-amz-sns-message-type')) {
            return [];
        }

        // Para webhooks diretos (não SNS), exigir campos mínimos
        return [
            'message_id' => 'required|string',
            'from' => 'required|email',
            'subject' => 'required|string',
            'to' => 'nullable|email',
            's3_object_key' => 'nullable|string',
        ];
    }

    /**
     * Mensagens de erro customizadas
     */
    public function messages(): array
    {
        return [
            'message_id.required' => 'O campo message_id é obrigatório.',
            'from.required' => 'O campo from é obrigatório.',
            'from.email' => 'O campo from deve ser um email válido.',
            'subject.required' => 'O campo subject é obrigatório.',
            'to.email' => 'O campo to deve ser um email válido.',
        ];
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization()
    {
        abort(401, 'Unauthorized: Invalid webhook secret');
    }
}
