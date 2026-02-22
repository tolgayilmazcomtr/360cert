import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_MAP = {
    approved: { label: 'Onaylandı', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending: { label: 'Bekliyor', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    rejected: { label: 'Reddedildi', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const TYPE_MAP = {
    deposit: { label: 'Yükleme', icon: ArrowUpCircle, color: 'text-emerald-600' },
    expense: { label: 'Harcama', icon: ArrowDownCircle, color: 'text-rose-600' },
    refund: { label: 'İade', icon: ArrowUpCircle, color: 'text-blue-600' },
};

const PAGE_SIZE = 15;

export default function PaymentHistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Filters
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, per_page: PAGE_SIZE };
            if (search) params.search = search;
            if (filterType !== 'all') params.type = filterType;
            if (filterStatus !== 'all') params.status = filterStatus;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get('/transactions', { params });
            // Handle both paginated and direct array
            if (res.data?.data) {
                setTransactions(res.data.data);
                setTotal(res.data.total || res.data.data.length);
            } else {
                setTransactions(res.data);
                setTotal(res.data.length);
            }
        } catch {
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterType, filterStatus, dateFrom, dateTo]);

    useEffect(() => { setPage(1); }, [search, filterType, filterStatus, dateFrom, dateTo]);
    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const income = transactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg"><History size={22} className="text-violet-600" /></div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ödeme Geçmişi</h2>
                    <p className="text-sm text-slate-500">Tüm işlem geçmişinizi görüntüleyin ve filtreleyin</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-emerald-100 bg-emerald-50">
                    <CardContent className="py-4">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Toplam Giriş</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(income)}</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-100 bg-rose-50">
                    <CardContent className="py-4">
                        <p className="text-xs text-rose-600 font-medium mb-1">Toplam Gider</p>
                        <p className="text-xl font-bold text-rose-700">{formatCurrency(expense)}</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 bg-slate-50">
                    <CardContent className="py-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">Toplam İşlem</p>
                        <p className="text-xl font-bold text-slate-700">{total}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                className="pl-8 h-9"
                                placeholder="Açıklamada ara..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-9 w-36">
                                <SelectValue placeholder="İşlem Türü" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Türler</SelectItem>
                                <SelectItem value="deposit">Yükleme</SelectItem>
                                <SelectItem value="expense">Harcama</SelectItem>
                                <SelectItem value="refund">İade</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 w-36">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="approved">Onaylandı</SelectItem>
                                <SelectItem value="pending">Bekliyor</SelectItem>
                                <SelectItem value="rejected">Reddedildi</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" className="h-9 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Başlangıç Tarihi" />
                        <Input type="date" className="h-9 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Bitiş Tarihi" />
                        <Button variant="outline" size="sm" className="h-9" onClick={() => { setSearch(""); setFilterType("all"); setFilterStatus("all"); setDateFrom(""); setDateTo(""); }}>
                            Sıfırla
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={fetchTransactions}>
                            <RefreshCw size={13} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Tarih</TableHead>
                                <TableHead>İşlem Türü</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Yöntem</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-500" />
                                            Yükleniyor...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <History size={32} className="mx-auto mb-2 opacity-30" />
                                        İşlem bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : transactions.map(t => {
                                const typeInfo = TYPE_MAP[t.type] || { label: t.type, icon: ArrowUpCircle, color: 'text-slate-500' };
                                const Icon = typeInfo.icon;
                                const statusInfo = STATUS_MAP[t.status] || { label: t.status, cls: '' };
                                return (
                                    <TableRow key={t.id} className="hover:bg-slate-50">
                                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString('tr-TR')}
                                            <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`flex items-center gap-1.5 text-sm font-medium ${typeInfo.color}`}>
                                                <Icon size={15} />
                                                {typeInfo.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate text-slate-700">{t.description}</TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {{ credit_card: 'Kredi Kartı', wire_transfer: 'Havale/EFT', system: 'Sistem', package: 'Paket' }[t.method] || t.method}
                                        </TableCell>
                                        <TableCell className={`font-semibold text-sm ${t.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.cls}`}>
                                                {statusInfo.label}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{total} işlem, {totalPages} sayfa</p>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0">
                            <ChevronLeft size={14} />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = page <= 3 ? i + 1 : page - 2 + i;
                            if (p < 1 || p > totalPages) return null;
                            return (
                                <Button key={p} variant={page === p ? "default" : "outline"} size="sm"
                                    onClick={() => setPage(p)} className="h-8 w-8 p-0 text-xs">
                                    {p}
                                </Button>
                            );
                        })}
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0">
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
