import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Download, Eye, FileText, Search, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Assuming this exists or using custom
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CertificatesPage() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20
    });

    // Filters
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        dealer_id: "all",
        startDate: "",
        endDate: "",
        sort_by: "created_at",
        sort_order: "desc"
    });

    // Stats
    const [stats, setStats] = useState(null);

    // Modal & Download
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);

    // Form Data (Select Options)
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [dealers, setDealers] = useState([]); // For Admin filter

    // New Certificate Form
    const [formData, setFormData] = useState({
        student_id: "",
        training_program_id: "",
        certificate_template_id: "",
        issue_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCertificates();
        fetchStats();
        fetchFormData();
        if (user?.role === 'admin') {
            fetchDealers();
        }
    }, [pagination.current_page, filters]); // Re-fetch on pagination or filter change (add debounce for search if needed)

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search) fetchCertificates();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setStats(res.data.metrics);
        } catch (error) {
            console.error("İstatistikler yüklenemedi", error);
        }
    };

    const fetchDealers = async () => {
        try {
            const res = await api.get('/dealers'); // Provided endpoint exists? Check DealerController
            // Need a list endpoint without pagination or handle pagination
            // Assuming we might need to adjust DealerController to return list or use paginated list.
            // For now, let's assume we fetch first page or all. 
            // Better: use existing /dealers endpoint which paginates.
            // Admin only needs a list for Dropdown. Let's try to get all or search.
            const res2 = await api.get('/dealers?per_page=100');
            setDealers(res2.data.data);
        } catch (error) {
            console.error("Bayiler yüklenemedi", error);
        }
    }

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                ...filters
            };
            // Clean empty filters
            if (params.status === 'all') delete params.status;
            if (params.dealer_id === 'all') delete params.dealer_id;

            const response = await api.get("/certificates", { params });
            setCertificates(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                per_page: response.data.per_page
            });
        } catch (error) {
            console.error("Sertifikalar yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [studentsRes, programsRes, templatesRes] = await Promise.all([
                api.get("/students?per_page=100"), // Get more for select
                api.get("/training-programs"),
                api.get("/certificate-templates")
            ]);
            setStudents(studentsRes.data.data);
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
            fetchStats(); // Update stats
            alert("Sertifika başarıyla oluşturuldu.");
        } catch (error) {
            console.error("Sertifika hatası", error);
            alert("Hata: " + (error.response?.data?.message || "İşlem başarısız."));
        }
    };

    const handleUpdateStatus = async (id, status) => {
        if (!confirm(`Sertifikayı ${status === 'approved' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`)) return;

        try {
            await api.put(`/certificates/${id}/status`, {
                status,
                rejection_reason: status === 'rejected' ? 'Yönetici tarafından reddedildi.' : null
            });
            alert("Sertifika durumu güncellendi.");
            fetchCertificates();
            fetchStats();
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

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "all",
            dealer_id: "all",
            startDate: "",
            endDate: "",
            sort_by: "created_at",
            sort_order: "desc"
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header & Stats */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sertifikalar</h2>
                    <p className="text-slate-500">Tüm sertifikaları yönetin, filtreleyin ve işlem yapın.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-blue-500/20">
                    <Plus size={16} />
                    Yeni Sertifika
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-none shadow-soft bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Toplam Sertifika</CardTitle>
                            <FileText className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.total_certificates}</div>
                            <p className="text-xs text-slate-500 mt-1">Sistemdeki toplam kayıt</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-soft bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Onay Bekleyen</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{stats.pending_certificates}</div>
                            <p className="text-xs text-slate-500 mt-1">İşlem bekleyen talepler</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-soft bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Onaylanan</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{stats.total_certificates - stats.pending_certificates}</div>
                            <p className="text-xs text-slate-500 mt-1">Tamamlanan belgeler</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Öğrenci Adı, TC veya Sertifika No Ara..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    {/* Dealer Filter (Admin Only) */}
                    {user?.role === 'admin' && (
                        <div className="w-full md:w-48">
                            <Select value={filters.dealer_id} onValueChange={(val) => setFilters({ ...filters, dealer_id: val })}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Bayi Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Bayiler</SelectItem>
                                    {dealers.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="w-full md:w-40">
                        <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                            <SelectTrigger className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="approved">Onaylı</SelectItem>
                                <SelectItem value="pending">Bekliyor</SelectItem>
                                <SelectItem value="rejected">Reddedildi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Start */}
                    <div className="w-full md:w-40 relative">
                        <Input
                            type="date"
                            className="bg-slate-50 border-slate-200"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    {/* Date Range End */}
                    <div className="w-full md:w-40 relative">
                        <Input
                            type="date"
                            className="bg-slate-50 border-slate-200"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>

                    {/* Clear Button */}
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Filtreleri Temizle">
                        <X className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Sertifika No</TableHead>
                            <TableHead className="font-semibold text-slate-700">Öğrenci</TableHead>
                            {user?.role === 'admin' && <TableHead className="font-semibold text-slate-700">Bayi</TableHead>}
                            <TableHead className="font-semibold text-slate-700">Eğitim Programı</TableHead>
                            <TableHead className="font-semibold text-slate-700">Tarih</TableHead>
                            <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        <span>Yükleniyor...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : certificates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    Kayıt bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            certificates.map((cert) => (
                                <TableRow key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium font-mono text-xs text-slate-600">{cert.certificate_no}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{cert.student?.first_name} {cert.student?.last_name}</div>
                                        <div className="text-xs text-slate-500">{cert.student?.tc_number}</div>
                                    </TableCell>
                                    {user?.role === 'admin' && (
                                        <TableCell>
                                            <div className="text-sm font-medium text-slate-700">{cert.student?.user?.name || '-'}</div>
                                            <div className="text-xs text-slate-400">{cert.student?.user?.email}</div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="text-sm">{cert.training_program?.name}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${cert.status === 'approved'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : cert.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
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
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3"
                                                    onClick={() => handleUpdateStatus(cert.id, 'approved')}
                                                >
                                                    Onayla
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 px-3"
                                                    onClick={() => handleUpdateStatus(cert.id, 'rejected')}
                                                >
                                                    Reddet
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 min-w-[80px] h-8 text-xs border-slate-200 hover:bg-slate-50"
                                            onClick={() => handleDownload(cert.id, cert.certificate_no)}
                                            disabled={downloadingId === cert.id || cert.status !== 'approved'}
                                            title={cert.status !== 'approved' ? 'Onaylanmamış sertifika indirilemez' : ''}
                                        >
                                            {downloadingId === cert.id ? (
                                                <span className="animate-pulse">İniyor...</span>
                                            ) : (
                                                <>
                                                    <Download size={12} />
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

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-4 bg-slate-50 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                        Toplam <span className="font-medium text-slate-900">{pagination.total}</span> kayıttan <span className="font-medium text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> - <span className="font-medium text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> arası gösteriliyor
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.current_page === 1}
                            onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-sm font-medium">Sayfa {pagination.current_page} / {pagination.last_page}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
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
                                <SelectContent className="max-h-[200px]">
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
