import { useState, useEffect } from "react";
import api from "../api/axios";
import { languageService } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TrainingProgramsPage() {
    const [programs, setPrograms] = useState([]);
    const [activeLanguages, setActiveLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const { toast } = useToast();

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        description: "",
        duration_hours: "",
        default_price: ""
    });
    const [nameObj, setNameObj] = useState({}); // Keeps name data per language code

    useEffect(() => {
        fetchPrograms();
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchLanguages();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (currentPage !== 1) setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

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

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const params = {
                paginate: 1,
                page: currentPage
            };
            if (debouncedSearch) {
                params.search = debouncedSearch;
            }

            const response = await api.get("/training-programs", { params });
            // Handle Laravel object paginator wrapper
            if (response.data && response.data.data) {
                setPrograms(response.data.data);
                setTotalPages(response.data.last_page || 1);
            } else {
                setPrograms(response.data);
            }
        } catch (error) {
            console.error("Eğitimler yüklenemedi", error);
            toast({ title: "Hata", description: "Eğitimler yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, name: nameObj };

            if (editingId) {
                await api.put(`/training-programs/${editingId}`, payload);
            } else {
                await api.post("/training-programs", payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ description: "", duration_hours: "", default_price: "" });

            // Reset NameObj
            const resetNameObj = {};
            activeLanguages.forEach(lang => { resetNameObj[lang.code] = ''; });
            setNameObj(resetNameObj);

            fetchPrograms();
        } catch (error) {
            console.error("Kayıt hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const handleEdit = (program) => {
        setEditingId(program.id);
        setFormData({
            description: program.description || "",
            duration_hours: program.duration_hours || "",
            default_price: program.default_price || ""
        });

        // Map existing name JSON to the current active languages
        const newNameObj = {};
        activeLanguages.forEach(lang => {
            if (typeof program.name === 'object' && program.name !== null) {
                newNameObj[lang.code] = program.name[lang.code] || "";
            } else if (lang.code === 'tr') { // Fallback for old records
                newNameObj[lang.code] = program.name || "";
            } else {
                newNameObj[lang.code] = "";
            }
        });
        setNameObj(newNameObj);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu eğitim programını silmek istediğinize emin misiniz?")) return;

        try {
            await api.delete(`/training-programs/${id}`);
            alert("Eğitim programı silindi.");
            fetchPrograms();
        } catch (error) {
            console.error("Silme hatası", error);
            const msg = error.response?.data?.message || "İşlem başarısız.";
            alert("Hata: " + msg);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ description: "", duration_hours: "", default_price: "" });
        const resetNameObj = {};
        activeLanguages.forEach(lang => { resetNameObj[lang.code] = ''; });
        setNameObj(resetNameObj);
        setIsModalOpen(true);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/training-programs/import/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'egitim_sablonu.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Şablon indirme hatası:", error);
            toast({ title: "Hata", description: "Şablon indirilemedi.", variant: "destructive" });
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            toast({ title: "Uyarı", description: "Lütfen bir Excel dosyası seçin.", variant: "destructive" });
            return;
        }

        setImporting(true);
        const formData = new FormData();
        formData.append("file", importFile);

        try {
            const res = await api.post('/training-programs/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Başarılı", description: res.data.message || "Eğitimler başarıyla içeri aktarıldı." });
            setIsImportModalOpen(false);
            setImportFile(null);
            fetchPrograms();
        } catch (error) {
            console.error("Import hatası:", error);
            const msg = error.response?.data?.message || "İçe aktarma sırasında bir hata oluştu.";
            toast({ title: "Hata", description: msg, variant: "destructive" });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Eğitim Programları</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
                        <Upload size={16} />
                        Excel İle İçeri Aktar
                    </Button>
                    <Button onClick={openCreateModal} className="gap-2">
                        <Plus size={16} />
                        Yeni Program Ekle
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 max-w-sm">
                    <Input
                        placeholder="Eğitim programı ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program Adı</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Süre (Saat)</TableHead>
                            <TableHead>Varsayılan Ücret</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : programs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Henüz program eklenmemiş.
                                </TableCell>
                            </TableRow>
                        ) : (
                            programs.map((program) => (
                                <TableRow key={program.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="text-slate-400" size={16} />
                                            {typeof program.name === 'string'
                                                ? program.name
                                                : (program.name?.tr || Object.values(program.name || {})[0] || '-')}
                                        </div>
                                    </TableCell>
                                    <TableCell>{program.description || '-'}</TableCell>
                                    <TableCell>{program.duration_hours} Saat</TableCell>
                                    <TableCell>{formatCurrency(program.default_price)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleEdit(program)}
                                                title="Düzenle"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(program.id)}
                                                title="Sil"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Sayfa {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Önceki
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                        >
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Eğitim Programını Düzenle" : "Yeni Eğitim Programı"}</DialogTitle>
                        <DialogDescription>
                            Sertifika verilecek eğitim programını tanımlayınız.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <Label>Program Adı</Label>
                            {activeLanguages.length === 0 ? (
                                <p className="text-sm text-red-500">Önce ayarlardan dil aktifleştiriniz!</p>
                            ) : (
                                activeLanguages.map(lang => (
                                    <div key={lang.id} className="flex flex-col space-y-1">
                                        <Label htmlFor={`name-${lang.code}`} className="text-xs text-muted-foreground">
                                            {lang.name}
                                        </Label>
                                        <Input
                                            id={`name-${lang.code}`}
                                            value={nameObj[lang.code] || ''}
                                            onChange={e => setNameObj({ ...nameObj, [lang.code]: e.target.value })}
                                            placeholder={`${lang.name} olarak eğitim adı...`}
                                            required
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Süre (Saat)</Label>
                                <Input id="duration" type="number" value={formData.duration_hours} onChange={e => setFormData({ ...formData, duration_hours: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Ücret (TL)</Label>
                                <Input id="price" type="number" value={formData.default_price} onChange={e => setFormData({ ...formData, default_price: e.target.value })} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button type="submit">Kaydet</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Excel İle Toplu Yükleme</DialogTitle>
                        <DialogDescription>
                            Örnek şablonu indirip doldurduktan sonra sisteme yükleyebilirsiniz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-2 border-dashed border-2 bg-slate-50 hover:bg-slate-100"
                            onClick={handleDownloadTemplate}
                        >
                            <Download size={16} className="text-blue-500" />
                            Örnek Şablonu İndir
                        </Button>

                        <div className="space-y-2 mt-4">
                            <Label htmlFor="excel_file">Doldurulmuş Excel Dosyası (.xlsx)</Label>
                            <Input
                                id="excel_file"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => setImportFile(e.target.files[0])}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>İptal</Button>
                        <Button onClick={handleImportSubmit} disabled={importing || !importFile}>
                            {importing ? "Yükleniyor..." : "Yükle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
