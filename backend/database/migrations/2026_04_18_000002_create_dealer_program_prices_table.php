<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dealer_program_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('training_program_id')->constrained('training_programs')->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->timestamps();

            $table->unique(['dealer_id', 'training_program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dealer_program_prices');
    }
};
