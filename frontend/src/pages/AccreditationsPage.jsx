import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Plus, Trash2, Edit2, Loader2, Save, X, Image as ImageIcon } from "lucide-react";

export default function AccreditationsPage() {
    const [accreditations, setAccreditations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        website: "",
        is_active: true,
        logo: null
    });
    const [previewLogo, setPreviewLogo] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAccreditations();
    }, []);

    const fetchAccreditations = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/accreditations");
            setAccreditations(res.data);
        } catch (error) {
            console.error("Akreditasyonlar yüklenemedi", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (accreditation = null) => {
        if (accreditation) {
            setEditingId(accreditation.id);
            setFormData({
                name: accreditation.name,
                website: accreditation.website || "",
                is_active: accreditation.is_active,
                logo: null
            });
            setPreviewLogo(accreditation.logo_path ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') + accreditation.logo_path : null);
        } else {
            setEditingId(null);
            setFormData({ name: "", website: "", is_active: true, logo: null });
            setPreviewLogo(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, logo: file });
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert("Lütfen adını girin.");
            return;
        }

        setIsSaving(true);
        const data = new FormData();
        data.append('name', formData.name);
        if (formData.website) data.append('website', formData.website);
        data.append('is_active', formData.is_active ? 1 : 0);

        if (formData.logo) {
            data.append('logo', formData.logo);
        }

        // For Laravel PUT method mapping with FormData
        if (editingId) {
            data.append('_method', 'PUT');
        }

        try {
            if (editingId) {
                await api.post(`/accreditations/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post("/accreditations", data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchAccreditations();
            handleCloseModal();
        } catch (error) {
            console.error("Kaydetme hatası", error);
            alert("Kaydedilirken hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu akreditasyonu silmek istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/accreditations/${id}`);
            fetchAccreditations();
        } catch (error) {
            console.error("Silme hatası", error);
        }
    };

    const toggleStatus = async (accreditation) => {
        try {
            const data = new FormData();
            data.append('_method', 'PUT');
            data.append('name', accreditation.name);
            data.append('is_active', accreditation.is_active ? 0 : 1);
            if (accreditation.website) data.append('website', accreditation.website);

            await api.post(`/accreditations/${accreditation.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchAccreditations();
        } catch (error) {
            console.error("Durum güncellenemedi", error);
        }
    };

    const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') : 'http://127.0.0.1:8000';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Akreditasyon Kurumları</h1>
                    <p className="text-muted-foreground mt-1">Ana sayfada görünecek akreditasyon kurumu logolarını yönetin.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus size={16} /> Yeni Ekle
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Logo</th>
                                <th className="px-6 py-4 font-medium">Kurum Adı</th>
                                <th className="px-6 py-4 font-medium">Web Sitesi</th>
                                <th className="px-6 py-4 font-medium">Durum</th>
                                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : false /* Fix scope later */ || accreditations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Hiç akreditasyon bulunamadı.</td>
                                </tr>
                            ) : (
                                accreditations.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {a.logo_path ? (
                                                <div className="w-16 h-16 rounded overflow-hidden bg-white border flex items-center justify-center p-1">
                                                    <img src={`${apiBase}${a.logo_path}`} alt={a.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded bg-slate-100 border flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{a.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {a.website ? (
                                                <a href={a.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ziyaret Et</a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(a)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {a.is_active ? "Aktif" : "Pasif"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleOpenModal(a)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => handleDelete(a.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <CardTitle>{editingId ? "Akreditasyon Düzenle" : "Yeni Akreditasyon Ekle"}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                                <X size={20} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kurum Adı *</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: ISO 9001"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Web Sitesi (Opsiyonel)</label>
                                <Input
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kurum Logosu (Görsel)</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative">
                                        {previewLogo ? (
                                            <img src={previewLogo} alt="Preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <ImageIcon className="text-muted-foreground w-8 h-8" />
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="flex-1 text-sm text-muted-foreground">
                                        Logoyu değiştirmek için alana tıklayın. Çoğunlukla şeffaf PNG önerilir.
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ms-3 text-sm font-medium text-slate-700">Aktif Olarak Göster</span>
                                </label>
                            </div>

                            <div className="flex justify-end pt-4 border-t gap-3">
                                <Button variant="outline" onClick={handleCloseModal}>İptal</Button>
                                <Button onClick={handleSave} disabled={isSaving || !formData.name} className="min-w-[120px]">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Kaydet
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
