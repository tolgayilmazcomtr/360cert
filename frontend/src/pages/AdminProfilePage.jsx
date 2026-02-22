import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Eye, EyeOff } from "lucide-react";

export default function AdminProfilePage() {
    const { user, login } = useAuth();
    const { toast } = useToast();

    const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm(prev => ({ ...prev, name: user.name || "", email: user.email || "" }));
        }
    }, [user]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password && form.password !== form.password_confirmation) {
            toast({ title: "Hata", description: "Şifreler eşleşmiyor.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const payload = { name: form.name, email: form.email };
            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }
            const res = await api.put("/admin/profile", payload);
            toast({ title: "Başarılı", description: "Profil güncellendi." });
            setForm(prev => ({ ...prev, password: "", password_confirmation: "" }));
            // Update user context
            try {
                const me = await api.get('/user');
                login(me.data, localStorage.getItem('token'));
            } catch (_) { }
        } catch (err) {
            const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || "Güncelleme başarısız.";
            toast({ title: "Hata", description: msg, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Shield size={24} className="text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Yönetici Profili</h2>
                    <p className="text-sm text-slate-500">Hesap bilgilerinizi güncelleyin</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil Bilgileri</CardTitle>
                    <CardDescription>Ad, e-posta ve şifrenizi değiştirebilirsiniz.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Soyad</Label>
                            <Input
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="Ad Soyad"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className="border-t pt-4 mt-2 space-y-4">
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Şifre Değişikliği (İsteğe Bağlı)</p>
                            <div className="space-y-2">
                                <Label htmlFor="password">Yeni Şifre</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Boş bırakırsanız değişmez"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Şifre Tekrar</Label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Şifreyi tekrar girin"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={saving} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Save size={16} />
                            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-slate-100 bg-slate-50">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                        <Shield size={16} className="text-slate-400" />
                        <span>Bu sayfadaki değişiklikler sadece <strong>kendi yönetici hesabınızı</strong> etkiler.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
