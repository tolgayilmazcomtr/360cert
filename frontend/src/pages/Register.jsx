import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone: "",
        company_name: "",
        tax_number: "",
        tax_office: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/register", formData);
            alert("Kayıt başarılı! Yönetici onayı sonrası giriş yapabilirsiniz.");
            navigate("/login");
        } catch (error) {
            console.error("Kayıt hatası", error);
            alert("Kayıt başarısız: " + (error.response?.data?.message || "Bilinmeyen bir hata oluştu."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Bayi Kayıt Formu</CardTitle>
                    <CardDescription>
                        360Cert bayisi olmak için formu doldurun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ad Soyad</Label>
                                <Input id="name" placeholder="Adınız Soyadınız" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" type="email" placeholder="ornek@sirket.com" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Şifre Tekrar</Label>
                                <Input id="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_name">Şirket/Kurum Adı</Label>
                            <Input id="company_name" placeholder="Kurumunuzun Tam Adı" value={formData.company_name} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" placeholder="0555 555 55 55" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_office">Vergi Dairesi</Label>
                                <Input id="tax_office" value={formData.tax_office} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_number">Vergi Numarası</Label>
                                <Input id="tax_number" value={formData.tax_number} onChange={handleChange} />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Zaten hesabınız var mı? <Link to="/login" className="text-blue-600 hover:underline">Giriş Yap</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
