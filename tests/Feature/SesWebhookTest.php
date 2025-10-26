<?php

namespace Tests\Feature;

use App\Jobs\EmailIngestJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SesWebhookTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test webhook rejects requests without valid secret
     */
    public function test_webhook_rejects_invalid_secret(): void
    {
        $response = $this->postJson('/api/webhooks/ses/inbound', [
            'message_id' => 'test-123',
            'from' => 'test@example.com',
            'subject' => 'Test Subject',
        ], [
            'X-SES-Secret' => 'invalid-secret',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test webhook accepts requests with valid secret
     */
    public function test_webhook_accepts_valid_secret(): void
    {
        Queue::fake();

        config(['services.ses.webhook_secret' => 'valid-secret']);

        $response = $this->postJson('/api/webhooks/ses/inbound', [
            'message_id' => 'test-message-id-123',
            'from' => 'sender@example.com',
            'subject' => 'Test Email Subject',
            'to' => 'recipient@example.com',
        ], [
            'X-SES-Secret' => 'valid-secret',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        // Verificar que o job foi enfileirado
        Queue::assertPushed(EmailIngestJob::class, function ($job) {
            return $job->messageId === 'test-message-id-123'
                && $job->from === 'sender@example.com'
                && $job->subject === 'Test Email Subject';
        });
    }

    /**
     * Test webhook accepts SNS notifications
     */
    public function test_webhook_accepts_sns_notification(): void
    {
        Queue::fake();

        config(['services.ses.topic_arn' => 'arn:aws:sns:us-east-2:123456789:test-topic']);

        $snsMessage = [
            'Type' => 'Notification',
            'TopicArn' => 'arn:aws:sns:us-east-2:123456789:test-topic',
            'Message' => json_encode([
                'mail' => [
                    'messageId' => 'sns-message-id-456',
                    'source' => 'sns-sender@example.com',
                    'destination' => ['sns-recipient@example.com'],
                    'commonHeaders' => [
                        'subject' => 'SNS Test Subject',
                    ],
                ],
                'receipt' => [
                    'action' => [
                        'type' => 'SNS',
                    ],
                ],
            ]),
        ];

        $response = $this->postJson('/api/webhooks/ses/inbound', $snsMessage, [
            'x-amz-sns-message-type' => 'Notification',
        ]);

        $response->assertStatus(200);

        // Verificar que o job foi enfileirado
        Queue::assertPushed(EmailIngestJob::class, function ($job) {
            return $job->messageId === 'sns-message-id-456'
                && $job->from === 'sns-sender@example.com';
        });
    }

    /**
     * Test webhook handles SNS subscription confirmation
     */
    public function test_webhook_handles_sns_subscription_confirmation(): void
    {
        config(['services.ses.topic_arn' => 'arn:aws:sns:us-east-2:123456789:test-topic']);

        $snsMessage = [
            'Type' => 'SubscriptionConfirmation',
            'TopicArn' => 'arn:aws:sns:us-east-2:123456789:test-topic',
            'SubscribeURL' => 'https://sns.us-east-2.amazonaws.com/test-confirm',
        ];

        // Mock HTTP request
        \Illuminate\Support\Facades\Http::fake([
            'sns.us-east-2.amazonaws.com/*' => \Illuminate\Support\Facades\Http::response('OK', 200),
        ]);

        $response = $this->postJson('/api/webhooks/ses/inbound', $snsMessage, [
            'x-amz-sns-message-type' => 'SubscriptionConfirmation',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
    }

    /**
     * Test webhook rejects mismatched topic ARN
     */
    public function test_webhook_rejects_mismatched_topic_arn(): void
    {
        config(['services.ses.topic_arn' => 'arn:aws:sns:us-east-2:123456789:expected-topic']);

        $snsMessage = [
            'Type' => 'Notification',
            'TopicArn' => 'arn:aws:sns:us-east-2:123456789:wrong-topic',
            'Message' => json_encode([]),
        ];

        $response = $this->postJson('/api/webhooks/ses/inbound', $snsMessage, [
            'x-amz-sns-message-type' => 'Notification',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test webhook validates required fields for direct webhook
     */
    public function test_webhook_validates_required_fields(): void
    {
        config(['services.ses.webhook_secret' => 'valid-secret']);

        $response = $this->postJson('/api/webhooks/ses/inbound', [
            // missing required fields
        ], [
            'X-SES-Secret' => 'valid-secret',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['message_id', 'from', 'subject']);
    }
}
