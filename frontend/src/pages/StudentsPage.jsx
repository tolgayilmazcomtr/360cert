import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, User, FileText } from "lucide-react";

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        tc_number: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        city: ""
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get("/students");
            setStudents(response.data.data);
        } catch (error) {
            console.error("Öğrenciler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            tc_number: "",
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            city: ""
        });
        setEditingStudent(null);
    };

    const handleOpenModal = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                tc_number: student.tc_number,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email || "",
                phone: student.phone || "",
                city: student.city || ""
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                await api.put(`/students/${editingStudent.id}`, formData);
            } else {
                await api.post("/students", formData);
            }
            setIsModalOpen(false);
            fetchStudents();
            resetForm();
        } catch (error) {
            console.error("Kayıt hatası", error);
            alert("İşlem başarısız: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu öğrenciyi silmek istiyor musunuz?")) {
            try {
                await api.delete(`/students/${id}`);
                fetchStudents();
            } catch (error) {
                console.error("Silme hatası", error);
            }
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/students/import", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert(response.data.message);
            fetchStudents();
        } catch (error) {
            console.error("Import hatası", error);
            alert("Yükleme başarısız.");
        }
    };

    const filteredStudents = students.filter(s =>
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tc_number.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <h2 className="text-3xl font-bold tracking-tight">Öğrenci Yönetimi</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImport}
                        />
                        <Button variant="outline" className="w-full gap-2">
                            <FileText size={16} />
                            Excel/CSV Yükle
                        </Button>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="gap-2">
                        <Plus size={16} />
                        Yeni Öğrenci Ekle
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-md border">
                <Search className="text-slate-400" size={20} />
                <Input
                    placeholder="İsim, Soyisim veya TC No ile ara..."
                    className="border-0 focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>TC Kimlik</TableHead>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Şehir</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Öğrenci bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.tc_number}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            {student.first_name} {student.last_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{student.email}</span>
                                            <span className="text-xs text-muted-foreground">{student.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.city || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(student)}>
                                            <Pencil size={16} className="text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}</DialogTitle>
                        <DialogDescription>
                            Öğrenci bilgilerini eksiksiz giriniz.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Ad</Label>
                                <Input id="first_name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Soyad</Label>
                                <Input id="last_name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tc_number">TC Kimlik No</Label>
                            <Input id="tc_number" maxLength={11} value={formData.tc_number} onChange={e => setFormData({ ...formData, tc_number: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Şehir</Label>
                                <Input id="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
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
