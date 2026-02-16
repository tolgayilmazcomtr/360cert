import { useState, useEffect } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Edit, RotateCcw, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function DealersPage() {
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [newQuota, setNewQuota] = useState(0);

    const { user } = useAuth();

    // Safety check: redirect if not admin handled by ProtectedRoute but good to be safe

    useEffect(() => {
        fetchDealers();
    }, []);

    const fetchDealers = async () => {
        try {
            const response = await api.get("/dealers");
            setDealers(response.data.data);
        } catch (error) {
            console.error("Bayiler yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(status ? "Bayiyi onaylamak istiyor musunuz?" : "Bayi onayını kaldırmak istiyor musunuz?")) return;

        try {
            await api.put(`/dealers/${id}/status`, { is_approved: status });
            fetchDealers();
        } catch (error) {
            console.error("Durum güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const handleOpenQuotaModal = (dealer) => {
        setSelectedDealer(dealer);
        setNewQuota(dealer.student_quota);
        setIsQuotaModalOpen(true);
    };

    const handleQuotaUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/dealers/${selectedDealer.id}/status`, {
                is_approved: selectedDealer.is_approved,
                student_quota: newQuota
            });
            setIsQuotaModalOpen(false);
            fetchDealers();
            alert("Kota güncellendi.");
        } catch (error) {
            console.error("Kota güncelleme hatası", error);
            alert("İşlem başarısız.");
        }
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDealerData, setNewDealerData] = useState({
        name: "",
        email: "",
        password: "",
        company_name: "",
        phone: "",
        student_quota: 0
    });

    const handleCreateDealer = async (e) => {
        e.preventDefault();
        try {
            await api.post("/register", {
                ...newDealerData,
                password_confirmation: newDealerData.password // API expects confirmation
            });
            // Auto approve if created by admin? Or keep pending? Let's just create as pending for now or update API to allow admin to create approved directly.
            // For now, use register endpoint which creates as pending, then admin can approve immediately in the list.
            // Ideally should have a dedicated admin endpoint to create approved dealer.

            setIsCreateModalOpen(false);
            fetchDealers();
            alert("Bayi başarıyla oluşturuldu.");
            setNewDealerData({ name: "", email: "", password: "", company_name: "", phone: "", student_quota: 0 });
        } catch (error) {
            console.error("Bayi oluşturma hatası", error);
            alert("Hata: " + (error.response?.data?.message || "Oluşturulamadı."));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Bayi Yönetimi</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus size={16} /> Bayi Ekle
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-soft">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Firma Adı</TableHead>
                            <TableHead>Yetkili</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Öğrenci Kotası</TableHead>
                            <TableHead>Bakiye</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : dealers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Kayıtlı bayi bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            dealers.map((dealer) => (
                                <TableRow key={dealer.id}>
                                    <TableCell className="font-medium">{dealer.company_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{dealer.name}</span>
                                            <span className="text-xs text-muted-foreground">{dealer.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{dealer.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{dealer.student_quota} Öğrenci</Badge>
                                    </TableCell>
                                    <TableCell>{dealer.balance} TL</TableCell>
                                    <TableCell>
                                        {dealer.is_approved ? (
                                            <Badge className="bg-green-600">Onaylı</Badge>
                                        ) : (
                                            <Badge variant="warning" className="bg-amber-500 text-white">Beklemede</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenQuotaModal(dealer)}>
                                            <Edit size={14} className="mr-1" /> Kota
                                        </Button>

                                        {!dealer.is_approved ? (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(dealer.id, true)}>
                                                <Check size={14} className="mr-1" /> Onayla
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(dealer.id, false)}>
                                                <X size={14} className="mr-1" /> Reddet
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isQuotaModalOpen} onOpenChange={setIsQuotaModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Öğrenci Kotası Düzenle</DialogTitle>
                        <DialogDescription>
                            {selectedDealer?.company_name} için yeni kota limiti belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleQuotaUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kota Miktarı</Label>
                            <Input
                                type="number"
                                min="0"
                                value={newQuota}
                                onChange={e => setNewQuota(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Güncelle</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Bayi Ekle</DialogTitle>
                        <DialogDescription>
                            Manuel olarak yeni bir bayi hesabı oluşturun.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDealer} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Firma Adı</Label>
                            <Input
                                value={newDealerData.company_name}
                                onChange={e => setNewDealerData({ ...newDealerData, company_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Yetkili Adı</Label>
                                <Input
                                    value={newDealerData.name}
                                    onChange={e => setNewDealerData({ ...newDealerData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input
                                    value={newDealerData.phone}
                                    onChange={e => setNewDealerData({ ...newDealerData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>E-posta</Label>
                            <Input
                                type="email"
                                value={newDealerData.email}
                                onChange={e => setNewDealerData({ ...newDealerData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Şifre</Label>
                            <Input
                                type="password"
                                value={newDealerData.password}
                                onChange={e => setNewDealerData({ ...newDealerData, password: e.target.value })}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Oluştur</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
