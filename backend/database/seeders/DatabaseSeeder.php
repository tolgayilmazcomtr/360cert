<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Yönetici',
            'email' => 'admin@360cert.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
            'balance' => 100000, // Unlimited basically
        ]);
        
        $this->call([
            CertificateTemplateSeeder::class,
            SystemSettingSeeder::class,
        ]);
    }
}
