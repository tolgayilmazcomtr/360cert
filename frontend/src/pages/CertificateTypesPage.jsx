import { useState, useEffect } from "react";
import api from "../api/axios";
import { languageService } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function CertificateTypesPage() {
    const [types, setTypes] = useState([]);
    const [activeLanguages, setActiveLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [nameObj, setNameObj] = useState({}); // Keeps name data per language code

    useEffect(() => {
        fetchTypes();
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const data = await languageService.getAll();
            const active = data.filter(l => l.is_active);
            setActiveLanguages(active);

            // Initialize name object with empty strings for active languages
            const initialNameObj = {};
            active.forEach(lang => {
                initialNameObj[lang.code] = '';
            });
            setNameObj(initialNameObj);
        } catch (error) {
            console.error("Diller yüklenemedi", error);
        }
    };

    const fetchTypes = async () => {
        try {
            const response = await api.get("/certificate-types");
            setTypes(response.data);
        } catch (error) {
            console.error("Sertifika türleri yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check if TR name is provided as it's required by backend validation
            if (!nameObj['tr']) {
                alert("Türkçe sertifika türü adı zorunludur.");
                return;
            }

            const payload = { name: nameObj, is_active: true };

            if (editingId) {
                await api.put(`/certificate-types/${editingId}`, payload);
            } else {
                await api.post("/certificate-types", payload);
            }

            setIsModalOpen(false);
            setEditingId(null);

            // Reset NameObj
            const resetNameObj = {};
            activeLanguages.forEach(lang => { resetNameObj[lang.code] = ''; });
            setNameObj(resetNameObj);

            fetchTypes();
        } catch (error) {
            console.error("Kayıt hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const handleEdit = (type) => {
        setEditingId(type.id);

        // Map existing name JSON to the current active languages
        const newNameObj = {};
        activeLanguages.forEach(lang => {
            if (typeof type.name === 'object' && type.name !== null) {
                newNameObj[lang.code] = type.name[lang.code] || "";
            } else if (lang.code === 'tr') { // Fallback for old records
                newNameObj[lang.code] = type.name || "";
            } else {
                newNameObj[lang.code] = "";
            }
        });
        setNameObj(newNameObj);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu sertifika türünü silmek istediğinize emin misiniz?")) return;

        try {
            await api.delete(`/certificate-types/${id}`);
            alert("Sertifika türü silindi.");
            fetchTypes();
        } catch (error) {
            console.error("Silme hatası", error);
            const msg = error.response?.data?.message || "İşlem başarısız.";
            alert("Hata: " + msg);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        const resetNameObj = {};
        activeLanguages.forEach(lang => { resetNameObj[lang.code] = ''; });
        setNameObj(resetNameObj);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Sertifika Türleri</h2>
                <Button onClick={openCreateModal} className="gap-2">
                    <Plus size={16} />
                    Yeni Tür Ekle
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tür Adı (TR)</TableHead>
                            <TableHead>Tür Adı (EN)</TableHead>
                            <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : types.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground border-dashed border-2 m-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 block">Herhangi bir sertifika türü bulunamadı.</TableCell>
                            </TableRow>
                        ) : (
                            types.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">
                                        {typeof type.name === 'object' ? type.name.tr : type.name}
                                    </TableCell>
                                    <TableCell>
                                        {typeof type.name === 'object' ? (type.name.en || '-') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Sertifika Türünü Düzenle" : "Yeni Sertifika Türü Ekle"}</DialogTitle>
                                <DialogDescription>
                                    Farklı dillerdeki adaylar için sertifika türü isimlerini aşağıdan girebilirsiniz.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                                {activeLanguages.map(lang => (
                                    <div key={lang.id} className="grid gap-2">
                                        <Label htmlFor={`name_${lang.code}`}>Tür Adı ({lang.name})</Label>
                                        <Input
                                            id={`name_${lang.code}`}
                                            value={nameObj[lang.code] || ''}
                                            onChange={(e) => setNameObj(prev => ({ ...prev, [lang.code]: e.target.value }))}
                                            required={lang.code === 'tr'} // TR is required
                                        />
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                                <Button type="submit">Kaydet</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
