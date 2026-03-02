import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, History, Lock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const defaultCardForm = { card_name: "", card_number: "", expire_month: "", expire_year: "", cvc: "" };

export default function BalancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [open, setOpen] = useState(false);
    const [cardForm, setCardForm] = useState(defaultCardForm);
    const [paying, setPaying] = useState(false);
    const [bankSettings, setBankSettings] = useState({
        bank_account_name: "",
        bank_iban: "",
        bank_name: "",
        bank_description: "Lütfen açıklama kısmına Bayi ID'nizi yazınız.",
    });

    useEffect(() => {
        const paymentStatus = searchParams.get('payment_status');
        const message = searchParams.get('message');

        if (paymentStatus) {
            if (paymentStatus === 'success') {
                toast({ title: "Ödeme Başarılı", description: message || "Bakiyeniz başarıyla yüklendi." });
            } else if (paymentStatus === 'error') {
                toast({ title: "Ödeme Hatası", description: message || "İşlem başarısız.", variant: "destructive" });
            } else if (paymentStatus === 'info') {
                toast({ title: "Bilgi", description: message });
            }
            setSearchParams({});
        }

        fetchTransactions();
        fetchBankSettings();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get("/transactions");
            setTransactions(response.data.data);
        } catch (error) {
            console.error("İşlemler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankSettings = async () => {
        try {
            const res = await api.get("/public/settings");
            if (res.data) {
                setBankSettings(prev => ({
                    ...prev,
                    bank_account_name: res.data.bank_account_name || "",
                    bank_iban: res.data.bank_iban || "",
                    bank_name: res.data.bank_name || "",
                    bank_description: res.data.bank_description || "Lütfen açıklama kısmına Bayi ID'nizi yazınız.",
                }));
            }
        } catch (e) {
            // Settings not critical, ignore errors
        }
    };

    const handleWireTransfer = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        try {
            await api.post("/transactions", {
                amount: parseFloat(amount),
                method: "wire_transfer",
                description: "Havale Bildirimi",
            });
            setOpen(false);
            setAmount("");
            fetchTransactions();
            toast({ title: "Bildirim Oluşturuldu", description: "Havale bildiriminiz alındı, onay bekleniyor." });
        } catch (error) {
            console.error("Yükleme başarısız", error);
            toast({ title: "Hata", description: "İşlem başarısız oldu.", variant: "destructive" });
        }
    };

    const handleCreditCardPayment = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: "Hata", description: "Lütfen geçerli bir tutar girin.", variant: "destructive" });
            return;
        }
        setPaying(true);
        try {
            const res = await api.post("/payment/deposit", {
                amount: parseFloat(amount),
                card_name: cardForm.card_name,
                card_number: cardForm.card_number,
                expire_month: cardForm.expire_month,
                expire_year: cardForm.expire_year,
                cvc: cardForm.cvc,
            });

            if (res.data.status === "success") {
                if (res.data.redirect_url) {
                    window.location.href = res.data.redirect_url;
                } else if (res.data.html) {
                    document.open();
                    document.write(res.data.html);
                    document.close();
                } else {
                    toast({ title: "Başarılı", description: "Ödeme tamamlandı." });
                    setOpen(false);
                    fetchTransactions();
                }
            } else {
                toast({ title: "Ödeme Hatası", description: res.data.message || "İşlem başarısız.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Ödeme Hatası", description: err.response?.data?.message || "İşlem başarısız.", variant: "destructive" });
        } finally {
            setPaying(false);
        }
    };

    const handleOpenChange = (isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            setAmount("");
            setCardForm(defaultCardForm);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500">Onaylandı</Badge>;
            case 'pending': return <Badge className="bg-yellow-500">Bekliyor</Badge>;
            case 'rejected': return <Badge className="bg-red-500">Reddedildi</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Bakiye ve Ödemeler</h2>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Wallet size={16} />
                            Bakiye Yükle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[460px]">
                        <DialogHeader>
                            <DialogTitle>Bakiye Yükle</DialogTitle>
                            <DialogDescription>
                                Hesabınıza bakiye yüklemek için lütfen bir yöntem seçin.
                            </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="credit_card" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="credit_card">Kredi Kartı</TabsTrigger>
                                <TabsTrigger value="wire_transfer">Havale / EFT</TabsTrigger>
                            </TabsList>

                            <div className="p-1 py-4">
                                {/* Amount input — shared */}
                                <div className="flex flex-col space-y-1.5 mb-4">
                                    <Label htmlFor="amount">Yüklenecek Tutar (TL)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        min="1"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                {/* Credit Card Tab */}
                                <TabsContent value="credit_card">
                                    <form onSubmit={handleCreditCardPayment}>
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cc-name">Kart Üzerindeki İsim *</Label>
                                                <Input
                                                    id="cc-name"
                                                    required
                                                    value={cardForm.card_name}
                                                    onChange={(e) => setCardForm(p => ({ ...p, card_name: e.target.value.toUpperCase() }))}
                                                    placeholder="AD SOYAD"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cc-number">Kart Numarası *</Label>
                                                <Input
                                                    id="cc-number"
                                                    required
                                                    maxLength="19"
                                                    value={cardForm.card_number}
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                                        setCardForm(p => ({ ...p, card_number: formatted }));
                                                    }}
                                                    placeholder="0000 0000 0000 0000"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Son Kullanma Tarihi *</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Ay (MM)"
                                                            required
                                                            maxLength="2"
                                                            value={cardForm.expire_month}
                                                            onChange={(e) => setCardForm(p => ({ ...p, expire_month: e.target.value.replace(/\D/g, '') }))}
                                                            className="text-center"
                                                        />
                                                        <Input
                                                            placeholder="Yıl (YYYY)"
                                                            required
                                                            maxLength="4"
                                                            value={cardForm.expire_year}
                                                            onChange={(e) => setCardForm(p => ({ ...p, expire_year: e.target.value.replace(/\D/g, '') }))}
                                                            className="text-center"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="cc-cvc">Güvenlik Kodu (CVC) *</Label>
                                                    <Input
                                                        id="cc-cvc"
                                                        required
                                                        maxLength="4"
                                                        type="password"
                                                        value={cardForm.cvc}
                                                        onChange={(e) => setCardForm(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '') }))}
                                                        placeholder="***"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                                <Lock size={10} className="text-emerald-600" />
                                                Kart bilgileriniz 256-bit SSL ile şifrelenerek Param POS altyapısına iletilir. 3D Secure ekranına yönlendirileceksiniz.
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full mt-4"
                                            disabled={paying || !amount || parseFloat(amount) <= 0}
                                        >
                                            {paying ? "İşleniyor..." : "Güvenli Ödeme Yap"}
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* Wire Transfer Tab */}
                                <TabsContent value="wire_transfer">
                                    <div className="rounded-md border p-4 bg-slate-50 mb-4 text-sm space-y-2">
                                        <p className="font-semibold">Banka Bilgileri:</p>
                                        {bankSettings.bank_account_name && <p>{bankSettings.bank_account_name}</p>}
                                        {bankSettings.bank_iban && <p className="font-mono">{bankSettings.bank_iban}</p>}
                                        {bankSettings.bank_name && <p>{bankSettings.bank_name}</p>}
                                        {bankSettings.bank_description && (
                                            <p className="text-xs text-muted-foreground mt-2">{bankSettings.bank_description}</p>
                                        )}
                                        {!bankSettings.bank_account_name && !bankSettings.bank_iban && (
                                            <p className="text-muted-foreground text-xs">Banka bilgileri sistem yöneticisi tarafından henüz girilmemiş.</p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleWireTransfer}
                                        className="w-full"
                                        disabled={!amount || parseFloat(amount) <= 0}
                                    >
                                        Havale Bildirimi Oluştur
                                    </Button>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mevcut Bakiye</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(user?.balance || 0)}</div>
                        <p className="text-xs text-muted-foreground">Kullanılabilir tutar</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History size={20} />
                        İşlem Geçmişi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Yükleniyor...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>İşlem Türü</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">İşlem bulunamadı.</TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.created_at).toLocaleDateString('tr-TR')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {t.type === 'deposit' ? <ArrowUpCircle size={16} className="text-green-500" /> : <ArrowDownCircle size={16} className="text-red-500" />}
                                                    <span className="capitalize">{t.type === 'deposit' ? 'Yükleme' : (t.type === 'expense' ? 'Harcama' : 'İade')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell className={t.type === 'deposit' ? 'text-green-600 font-medium' : 'text-slate-900'}>
                                                {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(t.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
