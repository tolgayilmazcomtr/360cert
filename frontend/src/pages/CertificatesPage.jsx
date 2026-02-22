import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileText, Search, X, ExternalLink, Download, Plus, ChevronLeft, ChevronRight, MoreVertical, ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { languageService } from "../services/languageService";

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

    // Modal & Download & Inspection
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadDialogCert, setDownloadDialogCert] = useState(null);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [selectedDownloadLang, setSelectedDownloadLang] = useState("");
    const [inspectionCert, setInspectionCert] = useState(null);
    const [dealers, setDealers] = useState([]); // For Admin filter

    useEffect(() => {
        fetchCertificates();
        fetchStats();
        fetchLanguages();
        if (user?.role === 'admin') {
            fetchDealers();
        }
    }, [pagination.current_page, filters]);

    const fetchLanguages = async () => {
        try {
            const result = await languageService.getAll();
            // result could be the array directly or wrapped in data property
            const langsArray = Array.isArray(result) ? result : (result.data || []);
            const activeLangs = langsArray.filter(lang => lang.is_active);

            setAvailableLanguages(activeLangs);
            if (activeLangs.length > 0) {
                // Default to Turkish if available, otherwise first active
                const tr = activeLangs.find(l => l.code === 'tr');
                setSelectedDownloadLang(tr ? 'tr' : activeLangs[0].code);
            }
        } catch (error) {
            console.error("Diller yüklenemedi", error);
        }
    };

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
            const res = await api.get('/dealers?per_page=100');
            setDealers(res.data.data);
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

    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [approvalMernisStatus, setApprovalMernisStatus] = useState("Başarılı");

    useEffect(() => {
        if (!inspectionCert) {
            setShowRejectInput(false);
            setRejectionReason("");
            setApprovalMernisStatus("Başarılı");
        } else {
            setApprovalMernisStatus(inspectionCert.mernis_status || "Başarılı");
        }
    }, [inspectionCert]);

    const handleUpdateStatus = async (id, status) => {
        if (status === 'approved' && inspectionCert?.status !== 'approved') {
            if (!confirm('Sertifikayı onaylamak istediğinize emin misiniz?')) return;
        }

        try {
            await api.put(`/certificates/${id}/status`, {
                status,
                rejection_reason: status === 'rejected' ? rejectionReason : null,
                mernis_status: status === 'approved' ? approvalMernisStatus : null
            });
            alert("Sertifika durumu güncellendi.");
            setInspectionCert(null);
            fetchCertificates();
            fetchStats();
        } catch (error) {
            console.error("Durum güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    // ... (rest of the file until the Modal Footer)


    const downloadPdf = async (id, no, lang = '') => {
        setDownloadingId(id);
        try {
            const urlPath = lang ? `/certificates/${id}/download?lang=${lang}` : `/certificates/${id}/download`;
            const response = await api.get(urlPath, {
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
            setDownloadDialogCert(null);
        }
    };

    const handleDownloadClick = (cert) => {
        setDownloadDialogCert(cert);
    };

    const handleInspect = async (id) => {
        try {
            const res = await api.get(`/certificates/${id}`);
            setInspectionCert(res.data);
        } catch (error) {
            console.error("Sertifika detayları alınamadı", error);
            alert("Detaylar yüklenemedi.");
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
                <Button asChild className="gap-2 shadow-lg shadow-blue-500/20">
                    <Link to="/certificates/new">
                        <Plus size={16} />
                        Yeni Sertifika
                    </Link>
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
                                    {Array.isArray(dealers) && dealers.map(d => (
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
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">AD VE SOYAD</TableHead>
                            {user?.role === 'admin' && <TableHead className="font-semibold text-slate-700 whitespace-nowrap">BAYİ</TableHead>}
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">TÜRÜ</TableHead>
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">KİMLİK NO</TableHead>
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">S. NO</TableHead>
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">TARİHİ</TableHead>
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">MERNİS</TableHead>
                            <TableHead className="font-semibold text-slate-700 whitespace-nowrap">DURUMU</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 whitespace-nowrap">İŞLEM</TableHead>
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
                        ) : !Array.isArray(certificates) || certificates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    Kayıt bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            certificates.map((cert) => (
                                <TableRow key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-medium text-sm">{cert.student?.first_name} {cert.student?.last_name}</div>
                                    </TableCell>
                                    {user?.role === 'admin' && (
                                        <TableCell>
                                            <div className="text-sm text-slate-700">{cert.student?.user?.name || '-'}</div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="text-sm">
                                            {typeof cert.training_program?.name === 'object'
                                                ? (cert.training_program.name[cert.certificate_language] || cert.training_program.name.tr || Object.values(cert.training_program.name)[0])
                                                : cert.training_program?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {cert.student?.tc_number}
                                    </TableCell>
                                    <TableCell className="font-medium font-mono text-xs text-slate-600">
                                        {cert.certificate_no}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${cert.mernis_status === 'Başarılı'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : cert.mernis_status === 'Başarısız'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {cert.mernis_status || 'Bekliyor'}
                                        </span>
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
                                        <div className="flex items-center justify-end gap-2">
                                            {cert.status === 'approved' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1 min-w-[80px] h-8 text-xs border-slate-200 hover:bg-slate-50 hidden md:flex"
                                                    onClick={() => handleDownloadClick(cert)}
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
                                            )}

                                            <Button
                                                size="sm"
                                                variant={user?.role === 'admin' ? 'default' : 'outline'}
                                                className={`h-8 gap-1.5 px-3 font-medium text-xs ${user?.role === 'admin'
                                                    ? (cert.status === 'pending' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm')
                                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                                onClick={() => handleInspect(cert.id)}
                                                title={user?.role === 'admin' ? "Yönetici İşlemleri" : "İncele"}
                                            >
                                                {user?.role === 'admin' ? (
                                                    <>
                                                        <MoreVertical size={14} />
                                                        {cert.status === 'pending' ? 'ONAYLA/YÖNET' : 'YÖNET'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye size={14} className="opacity-70" />
                                                        İncele
                                                    </>
                                                )}
                                            </Button>
                                        </div>
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

            {/* Inspection/Details Modal */}
            {inspectionCert && (
                <Dialog open={!!inspectionCert} onOpenChange={(open) => !open && setInspectionCert(null)}>
                    <DialogContent className="sm:max-w-[900px]">
                        <DialogHeader>
                            <DialogTitle>Sertifika Detayları</DialogTitle>
                            <DialogDescription>
                                Sertifika bilgilerini, transkripti ve durumu inceleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Left Side: Details */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Öğrenci Bilgileri</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        <div className="font-semibold text-lg">{inspectionCert.student?.first_name} {inspectionCert.student?.last_name}</div>
                                        <div className="text-sm text-slate-600">TC/Pasaport No: {inspectionCert.student?.tc_number}</div>
                                        <div className="text-sm text-slate-600">Doğum Yılı: {inspectionCert.student?.birth_year || '-'}</div>
                                        {inspectionCert.student?.photo_path && (
                                            <div className="mt-2">
                                                <img
                                                    src={`${api.defaults.baseURL.replace('/api', '')}/storage/${inspectionCert.student.photo_path}`}
                                                    alt="Öğrenci"
                                                    className="w-16 h-16 rounded object-cover border border-slate-200"
                                                />
                                            </div>
                                        )}
                                        {inspectionCert.student?.user && (
                                            <div className="text-xs text-slate-400 mt-2 pt-2 border-t">Bayi: {inspectionCert.student.user.name} ({inspectionCert.student.user.company_name})</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Sertifika Detayları</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        <div className="font-medium">
                                            {typeof inspectionCert.training_program?.name === 'object'
                                                ? (inspectionCert.training_program.name[inspectionCert.certificate_language] || inspectionCert.training_program.name.tr || Object.values(inspectionCert.training_program.name)[0])
                                                : inspectionCert.training_program?.name}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-2">Sertifika Dili: <span className="uppercase font-medium">{inspectionCert.certificate_language || 'TR'}</span></div>
                                        <div className="text-sm text-slate-600">Eğitim Süresi: {inspectionCert.duration_hours ? `${inspectionCert.duration_hours} Saat` : '-'}</div>
                                        {(inspectionCert.start_date || inspectionCert.end_date) && (
                                            <div className="text-sm text-slate-600">
                                                Eğitim Tarihi: {inspectionCert.start_date ? new Date(inspectionCert.start_date).toLocaleDateString('tr-TR') : '?'} - {inspectionCert.end_date ? new Date(inspectionCert.end_date).toLocaleDateString('tr-TR') : '?'}
                                            </div>
                                        )}
                                        <div className="text-sm text-slate-600">Veriliş Tarihi: {new Date(inspectionCert.issue_date).toLocaleDateString('tr-TR')}</div>
                                        <div className="text-sm text-slate-600">Şablon: {inspectionCert.template?.name}</div>
                                        <div className="text-sm text-slate-600 mt-2 pt-2 border-t">
                                            Durum:
                                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                                                ${inspectionCert.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : inspectionCert.status === 'rejected'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {inspectionCert.status === 'approved' ? 'Onaylandı' :
                                                    inspectionCert.status === 'rejected' ? 'Reddedildi' : 'Onay Bekliyor'}
                                            </span>
                                        </div>
                                        {inspectionCert.rejection_reason && (
                                            <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                                                <strong>Ret Nedeni:</strong> {inspectionCert.rejection_reason}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {inspectionCert.transcript_url ? (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <FileText size={20} />
                                            <span className="font-medium">Öğrenci Transkripti</span>
                                        </div>
                                        <a href={inspectionCert.transcript_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-100">
                                                <ExternalLink size={14} /> Görüntüle
                                            </Button>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-sm text-center">
                                        Transkript yüklenmemiş.
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Preview */}
                            <div className="h-[400px] bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 relative overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 text-slate-400 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium">Sertifika Önizleme</p>
                                        {inspectionCert.status === 'approved' && (
                                            <Button
                                                className="mt-4"
                                                variant="secondary"
                                                onClick={() => handleDownloadClick(inspectionCert)}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                PDF İndir / Önizle
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Control Panel Layout */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {user?.role === 'admin' ? (
                                inspectionCert.status === 'pending' ? (
                                    <div className="flex flex-col w-full gap-4">
                                        <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-2 rounded border border-indigo-100 shadow-sm">
                                            <ShieldCheck size={20} />
                                            <span className="text-sm font-bold uppercase tracking-wider">Yönetici Kontrol Paneli - İşlem Bekliyor</span>
                                        </div>

                                        {showRejectInput ? (
                                            <div className="w-full space-y-3 bg-rose-50/80 p-5 rounded-lg border border-rose-200 shadow-sm">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-rose-800">Red Nedeni Belirtin</label>
                                                    <textarea
                                                        className="w-full min-h-[80px] p-3 text-sm border border-rose-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500/30 bg-white"
                                                        placeholder="Sertifikanın neden reddedildiğini yazın..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3 pt-2">
                                                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200" onClick={() => { setShowRejectInput(false); setRejectionReason(""); }}>
                                                        İptal
                                                    </Button>
                                                    <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700 font-bold" onClick={() => handleUpdateStatus(inspectionCert.id, 'rejected')}>
                                                        <XCircle className="w-5 h-5 mr-1.5" /> Kalıcı Olarak Reddet
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col md:flex-row gap-4 w-full bg-slate-50 p-5 rounded-lg border border-slate-200 items-center justify-between shadow-sm">
                                                <Button
                                                    variant="outline"
                                                    className="w-full md:w-auto border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-11"
                                                    onClick={() => setShowRejectInput(true)}
                                                >
                                                    <XCircle className="w-5 h-5 mr-2" /> Sertifikayı Reddet
                                                </Button>
                                                <div className="flex flex-col md:flex-row w-full md:w-auto gap-4 items-center">
                                                    <div className="flex flex-col w-full md:w-auto">
                                                        <span className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Mernis Kontrol Durumu</span>
                                                        <Select value={approvalMernisStatus} onValueChange={setApprovalMernisStatus}>
                                                            <SelectTrigger className="w-full md:w-[180px] h-11 bg-white text-sm font-bold border-emerald-200 focus:ring-emerald-500 shadow-sm">
                                                                <SelectValue placeholder="Mernis Durumu" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Başarılı" className="text-emerald-700 font-bold">Başarılı (Onaylı)</SelectItem>
                                                                <SelectItem value="Başarısız" className="text-rose-700 font-bold">Başarısız</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto md:self-end h-11 font-bold shadow-md text-base"
                                                        onClick={() => handleUpdateStatus(inspectionCert.id, 'approved')}
                                                    >
                                                        <CheckCircle className="w-5 h-5 mr-2" /> Sertifikayı Onayla
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : inspectionCert.status === 'approved' ? (
                                    <div className="flex flex-col w-full gap-4">
                                        <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-2 rounded border border-slate-200 shadow-sm">
                                            <ShieldCheck size={20} />
                                            <span className="text-sm font-bold uppercase tracking-wider">Yönetici Kontrol Paneli - Gelişmiş İşlemler</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row w-full bg-slate-50 p-5 rounded-lg border border-slate-200 items-center justify-between gap-4 shadow-sm">
                                            <div className="flex flex-col w-full sm:w-auto">
                                                <span className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Mernis Kontrol Durumunu Değiştir</span>
                                                <Select value={approvalMernisStatus} onValueChange={setApprovalMernisStatus}>
                                                    <SelectTrigger className="w-full sm:w-[200px] h-11 bg-white text-sm font-bold border-indigo-200 focus:ring-indigo-500 shadow-sm">
                                                        <SelectValue placeholder="Mernis Durumu Seç" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Başarılı" className="text-emerald-700 font-bold">Başarılı</SelectItem>
                                                        <SelectItem value="Başarısız" className="text-rose-700 font-bold">Başarısız</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 items-center">
                                                {approvalMernisStatus !== inspectionCert.mernis_status && (
                                                    <Button
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto h-11 shadow-md font-bold"
                                                        onClick={() => handleUpdateStatus(inspectionCert.id, 'approved')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" /> Durumu Güncelle
                                                    </Button>
                                                )}
                                                <Button variant="outline" className="w-full sm:w-auto h-11" onClick={() => setInspectionCert(null)}>
                                                    Kapat
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col w-full gap-4">
                                        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-2 rounded border border-rose-100 shadow-sm">
                                            <XCircle size={20} />
                                            <span className="text-sm font-bold uppercase tracking-wider">Yönetici Kontrol Paneli - Sertifika Reddedilmiş</span>
                                        </div>
                                        <div className="flex w-full justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setInspectionCert(null)}>Kapat</Button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex w-full justify-end border-t border-slate-100 pt-3">
                                    <Button variant="outline" onClick={() => setInspectionCert(null)}>
                                        Kapat
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Language Selection PDF Download Dialog */}
            {downloadDialogCert && (
                <Dialog open={!!downloadDialogCert} onOpenChange={(open) => !open && setDownloadDialogCert(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>PDF İndirme Dili Seçimi</DialogTitle>
                            <DialogDescription>
                                Lütfen sertifikanın hangi dilde oluşturulmasını istediğinizi seçin. Eğitim adı seçtiğiniz dile göre çevrilecektir.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Sertifika Dili</label>
                                <Select value={selectedDownloadLang} onValueChange={setSelectedDownloadLang}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Dil Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableLanguages.map((lang) => (
                                            <SelectItem key={lang.id} value={lang.code}>
                                                {lang.name} ({lang.code.toUpperCase()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDownloadDialogCert(null)} disabled={downloadingId === downloadDialogCert.id}>
                                İptal
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => downloadPdf(downloadDialogCert.id, downloadDialogCert.certificate_no, selectedDownloadLang)}
                                disabled={downloadingId === downloadDialogCert.id || !selectedDownloadLang}
                            >
                                {downloadingId === downloadDialogCert.id ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        İndiriliyor...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        İndir
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
