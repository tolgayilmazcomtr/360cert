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
        // Önce mevcut verileri geçici tutmak istemiyorsak ve doğrudan JSON'a çevireceksek,
        // Laravel'in doctrine/dbal ile sütun tipi değiştirmesi yerine
        // yeni bir sütun ekleyip, veriyi oraya kopyalayıp, eski sütunu silip ismini değiştirme yöntemini veya
        // veritabanına özel `ALTER TABLE` sorgularını kullanabiliriz.
        // Daha güvenlisi, verileri okuyup güncellemektir:

        $programs = DB::table('training_programs')->get();
        
        // Sütun tipini text/json'a çevirme (Laravel 11'de change() kullanılabilir)
        Schema::table('training_programs', function (Blueprint $table) {
            $table->text('name')->change();
        });

        foreach ($programs as $program) {
            // Eğer JSON formatında değilse (eski veriyse)
            if (!is_array(json_decode($program->name, true))) {
                DB::table('training_programs')
                    ->where('id', $program->id)
                    ->update([
                        'name' => json_encode(['tr' => $program->name])
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $programs = DB::table('training_programs')->get();

        foreach ($programs as $program) {
            $decoded = json_decode($program->name, true);
            if (is_array($decoded) && isset($decoded['tr'])) {
                DB::table('training_programs')
                    ->where('id', $program->id)
                    ->update([
                        // Sadece TR ismini kurtararak geri al
                        'name' => $decoded['tr']
                    ]);
            }
        }

        Schema::table('training_programs', function (Blueprint $table) {
            $table->string('name')->change();
        });
    }
};
