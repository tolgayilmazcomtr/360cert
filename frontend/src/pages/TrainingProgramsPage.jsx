import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function TrainingProgramsPage() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        duration_hours: "",
        default_price: ""
    });

    useEffect(() => {
        fetchPrograms();
    }, []);

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
            await api.post("/training-programs", formData);
            setIsModalOpen(false);
            setFormData({ name: "", description: "", duration_hours: "", default_price: "" }); // Reset
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
                                            {program.name}
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
                        <div className="space-y-2">
                            <Label htmlFor="name">Program Adı</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
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
