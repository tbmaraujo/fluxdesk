<?php

namespace Tests\Unit;

use App\Jobs\EmailIngestJob;
use App\Models\TicketEmail;
use App\Services\EmailInboundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class EmailIngestJobTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test job creates TicketEmail record with idempotency
     */
    public function test_job_creates_ticket_email_record(): void
    {
        // Mock the service
        $mockService = Mockery::mock(EmailInboundService::class);
        $mockService->shouldReceive('processInboundEmail')
            ->once()
            ->andReturn(['action' => 'ticket_created', 'ticket_id' => 1]);

        $this->app->instance(EmailInboundService::class, $mockService);

        // Create and execute job
        $job = new EmailIngestJob(
            messageId: 'unique-message-id-123',
            from: 'test@example.com',
            subject: 'Test Subject',
            to: 'recipient@example.com',
            s3ObjectKey: null,
            rawPayload: ['test' => 'data']
        );

        $job->handle($mockService);

        // Assert TicketEmail was created
        $this->assertDatabaseHas('ticket_emails', [
            'message_id' => 'unique-message-id-123',
            'from' => 'test@example.com',
            'subject' => 'Test Subject',
            'status' => 'processed',
        ]);
    }

    /**
     * Test job respects idempotency (doesn't process same message twice)
     */
    public function test_job_respects_idempotency(): void
    {
        // Create existing processed email
        TicketEmail::create([
            'message_id' => 'already-processed-123',
            'from' => 'test@example.com',
            'subject' => 'Already Processed',
            'status' => 'processed',
            'received_at' => now(),
            'ticket_id' => 1,
        ]);

        // Mock the service (should NOT be called)
        $mockService = Mockery::mock(EmailInboundService::class);
        $mockService->shouldNotReceive('processInboundEmail');

        $this->app->instance(EmailInboundService::class, $mockService);

        // Create and execute job
        $job = new EmailIngestJob(
            messageId: 'already-processed-123',
            from: 'test@example.com',
            subject: 'Already Processed',
            rawPayload: ['test' => 'data']
        );

        $job->handle($mockService);

        // Assert only one record exists
        $this->assertEquals(1, TicketEmail::where('message_id', 'already-processed-123')->count());
    }

    /**
     * Test job marks email as failed on exception
     */
    public function test_job_marks_email_as_failed_on_exception(): void
    {
        // Mock the service to throw exception
        $mockService = Mockery::mock(EmailInboundService::class);
        $mockService->shouldReceive('processInboundEmail')
            ->once()
            ->andThrow(new \Exception('Processing failed'));

        $this->app->instance(EmailInboundService::class, $mockService);

        // Create and execute job
        $job = new EmailIngestJob(
            messageId: 'will-fail-123',
            from: 'test@example.com',
            subject: 'Will Fail',
            rawPayload: ['test' => 'data']
        );

        try {
            $job->handle($mockService);
        } catch (\Exception $e) {
            // Expected to throw
        }

        // Assert email was marked as failed
        $this->assertDatabaseHas('ticket_emails', [
            'message_id' => 'will-fail-123',
            'status' => 'failed',
        ]);

        $email = TicketEmail::where('message_id', 'will-fail-123')->first();
        $this->assertNotNull($email->error_message);
        $this->assertStringContainsString('Processing failed', $email->error_message);
    }

    /**
     * Test job handles reprocessing of failed emails
     */
    public function test_job_reprocesses_failed_emails(): void
    {
        // Create existing failed email
        TicketEmail::create([
            'message_id' => 'retry-me-123',
            'from' => 'test@example.com',
            'subject' => 'Retry This',
            'status' => 'failed',
            'error_message' => 'Previous error',
            'received_at' => now(),
        ]);

        // Mock the service
        $mockService = Mockery::mock(EmailInboundService::class);
        $mockService->shouldReceive('processInboundEmail')
            ->once()
            ->andReturn(['action' => 'ticket_created', 'ticket_id' => 2]);

        $this->app->instance(EmailInboundService::class, $mockService);

        // Create and execute job
        $job = new EmailIngestJob(
            messageId: 'retry-me-123',
            from: 'test@example.com',
            subject: 'Retry This',
            rawPayload: ['test' => 'data']
        );

        $job->handle($mockService);

        // Assert email was marked as processed
        $this->assertDatabaseHas('ticket_emails', [
            'message_id' => 'retry-me-123',
            'status' => 'processed',
            'ticket_id' => 2,
        ]);
    }

    /**
     * Test job handles empty payload gracefully
     */
    public function test_job_handles_empty_payload(): void
    {
        $mockService = Mockery::mock(EmailInboundService::class);
        // Should not call service when payload is null
        $mockService->shouldNotReceive('processInboundEmail');

        $this->app->instance(EmailInboundService::class, $mockService);

        $job = new EmailIngestJob(
            messageId: 'no-payload-123',
            from: 'test@example.com',
            subject: 'No Payload',
            rawPayload: null
        );

        $job->handle($mockService);

        // Assert email was created but marked as processed without ticket
        $this->assertDatabaseHas('ticket_emails', [
            'message_id' => 'no-payload-123',
            'status' => 'processed',
            'ticket_id' => null,
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
