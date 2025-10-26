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
        Schema::table('services', function (Blueprint $table) {
            $table->string('review_type')->nullable()->after('is_active');
            $table->integer('review_time_limit')->nullable()->after('review_type');
            $table->boolean('allow_reopen_after_review')->default(false)->after('review_time_limit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['review_type', 'review_time_limit', 'allow_reopen_after_review']);
        });
    }
};
