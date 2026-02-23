import { useState, useEffect } from "react";
import api from "../api/axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Download, Filter, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: 20,
            };

            if (searchQuery) params.search = searchQuery;
            if (typeFilter !== 'all') params.type = typeFilter;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get("/transactions", { params });
            setTransactions(response.data.data);
            setTotalPages(response.data.last_page);
        } catch (error) {
            console.error("İşlemler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, typeFilter, statusFilter, currentPage]);

    const getTypeDetails = (type) => {
        const types = {
            deposit: { label: "Para Girişi", variant: "default", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20" },
            expense: { label: "Para Çıkışı", variant: "destructive", color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20" },
            refund: { label: "İade", variant: "secondary", color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20" }
        };
        return types[type] || { label: type, variant: "outline", color: "" };
    };

    const getStatusBadge = (status) => {
        const statuses = {
            pending: { label: "Bekliyor", variant: "secondary" },
            approved: { label: "Onaylandı", variant: "default", className: "bg-emerald-500 hover:bg-emerald-600" },
            rejected: { label: "Reddedildi", variant: "destructive" }
        };
        const st = statuses[status] || { label: status, variant: "outline" };
        return <Badge variant={st.variant} className={st.className}>{st.label}</Badge>;
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Hesap Hareketleri</h2>
                <p className="text-muted-foreground">Tüm finansal işlemler, paket satın alımları ve bakiye yüklemeleri.</p>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
                {user?.role === 'admin' && (
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bayi Arayın</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Firma veya isim ile arama..."
                                className="pl-9 h-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}
                <div className="w-full md:w-[200px] space-y-1">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">İşlem Yönü</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="deposit">Girişler (Yüklemeler)</SelectItem>
                            <SelectItem value="expense">Çıkışlar (Harcamalar)</SelectItem>
                            <SelectItem value="refund">İadeler</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-[200px] space-y-1">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Durum</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="approved">Onaylananlar</SelectItem>
                            <SelectItem value="pending">Bekleyenler</SelectItem>
                            <SelectItem value="rejected">Reddedilenler</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow>
                                <TableHead className="w-[100px] font-semibold">Tarih</TableHead>
                                {user?.role === 'admin' && <TableHead className="font-semibold">Bayi</TableHead>}
                                <TableHead className="font-semibold">İşlem Tipi</TableHead>
                                <TableHead className="font-semibold min-w-[200px]">Açıklama</TableHead>
                                <TableHead className="font-semibold">Yöntem</TableHead>
                                <TableHead className="text-right font-semibold">Tutar</TableHead>
                                <TableHead className="text-right font-semibold">Durum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Yükleniyor...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <Filter className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                                            <span>Sonuç bulunamadı</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((transaction) => {
                                    const typeInfo = getTypeDetails(transaction.type);
                                    return (
                                        <TableRow key={transaction.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {format(new Date(transaction.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                                            </TableCell>
                                            {user?.role === 'admin' && (
                                                <TableCell className="font-medium">
                                                    <div>{transaction.user?.company_name || 'Bilinmiyor'}</div>
                                                    <div className="text-xs text-muted-foreground">{transaction.user?.name}</div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-300">
                                                {transaction.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize text-slate-500">
                                                    {transaction.method.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold whitespace-nowrap">
                                                <span className={transaction.type === 'deposit' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}>
                                                    {transaction.type === 'deposit' ? '+' : '-'}₺{Number(transaction.amount).toLocaleString('tr-TR')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {getStatusBadge(transaction.status)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                        <div className="text-sm text-muted-foreground">
                            Sayfa <span className="font-medium text-slate-900 dark:text-slate-100">{currentPage}</span> / {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || loading}
                            >
                                Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
