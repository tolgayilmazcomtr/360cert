import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStorageUrl } from "@/lib/utils";

export default function CertificateTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [certificateTypes, setCertificateTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        type: "standard",
        certificate_type_id: "none",
        file: null
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const [templatesRes, typesRes] = await Promise.all([
                api.get("/certificate-templates"),
                api.get("/certificate-types")
            ]);
            setTemplates(templatesRes.data);
            setCertificateTypes(typesRes.data);
        } catch (error) {
            console.error("Şablonlar yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("name", formData.name);
        data.append("type", formData.type);
        if (formData.certificate_type_id && formData.certificate_type_id !== "none") {
            data.append("certificate_type_id", formData.certificate_type_id);
        }
        data.append("background_image", formData.file);

        try {
            await api.post("/certificate-templates", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setIsModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error("Yükleme hatası", error);
            alert("Şablon yüklenemedi.");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Stop clicking on the card
        if (!window.confirm("Şablonu silmek istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/certificate-templates/${id}`);
            fetchTemplates();
            alert("Şablon silindi.");
        } catch (error) {
            console.error("Silme hatası", error);
            alert(error.response?.data?.message || "Silme işlemi başarısız oldu.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Sertifika Şablonları</h2>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Yeni Şablon Yükle
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden group relative">
                        <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                            {template.background_path ? (
                                <img
                                    src={getStorageUrl(template.background_path)}
                                    alt={template.name}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <ImageIcon size={48} />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button variant="secondary" onClick={() => navigate(`/dashboard/templates/${template.id}/design`)}>
                                    <Settings size={16} className="mr-2" />
                                    Tasarla
                                </Button>
                                <Button variant="destructive" size="icon" onClick={(e) => handleDelete(e, template.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                        <CardFooter className="p-4 border-t">
                            <div className="flex flex-col">
                                <span className="font-semibold">{template.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                    {template.type === 'card' ? 'Kimlik Kartı' : 'A4 Sertifika'}
                                </span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) {
                    setFormData({
                        name: "",
                        type: "standard",
                        certificate_type_id: "none",
                        file: null
                    });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Şablon Yükle</DialogTitle>
                        <DialogDescription>
                            Tasarımı yapılacak boş sertifika görselini (JPG/PNG) yükleyiniz.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Şablon Adı</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Şablon Türü</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, type: v })} value={formData.type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tür Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">A4 Sertifika Şablonu</SelectItem>
                                    <SelectItem value="card">Yaka Kimlik Kartı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Sertifika Türü <span className="text-muted-foreground text-xs">(Opsiyonel)</span></Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, certificate_type_id: v })} value={formData.certificate_type_id || "none"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sertifika Türü Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Seçiniz (Opsiyonel)</SelectItem>
                                    {certificateTypes.map(ct => (
                                        <SelectItem key={ct.id} value={ct.id.toString()}>
                                            <span>{typeof ct.name === 'object' ? (ct.name.tr || Object.values(ct.name)[0]) : ct.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Görsel Dosyası</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Yükle</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
