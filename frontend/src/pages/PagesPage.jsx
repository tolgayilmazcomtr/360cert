import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Plus, Edit, Trash2, Globe, Layout, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

export default function PagesPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        meta_title: "",
        meta_description: "",
        is_published: true,
        is_external: false,
        external_url: "",
        show_in_header: false,
        show_in_footer: false,
        order: 0,
    });

    const fetchPages = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/pages');
            setPages(res.data);
        } catch (error) {
            toast({
                title: "Hata",
                description: "Sayfalar yüklenemedi.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleOpenModal = (page = null) => {
        if (page) {
            setEditingPage(page);
            setFormData({
                title: page.title || "",
                slug: page.slug || "",
                content: page.content || "",
                meta_title: page.meta_title || "",
                meta_description: page.meta_description || "",
                is_published: page.is_published,
                is_external: page.is_external,
                external_url: page.external_url || "",
                show_in_header: page.show_in_header,
                show_in_footer: page.show_in_footer,
                order: page.order || 0,
            });
        } else {
            setEditingPage(null);
            setFormData({
                title: "",
                slug: "",
                content: "",
                meta_title: "",
                meta_description: "",
                is_published: true,
                is_external: false,
                external_url: "",
                show_in_header: false,
                show_in_footer: false,
                order: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSwitchChange = (name, checked) => {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleContentChange = (content) => {
        setFormData((prev) => ({
            ...prev,
            content,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPage) {
                await api.put(`/pages/${editingPage.id}`, formData);
                toast({ title: "Başarılı", description: "Sayfa güncellendi." });
            } else {
                await api.post('/pages', formData);
                toast({ title: "Başarılı", description: "Sayfa oluşturuldu." });
            }
            setIsModalOpen(false);
            fetchPages();
        } catch (error) {
            toast({
                title: "Hata",
                description: error.response?.data?.message || "Sayfa kaydedilirken detayları kontrol edin.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu sayfayı silmek istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/pages/${id}`);
            toast({ title: "Başarılı", description: "Sayfa silindi." });
            fetchPages();
        } catch (error) {
            toast({
                title: "Hata",
                description: "Sayfa silinirken hata oluştu.",
                variant: "destructive",
            });
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
        ],
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Globe className="h-6 w-6 text-primary" />
                        Sayfa Yönetimi
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Sitenizin dinamik sayfalarını ve menü yapısını yönetin.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Yeni Sayfa
                </Button>
            </div>

            {/* Pages List */}
            <div className="bg-white rounded-xl shadow-sm border border-border mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Başlık</th>
                                <th className="px-6 py-4 font-medium">Slug / URL</th>
                                <th className="px-6 py-4 font-medium">Menü Gösterimi</th>
                                <th className="px-6 py-4 font-medium text-center">Durum</th>
                                <th className="px-6 py-4 font-medium text-center">Sıra</th>
                                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map((page) => (
                                <tr key={page.id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">{page.title}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{page.is_external ? page.external_url : `/${page.slug}`}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {page.show_in_header && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Üst Menü</span>}
                                            {page.show_in_footer && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Alt Menü</span>}
                                            {!page.show_in_header && !page.show_in_footer && <span className="text-muted-foreground text-xs">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium",
                                            page.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                        )}>
                                            {page.is_published ? "Yayında" : "Taslak"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">{page.order}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(page)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pages.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">Kayıtlı sayfa bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPage ? "Sayfayı Düzenle" : "Yeni Sayfa Ekle"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Sayfa Başlığı <span className="text-red-500">*</span></Label>
                                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug / URL (Otomatik oluşturulur)</Label>
                                <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} placeholder="ornek-sayfa" />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-4 rounded-lg border border-border bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Switch id="is_published" checked={formData.is_published} onCheckedChange={(c) => handleSwitchChange('is_published', c)} />
                                <Label htmlFor="is_published">Yayında</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="is_external" checked={formData.is_external} onCheckedChange={(c) => handleSwitchChange('is_external', c)} />
                                <Label htmlFor="is_external">Dış Bağlantı</Label>
                            </div>
                        </div>

                        {formData.is_external ? (
                            <div className="space-y-2">
                                <Label htmlFor="external_url">Dış Bağlantı URLsi <span className="text-red-500">*</span></Label>
                                <Input id="external_url" name="external_url" value={formData.external_url} onChange={handleChange} placeholder="https://..." required={formData.is_external} />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Sayfa İçeriği</Label>
                                <div className="border border-border rounded-md overflow-hidden h-[300px]">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        className="h-[258px]"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="meta_title">SEO Başlığı (Meta Title)</Label>
                                <Input id="meta_title" name="meta_title" value={formData.meta_title} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meta_description">SEO Açıklaması (Meta Desc)</Label>
                                <Input id="meta_description" name="meta_description" value={formData.meta_description} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border border-border space-y-4">
                            <h3 className="font-medium text-sm">Menü ve Sıralama Ayarları</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch id="show_in_header" checked={formData.show_in_header} onCheckedChange={(c) => handleSwitchChange('show_in_header', c)} />
                                    <Label htmlFor="show_in_header">Üst Menüde Göster</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch id="show_in_footer" checked={formData.show_in_footer} onCheckedChange={(c) => handleSwitchChange('show_in_footer', c)} />
                                    <Label htmlFor="show_in_footer">Alt Menüde Göster</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="order" className="text-xs">Sıralama</Label>
                                    <Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} className="h-8" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button type="submit">Kaydet</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
