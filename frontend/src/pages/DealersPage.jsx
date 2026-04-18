import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Image as ImageIcon, CheckCircle, XCircle, DollarSign, Trash2, MoreHorizontal, Star, Layout } from "lucide-react";
import { getStorageUrl } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

    // Pricing modal state
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [pricingDealer, setPricingDealer] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [dealerPrices, setDealerPrices] = useState({});
    const [priceEditValues, setPriceEditValues] = useState({});
    const [priceSaving, setPriceSaving] = useState({});
    const [pricingLoading, setPricingLoading] = useState(false);

    // Bulk pricing state
    const [bulkType, setBulkType] = useState("percent");
    const [bulkDirection, setBulkDirection] = useState("+");
    const [bulkValue, setBulkValue] = useState("");
    const [bulkScope, setBulkScope] = useState("all");
    const [bulkApplying, setBulkApplying] = useState(false);

    const computeNewPrice = (basePrice, type, direction, value) => {
        const v = parseFloat(value);
        if (isNaN(v) || v < 0) return null;
        let result;
        if (type === "percent") {
            result = direction === "+" ? basePrice * (1 + v / 100) : basePrice * (1 - v / 100);
        } else {
            result = direction === "+" ? basePrice + v : basePrice - v;
        }
        return Math.max(0, Math.round(result * 100) / 100);
    };

    const handleBulkApply = async () => {
        const v = parseFloat(bulkValue);
        if (isNaN(v) || v < 0) { alert("Geçerli bir değer girin."); return; }

        const targetPrograms = programs.filter(p => {
            if (bulkScope === "custom_only") return dealerPrices[p.id] !== undefined;
            return true;
        });

        if (targetPrograms.length === 0) { alert("Güncellenecek program bulunamadı."); return; }

        const preview = targetPrograms.map(p => {
            const base = dealerPrices[p.id] !== undefined ? dealerPrices[p.id] : parseFloat(p.default_price);
            return { program: p, newPrice: computeNewPrice(base, bulkType, bulkDirection, v) };
        });

        const label = bulkType === "percent"
            ? `%${v} ${bulkDirection === "+" ? "artış" : "indirim"}`
            : `${v} TL ${bulkDirection === "+" ? "artış" : "indirim"}`;
        const scopeLabel = bulkScope === "all" ? "tüm eğitimler" : "mevcut özel fiyatlı eğitimler";

        if (!window.confirm(`${scopeLabel} için ${label} uygulanacak. Onaylıyor musunuz?`)) return;

        setBulkApplying(true);
        try {
            await Promise.all(preview.map(({ program, newPrice }) =>
                api.post(`/dealers/${pricingDealer.id}/program-prices`, {
                    training_program_id: program.id,
                    price: newPrice,
                })
            ));
            const newPrices = { ...dealerPrices };
            preview.forEach(({ program, newPrice }) => { newPrices[program.id] = newPrice; });
            setDealerPrices(newPrices);
            setBulkValue("");
        } catch (e) {
            alert("Toplu güncelleme sırasında hata oluştu.");
        } finally {
            setBulkApplying(false);
        }
    };

    const bulkPreviewCount = () => {
        const v = parseFloat(bulkValue);
        if (isNaN(v) || v <= 0) return null;
        return programs.filter(p => bulkScope === "all" || dealerPrices[p.id] !== undefined).length;
    };

    const getProgramName = (p) => {
        if (!p) return "";
        return typeof p.name === "object" ? (p.name.tr ?? Object.values(p.name)[0] ?? "") : p.name;
    };

    const handleOpenPricingModal = async (dealer) => {
        setPricingDealer(dealer);
        setPriceEditValues({});
        setIsPricingModalOpen(true);
        setPricingLoading(true);
        try {
            const [progRes, priceRes] = await Promise.all([
                api.get("/training-programs"),
                api.get(`/dealers/${dealer.id}/program-prices`),
            ]);
            setPrograms(progRes.data);
            const map = {};
            priceRes.data.forEach(p => { map[p.training_program_id] = parseFloat(p.price); });
            setDealerPrices(map);
        } catch (e) {
            console.error(e);
        } finally {
            setPricingLoading(false);
        }
    };

    const handleSavePrice = async (programId) => {
        const val = priceEditValues[programId];
        if (val === undefined || val === "") return;
        setPriceSaving(s => ({ ...s, [programId]: true }));
        try {
            await api.post(`/dealers/${pricingDealer.id}/program-prices`, {
                training_program_id: programId,
                price: parseFloat(val),
            });
            setDealerPrices(p => ({ ...p, [programId]: parseFloat(val) }));
            setPriceEditValues(v => { const nv = { ...v }; delete nv[programId]; return nv; });
        } catch (e) {
            alert(e.response?.data?.message || "Kayıt başarısız.");
        } finally {
            setPriceSaving(s => ({ ...s, [programId]: false }));
        }
    };

    const handleDeletePrice = async (programId) => {
        if (!window.confirm("Bu özel fiyatı kaldırmak istiyor musunuz?")) return;
        try {
            await api.delete(`/dealers/${pricingDealer.id}/program-prices/${programId}`);
            setDealerPrices(p => { const np = { ...p }; delete np[programId]; return np; });
        } catch (e) {
            alert(e.response?.data?.message || "Silme başarısız.");
        }
    };

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

    const handleMainDealerToggle = async (dealer) => {
        const newVal = !dealer.is_main_dealer;
        const msg = newVal
            ? `"${dealer.name}" kullanıcısını Ana Bayi yapmak istiyor musunuz?`
            : `"${dealer.name}" kullanıcısının Ana Bayi statüsünü kaldırmak istiyor musunuz?`;
        if (!window.confirm(msg)) return;
        try {
            await api.put(`/dealers/${dealer.id}/main-dealer-status`, { is_main_dealer: newVal });
            fetchDealers();
        } catch (error) {
            console.error("Ana bayi güncelleme hatası", error);
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
                                                        <img src={getStorageUrl(dealer.logo_path)} className="w-10 h-10 rounded-md object-contain border bg-white" alt="Logo" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center border text-slate-400">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-sm">{dealer.company_name}</span>
                                                        {dealer.is_main_dealer && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 w-fit">
                                                                <Star size={9} className="fill-purple-500 text-purple-500" /> Ana Bayi
                                                            </span>
                                                        )}
                                                    </div>
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
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        <DropdownMenuItem onClick={() => handleOpenEditModal(dealer)}>
                                                            <Edit size={14} className="mr-2" /> Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenPricingModal(dealer)}>
                                                            <DollarSign size={14} className="mr-2 text-emerald-600" /> Fiyatlar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenTemplateModal(dealer.id)}>
                                                            <Layout size={14} className="mr-2 text-blue-600" /> Şablonlar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenQuotaModal(dealer)}>
                                                            <Edit size={14} className="mr-2 text-slate-500" /> Kota Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleMainDealerToggle(dealer)}>
                                                            <Star size={14} className={`mr-2 ${dealer.is_main_dealer ? "text-purple-600 fill-purple-600" : "text-slate-400"}`} />
                                                            {dealer.is_main_dealer ? "Ana Bayi Statüsünü Kaldır" : "Ana Bayi Yap"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {!dealer.is_approved ? (
                                                            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={() => handleStatusUpdate(dealer.id, true)}>
                                                                <CheckCircle size={14} className="mr-2" /> Onayla
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleStatusUpdate(dealer.id, false)}>
                                                                <XCircle size={14} className="mr-2" /> Onayı Kaldır
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
            {/* Pricing Modal */}
            <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            <span className="flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-600" />
                                {pricingDealer?.company_name || pricingDealer?.name} — Özel Fiyatlar
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Fiyat girilmemiş eğitimlerde sistem varsayılan fiyatı kullanılır.
                        </DialogDescription>
                    </DialogHeader>

                    {pricingLoading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Yükleniyor...</p>
                    ) : (
                        <>
                        {/* Bulk Update Card */}
                        <div className="rounded-md border bg-slate-50 p-4 space-y-3 mt-2">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Toplu Fiyat Güncelleme</p>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Kapsam</Label>
                                    <div className="flex rounded-md border overflow-hidden text-sm">
                                        <button className={`px-3 py-1.5 ${bulkScope === "all" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} onClick={() => setBulkScope("all")}>Tümü</button>
                                        <button className={`px-3 py-1.5 border-l ${bulkScope === "custom_only" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} onClick={() => setBulkScope("custom_only")}>Özel Fiyatlılar</button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Tür</Label>
                                    <div className="flex rounded-md border overflow-hidden text-sm">
                                        <button className={`px-3 py-1.5 ${bulkType === "percent" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} onClick={() => setBulkType("percent")}>Yüzde (%)</button>
                                        <button className={`px-3 py-1.5 border-l ${bulkType === "amount" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`} onClick={() => setBulkType("amount")}>Tutar (TL)</button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Yön</Label>
                                    <div className="flex rounded-md border overflow-hidden text-sm">
                                        <button className={`px-3 py-1.5 font-bold ${bulkDirection === "+" ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-green-50"}`} onClick={() => setBulkDirection("+")}>+ Artır</button>
                                        <button className={`px-3 py-1.5 font-bold border-l ${bulkDirection === "-" ? "bg-red-600 text-white" : "bg-white text-slate-600 hover:bg-red-50"}`} onClick={() => setBulkDirection("-")}>− İndir</button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Değer {bulkType === "percent" ? "(%)" : "(TL)"}</Label>
                                    <Input type="number" min="0" step="0.01" placeholder={bulkType === "percent" ? "Örn: 10" : "Örn: 50"} value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="h-9 w-28 text-sm" />
                                </div>
                                <Button onClick={handleBulkApply} disabled={!bulkValue || bulkApplying} className={bulkDirection === "+" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                                    {bulkApplying ? "Uygulanıyor..." : bulkPreviewCount() ? `${bulkPreviewCount()} programa uygula` : "Uygula"}
                                </Button>
                            </div>
                            {bulkValue && parseFloat(bulkValue) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {bulkScope === "all" ? "Tüm eğitimler" : "Özel fiyatlı eğitimler"} için{" "}
                                    <span className={`font-semibold ${bulkDirection === "+" ? "text-green-600" : "text-red-600"}`}>
                                        {bulkDirection}{bulkValue}{bulkType === "percent" ? "%" : " TL"}
                                    </span>{" "}
                                    {bulkDirection === "+" ? "eklenecek" : "düşülecek"}.
                                    {bulkScope === "all" && " Özel fiyatı olmayanlarda varsayılan fiyat baz alınır."}
                                </p>
                            )}
                        </div>

                        <div className="overflow-x-auto rounded-md border mt-2">
                            <table className="text-sm w-full">
                                <thead>
                                    <tr className="border-b bg-slate-50">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Eğitim Programı</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Varsayılan</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Özel Fiyat</th>
                                        <th className="px-3 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {programs.map(program => {
                                        const hasCustom = dealerPrices[program.id] !== undefined;
                                        const customPrice = dealerPrices[program.id];
                                        const editing = priceEditValues[program.id] !== undefined;
                                        return (
                                            <tr key={program.id} className="border-b hover:bg-slate-50">
                                                <td className="px-3 py-2 font-medium">{getProgramName(program)}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{program.default_price} TL</td>
                                                <td className="px-3 py-2">
                                                    {hasCustom && !editing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-emerald-600">{customPrice} TL</Badge>
                                                            <button className="text-xs text-emerald-600 underline" onClick={() => setPriceEditValues(v => ({ ...v, [program.id]: String(customPrice) }))}>
                                                                Değiştir
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number" min="0" step="0.01"
                                                                placeholder={hasCustom ? String(customPrice) : "Fiyat girin"}
                                                                value={priceEditValues[program.id] ?? ""}
                                                                onChange={e => setPriceEditValues(v => ({ ...v, [program.id]: e.target.value }))}
                                                                className="h-7 w-28 text-xs"
                                                            />
                                                            <Button size="sm" className="h-7 text-xs" disabled={priceSaving[program.id]} onClick={() => handleSavePrice(program.id)}>
                                                                {priceSaving[program.id] ? "..." : "Kaydet"}
                                                            </Button>
                                                            {editing && (
                                                                <button className="text-xs text-muted-foreground underline" onClick={() => setPriceEditValues(v => { const nv = { ...v }; delete nv[program.id]; return nv; })}>
                                                                    İptal
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    {hasCustom && (
                                                        <button className="text-red-400 hover:text-red-600" onClick={() => handleDeletePrice(program.id)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
