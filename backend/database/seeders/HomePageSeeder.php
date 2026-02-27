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
            <div class="flex-1 space-y-8 text-center md:text-left pt-12 md:pt-0">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-900/40 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 4.93 1 7 2a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    <span class="text-sm font-semibold text-blue-200 tracking-wide uppercase">Küresel Akredite Sertifikasyon</span>
                </div>
                
                <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-2xl">
                    Dünya Çapında <br/>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]">Sınırları Aşın</span>
                </h1>
                
                <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed font-light drop-shadow-md">
                    Uluslararası standartlarda onaylı ve güvenilir eğitim sertifikalarınızla kariyerinizde bir adım öne çıkın. Geleceğiniz parmaklarınızın ucunda.
                </p>
                
                <div class="flex flex-col sm:flex-row items-center gap-5 justify-center md:justify-start mt-8">
                    <a href="/sertifika-dogrula" class="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-blue-600 p-4 px-8 font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] w-full sm:w-auto">
                        <span class="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></span>
                        <span class="relative flex items-center">
                            Sertifika Sorgula 
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-3 h-5 w-5 transform group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                        </span>
                    </a>
                    <a href="/programs" class="inline-flex items-center justify-center rounded-xl p-4 px-8 font-bold text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:bg-white/20 hover:border-white/40 w-full sm:w-auto">
                        Eğitim Programları
                    </a>
                </div>
                
                <div class="flex items-center justify-center md:justify-start gap-4 pt-10 opacity-70">
                    <div class="flex -space-x-3">
                        <div class="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-white shadow-lg">ISO</div>
                        <div class="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-blue-400 shadow-lg" style="letter-spacing: -1px">100%</div>
                        <div class="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-purple-400 shadow-lg">SAFE</div>
                    </div>
                    <div class="text-sm font-medium">Uluslararası standartlara tam uyum</div>
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
