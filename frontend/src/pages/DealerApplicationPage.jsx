import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, LogIn, ArrowLeft, Loader2 } from "lucide-react";

export default function DealerApplicationPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        company_name: "",
        phone: "",
        tax_number: "",
        tax_office: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post("/register", formData);
            toast({
                title: "Başvuru Alındı",
                description: "Bayi başvurunuz başarıyla alındı. Yönetici onayının ardından giriş yapabilirsiniz.",
            });
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            toast({
                title: "Başvuru Başarısız",
                description: error.response?.data?.message || "Lütfen girdiğiniz bilgileri kontrol edip tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
                <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building className="text-primary" />
                            Bayi Başvurusu
                        </h1>
                        <p className="text-muted-foreground mt-1">Sertifika sitemine katılmak için lütfen aşağıdaki formu eksiksiz doldurun.</p>
                    </div>
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Yetkili Adı Soyadı *</Label>
                                <Input
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ad Soyad"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma/Kurum Adı *</Label>
                                <Input
                                    name="company_name"
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    placeholder="Kurum Adı"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>E-posta Adresi *</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="ornek@firma.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon Numarası *</Label>
                                <Input
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="05XX XXX XX XX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vergi Dairesi</Label>
                                <Input
                                    name="tax_office"
                                    value={formData.tax_office}
                                    onChange={handleChange}
                                    placeholder="Vergi Dairesi"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vergi Kimlik / TC No</Label>
                                <Input
                                    name="tax_number"
                                    value={formData.tax_number}
                                    onChange={handleChange}
                                    placeholder="VKN / TCKN"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Şifre *</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Şifre Tekrar *</Label>
                                <Input
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                            <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                                <LogIn size={16} /> Zaten hesabınız var mı? Giriş yapın.
                            </Link>
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto px-8">
                                {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Başvuruyu Gönder
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
