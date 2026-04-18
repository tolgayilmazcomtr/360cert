import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, PlusCircle, Loader2, Building2, Users, ArrowUpCircle, ArrowDownCircle, X } from "lucide-react";

export default function DealerReportsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    // Payment modal
    const [paymentModal, setPaymentModal] = useState({ open: false, dealer: null });
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [paying, setPaying] = useState(false);

    // Detail modal
    const [detailModal, setDetailModal] = useState({ open: false, dealer: null });
    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(false);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get("/dealers/stats");
            setStats(res.data);
        } catch (e) {
            console.error("İstatistikler yüklenemedi", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    const openPayment = (e, dealer) => {
        e.stopPropagation();
        setPaymentModal({ open: true, dealer });
        setPaymentAmount("");
        setPaymentNote("");
    };

    const handlePay = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) { alert("Geçerli bir tutar girin."); return; }
        setPaying(true);
        try {
            await api.post(`/dealers/${paymentModal.dealer.id}/add-balance`, {
                amount,
                note: paymentNote || undefined,
            });
            setPaymentAmount("");
            setPaymentNote("");
            setPaymentModal({ open: false, dealer: null });
            fetchStats();
        } catch (e) {
            alert(e.response?.data?.message || "İşlem başarısız.");
        } finally {
            setPaying(false);
        }
    };

    const openDetail = async (dealer) => {
        setDetailModal({ open: true, dealer });
        setTransactions([]);
        setTxLoading(true);
        try {
            const res = await api.get(`/dealers/${dealer.id}/transactions`);
            setTransactions(res.data);
        } catch (e) {
            console.error("İşlemler yüklenemedi", e);
        } finally {
            setTxLoading(false);
        }
    };

    const totalCerts = stats.reduce((s, d) => s + d.cert_count, 0);
    const totalSpend = stats.reduce((s, d) => s + d.total_spend, 0);
    const totalBalance = stats.reduce((s, d) => s + parseFloat(d.balance || 0), 0);

    const title = user?.role === 'admin' ? "Bayi Raporları" : "Alt Bayi Raporları";

    // Summary for detail modal
    const txDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const txExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Bayilere tıklayarak tüm işlem geçmişini görün. Tahsilat yapıldığında "Ödeme Al" ile bakiyeyi güncelleyin.
                </p>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Toplam Sertifika" value={totalCerts} unit="adet" color="blue" />
                <SummaryCard label="Toplam Harcama" value={totalSpend.toFixed(2)} unit="TL" color="red" />
                <SummaryCard label="Toplam Bakiye" value={totalBalance.toFixed(2)} unit="TL" color="green" />
            </div>

            {/* Tablo */}
            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left w-8"></th>
                            <th className="px-4 py-3 text-left">Bayi</th>
                            <th className="px-4 py-3 text-right">Sertifika</th>
                            <th className="px-4 py-3 text-right">Toplam Harcama</th>
                            <th className="px-4 py-3 text-right">Mevcut Bakiye</th>
                            <th className="px-4 py-3 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                    Yükleniyor...
                                </td>
                            </tr>
                        ) : stats.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Kayıt bulunamadı.</td></tr>
                        ) : stats.map(dealer => (
                            <>
                                <tr
                                    key={dealer.id}
                                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                                    onClick={() => openDetail(dealer)}
                                >
                                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleRow(dealer.id); }}>
                                        {dealer.sub_dealers?.length > 0 ? (
                                            <button className="text-slate-400 hover:text-slate-600">
                                                {expandedRows[dealer.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        ) : <span className="w-4 inline-block" />}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={15} className="text-slate-400 shrink-0" />
                                            <div>
                                                <div className="font-medium">{dealer.company_name || dealer.name}</div>
                                                <div className="text-xs text-muted-foreground">{dealer.name}</div>
                                            </div>
                                            {dealer.is_main_dealer && (
                                                <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200 ml-1">Ana Bayi</Badge>
                                            )}
                                            <span className="text-[11px] text-blue-400 ml-1">↗ detay</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{dealer.cert_count}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-red-600">{Number(dealer.total_spend).toFixed(2)} TL</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-bold ${parseFloat(dealer.balance) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {Number(dealer.balance).toFixed(2)} TL
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            size="sm" variant="outline"
                                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 gap-1"
                                            onClick={e => openPayment(e, dealer)}
                                        >
                                            <PlusCircle size={13} /> Ödeme Al
                                        </Button>
                                    </td>
                                </tr>

                                {expandedRows[dealer.id] && dealer.sub_dealers?.map(sub => (
                                    <tr
                                        key={`sub-${sub.id}`}
                                        className="bg-slate-50/60 hover:bg-blue-50/30 transition-colors cursor-pointer"
                                        onClick={() => openDetail(sub)}
                                    >
                                        <td className="px-4 py-2.5"></td>
                                        <td className="px-4 py-2.5 pl-10">
                                            <div className="flex items-center gap-2">
                                                <Users size={13} className="text-slate-400 shrink-0" />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-700">{sub.company_name || sub.name}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.name}</div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] ml-1">Alt Bayi</Badge>
                                                <span className="text-[11px] text-blue-400 ml-1">↗ detay</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-sm">{sub.cert_count}</td>
                                        <td className="px-4 py-2.5 text-right text-sm text-red-500">{Number(sub.total_spend).toFixed(2)} TL</td>
                                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-600">{Number(sub.balance).toFixed(2)} TL</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button
                                                size="sm" variant="ghost"
                                                className="text-emerald-600 hover:bg-emerald-50 gap-1 h-7 text-xs"
                                                onClick={e => openPayment(e, sub)}
                                            >
                                                <PlusCircle size={12} /> Ödeme Al
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── DETAIL MODAL ── */}
            <Dialog open={detailModal.open} onOpenChange={v => !v && setDetailModal({ open: false, dealer: null })}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 size={18} className="text-slate-500" />
                            {detailModal.dealer?.company_name || detailModal.dealer?.name} — İşlem Geçmişi
                        </DialogTitle>
                        <DialogDescription>
                            Tüm gelir ve gider hareketleri. Hiçbir tutar gözden kaçmaz.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Summary strip */}
                    {!txLoading && transactions.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 px-1 pb-2">
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                                <p className="text-[11px] text-emerald-600 uppercase font-semibold">Toplam Ödeme</p>
                                <p className="text-lg font-bold text-emerald-700">{txDeposits.toFixed(2)} TL</p>
                            </div>
                            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
                                <p className="text-[11px] text-red-500 uppercase font-semibold">Toplam Harcama</p>
                                <p className="text-lg font-bold text-red-600">{txExpenses.toFixed(2)} TL</p>
                            </div>
                            <div className={`rounded-lg border p-3 text-center ${(txDeposits - txExpenses) >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                                <p className={`text-[11px] uppercase font-semibold ${(txDeposits - txExpenses) >= 0 ? 'text-blue-500' : 'text-amber-600'}`}>Net Bakiye</p>
                                <p className={`text-lg font-bold ${(txDeposits - txExpenses) >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                    {(txDeposits - txExpenses).toFixed(2)} TL
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 rounded-md border">
                        {txLoading ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                Yükleniyor...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">Henüz işlem kaydı yok.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b text-xs text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left">Tarih</th>
                                        <th className="px-4 py-2.5 text-left">Açıklama</th>
                                        {detailModal.dealer?.is_main_dealer && (
                                            <th className="px-4 py-2.5 text-left">Kaynak</th>
                                        )}
                                        <th className="px-4 py-2.5 text-right">Tutar</th>
                                        <th className="px-4 py-2.5 text-center">Tür</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className={`${tx.type === 'deposit' ? 'hover:bg-emerald-50/30' : 'hover:bg-red-50/20'} transition-colors`}>
                                            <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{tx.date}</td>
                                            <td className="px-4 py-2.5 text-slate-700 max-w-xs truncate">{tx.description || '-'}</td>
                                            {detailModal.dealer?.is_main_dealer && (
                                                <td className="px-4 py-2.5">
                                                    {tx.is_sub_dealer ? (
                                                        <span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{tx.dealer_name}</span>
                                                    ) : (
                                                        <span className="text-xs text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">Ana Bayi</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                                                <span className={tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(2)} TL
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {tx.type === 'deposit' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                                                        <ArrowUpCircle size={11} /> Ödeme
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                                                        <ArrowDownCircle size={11} /> Harcama
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <DialogFooter className="pt-2 border-t">
                        <Button
                            variant="outline"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 gap-2"
                            onClick={e => {
                                setDetailModal({ open: false, dealer: null });
                                openPayment(e, detailModal.dealer);
                            }}
                        >
                            <PlusCircle size={15} /> Ödeme Al
                        </Button>
                        <Button variant="ghost" onClick={() => setDetailModal({ open: false, dealer: null })}>
                            <X size={15} className="mr-1" /> Kapat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── PAYMENT MODAL ── */}
            <Dialog open={paymentModal.open} onOpenChange={v => { if (!v) { setPaymentModal({ open: false, dealer: null }); setPaymentAmount(""); setPaymentNote(""); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlusCircle size={18} className="text-emerald-600" />
                            Bakiye Yükle
                        </DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-slate-700">{paymentModal.dealer?.company_name || paymentModal.dealer?.name}</span> bayisine tahsilat girişi yapın.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-md p-3 border text-center">
                                <p className="text-xs text-muted-foreground mb-1">Mevcut Bakiye</p>
                                <p className={`font-bold text-base ${parseFloat(paymentModal.dealer?.balance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {Number(paymentModal.dealer?.balance || 0).toFixed(2)} TL
                                </p>
                            </div>
                            <div className="bg-amber-50 rounded-md p-3 border border-amber-100 text-center">
                                <p className="text-xs text-amber-600 mb-1">Toplam Harcama</p>
                                <p className="font-bold text-base text-amber-700">
                                    {Number(paymentModal.dealer?.total_spend || 0).toFixed(2)} TL
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ödeme Tutarı (TL) *</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number" min="0.01" step="0.01" placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="text-lg font-bold"
                                    autoFocus
                                />
                                {paymentModal.dealer?.total_spend > 0 && (
                                    <Button type="button" variant="outline" className="shrink-0 text-xs"
                                        onClick={() => setPaymentAmount(String(paymentModal.dealer.total_spend))}>
                                        Tamamı
                                    </Button>
                                )}
                            </div>
                            {paymentAmount && parseFloat(paymentAmount) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Yeni bakiye:{" "}
                                    <span className="font-semibold text-emerald-600">
                                        {(parseFloat(paymentModal.dealer?.balance || 0) + parseFloat(paymentAmount)).toFixed(2)} TL
                                    </span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Not (Opsiyonel)</Label>
                            <Input placeholder="Örn: Ocak ayı ödemesi, havale..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setPaymentModal({ open: false, dealer: null }); setPaymentAmount(""); setPaymentNote(""); }}>İptal</Button>
                        <Button
                            onClick={handlePay}
                            disabled={paying || !paymentAmount || parseFloat(paymentAmount) <= 0}
                            className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
                        >
                            {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle size={16} className="mr-2" />}
                            Bakiyeye Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SummaryCard({ label, value, unit, color }) {
    const colors = {
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        red: "bg-red-50 border-red-100 text-red-700",
        green: "bg-emerald-50 border-emerald-100 text-emerald-700",
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color]}`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{value} <span className="text-sm font-normal">{unit}</span></p>
        </div>
    );
}
