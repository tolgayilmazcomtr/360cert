import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Edit, RotateCcw, Plus, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DealersPage() {
    const [dealers, setDealers] = useState([]);
    const [updateRequests, setUpdateRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [newQuota, setNewQuota] = useState(0);

    const { user } = useAuth();

    useEffect(() => {
        fetchDealers();
        fetchUpdateRequests();
    }, []);

    const [templates, setTemplates] = useState([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState(null);
    const [assignedTemplates, setAssignedTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    const fetchTemplates = async () => {
        try {
            const res = await api.get("/certificate-templates");
            setTemplates(res.data);
        } catch (error) {
            console.error("Şablonlar yüklenemedi", error);
        }
    };

    const handleOpenTemplateModal = async (dealerId) => {
        setSelectedDealerId(dealerId);
        setIsTemplateModalOpen(true);
        fetchTemplates();
        fetchAssignedTemplates(dealerId);
    };

    const fetchAssignedTemplates = async (dealerId) => {
        try {
            const res = await api.get(`/dealers/${dealerId}/templates`);
            setAssignedTemplates(res.data);
        } catch (error) {
            console.error("Atanmış şablonlar yüklenemedi", error);
        }
    };

    const handleAssignTemplate = async () => {
        if (!selectedTemplateId) return;
        try {
            await api.post(`/dealers/${selectedDealerId}/templates`, { template_id: selectedTemplateId });
            alert("Şablon başarıyla atandı.");
            fetchAssignedTemplates(selectedDealerId);
            setSelectedTemplateId("");
        } catch (error) {
            console.error("Atama hatası", error);
            alert("Hata: " + (error.response?.data?.message || "İşlem başarısız."));
        }
    };

    const handleRevokeTemplate = async (templateId) => {
        if (!confirm("Atamayı kaldırmak istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/dealers/${selectedDealerId}/templates/${templateId}`);
            alert("Atama kaldırıldı.");
            fetchAssignedTemplates(selectedDealerId);
        } catch (error) {
            console.error("Kaldırma hatası", error);
            alert("Hata oluştu.");
        }
    };

    const fetchDealers = async () => {
        try {
            const response = await api.get("/dealers");
            setDealers(response.data.data);
        } catch (error) {
            console.error("Bayiler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpdateRequests = async () => {
        try {
            const response = await api.get("/dealers/update-requests");
            setUpdateRequests(response.data);
        } catch (error) {
            console.error("Güncelleme talepleri yüklenemedi", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(status ? "Bayiyi onaylamak istiyor musunuz?" : "Bayi onayını kaldırmak istiyor musunuz?")) return;

        try {
            await api.put(`/dealers/${id}/status`, { is_approved: status });
            fetchDealers();
        } catch (error) {
            console.error("Durum güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const handleOpenQuotaModal = (dealer) => {
        setSelectedDealer(dealer);
        setNewQuota(dealer.student_quota);
        setIsQuotaModalOpen(true);
    };

    const handleQuotaUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/dealers/${selectedDealer.id}/status`, {
                is_approved: selectedDealer.is_approved,
                student_quota: newQuota
            });
            setIsQuotaModalOpen(false);
            fetchDealers();
            alert("Kota güncellendi.");
        } catch (error) {
            console.error("Kota güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    // CREATE / EDIT DEALER MODAL
    const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
    const [editingDealerId, setEditingDealerId] = useState(null);
    const [dealerFormData, setDealerFormData] = useState({
        name: "",
        email: "",
        password: "",
        company_name: "",
        phone: "",
        tax_number: "",
        tax_office: "",
        city: "",
    });
    const [dealerPhoto, setDealerPhoto] = useState(null);
    const [dealerLogo, setDealerLogo] = useState(null);

    const handleOpenCreateModal = () => {
        setEditingDealerId(null);
        setDealerFormData({
            name: "", email: "", password: "", company_name: "", phone: "", tax_number: "", tax_office: "", city: ""
        });
        setDealerPhoto(null);
        setDealerLogo(null);
        setIsDealerModalOpen(true);
    };

    const handleOpenEditModal = (dealer) => {
        setEditingDealerId(dealer.id);
        setDealerFormData({
            name: dealer.name || "",
            email: dealer.email || "",
            password: "",
            company_name: dealer.company_name || "",
            phone: dealer.phone || "",
            tax_number: dealer.tax_number || "",
            tax_office: dealer.tax_office || "",
            city: dealer.city || "",
        });
        setDealerPhoto(null);
        setDealerLogo(null);
        setIsDealerModalOpen(true);
    };

    const handleSaveDealer = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(dealerFormData).forEach(key => {
            if (dealerFormData[key]) data.append(key, dealerFormData[key]);
        });
        if (dealerPhoto) data.append("photo", dealerPhoto);
        if (dealerLogo) data.append("logo", dealerLogo);

        try {
            if (editingDealerId) {
                data.append("_method", "PUT");
                await api.post(`/dealers/${editingDealerId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post("/dealers", data, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setIsDealerModalOpen(false);
            fetchDealers();
            alert(`Bayi başarıyla ${editingDealerId ? 'güncellendi' : 'oluşturuldu'}.`);
        } catch (error) {
            console.error("Bayi kayıt hatası", error);
            alert("Hata: " + (error.response?.data?.message || "İşlem başarısız."));
        }
    };

    // REQUEST ACTIONS
    const handleApproveRequest = async (id) => {
        if (!confirm("Talebi onaylamak istediğinize emin misiniz? Bilgiler güncellenecektir.")) return;
        try {
            await api.post(`/dealers/update-requests/${id}/approve`);
            fetchUpdateRequests();
            fetchDealers();
        } catch (error) {
            alert("İşlem başarısız.");
        }
    };

    const handleRejectRequest = async (id) => {
        if (!confirm("Talebi reddetmek istediğinize emin misiniz?")) return;
        try {
            await api.post(`/dealers/update-requests/${id}/reject`);
            fetchUpdateRequests();
        } catch (error) {
            alert("İşlem başarısız.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Bayi Yönetimi</h2>
                <Button onClick={handleOpenCreateModal} className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus size={16} /> Bayi Ekle
                </Button>
            </div>

            <Tabs defaultValue="dealers" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="dealers">Bayi Listesi</TabsTrigger>
                    <TabsTrigger value="requests">Güncelleme Talepleri
                        {updateRequests.filter(r => r.status === 'pending').length > 0 && (
                            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-[10px]">{updateRequests.filter(r => r.status === 'pending').length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dealers">
                    <div className="rounded-md border bg-white dark:bg-slate-900 shadow-soft">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Firma Adı & Logo</TableHead>
                                    <TableHead>Yetkili</TableHead>
                                    <TableHead>İletişim & Konum</TableHead>
                                    <TableHead>Öğrenci Kotası</TableHead>
                                    <TableHead>Bakiye</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">Yükleniyor...</TableCell>
                                    </TableRow>
                                ) : dealers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Kayıtlı bayi bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dealers.map((dealer) => (
                                        <TableRow key={dealer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {dealer.logo_path ? (
                                                        <img src={`${(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace('/api', '')}/storage/${dealer.logo_path}`} className="w-10 h-10 rounded-md object-contain border bg-white" alt="Logo" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center border text-slate-400">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-sm">{dealer.company_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{dealer.name}</span>
                                                    <span className="text-xs text-muted-foreground">{dealer.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{dealer.phone}</span>
                                                    <span className="text-xs text-muted-foreground">{dealer.city || 'Şehir Yok'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{dealer.student_quota} Öğrenci</Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-700">{dealer.balance} TL</TableCell>
                                            <TableCell>
                                                {dealer.is_approved ? (
                                                    <Badge className="bg-green-600">Onaylı</Badge>
                                                ) : (
                                                    <Badge variant="warning" className="bg-amber-500 text-white">Beklemede</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleOpenTemplateModal(dealer.id)}>
                                                    Şablonlar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenQuotaModal(dealer)}>
                                                    <Edit size={14} className="mr-1" /> Kota
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(dealer)} className="text-blue-600 hover:text-blue-700">
                                                    <Edit size={14} />
                                                </Button>
                                                {!dealer.is_approved ? (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(dealer.id, true)}>
                                                        <Check size={14} className="mr-1" /> Onayla
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(dealer.id, false)}>
                                                        <X size={14} className="mr-1" /> Reddet
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="requests">
                    <div className="rounded-md border bg-white dark:bg-slate-900 shadow-soft">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Bayi</TableHead>
                                    <TableHead>Talep Edilen Değişiklikler</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingRequests ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8">Yükleniyor...</TableCell></TableRow>
                                ) : updateRequests.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Güncelleme talebi bulunmuyor.</TableCell></TableRow>
                                ) : (
                                    updateRequests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="text-sm">{new Date(req.created_at).toLocaleDateString('tr-TR')} {new Date(req.created_at).toLocaleTimeString('tr-TR')}</TableCell>
                                            <TableCell className="font-medium text-sm">{req.user?.company_name}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                                    {Object.entries(req.requested_data || {}).map(([key, value]) => {
                                                        const keyLabels = { company_name: "Firma Adı", tax_number: "Vergi No", tax_office: "Vergi Dairesi", city: "Şehir" };
                                                        return <div key={key}><span className="font-semibold text-slate-500">{keyLabels[key] || key}:</span> {value || '-'}</div>;
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Bekliyor</Badge>}
                                                {req.status === 'approved' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Onaylandı</Badge>}
                                                {req.status === 'rejected' && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Reddedildi</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 border-emerald-200" onClick={() => handleApproveRequest(req.id)}>
                                                            <CheckCircle size={14} className="mr-1" /> Onayla
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => handleRejectRequest(req.id)}>
                                                            <XCircle size={14} className="mr-1" /> Reddet
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Template Assignment Modal */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                {/* Internal UI remains the same */}
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Şablon Atamaları</DialogTitle>
                        <DialogDescription>
                            Bayinin kullanabileceği sertifika şablonlarını yönetin.
                        </DialogDescription>
                    </DialogHeader>
                    {/* ... rest of the template body ... */}
                    <div className="space-y-6">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Şablon Ekle</Label>
                                <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Şablon Seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAssignTemplate}>Ekle</Button>
                        </div>

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Atanan Şablonlar</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignedTemplates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">Atanmış şablon yok.</TableCell>
                                        </TableRow>
                                    ) : (
                                        assignedTemplates.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{t.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRevokeTemplate(t.id)}>
                                                        Kaldır
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quota Modal */}
            <Dialog open={isQuotaModalOpen} onOpenChange={setIsQuotaModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Öğrenci Kotası Düzenle</DialogTitle>
                        <DialogDescription>
                            {selectedDealer?.company_name} için yeni kota limiti belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleQuotaUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kota Miktarı</Label>
                            <Input
                                type="number"
                                min="0"
                                value={newQuota}
                                onChange={e => setNewQuota(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Güncelle</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dealer Create/Edit Modal */}
            <Dialog open={isDealerModalOpen} onOpenChange={setIsDealerModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingDealerId ? 'Bayi Bilgilerini Düzenle' : 'Yeni Bayi Ekle'}</DialogTitle>
                        <DialogDescription>
                            Bayinin kurumsal bilgilerini, yetkilisini ve medya dosyalarını ayarlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveDealer} className="space-y-6 py-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Hesap & Yetkili</h3>
                                <div className="space-y-2">
                                    <Label>Yetkili Adı *</Label>
                                    <Input value={dealerFormData.name} onChange={e => setDealerFormData({ ...dealerFormData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-posta (Giriş) *</Label>
                                    <Input type="email" value={dealerFormData.email} onChange={e => setDealerFormData({ ...dealerFormData, email: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Şifre {editingDealerId ? '(Değiştirmek için doldurun)' : '*'}</Label>
                                    <Input type="password" value={dealerFormData.password} onChange={e => setDealerFormData({ ...dealerFormData, password: e.target.value })} required={!editingDealerId} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefon</Label>
                                    <Input value={dealerFormData.phone} onChange={e => setDealerFormData({ ...dealerFormData, phone: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Kurumsal & Medya</h3>
                                <div className="space-y-2">
                                    <Label>Firma Adı *</Label>
                                    <Input value={dealerFormData.company_name} onChange={e => setDealerFormData({ ...dealerFormData, company_name: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Vergi Dairesi</Label>
                                        <Input value={dealerFormData.tax_office} onChange={e => setDealerFormData({ ...dealerFormData, tax_office: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Vergi No</Label>
                                        <Input value={dealerFormData.tax_number} onChange={e => setDealerFormData({ ...dealerFormData, tax_number: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Şehir</Label>
                                    <Input value={dealerFormData.city} onChange={e => setDealerFormData({ ...dealerFormData, city: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Yetkili Fotoğrafı</Label>
                                        <Input type="file" accept="image/*" onChange={e => setDealerPhoto(e.target.files[0])} className="text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Firma Logosu</Label>
                                        <Input type="file" accept="image/*" onChange={e => setDealerLogo(e.target.files[0])} className="text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button variant="outline" type="button" onClick={() => setIsDealerModalOpen(false)}>İptal</Button>
                            <Button type="submit">{editingDealerId ? 'Değişiklikleri Kaydet' : 'Bayi Oluştur'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
