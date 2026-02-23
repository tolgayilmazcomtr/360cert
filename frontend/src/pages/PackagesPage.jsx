import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit2, Trash2, Star, CheckCircle, Zap, ShoppingCart, ToggleLeft, CreditCard, Lock } from "lucide-react";

const defaultForm = { name: "", description: "", price: "", credit_amount: "", sort_order: 0, is_active: true, is_featured: false };
const defaultCheckoutForm = { card_name: '', card_number: '', expire_month: '', expire_year: '', cvc: '' };

export default function PackagesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const isAdmin = user?.role === 'admin';

    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [purchasingId, setPurchasingId] = useState(null);
    const [checkoutPkg, setCheckoutPkg] = useState(null);
    const [checkoutForm, setCheckoutForm] = useState(defaultCheckoutForm);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/packages');
            setPackages(res.data);
        } catch {
            toast({ title: "Hata", description: "Paketler yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPackages(); }, []);

    const openCreate = () => { setEditingPackage(null); setForm(defaultForm); setIsModalOpen(true); };
    const openEdit = (pkg) => { setEditingPackage(pkg); setForm({ ...pkg }); setIsModalOpen(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingPackage) {
                await api.put(`/packages/${editingPackage.id}`, form);
                toast({ title: "Güncellendi", description: "Paket güncellendi." });
            } else {
                await api.post('/packages', form);
                toast({ title: "Oluşturuldu", description: "Yeni paket eklendi." });
            }
            setIsModalOpen(false);
            fetchPackages();
        } catch (err) {
            const msg = Object.values(err.response?.data?.errors || {})[0]?.[0] || "Hata oluştu.";
            toast({ title: "Hata", description: msg, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bu paketi silmek istediğinizden emin misiniz?")) return;
        try {
            await api.delete(`/packages/${id}`);
            toast({ title: "Silindi", description: "Paket silindi." });
            fetchPackages();
        } catch {
            toast({ title: "Hata", description: "Silinemedi.", variant: "destructive" });
        }
    };

    const handleToggleActive = async (pkg) => {
        try {
            await api.put(`/packages/${pkg.id}`, { is_active: !pkg.is_active });
            fetchPackages();
        } catch { }
    };

    const handleOpenCheckout = (pkg) => {
        setCheckoutPkg(pkg);
        setCheckoutForm({ card_name: '', card_number: '', expire_month: '', expire_year: '', cvc: '' });
    };

    const submitCheckout = async (e) => {
        e.preventDefault();
        setPurchasingId(checkoutPkg.id);
        try {
            const res = await api.post('/payment/process', {
                package_id: checkoutPkg.id,
                ...checkoutForm
            });

            // Redirect to 3D Secure
            if (res.data.status === 'success') {
                if (res.data.redirect_url) {
                    window.location.href = res.data.redirect_url;
                } else if (res.data.html) {
                    document.open();
                    document.write(res.data.html);
                    document.close();
                } else {
                    toast({ title: "Başarılı", description: "Ödeme işlemi tamamlandı." });
                    setCheckoutPkg(null);
                }
            } else {
                toast({ title: "Ödeme Hatası", description: res.data.message || "İşlem başarısız.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Ödeme Hatası", description: err.response?.data?.message || "İşlem başarısız.", variant: "destructive" });
        } finally {
            setPurchasingId(null);
        }
    };

    const visiblePackages = isAdmin ? packages : packages.filter(p => p.is_active);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg"><Package size={22} className="text-indigo-600" /></div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Bakiye Paketleri</h2>
                        <p className="text-sm text-slate-500">
                            {isAdmin ? "Paketleri yönetin ve düzenleyin" : "Bir paket satın alarak bakiyenizi yükleyin"}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Plus size={16} /> Yeni Paket Ekle
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                    Yükleniyor...
                </div>
            ) : visiblePackages.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Henüz aktif paket bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {visiblePackages.map(pkg => {
                        const bonus = pkg.credit_amount - pkg.price;
                        const bonusPct = Math.round((bonus / pkg.price) * 100);
                        return (
                            <Card key={pkg.id} className={`relative flex flex-col transition-all hover:shadow-lg ${pkg.is_featured ? 'border-2 border-indigo-500 shadow-md' : ''} ${!pkg.is_active && isAdmin ? 'opacity-50' : ''}`}>
                                {pkg.is_featured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                                        <Star size={10} fill="white" /> En Popüler
                                    </div>
                                )}
                                {isAdmin && !pkg.is_active && (
                                    <div className="absolute top-2 right-2 bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded">Pasif</div>
                                )}

                                <CardHeader className={`pb-2 ${pkg.is_featured ? 'bg-indigo-50 rounded-t-xl' : ''}`}>
                                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                                    <CardDescription className="text-xs">{pkg.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-center py-2">
                                        <p className="text-3xl font-bold text-slate-900">{formatCurrency(pkg.price)}</p>
                                        <p className="text-xs text-slate-500 mt-1">ödeme yaparsınız</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(pkg.credit_amount)}</p>
                                        <p className="text-xs text-emerald-600">bakiyenize eklenir</p>
                                    </div>
                                    {bonus > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 justify-center">
                                            <Zap size={12} />
                                            <span className="font-medium">+{formatCurrency(bonus)} bonus (%{bonusPct})</span>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="flex flex-col gap-2">
                                    {isAdmin ? (
                                        <div className="flex gap-2 w-full">
                                            <Button variant="outline" size="sm" className="flex-1 gap-1 h-8" onClick={() => openEdit(pkg)}>
                                                <Edit2 size={12} /> Düzenle
                                            </Button>
                                            <Button
                                                variant="outline" size="sm"
                                                className={`h-8 px-2 ${pkg.is_active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                onClick={() => handleToggleActive(pkg)}
                                                title={pkg.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                            >
                                                <ToggleLeft size={12} />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 px-2 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(pkg.id)}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className={`w-full gap-2 ${pkg.is_featured ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                            onClick={() => handleOpenCheckout(pkg)}
                                            disabled={purchasingId === pkg.id}
                                        >
                                            <ShoppingCart size={14} />
                                            {purchasingId === pkg.id ? 'İşleniyor...' : 'Satın Al'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Admin: Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</DialogTitle>
                        <DialogDescription>Bayi panelinde görünecek bakiye paketini yapılandırın.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="pkg-name">Paket Adı *</Label>
                                <Input id="pkg-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Örn: Pro Paket" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pkg-desc">Açıklama</Label>
                                <Textarea id="pkg-desc" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Kısa açıklama..." rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="pkg-price">Satış Fiyatı (TL) *</Label>
                                    <Input id="pkg-price" type="number" min="1" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required placeholder="1000" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="pkg-credit">Bakiye Kredisi (TL) *</Label>
                                    <Input id="pkg-credit" type="number" min="1" value={form.credit_amount} onChange={e => setForm(p => ({ ...p, credit_amount: e.target.value }))} required placeholder="1050" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="pkg-order">Sıra</Label>
                                    <Input id="pkg-order" type="number" min="0" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))} />
                                </div>
                                <div className="space-y-3 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="rounded" />
                                        <span className="text-sm">En Popüler olarak işaretle</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                                        <span className="text-sm">Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                {saving ? 'Kaydediliyor...' : (editingPackage ? 'Güncelle' : 'Oluştur')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dealer: Checkout Modal */}
            <Dialog open={!!checkoutPkg} onOpenChange={(open) => !open && setCheckoutPkg(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard size={18} className="text-indigo-600" /> Güvenli Ödeme
                        </DialogTitle>
                        <DialogDescription>
                            {checkoutPkg?.name} paketini satın almak üzeresiniz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border mb-2">
                        <div>
                            <p className="text-sm text-slate-500">Ödenecek Tutar</p>
                            <p className="text-2xl font-bold text-slate-900">{checkoutPkg && formatCurrency(checkoutPkg.price)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Eklenecek Bakiye</p>
                            <p className="font-bold text-emerald-600">{checkoutPkg && formatCurrency(checkoutPkg.credit_amount)}</p>
                        </div>
                    </div>

                    <form onSubmit={submitCheckout}>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="cc-name">Kart Üzerindeki İsim *</Label>
                                <Input id="cc-name" required value={checkoutForm.card_name} onChange={e => setCheckoutForm(p => ({ ...p, card_name: e.target.value.toUpperCase() }))} placeholder="AD SOYAD" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cc-number">Kart Numarası *</Label>
                                <Input
                                    id="cc-number"
                                    required
                                    maxLength="19"
                                    value={checkoutForm.card_number}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                        setCheckoutForm(p => ({ ...p, card_number: formatted }));
                                    }}
                                    placeholder="0000 0000 0000 0000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Son Kullanma Tarihi *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ay (MM)"
                                            required
                                            maxLength="2"
                                            value={checkoutForm.expire_month}
                                            onChange={e => setCheckoutForm(p => ({ ...p, expire_month: e.target.value.replace(/\D/g, '') }))}
                                            className="text-center"
                                        />
                                        <Input
                                            placeholder="Yıl (YYYY)"
                                            required
                                            maxLength="4"
                                            value={checkoutForm.expire_year}
                                            onChange={e => setCheckoutForm(p => ({ ...p, expire_year: e.target.value.replace(/\D/g, '') }))}
                                            className="text-center"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex flex-col items-end">
                                    <Label htmlFor="cc-cvc" className="w-full text-left">Güvenlik Kodu (CVC) *</Label>
                                    <Input
                                        id="cc-cvc"
                                        required
                                        maxLength="4"
                                        type="password"
                                        value={checkoutForm.cvc}
                                        onChange={e => setCheckoutForm(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="***"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
                                <Lock size={10} className="text-emerald-600" />
                                Kart bilgileriniz 256-bit SSL ile şifrelenerek Param POS altyapısına iletilir. 3D Secure ekranına yönlendirileceksiniz.
                            </p>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setCheckoutPkg(null)} disabled={purchasingId}>İptal</Button>
                            <Button type="submit" disabled={purchasingId} className="bg-indigo-600 hover:bg-indigo-700 w-[140px]">
                                {purchasingId ? 'İşleniyor...' : 'Ödeme Yap'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
