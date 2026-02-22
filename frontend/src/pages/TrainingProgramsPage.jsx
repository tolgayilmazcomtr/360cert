import { useState, useEffect } from "react";
import api from "../api/axios";
import { languageService } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function TrainingProgramsPage() {
    const [programs, setPrograms] = useState([]);
    const [activeLanguages, setActiveLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        description: "",
        duration_hours: "",
        default_price: ""
    });
    const [nameObj, setNameObj] = useState({}); // Keeps name data per language code

    useEffect(() => {
        fetchPrograms();
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

    const fetchPrograms = async () => {
        try {
            const response = await api.get("/training-programs");
            setPrograms(response.data);
        } catch (error) {
            console.error("Eğitimler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, name: nameObj };
            await api.post("/training-programs", payload);
            setIsModalOpen(false);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Eğitim Programları</h2>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Yeni Program Ekle
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program Adı</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Süre (Saat)</TableHead>
                            <TableHead>Varsayılan Ücret</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : programs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Eğitim Programı</DialogTitle>
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
                            <Button type="submit">Kaydet</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
