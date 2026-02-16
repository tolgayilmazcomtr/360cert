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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Bayi
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['deposit', 'expense', 'refund'])->default('expense'); // Gelir/Gider
            $table->enum('method', ['credit_card', 'wire_transfer', 'system'])->default('system');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved'); // Havale için pending
            $table->text('description')->nullable();
            $table->string('document_path')->nullable(); // Dekont
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
