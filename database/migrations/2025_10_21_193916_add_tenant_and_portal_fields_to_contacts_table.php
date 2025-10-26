<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->onDelete('cascade');
            $table->string('job_title')->nullable()->after('phone');
            $table->boolean('portal_access')->default(false)->after('contact_type');
            $table->string('password')->nullable()->after('portal_access');
        });

        // Preencher tenant_id dos contacts baseado no client_id
        \Illuminate\Support\Facades\DB::statement('
            UPDATE contacts 
            SET tenant_id = clients.tenant_id 
            FROM clients 
            WHERE contacts.client_id = clients.id
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn(['tenant_id', 'job_title', 'portal_access', 'password']);
        });
    }
};
