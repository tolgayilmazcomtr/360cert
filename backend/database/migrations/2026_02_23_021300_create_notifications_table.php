<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // who receives it
            $table->string('type'); // 'announcement', 'certificate_approved', 'certificate_rejected', 'certificate_submitted', 'update_request', 'general'
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable(); // extra context like certificate_id, etc.
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
