<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Page;

class HomePageSeeder extends Seeder
{
    public function run()
    {
        $html = '<div class="flex-1 flex flex-col w-full animate-in fade-in duration-500">
    <section class="relative bg-slate-900 text-white overflow-hidden py-24 md:py-32">
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div class="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div class="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
            <div class="absolute inset-0 bg-[url(\'/bg-pattern.svg\')] opacity-5"></div>
        </div>

        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div class="flex-1 space-y-8 text-center md:text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 4.93 1 7 2a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    <span>Resmi Onaylı Sertifikasyon Sistemi</span>
                </div>
                
                <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                    Geleceğinize <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Sertifika Katın</span>
                </h1>
                
                <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                    Kariyerinizde bir adım öne geçmek için uluslararası geçerliliğe sahip onaylı eğitim sertifikalarına hemen ulaşın ve sorgulayın.
                </p>
                
                <div class="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                    <a href="/sertifika-dogrula" class="inline-flex items-center justify-center whitespace-nowrap h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto transition-colors">
                        Sertifika Doğrula 
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 h-5 w-5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </a>
                    <a href="/programs" class="inline-flex items-center justify-center whitespace-nowrap h-14 px-8 text-base font-bold rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white backdrop-blur-sm w-full sm:w-auto transition-colors">
                        Eğitim Programları
                    </a>
                </div>
            </div>
            
            <div class="flex-1 relative hidden md:block">
                <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                     <div class="w-full h-80 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-600/20 to-transparent"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="w-32 h-32 text-blue-400/80 drop-shadow-xl"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
                        
                        <div class="absolute top-6 left-6 right-6 h-4 bg-white/5 rounded-full overflow-hidden">
                             <div class="h-full bg-blue-500/50 w-2/3 rounded-full"></div>
                        </div>
                        <div class="absolute top-14 left-6 w-1/3 h-2 bg-white/5 rounded-full"></div>
                        <div class="absolute top-14 left-[40%] w-1/4 h-2 bg-white/5 rounded-full"></div>
                     </div>
                </div>
                
                <div class="absolute -bottom-6 -left-6 bg-white text-slate-900 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style="animation-duration: 3s;">
                    <div class="bg-green-100 p-3 rounded-full text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 4.93 1 7 2a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    </div>
                    <div>
                        <div class="text-sm text-slate-500 font-medium">Güvenilir</div>
                        <div class="font-bold">100% Onaylı</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                    <div class="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Çeşitli Eğitimler</h3>
                    <p class="text-slate-500">Geniş yelpazede sunulan sertifika programları ile uzmanlık alanınızı genişletin.</p>
                </div>
                <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                    <div class="w-16 h-16 mx-auto bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Uluslararası Geçerlilik</h3>
                    <p class="text-slate-500">Aldığınız belgeler e-Devlet ve uluslararası akreditasyon standartlarına uygundur.</p>
                </div>
                <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                    <div class="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Geniş Bayi Ağı</h3>
                    <p class="text-slate-500">Türkiye\'nin dört bir yanındaki onaylı bayilerimiz aracılığıyla güvenli hizmet alın.</p>
                </div>
            </div>
        </div>
    </section>
</div>';

        Page::updateOrCreate(
            ['slug' => 'anasayfa'],
            [
                'title' => 'Ana Sayfa',
                'content' => $html,
                'meta_title' => 'Ana Sayfa - 360Cert',
                'meta_description' => 'Geleceğinize Sertifika Katın. Uluslararası geçerliliğe sahip onaylı eğitim sertifikalarına sayfamızdan ulaşınız.',
                'is_published' => true,
                'is_external' => false,
                'show_in_header' => false,
                'show_in_footer' => false,
            ]
        );
    }
}
