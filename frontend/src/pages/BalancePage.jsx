import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, History } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function BalancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const paymentStatus = searchParams.get('payment_status');
        const message = searchParams.get('message');

        if (paymentStatus) {
            if (paymentStatus === 'success') {
                toast({ title: "Ödeme Başarılı", description: message || "Paket başarıyla satın alındı ve bakiye eklendi." });
            } else if (paymentStatus === 'error') {
                toast({ title: "Ödeme Hatası", description: message || "İşlem başarısız.", variant: "destructive" });
            } else if (paymentStatus === 'info') {
                toast({ title: "Bilgi", description: message });
            }
            // Clear the params from URL
            setSearchParams({});
        }

        fetchTransactions();
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

    const handleDeposit = async (method) => {
        try {
            await api.post("/transactions", {
                amount: parseFloat(amount),
                method: method, // 'credit_card' or 'wire_transfer'
                description: method === 'credit_card' ? 'Kredi Kartı ile Yükleme' : 'Havale Bildirimi',
            });
            setOpen(false);
            setAmount("");
            fetchTransactions();
            // Gerçek senaryoda kullanıcı bakiyesi context update veya re-fetch user ile güncellenmeli
            // window.location.reload(); // Basit çözüm için reload veya user context refresh
        } catch (error) {
            console.error("Yükleme başarısız", error);
            alert("İşlem başarısız oldu.");
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
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Wallet size={16} />
                            Bakiye Yükle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
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

                            <div className="p-4 py-6">
                                <div className="grid w-full items-center gap-4 mb-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="amount">Yüklenecek Tutar (TL)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <TabsContent value="credit_card">
                                    <div className="rounded-md border p-4 bg-slate-50 mb-4">
                                        <p className="text-sm text-muted-foreground mb-2">Simülasyon Modu: "Ödeme Yap" butonuna bastığınızda işlem onaylanacaktır.</p>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <CreditCard size={20} />
                                            **** **** **** 1234
                                        </div>
                                    </div>
                                    <Button onClick={() => handleDeposit('credit_card')} className="w-full" disabled={!amount || parseFloat(amount) <= 0}>
                                        Güvenli Ödeme Yap
                                    </Button>
                                </TabsContent>

                                <TabsContent value="wire_transfer">
                                    <div className="rounded-md border p-4 bg-slate-50 mb-4 text-sm space-y-2">
                                        <p className="font-semibold">Banka Bilgileri:</p>
                                        <p>Tolga YILMAZ</p>
                                        <p>TR12 0000 0000 0000 0000 0000 00</p>
                                        <p>Ziraat Bankası</p>
                                        <p className="text-xs text-muted-foreground mt-2">Lütfen açıklama kısmına Bayi ID'nizi yazınız.</p>
                                    </div>
                                    <Button onClick={() => handleDeposit('wire_transfer')} className="w-full" disabled={!amount || parseFloat(amount) <= 0}>
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
