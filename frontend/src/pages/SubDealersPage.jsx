import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Save } from "lucide-react";

const emptyForm = {
    name: "", email: "", password: "", phone: "",
    company_name: "", tax_number: "", tax_office: "", city: ""
};

const emptyBank = { bank_account_name: "", bank_iban: "", bank_name: "", bank_description: "" };

export default function SubDealersPage() {
    const { user } = useAuth();
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDealer, setEditingDealer] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Bank info state
    const [bankForm, setBankForm] = useState(emptyBank);
    const [bankLoading, setBankLoading] = useState(true);
    const [bankSaving, setBankSaving] = useState(false);
    const [bankSaved, setBankSaved] = useState(false);

    useEffect(() => {
        fetchDealers();
        fetchBankInfo();
    }, []);

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/dealers");
            setDealers(res.data.data ?? res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankInfo = async () => {
        if (!user?.id) return;
        setBankLoading(true);
        try {
            const res = await api.get(`/dealers/${user.id}/bank-info`);
            setBankForm({
                bank_account_name: res.data.bank_account_name || "",
                bank_iban:         res.data.bank_iban || "",
                bank_name:         res.data.bank_name || "",
                bank_description:  res.data.bank_description || "",
            });
        } catch (e) {
            // not yet set — ignore
        } finally {
            setBankLoading(false);
        }
    };

    const saveBankInfo = async () => {
        setBankSaving(true);
        try {
            await api.put(`/dealers/${user.id}/bank-info`, bankForm);
            setBankSaved(true);
            setTimeout(() => setBankSaved(false), 3000);
        } catch (e) {
            alert(e.response?.data?.message || "Kayıt başarısız.");
        } finally {
            setBankSaving(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingDealer(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (dealer) => {
        setEditingDealer(dealer);
        setFormData({
            name: dealer.name ?? "",
            email: dealer.email ?? "",
            password: "",
            phone: dealer.phone ?? "",
            company_name: dealer.company_name ?? "",
            tax_number: dealer.tax_number ?? "",
            tax_office: dealer.tax_office ?? "",
            city: dealer.city ?? "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => { if (v) data.append(k, v); });

            if (editingDealer) {
                await api.put(`/dealers/${editingDealer.id}`, data);
            } else {
                await api.post("/dealers", data);
            }
            setIsModalOpen(false);
            fetchDealers();
        } catch (err) {
            const msg = err.response?.data?.message || Object.values(err.response?.data?.errors ?? {}).flat().join("\n");
            alert(msg || "Bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Alt Bayilerim</h1>
                    <p className="text-sm text-muted-foreground">Oluşturduğunuz alt bayileri yönetin.</p>
                </div>
                <Button onClick={handleOpenCreate}><Plus size={16} className="mr-2" /> Alt Bayi Ekle</Button>
            </div>

            {/* IBAN / Banka Bilgileri Kartı */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Alt Bayi Havale Bilgileri (IBAN)</CardTitle>
                    <CardDescription>
                        Alt bayileriniz bakiye yüklerken bu banka bilgilerini görecek. Havale/EFT yönteminde görüntülenir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {bankLoading ? (
                        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Hesap Sahibi Adı</Label>
                                <Input
                                    value={bankForm.bank_account_name}
                                    onChange={e => setBankForm(f => ({ ...f, bank_account_name: e.target.value }))}
                                    placeholder="Ad Soyad / Firma Adı"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>IBAN</Label>
                                <Input
                                    value={bankForm.bank_iban}
                                    onChange={e => setBankForm(f => ({ ...f, bank_iban: e.target.value.toUpperCase() }))}
                                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Banka Adı</Label>
                                <Input
                                    value={bankForm.bank_name}
                                    onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                                    placeholder="Banka Adı"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Açıklama / Yönlendirme</Label>
                                <Input
                                    value={bankForm.bank_description}
                                    onChange={e => setBankForm(f => ({ ...f, bank_description: e.target.value }))}
                                    placeholder="Lütfen açıklamaya Bayi ID'nizi yazınız."
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3 pt-1">
                                <Button onClick={saveBankInfo} disabled={bankSaving} className="gap-2">
                                    <Save size={14} />
                                    {bankSaving ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                                {bankSaved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Firma</TableHead>
                            <TableHead>Şehir</TableHead>
                            <TableHead>Bakiye</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell></TableRow>
                        ) : dealers.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Henüz alt bayi yok.</TableCell></TableRow>
                        ) : dealers.map(dealer => (
                            <TableRow key={dealer.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{dealer.name}</span>
                                        <span className="text-xs text-muted-foreground">{dealer.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{dealer.company_name || "-"}</TableCell>
                                <TableCell>{dealer.city || "-"}</TableCell>
                                <TableCell className="font-bold text-slate-700">{dealer.balance} TL</TableCell>
                                <TableCell>
                                    {dealer.is_approved
                                        ? <Badge className="bg-green-600">Aktif</Badge>
                                        : <Badge className="bg-amber-500 text-white">Beklemede</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(dealer)}>
                                        <Edit size={14} className="mr-1" /> Düzenle
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingDealer ? "Alt Bayi Düzenle" : "Yeni Alt Bayi"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Ad Soyad *</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>E-posta *</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>{editingDealer ? "Şifre (değiştirmek için girin)" : "Şifre *"}</Label>
                                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingDealer} />
                            </div>
                            <div className="space-y-1">
                                <Label>Telefon</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Firma Adı</Label>
                                <Input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Vergi No *</Label>
                                <Input value={formData.tax_number} onChange={e => setFormData({ ...formData, tax_number: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>Vergi Dairesi *</Label>
                                <Input value={formData.tax_office} onChange={e => setFormData({ ...formData, tax_office: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>Şehir</Label>
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
