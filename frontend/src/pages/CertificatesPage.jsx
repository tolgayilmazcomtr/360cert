import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Download, Eye, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function CertificatesPage() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Data for Selects
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [templates, setTemplates] = useState([]);

    // Form
    const [formData, setFormData] = useState({
        student_id: "",
        training_program_id: "",
        certificate_template_id: "",
        issue_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCertificates();
        fetchFormData();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await api.get("/certificates");
            setCertificates(response.data.data);
        } catch (error) {
            console.error("Sertifikalar yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [studentsRes, programsRes, templatesRes] = await Promise.all([
                api.get("/students"),
                api.get("/training-programs"),
                api.get("/certificate-templates")
            ]);
            setStudents(studentsRes.data.data); // Pagination wraps data
            setPrograms(programsRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error("Form verileri yüklenemedi", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/certificates", formData);
            setIsModalOpen(false);
            setFormData({
                student_id: "",
                training_program_id: "",
                certificate_template_id: "",
                issue_date: new Date().toISOString().split('T')[0]
            });
            fetchCertificates();
            alert("Sertifika başarıyla oluşturuldu.");
        } catch (error) {
            console.error("Sertifika hatası", error);
            alert("Hata: " + (error.response?.data?.message || "İşlem başarısız."));
        }
    };

    const [downloadingId, setDownloadingId] = useState(null);

    const handleUpdateStatus = async (id, status) => {
        if (!confirm(`Sertifikayı ${status === 'approved' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`)) return;

        try {
            await api.put(`/certificates/${id}/status`, {
                status,
                rejection_reason: status === 'rejected' ? 'Yönetici tarafından reddedildi.' : null
            });
            alert("Sertifika durumu güncellendi.");
            fetchCertificates();
        } catch (error) {
            console.error("Durum güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const handleDownload = async (id, no) => {
        setDownloadingId(id);
        try {
            const response = await api.get(`/certificates/${id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${no}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("İndirme hatası", error);
            const msg = error.response?.data?.message || "İndirme başarısız.";
            if (error.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const result = JSON.parse(reader.result);
                        alert("Hata: " + (result.message || msg));
                    } catch (e) {
                        alert("Hata: " + msg);
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                alert("Hata: " + msg);
            }
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Sertifika Yönetimi</h2>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Sertifika Oluştur
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sertifika No</TableHead>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead>Eğitim Programı</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : certificates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Henüz sertifika oluşturulmamış.
                                </TableCell>
                            </TableRow>
                        ) : (
                            certificates.map((cert) => (
                                <TableRow key={cert.id}>
                                    <TableCell className="font-medium font-mono text-xs">{cert.certificate_no}</TableCell>
                                    <TableCell>{cert.student?.first_name} {cert.student?.last_name}</TableCell>
                                    <TableCell>{cert.training_program?.name}</TableCell>
                                    <TableCell>{new Date(cert.issue_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cert.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            cert.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {cert.status === 'approved' ? 'Onaylandı' :
                                                cert.status === 'rejected' ? 'Reddedildi' : 'Onay Bekliyor'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {user?.role === 'admin' && cert.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-8"
                                                    onClick={() => handleUpdateStatus(cert.id, 'approved')}
                                                >
                                                    Onayla
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8"
                                                    onClick={() => handleUpdateStatus(cert.id, 'rejected')}
                                                >
                                                    Reddet
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 min-w-[80px]"
                                            onClick={() => handleDownload(cert.id, cert.certificate_no)}
                                            disabled={downloadingId === cert.id || cert.status !== 'approved'}
                                            title={cert.status !== 'approved' ? 'Onaylanmamış sertifika indirilemez' : ''}
                                        >
                                            {downloadingId === cert.id ? (
                                                <span className="animate-pulse">İniyor...</span>
                                            ) : (
                                                <>
                                                    <Download size={14} />
                                                    PDF
                                                </>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Sertifika Oluştur</DialogTitle>
                        <DialogDescription>
                            Lütfen sertifika verilecek öğrenci ve programı seçiniz. Bakiyenizden düşüm yapılacaktır.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Öğrenci Seçin</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, student_id: val })} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Öğrenci Ara..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.first_name} {s.last_name} ({s.tc_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Eğitim Programı</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, training_program_id: val })} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Program Seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name} - {formatCurrency(p.default_price)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sertifika Şablonu</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, certificate_template_id: val })} required>
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

                        <div className="space-y-2">
                            <Label>Düzenlenme Tarihi</Label>
                            <Input
                                type="date"
                                value={formData.issue_date}
                                onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Oluştur ve Onayla</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
