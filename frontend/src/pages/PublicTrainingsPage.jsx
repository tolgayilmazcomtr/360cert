import { useState, useEffect } from "react";
import api from "@/api/axios";
import { Loader2, GraduationCap, Clock, Languages } from "lucide-react";

export default function PublicTrainingsPage() {
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const res = await api.get('/public/training-programs');
                setPrograms(res.data);
            } catch (err) { }
            finally { setIsLoading(false); }
        };
        fetchPrograms();
    }, []);

    const parseName = (nameObj) => {
        if (!nameObj) return "İsimsiz Eğitim";
        try {
            const parsed = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
            return parsed.tr || parsed.en || "İsimsiz Eğitim";
        } catch {
            return nameObj;
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center py-32">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto space-y-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Eğitim Programları</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Uluslararası standartlarda sunulan mesleki eğitim, kalfalık, ustalık ve uzmanlık programlarımızı inceleyin.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                {programs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <GraduationCap className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700">Henüz Eğitim Programı Bulunmuyor</h2>
                        <p className="text-slate-500 mt-2">Daha sonra tekrar kontrol ediniz.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {programs.map((prog) => (
                            <div key={prog.id} className="bg-white group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200 hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                        <GraduationCap size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                                        {parseName(prog.name)}
                                    </h3>
                                    <p className="text-slate-500 text-sm flex-1 mb-6">
                                        {prog.description || "Bu eğitim programı sertifikasyon süreçlerinizde geçerliliğe sahiptir."}
                                    </p>

                                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <Clock size={16} className="text-blue-500" />
                                            <span className="font-semibold">{prog.duration_hours} <span className="text-slate-400 font-normal">Saat</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400" title="Çoklu Dil Desteği">
                                            <Languages size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
