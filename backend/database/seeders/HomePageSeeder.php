<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Page;

class HomePageSeeder extends Seeder
{
    public function run()
    {
        $html = '<div class="flex-1 flex flex-col w-full h-full text-white">
    <section class="relative min-h-[85vh] flex items-center py-20 bg-transparent overflow-hidden">
        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 w-full">
            <div class="flex-1 space-y-2 text-center md:text-left pt-12 md:pt-0 relative z-30">
                <style>
                    @keyframes slideUpFade {
                        0% { opacity: 0; transform: translateY(40px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    .anim-1 { animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                    .anim-2 { animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards; opacity: 0; }
                    .anim-3 { animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
                    .anim-4 { animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards; opacity: 0; }
                </style>
                
                <div class="anim-1 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-blue-400/30 bg-blue-900/40 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.25)] mb-6">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span class="text-sm font-bold text-blue-200 tracking-[0.2em] uppercase">Uluslararası Akreditasyon</span>
                </div>
                
                <h1 class="anim-2 text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] drop-shadow-2xl">
                    Global <br/>
                    <span class="relative inline-block mt-1">
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.7)]">Güvence</span>
                        <div class="absolute -bottom-2 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-purple-500 blur-md opacity-60"></div>
                    </span>
                </h1>
                
                <p class="anim-3 text-xl md:text-2xl text-slate-300 max-w-xl mx-auto md:mx-0 leading-relaxed font-light drop-shadow-md border-l-4 border-blue-500 pl-6 my-10">
                    Sertifikasyon standartlarını yeniden yazıyoruz. Onaylı ve uluslararası geçerli belgelerle 
                    <strong class="text-white font-medium">sınır tanımayın.</strong>
                </p>
                
                <div class="anim-4 flex flex-col sm:flex-row items-center gap-5 justify-center md:justify-start mt-10">
                    <a href="/sertifika-dogrula" class="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-blue-600 p-5 px-10 font-bold text-lg text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] w-full sm:w-auto">
                        <span class="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></span>
                        <span class="relative flex items-center tracking-wide">
                            Sertifika Doğrula 
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ml-3 h-6 w-6 transform group-hover:translate-x-2 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                        </span>
                    </a>
                    <a href="/programs" class="inline-flex items-center justify-center rounded-2xl p-5 px-10 font-bold text-lg text-white backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all hover:bg-white/10 hover:border-white/30 w-full sm:w-auto tracking-wide">
                        Eğitim Programları
                    </a>
                </div>
            </div>
            
            <div class="flex-1 relative hidden md:block" style="height:400px;">
                <!-- 3D Globe renders here under the layout via LandingPage.jsx  -->
            </div>
        </div>
    </section>

    <section class="py-24 relative bg-slate-950/80 backdrop-blur-3xl border-t border-white/10 z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div class="max-w-7xl mx-auto px-6 relative">
            <div class="text-center mb-16 space-y-4">
                <h2 class="text-3xl md:text-5xl font-bold">Neden Bizi Seçmelisiniz?</h2>
                <div class="h-1 w-20 bg-blue-500 rounded-full mx-auto"></div>
                <p class="text-slate-400 max-w-2xl mx-auto mt-4 text-lg">Kurumsal ihtiyaçlarınıza en hızlı, en güvenilir ve en yenilikçi çözümleri sunuyoruz.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 transition-all outline outline-1 outline-white/5 hover:outline-blue-500/50 hover:bg-slate-800/80 hover:-translate-y-2 text-center group">
                    <div class="w-20 h-20 mx-auto bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500 border-b-blue-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-white">Alanında Uzmanlaşın</h3>
                    <p class="text-slate-400 leading-relaxed font-light text-lg">Geniş yelpazede sunulan sertifika programları ile uzmanlık alanınızı genişletin ve rakiplerinize fark atın.</p>
                </div>
                <div class="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 transition-all outline outline-1 outline-white/5 hover:outline-indigo-500/50 hover:bg-slate-800/80 hover:-translate-y-2 text-center group relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                    <div class="w-20 h-20 mx-auto bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)] border-b-indigo-500/50 group-hover:scale-110 transition-transform duration-500 relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-white relative z-10">Küresel Geçerlilik</h3>
                    <p class="text-slate-400 leading-relaxed font-light text-lg relative z-10">Aldığınız belgeler e-Devlet ve uluslararası akreditasyon standartlarına %100 uyumludur.</p>
                </div>
                <div class="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 transition-all outline outline-1 outline-white/5 hover:outline-purple-500/50 hover:bg-slate-800/80 hover:-translate-y-2 text-center group">
                    <div class="w-20 h-20 mx-auto bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] border-b-purple-500/50 group-hover:scale-110 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-white">Güçlü Partner Ağı</h3>
                    <p class="text-slate-400 leading-relaxed font-light text-lg">Türkiye\'nin ve dünyanın dört bir yanındaki onaylı bayilerimiz aracılığıyla anında ulaşılabilir hizmet garantisi.</p>
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
                'meta_description' => 'Dünya Çapında Sınırları Aşın. Uluslararası geçerliliğe sahip onaylı eğitim sertifikalarına sayfamızdan ulaşınız.',
                'is_published' => true,
                'is_external' => false,
                'show_in_header' => false,
                'show_in_footer' => false,
            ]
        );
    }
}
