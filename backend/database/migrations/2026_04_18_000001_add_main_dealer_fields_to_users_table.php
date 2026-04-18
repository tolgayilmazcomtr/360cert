<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_main_dealer')->default(false)->after('is_approved');
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete()->after('is_main_dealer');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['is_main_dealer', 'parent_id']);
        });
    }
};
