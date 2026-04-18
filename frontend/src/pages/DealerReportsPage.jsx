import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, PlusCircle, Loader2, Building2, Users } from "lucide-react";

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

    useEffect(() => {
        fetchStats();
    }, []);

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

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openPayment = (dealer) => {
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
            setPaymentModal({ open: false, dealer: null });
            fetchStats();
        } catch (e) {
            alert(e.response?.data?.message || "İşlem başarısız.");
        } finally {
            setPaying(false);
        }
    };

    const totalCerts = stats.reduce((s, d) => s + d.cert_count, 0);
    const totalSpend = stats.reduce((s, d) => s + d.total_spend, 0);
    const totalBalance = stats.reduce((s, d) => s + parseFloat(d.balance || 0), 0);

    const title = user?.role === 'admin' ? "Bayi Raporları" : "Alt Bayi Raporları";
    const subtitle = user?.role === 'admin'
        ? "Tüm bayilerin sertifika üretim ve harcama raporları. Tahsilat yapıldığında bakiyeyi güncelleyin."
        : "Alt bayilerinizin sertifika üretim ve harcama raporları.";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
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
                            <th className="px-4 py-3 text-right">Bakiye Ekle</th>
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
                            <tr>
                                <td colSpan={6} className="py-10 text-center text-muted-foreground">Kayıt bulunamadı.</td>
                            </tr>
                        ) : stats.map(dealer => (
                            <>
                                <tr key={dealer.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {dealer.sub_dealers?.length > 0 ? (
                                            <button onClick={() => toggleRow(dealer.id)} className="text-slate-400 hover:text-slate-600">
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
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{dealer.cert_count}</td>
                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{Number(dealer.total_spend).toFixed(2)} TL</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-bold ${parseFloat(dealer.balance) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {Number(dealer.balance).toFixed(2)} TL
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 gap-1" onClick={() => openPayment(dealer)}>
                                            <PlusCircle size={13} /> Ödeme Al
                                        </Button>
                                    </td>
                                </tr>

                                {/* Sub-dealer rows */}
                                {expandedRows[dealer.id] && dealer.sub_dealers?.map(sub => (
                                    <tr key={`sub-${sub.id}`} className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                                        <td className="px-4 py-2.5"></td>
                                        <td className="px-4 py-2.5 pl-10">
                                            <div className="flex items-center gap-2">
                                                <Users size={13} className="text-slate-400 shrink-0" />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-700">{sub.company_name || sub.name}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.name}</div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] ml-1">Alt Bayi</Badge>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-sm">{sub.cert_count}</td>
                                        <td className="px-4 py-2.5 text-right text-sm text-red-500">{Number(sub.total_spend).toFixed(2)} TL</td>
                                        <td className="px-4 py-2.5 text-right text-sm text-emerald-600 font-semibold">{Number(sub.balance).toFixed(2)} TL</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50 gap-1 h-7 text-xs" onClick={() => openPayment(sub)}>
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

            {/* Payment Modal */}
            <Dialog open={paymentModal.open} onOpenChange={v => !v && setPaymentModal({ open: false, dealer: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlusCircle size={18} className="text-emerald-600" />
                            Bakiye Yükle
                        </DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-slate-700">{paymentModal.dealer?.company_name || paymentModal.dealer?.name}</span> bayisine ödeme alındı olarak bakiye ekleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Current balance info */}
                        <div className="bg-slate-50 rounded-md p-3 flex items-center justify-between text-sm border">
                            <span className="text-muted-foreground">Mevcut Bakiye</span>
                            <span className={`font-bold ${parseFloat(paymentModal.dealer?.balance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {Number(paymentModal.dealer?.balance || 0).toFixed(2)} TL
                            </span>
                        </div>
                        {paymentModal.dealer?.total_spend > 0 && (
                            <div className="bg-amber-50 rounded-md p-3 flex items-center justify-between text-sm border border-amber-100">
                                <span className="text-amber-700">Toplam Harcama</span>
                                <span className="font-semibold text-amber-700">{Number(paymentModal.dealer?.total_spend || 0).toFixed(2)} TL</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Ödeme Tutarı (TL) *</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="text-lg font-bold"
                                    autoFocus
                                />
                                {paymentModal.dealer?.total_spend > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="shrink-0 text-xs"
                                        onClick={() => setPaymentAmount(String(paymentModal.dealer.total_spend))}
                                    >
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
                            <Input
                                placeholder="Örn: Ocak ayı ödemesi, havale..."
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentModal({ open: false, dealer: null })}>İptal</Button>
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
