import React, { useState, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Award, BookOpen, Users, Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AccreditationSlider from "@/components/AccreditationSlider";

const GlobeHero = React.lazy(() => import("@/components/GlobeHero"));

export default function LandingPage() {
    const [pageContent, setPageContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHomePage = async () => {
            try {
                const res = await api.get('/public/pages/anasayfa');
                if (res.data && res.data.content) {
                    setPageContent(res.data.content);
                }
            } catch (error) {
                setPageContent(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomePage();
    }, []);

    if (isLoading) {
        return <div className="flex-1 flex justify-center items-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    }

    if (pageContent) {
        return (
            <div className="w-full flex-1 relative bg-slate-950 overflow-hidden min-h-screen">
                <ErrorBoundary fallback={<div className="absolute inset-0 z-0 bg-slate-950" />}>
                    <Suspense fallback={null}>
                        <GlobeHero />
                    </Suspense>
                </ErrorBoundary>
                <div
                    className="w-full relative z-10 animate-in fade-in duration-500"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                />

                {/* Accreditation Logos Slider for CMS Content */}
                <div className="relative z-10 w-full">
                    <AccreditationSlider />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 bg-slate-950 relative overflow-hidden">
            <ErrorBoundary fallback={<div className="absolute inset-0 z-0 bg-slate-950" />}>
                <Suspense fallback={null}>
                    <GlobeHero />
                </Suspense>
            </ErrorBoundary>

            <div className="relative z-10 w-full">
                {/* Fallback Hero Section */}
                <section className="relative text-white py-24 md:py-32 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1 space-y-8 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 backdrop-blur-md">
                                <ShieldCheck size={16} />
                                <span>Resmi Onaylı Sertifikasyon Sistemi</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.2]">
                                Uluslararası Sertifikalandırma ve <br className="hidden md:block" />
                                <span className="relative inline-block mt-2">
                                    <span className="relative z-10 text-white">Akreditasyon Merkezi</span>
                                    {/* Animated Highlight Underline */}
                                    <span className="absolute bottom-1 left-0 w-full h-[30%] bg-blue-600/60 -z-10 -rotate-2 transform origin-left animate-[highlight_2s_ease-in-out_forwards]"></span>
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed font-light mt-6">
                                Kariyerinizde bir adım öne geçmek için uluslararası geçerliliğe sahip onaylı eğitim sertifikalarına hemen ulaşın ve sorgulayın.
                            </p>

                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes highlight {
                                    0% { width: 0; opacity: 0; }
                                    50% { opacity: 1; }
                                    100% { width: 100%; opacity: 1; }
                                }
                                @keyframes shimmer {
                                    100% { transform: translateX(100%); }
                                }
                            `}} />

                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-8">
                                <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                    <Link to="/sertifika-dogrula">
                                        Sertifika Doğrula <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-bold rounded-xl border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:text-white backdrop-blur-sm w-full sm:w-auto">
                                    <Link to="/programs">
                                        Eğitim Programları
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="flex-1 relative hidden md:block">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                {/* Placeholder or actual visual: A stylized representation of a certificate or dashboard */}
                                <div className="w-full h-80 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-600/20 to-transparent"></div>
                                    <Award className="w-32 h-32 text-blue-400/80 drop-shadow-xl" strokeWidth={1} />

                                    <div className="absolute top-6 left-6 right-6 h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500/50 w-2/3 rounded-full"></div>
                                    </div>
                                    <div className="absolute top-14 left-6 w-1/3 h-2 bg-white/5 rounded-full"></div>
                                    <div className="absolute top-14 left-[40%] w-1/4 h-2 bg-white/5 rounded-full"></div>
                                </div>
                            </div>

                            {/* Floating Badges */}
                            <div className="absolute -bottom-6 -left-6 bg-white text-slate-900 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Uluslararası</div>
                                    <div className="font-bold">Akredite Sertifika</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features/Stats Section */}
                <section className="py-24 relative bg-slate-950 border-t border-white/10 z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-[0.03]"></div>
                    <div className="max-w-7xl mx-auto px-6 relative">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold text-white">Neden Bizi Seçmelisiniz?</h2>
                            <div className="h-1 w-20 bg-blue-500 rounded-full mx-auto"></div>
                            <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-lg">Kurumsal ihtiyaçlarınıza en hızlı, en güvenilir ve en yenilikçi çözümleri sunuyoruz.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 transition-all hover:bg-slate-800/80 hover:-translate-y-2 text-center group">
                                <div className="w-20 h-20 mx-auto bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500">
                                    <BookOpen size={36} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Alanında Uzmanlaşın</h3>
                                <p className="text-slate-400 leading-relaxed font-light text-lg">Geniş yelpazede sunulan sertifika programları ile uzmanlık alanınızı genişletin ve rakiplerinize fark atın.</p>
                            </div>
                            <div className="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 transition-all hover:bg-slate-800/80 hover:-translate-y-2 text-center group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                                <div className="w-20 h-20 mx-auto bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform duration-500 relative z-10">
                                    <Award size={36} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white relative z-10">Küresel Geçerlilik</h3>
                                <p className="text-slate-400 leading-relaxed font-light text-lg relative z-10">Aldığınız belgeler e-Devlet ve uluslararası akreditasyon standartlarına %100 uyumludur.</p>
                            </div>
                            <div className="p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 transition-all hover:bg-slate-800/80 hover:-translate-y-2 text-center group">
                                <div className="w-20 h-20 mx-auto bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform duration-500">
                                    <Users size={36} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Güçlü Partner Ağı</h3>
                                <p className="text-slate-400 leading-relaxed font-light text-lg">Türkiye'nin ve dünyanın dört bir yanındaki onaylı bayilerimiz aracılığıyla anında ulaşılabilir hizmet garantisi.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Accreditation Logos Slider */}
                <AccreditationSlider />
            </div>
        </div>
    );
}
