import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Loader2, FileText, ArrowRight, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function CertificateVerificationPage() {
    const [certNo, setCertNo] = useState("");
    const [tcNo, setTcNo] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [tcResults, setTcResults] = useState(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSearchByNo = async (e) => {
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

    const handleSearchByTc = async (e) => {
        e.preventDefault();
        if (!tcNo.trim() || tcNo.length !== 11) {
            toast({
                title: "Geçersiz Giriş",
                description: "Lütfen 11 haneli geçerli bir TC Kimlik Numarası girin.",
                variant: "warning"
            });
            return;
        }

        try {
            setIsSearching(true);
            setTcResults(null);
            const res = await api.get(`/public/certificates/search-tc`, {
                params: { tc_number: tcNo.trim() }
            });
            setTcResults(res.data);
        } catch (error) {
            toast({
                title: "Bulunamadı",
                description: error.response?.data?.message || "Bu TC Kimlik numarasına ait onaylı sertifika bulunamadı.",
                variant: "destructive"
            });
            setTcResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center p-6 py-12 md:py-20 animate-in fade-in duration-500">
            <div className="max-w-4xl w-full">
                {/* Header Area */}
                <div className="text-center space-y-4 mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-full mb-2">
                        <ShieldCheck className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        Sertifika Doğrulama Sistemi
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Belgelerinizin geçerliliğini güvenle sorgulayın. Sertifika numaranızla doğrudan belgeye ulaşabilir veya TC Kimlik numaranızla adınıza kayıtlı tüm belgeleri listeleyebilirsiniz.
                    </p>
                </div>

                {/* Validation Card */}
                <Card className="shadow-2xl shadow-slate-200/50 border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-50/50 blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-50/50 blur-3xl -z-10"></div>

                    <CardContent className="p-0 z-10 relative">
                        <Tabs defaultValue="cert-no" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-16 rounded-none bg-slate-100/50 p-0 border-b">
                                <TabsTrigger value="cert-no" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-base font-medium">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Sertifika No ile Sorgula
                                </TabsTrigger>
                                <TabsTrigger value="tc-no" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-base font-medium">
                                    <UserCheck className="mr-2 h-5 w-5" />
                                    TC Kimlik No ile Sorgula
                                </TabsTrigger>
                            </TabsList>

                            <div className="p-8 md:p-12">
                                {/* Tab: Certificate Number */}
                                <TabsContent value="cert-no" className="mt-0 space-y-6">
                                    <div className="text-center space-y-2 mb-8">
                                        <h3 className="text-xl font-bold text-slate-800">Sertifika Kodu ile Doğrulama</h3>
                                        <p className="text-slate-500 text-sm">Sertifikanızın üzerinde yer alan (Örn: IAC-2026-ABCDEF) takip kodunu giriniz.</p>
                                    </div>
                                    <form onSubmit={handleSearchByNo} className="max-w-xl mx-auto">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <Input
                                                    value={certNo}
                                                    onChange={(e) => setCertNo(e.target.value)}
                                                    placeholder="Sertifika No Giriniz"
                                                    className="pl-12 h-14 text-lg bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700" disabled={isSearching}>
                                                {isSearching ? <Loader2 className="animate-spin mr-2" /> : "Doğrula"}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>

                                {/* Tab: TC Number */}
                                <TabsContent value="tc-no" className="mt-0 space-y-6">
                                    <div className="text-center space-y-2 mb-8">
                                        <h3 className="text-xl font-bold text-slate-800">T.C. Kimlik No ile Doğrulama</h3>
                                        <p className="text-slate-500 text-sm">T.C. Kimlik numaranızı girerek adınıza düzenlenmiş tüm resmi belgeleri listeleyebilirsiniz.</p>
                                    </div>
                                    <form onSubmit={handleSearchByTc} className="max-w-xl mx-auto">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <Input
                                                    value={tcNo}
                                                    onChange={(e) => setTcNo(e.target.value)}
                                                    placeholder="T.C. Kimlik No (11 Hane)"
                                                    maxLength={11}
                                                    className="pl-12 h-14 text-lg bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700" disabled={isSearching}>
                                                {isSearching ? <Loader2 className="animate-spin mr-2" /> : "Sorgula"}
                                            </Button>
                                        </div>
                                    </form>

                                    {/* TC Results Table */}
                                    {tcResults && tcResults.length > 0 && (
                                        <div className="mt-10 animate-in slide-in-from-bottom-4 duration-500">
                                            <h4 className="font-semibold text-slate-800 mb-4 border-b pb-2">Kayıtlı Sertifikalarınız ({tcResults.length})</h4>
                                            <div className="space-y-3">
                                                {tcResults.map((cert) => (
                                                    <div key={cert.id} className="group border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-md rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Onaylı</span>
                                                                <span className="text-sm text-slate-500 font-mono">{cert.certificate_no}</span>
                                                            </div>
                                                            <h5 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                                                                {cert.program_name}
                                                            </h5>
                                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                                <span>{cert.student_name_masked}</span>
                                                                <span>•</span>
                                                                <span>Veriliş: {new Date(cert.issue_date).toLocaleDateString('tr-TR')}</span>
                                                            </div>
                                                        </div>
                                                        <Button asChild variant="outline" className="shrink-0 bg-white group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200">
                                                            <Link to={`/verify/${cert.hash}`}>
                                                                Detaylar <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {tcResults && tcResults.length === 0 && (
                                        <div className="mt-8 text-center p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                                            Girdiğiniz bilgilere ait sistemde kayıtlı belge bulunamadı.
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-green-600" /> Sorgulama işlemleri güvenli bağlantı üzerinden yapılmaktadır.
                </div>
            </div>
        </div>
    );
}
