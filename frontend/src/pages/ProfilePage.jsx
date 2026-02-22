import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Save, User as UserIcon, Building2, Send } from "lucide-react";

// Safe storage base URL — works with either VITE_API_URL or VITE_API_BASE_URL
const storageBase = (() => {
    const raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
    return raw.replace('/api', '');
})();

export default function ProfilePage() {
    const { user, login } = useAuth(); // Assuming login context updates user state
    const { toast } = useToast();

    // Direct Update States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [photo, setPhoto] = useState(null);
    const [logo, setLogo] = useState(null);
    const [isSavingDirect, setIsSavingDirect] = useState(false);

    // Request Update States
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestData, setRequestData] = useState({
        company_name: "",
        tax_number: "",
        tax_office: "",
        city: "",
    });
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    useEffect(() => {
        if (user) {
            setEmail(user.email || "");
            setRequestData({
                company_name: user.company_name || "",
                tax_number: user.tax_number || "",
                tax_office: user.tax_office || "",
                city: user.city || "",
            });
            if (user.role === 'dealer') {
                fetchPendingRequest();
            }
        }
    }, [user]);

    const fetchPendingRequest = async () => {
        try {
            const res = await api.get("/profile/update-request");
            // null means no pending request
            setPendingRequest(res.data && res.data.id ? res.data : null);
        } catch (error) {
            console.error("Bekleyen talep alınamadı", error);
            setPendingRequest(null);
        }
    };

    const handleDirectUpdate = async (e) => {
        e.preventDefault();
        setIsSavingDirect(true);
        const data = new FormData();
        if (email !== user.email) data.append("email", email);
        if (password) data.append("password", password);
        if (photo) data.append("photo", photo);
        if (logo) data.append("logo", logo);

        try {
            const response = await api.post("/profile/update", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Re-authenticate or manually update user context if possible. 
            // For now, let's just show success
            toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
            setPassword("");
            setPhoto(null);
            setLogo(null);

            // Optionally fetch me and set context
            try {
                const me = await api.get('/user');
                login(me.data.data, localStorage.getItem('token'));
            } catch (e) { }

        } catch (error) {
            toast({ title: "Hata", description: error.response?.data?.message || "Güncelleme başarısız.", variant: "destructive" });
        } finally {
            setIsSavingDirect(false);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!requestData.company_name?.trim()) {
            toast({ title: "Hata", description: "Firma adı zorunludur.", variant: "destructive" });
            return;
        }
        setIsSubmittingRequest(true);
        try {
            await api.post("/profile/update-request", requestData);
            toast({ title: "Talebiniz Alındı ✅", description: "Yönetici onayından sonra bilgileriniz güncellenecektir." });
            setIsRequestModalOpen(false);
            fetchPendingRequest();
        } catch (error) {
            const errors = error.response?.data?.errors;
            const firstErr = errors ? Object.values(errors)[0]?.[0] : null;
            toast({
                title: "Hata",
                description: firstErr || error.response?.data?.message || "Talep oluşturulamadı. Lütfen tekrar deneyin.",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="max-w-4xl space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Profilim</h2>

            <div className="grid md:grid-cols-2 gap-6">

                {/* DIRECT UPDATE CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserIcon size={20} className="text-indigo-600" /> Hesap ve Medya (Hızlı Değişim)</CardTitle>
                        <CardDescription>E-posta, şifre ve görseller anında güncellenir.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleDirectUpdate}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Giriş E-postası</Label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2 border p-3 rounded-md bg-slate-50">
                                <Label className="text-sm font-semibold mb-2 block text-slate-700">Logo & Fotoğraf</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Yetkili İşletme Logosu (Sertifikalara basılacak)</Label>
                                        {user.logo_path && (
                                            <img src={`${storageBase}/storage/${user.logo_path}`} alt="Logo" className="w-16 h-16 object-cover rounded shadow-sm border mb-2 bg-white" />
                                        )}
                                        <Input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} className="text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Yetkili Fotoğrafı (Paneli Kişiselleştirmek İçin)</Label>
                                        {user.photo_path && (
                                            <img src={`${storageBase}/storage/${user.photo_path}`} alt="Photo" className="w-16 h-16 object-cover rounded shadow-sm border mb-2 bg-white" />
                                        )}
                                        <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="text-xs" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSavingDirect} className="w-full gap-2">
                                <Save size={16} /> {isSavingDirect ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* CORPORATE INFO CARD (READ-ONLY + REQUEST) */}
                <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="flex items-center gap-2"><Building2 size={20} className="text-slate-600" /> Kurumsal Bilgiler</CardTitle>
                        <CardDescription>Bu bilgiler sertifikalarda ve faturalandırmada kullanılır. Değişiklik için yönetici onayı gerekir.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">

                        {pendingRequest && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm mb-4">
                                <strong className="block mb-1">Devam Eden Değişiklik Talebiniz Var</strong>
                                Yönetici onayına sunulmuş bilgileriniz incelenmektedir.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Firma Adı / Ünvan</Label>
                                <div className="font-medium bg-slate-100/50 p-2 rounded">{user.company_name || "-"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Şehir</Label>
                                <div className="font-medium bg-slate-100/50 p-2 rounded">{user.city || "-"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Vergi Dairesi</Label>
                                <div className="font-medium bg-slate-100/50 p-2 rounded">{user.tax_office || "-"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Vergi No</Label>
                                <div className="font-medium bg-slate-100/50 p-2 rounded">{user.tax_number || "-"}</div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t items-center justify-end">
                        <Button variant="outline" onClick={() => setIsRequestModalOpen(true)} disabled={!!pendingRequest} className="gap-2">
                            <Send size={16} /> Değişiklik Talebi Gönder
                        </Button>
                    </CardFooter>
                </Card>

            </div>

            {/* Request Update Modal */}
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kurumsal Bilgileri Güncelleme Talebi</DialogTitle>
                        <DialogDescription>
                            Girdiğiniz yeni bilgiler sistem yöneticisinin onayına sunulacaktır. Onaylanana kadar mevcut bilgileriniz geçerli olmaya devam eder.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Yeni Firma Adı / Ünvan *</Label>
                            <Input value={requestData.company_name} onChange={e => setRequestData({ ...requestData, company_name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Yeni Vergi Dairesi</Label>
                                <Input value={requestData.tax_office} onChange={e => setRequestData({ ...requestData, tax_office: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Yeni Vergi No</Label>
                                <Input value={requestData.tax_number} onChange={e => setRequestData({ ...requestData, tax_number: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Yeni Şehir</Label>
                            <Input value={requestData.city} onChange={e => setRequestData({ ...requestData, city: e.target.value })} />
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" type="button" onClick={() => setIsRequestModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isSubmittingRequest}>Talep Gönder</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
