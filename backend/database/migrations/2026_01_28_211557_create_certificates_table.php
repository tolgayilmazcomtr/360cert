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
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_no')->unique();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('training_program_id')->constrained('training_programs');
            $table->foreignId('certificate_template_id')->constrained('certificate_templates');
            
            $table->date('issue_date');
            $table->string('qr_code_hash')->unique(); // QR taranınca gidilecek hash
            
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->text('rejection_reason')->nullable();
            
            $table->decimal('cost', 10, 2); // O anki maliyet
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
