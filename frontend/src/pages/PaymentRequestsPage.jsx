import { useState, useEffect } from "react";
import api from "../api/axios";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, FileText, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function PaymentRequestsPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [previewTx, setPreviewTx] = useState(null);
    const [filter, setFilter] = useState("pending");

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get("/transactions", {
                params: { method: "wire_transfer", status: filter === "all" ? undefined : filter, per_page: 50 }
            });
            setTransactions(res.data.data || []);
        } catch {
            toast({ title: "Hata", description: "Veriler yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, [filter]);

    const handleAction = async (id, status) => {
        setProcessingId(id);
        try {
            await api.put(`/transactions/${id}/status`, { status });
            toast({
                title: status === "approved" ? "Onaylandı" : "Reddedildi",
                description: status === "approved" ? "Bakiye başarıyla yüklendi." : "İşlem reddedildi.",
                variant: status === "approved" ? "default" : "destructive",
            });
            setPreviewTx(null);
            fetchTransactions();
        } catch (err) {
            toast({ title: "Hata", description: err.response?.data?.message || "İşlem başarısız.", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-500 hover:bg-green-600">Onaylandı</Badge>;
            case "pending": return <Badge className="bg-yellow-500 hover:bg-yellow-600">Bekliyor</Badge>;
            case "rejected": return <Badge className="bg-red-500 hover:bg-red-600">Reddedildi</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getReceiptUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `${API_BASE}/storage/${path}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ödeme Talepleri</h2>
                    <p className="text-sm text-muted-foreground mt-1">Bayi havale / EFT bildirimleri ve dekont incelemeleri</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTransactions} className="gap-2">
                    <RefreshCw size={14} /> Yenile
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {[
                    { key: "pending", label: "Bekleyenler" },
                    { key: "approved", label: "Onaylananlar" },
                    { key: "rejected", label: "Reddedilenler" },
                    { key: "all", label: "Tümü" },
                ].map(f => (
                    <Button
                        key={f.key}
                        variant={filter === f.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText size={18} /> Havale Talepleri
                    </CardTitle>
                    <CardDescription>
                        Bekleyen talepleri onaylayarak bayi bakiyesini yükleyin veya reddedin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                            Yükleniyor...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText size={36} className="mx-auto mb-3 opacity-20" />
                            <p>Bu kategoride kayıt bulunamadı.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Bayi</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Dekont</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-sm whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString("tr-TR")}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{t.user?.company_name || t.user?.name || "—"}</p>
                                                <p className="text-xs text-muted-foreground">{t.user?.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                                        <TableCell className="font-semibold text-emerald-700">
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                                        <TableCell>
                                            {t.document_path ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-indigo-600 hover:text-indigo-700"
                                                    onClick={() => setPreviewTx(t)}
                                                >
                                                    <Eye size={14} /> Görüntüle
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Yok</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {t.status === "pending" && (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                                                        disabled={processingId === t.id}
                                                        onClick={() => handleAction(t.id, "approved")}
                                                    >
                                                        <CheckCircle size={13} />
                                                        {processingId === t.id ? "..." : "Onayla"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="gap-1.5"
                                                        disabled={processingId === t.id}
                                                        onClick={() => handleAction(t.id, "rejected")}
                                                    >
                                                        <XCircle size={13} />
                                                        {processingId === t.id ? "..." : "Reddet"}
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Receipt Preview Dialog */}
            <Dialog open={!!previewTx} onOpenChange={() => setPreviewTx(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dekont İnceleme</DialogTitle>
                        <DialogDescription>
                            {previewTx?.user?.company_name || previewTx?.user?.name} — {previewTx && formatCurrency(previewTx.amount)}
                        </DialogDescription>
                    </DialogHeader>
                    {previewTx?.document_path && (
                        <div className="mt-2">
                            {previewTx.document_path.endsWith(".pdf") ? (
                                <iframe
                                    src={getReceiptUrl(previewTx.document_path)}
                                    className="w-full h-[500px] border rounded-md"
                                    title="Dekont"
                                />
                            ) : (
                                <img
                                    src={getReceiptUrl(previewTx.document_path)}
                                    alt="Dekont"
                                    className="w-full max-h-[500px] object-contain border rounded-md"
                                />
                            )}
                        </div>
                    )}
                    {previewTx?.status === "pending" && (
                        <div className="flex gap-3 mt-4">
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                                disabled={!!processingId}
                                onClick={() => handleAction(previewTx.id, "approved")}
                            >
                                <CheckCircle size={15} /> Onayla ve Bakiye Yükle
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 gap-2"
                                disabled={!!processingId}
                                onClick={() => handleAction(previewTx.id, "rejected")}
                            >
                                <XCircle size={15} /> Reddet
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
