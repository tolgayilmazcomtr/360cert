import { useState, useEffect } from "react";
import api from "../api/axios";
import { getStorageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, User, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ last_page: 1, total: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        tc_number: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        city: "",
        photo: null
    });

    useEffect(() => {
        fetchStudents(1);
    }, []);

    // Arama değişince ilk sayfaya dön
    useEffect(() => {
        const timer = setTimeout(() => fetchStudents(1), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page };
            if (searchTerm) params.search = searchTerm;
            const response = await api.get("/students", { params });
            setStudents(response.data.data);
            setPagination({ last_page: response.data.last_page, total: response.data.total });
            setCurrentPage(page);
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
            city: "",
            photo: null
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
                city: student.city || "",
                photo: null
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("tc_number", formData.tc_number);
            formDataToSend.append("first_name", formData.first_name);
            formDataToSend.append("last_name", formData.last_name);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("phone", formData.phone);
            formDataToSend.append("city", formData.city);

            if (formData.photo) {
                formDataToSend.append("photo", formData.photo);
            }

            if (editingStudent) {
                formDataToSend.append("_method", "PUT");
                await api.post(`/students/${editingStudent.id}`, formDataToSend, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else {
                await api.post("/students", formDataToSend, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }
            setIsModalOpen(false);
            fetchStudents(currentPage);
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
                fetchStudents(currentPage);
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
            fetchStudents(1);
        } catch (error) {
            console.error("Import hatası", error);
            alert("Yükleme başarısız.");
        }
    };


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
                {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 text-xs px-2">✕</button>
                )}
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
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Öğrenci bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.tc_number}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {student.photo_path ? (
                                                <img
                                                    src={getStorageUrl(student.photo_path)}
                                                    alt="Photo"
                                                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={14} />
                                                </div>
                                            )}
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

            {/* Sayfalama */}
            {pagination.last_page > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Toplam {pagination.total} öğrenci</span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline" size="icon" className="h-8 w-8"
                            disabled={currentPage === 1}
                            onClick={() => fetchStudents(currentPage - 1)}
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - currentPage) <= 2)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === "…" ? (
                                    <span key={`ellipsis-${i}`} className="px-1">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === currentPage ? "default" : "outline"}
                                        size="icon" className="h-8 w-8"
                                        onClick={() => fetchStudents(p)}
                                    >
                                        {p}
                                    </Button>
                                )
                            )}
                        <Button
                            variant="outline" size="icon" className="h-8 w-8"
                            disabled={currentPage === pagination.last_page}
                            onClick={() => fetchStudents(currentPage + 1)}
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}

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
                        <div className="space-y-2 pt-2">
                            <Label className="text-base font-semibold">Öğrenci Resmi</Label>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-1 pl-3 h-11 flex items-center bg-white dark:bg-slate-950">
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    id="student-photo-upload"
                                    onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                />
                                <Label htmlFor="student-photo-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded text-sm font-medium mr-3">
                                    Dosya Seç
                                </Label>
                                <span className="text-slate-500 text-sm truncate">
                                    {formData.photo ? formData.photo.name : (editingStudent?.photo_path ? "Mevcut resim yüklü (Değiştirmek için seçin)" : "Dosya seçilmedi")}
                                </span>
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
