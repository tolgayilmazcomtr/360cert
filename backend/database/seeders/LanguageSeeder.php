<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Language;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['code' => 'tr', 'name' => 'Türkçe', 'is_active' => true],
            ['code' => 'en', 'name' => 'English', 'is_active' => true],
            ['code' => 'de', 'name' => 'Deutsch', 'is_active' => true],
            ['code' => 'ru', 'name' => 'Русский', 'is_active' => true],
        ];

        foreach ($languages as $lang) {
            Language::updateOrCreate(
                ['code' => $lang['code']],
                $lang
            );
        }
    }
}
