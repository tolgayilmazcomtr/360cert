import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
    const [certNo, setCertNo] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!certNo.trim()) return;

        try {
            setIsSearching(true);
            const res = await api.get(`/public/certificates/search`, {
                params: { no: certNo.trim() }
            });
            if (res.data && res.data.hash) {
                navigate(`/verify/${res.data.hash}`);
            }
        } catch (error) {
            toast({
                title: "Bulunamadı",
                description: "Girdiğiniz numara ile eşleşen onaylı bir sertifika bulunamadı.",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-20">
            <div className="max-w-3xl w-full space-y-8 p-10 bg-white shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-50/50 blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-50/50 blur-3xl -z-10"></div>

                <div className="flex justify-center mb-6">
                    <ShieldCheck className="h-20 w-20 text-blue-500" />
                </div>

                <div className="space-y-4 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        Sertifika Doğrulama
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto">
                        Elinizdeki sertifikanın veya belgenin geçerliliğini doğrulamak için lütfen üzerinde yazan sertifika numarasını girin.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="max-w-md mx-auto relative z-10 mt-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <Input
                                value={certNo}
                                onChange={(e) => setCertNo(e.target.value)}
                                placeholder="Sertifika No (örn: IAC-12345)"
                                className="pl-10 h-14 text-lg bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                required
                            />
                        </div>
                        <Button type="submit" className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/25 border-0" disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin mr-2" /> : "Sorgula"}
                        </Button>
                    </div>
                </form>

                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-400">
                    <ShieldCheck size={16} /> Resmi Onaylı ve Güvenilir Altyapı
                </div>
            </div>
        </div>
    );
}
