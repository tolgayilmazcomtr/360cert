<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'contact_email', 'value' => 'info@360cert.com', 'type' => 'string'],
            ['key' => 'contact_phone', 'value' => '+90 555 555 55 55', 'type' => 'string'],
            ['key' => 'contact_address', 'value' => 'İstanbul, Türkiye', 'type' => 'string'],
            ['key' => 'social_facebook', 'value' => '#', 'type' => 'string'],
            ['key' => 'social_instagram', 'value' => '#', 'type' => 'string'],
            ['key' => 'social_linkedin', 'value' => '#', 'type' => 'string'],
            ['key' => 'social_twitter', 'value' => '#', 'type' => 'string'],
        ];

        foreach ($settings as $setting) {
            \App\Models\SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'type' => $setting['type']]
            );
        }
    }
}
