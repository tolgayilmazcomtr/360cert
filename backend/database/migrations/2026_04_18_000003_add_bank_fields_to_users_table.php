<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('bank_account_name')->nullable()->after('logo_path');
            $table->string('bank_iban')->nullable()->after('bank_account_name');
            $table->string('bank_name')->nullable()->after('bank_iban');
            $table->string('bank_description')->nullable()->after('bank_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bank_account_name', 'bank_iban', 'bank_name', 'bank_description']);
        });
    }
};
