import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Eye, EyeOff, CheckCircle, XCircle, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/users");
            setAdmins(res.data);
        } catch (err) {
            toast({ title: "Hata", description: "Yöneticiler yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAdmins(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            toast({ title: "Hata", description: "Şifreler eşleşmiyor.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            await api.post("/admin/users", form);
            toast({ title: "Başarılı", description: "Yeni yönetici oluşturuldu." });
            setIsModalOpen(false);
            setForm({ name: "", email: "", password: "", password_confirmation: "" });
            fetchAdmins();
        } catch (err) {
            const errors = err.response?.data?.errors;
            const msg = errors ? Object.values(errors)[0]?.[0] : (err.response?.data?.message || "Oluşturma başarısız.");
            toast({ title: "Hata", description: msg, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const action = currentStatus ? "pasif" : "aktif";
        if (!confirm(`Bu yöneticiyi ${action} yapmak istiyor musunuz?`)) return;
        try {
            await api.put(`/admin/users/${id}/status`);
            toast({ title: "Başarılı", description: `Yönetici ${action} yapıldı.` });
            fetchAdmins();
        } catch (err) {
            toast({ title: "Hata", description: err.response?.data?.message || "İşlem başarısız.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Users size={24} className="text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Yönetici Hesapları</h2>
                        <p className="text-sm text-slate-500">Sisteme erişebilen yöneticileri yönetin</p>
                    </div>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={16} />
                    Yeni Yönetici Ekle
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>E-posta</TableHead>
                                <TableHead>Kayıt Tarihi</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                                            Yükleniyor...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : admins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                        Henüz yönetici bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : admins.map(admin => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.name}</TableCell>
                                    <TableCell className="text-slate-600">{admin.email}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(admin.created_at).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${admin.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                            {admin.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {admin.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-8 text-xs ${admin.is_active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                            onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                                        >
                                            {admin.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Admin Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus size={20} className="text-indigo-600" />
                            Yeni Yönetici Ekle
                        </DialogTitle>
                        <DialogDescription>
                            Sisteme yönetici rolünde yeni bir kullanıcı ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="new-name">Ad Soyad <span className="text-red-500">*</span></Label>
                                <Input
                                    id="new-name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Adı Soyadı"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-email">E-posta <span className="text-red-500">*</span></Label>
                                <Input
                                    id="new-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Şifre <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        placeholder="En az 6 karakter"
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
                                <Label htmlFor="new-password-confirm">Şifre Tekrar <span className="text-red-500">*</span></Label>
                                <Input
                                    id="new-password-confirm"
                                    name="password_confirmation"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    required
                                    placeholder="Şifreyi tekrar girin"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <UserPlus size={16} />
                                {saving ? "Oluşturuluyor..." : "Yönetici Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
