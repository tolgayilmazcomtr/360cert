<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('credit_amount'); // How much balance/credit is added
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        // Seed with default packages
        DB::table('packages')->insert([
            ['name' => 'Başlangıç Paketi', 'description' => '500 TL bakiye yükleyin, ekstra bonus kazanın.', 'price' => 500, 'credit_amount' => 525, 'sort_order' => 1, 'is_active' => true, 'is_featured' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Standart Paket', 'description' => '1000 TL bakiye yükleyin, %5 ekstra kazanın.', 'price' => 1000, 'credit_amount' => 1050, 'sort_order' => 2, 'is_active' => true, 'is_featured' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pro Paket', 'description' => '2500 TL bakiye yükleyin, %8 ekstra kazanın.', 'price' => 2500, 'credit_amount' => 2700, 'sort_order' => 3, 'is_active' => true, 'is_featured' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kurumsal Paket', 'description' => '5000 TL bakiye yükleyin, %12 ekstra kazanın.', 'price' => 5000, 'credit_amount' => 5600, 'sort_order' => 4, 'is_active' => true, 'is_featured' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
