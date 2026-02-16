<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use Illuminate\Database\Seeder;

class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        CertificateTemplate::create([
            'name' => 'Standart A4 Şablon',
            'background_path' => 'templates/standard_bg.jpg', // Placeholder
            'type' => 'standard',
            'layout_config' => [
                'orientation' => 'landscape',
                'font_family' => 'DejaVu Sans'
            ],
            'is_active' => true,
        ]);
        
        CertificateTemplate::create([
            'name' => 'Premium Sertifika Şablonu',
            'background_path' => 'templates/premium_bg.jpg',
            'type' => 'standard',
            'layout_config' => [
                'orientation' => 'landscape',
                'font_family' => 'Serif'
            ],
            'is_active' => true,
        ]);
    }
}
