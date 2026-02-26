import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Award, BookOpen, Users } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white overflow-hidden py-24 md:py-32">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
                    <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-5"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-8 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 backdrop-blur-md">
                            <ShieldCheck size={16} />
                            <span>Resmi Onaylı Sertifikasyon Sistemi</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                            Geleceğinize <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Sertifika Katın</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                            Kariyerinizde bir adım öne geçmek için uluslararası geçerliliğe sahip onaylı eğitim sertifikalarına hemen ulaşın ve sorgulayın.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
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
                            <div className="bg-green-100 p-3 rounded-full text-green-600">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 font-medium">Güvenilir</div>
                                <div className="font-bold">100% Onaylı</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Stats Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Çeşitli Eğitimler</h3>
                            <p className="text-slate-500">Geniş yelpazede sunulan sertifika programları ile uzmanlık alanınızı genişletin.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Award size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Uluslararası Geçerlilik</h3>
                            <p className="text-slate-500">Aldığınız belgeler e-Devlet ve uluslararası akreditasyon standartlarına uygundur.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Geniş Bayi Ağı</h3>
                            <p className="text-slate-500">Türkiye'nin dört bir yanındaki onaylı bayilerimiz aracılığıyla güvenli hizmet alın.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
