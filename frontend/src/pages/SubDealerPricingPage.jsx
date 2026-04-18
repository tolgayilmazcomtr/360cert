import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function SubDealerPricingPage() {
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [prices, setPrices] = useState({}); // { training_program_id: price }
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.get("/training-programs"),
            api.get(`/dealers/${user.id}/program-prices`),
        ]).then(([progRes, priceRes]) => {
            setPrograms(progRes.data);
            const map = {};
            priceRes.data.forEach(p => { map[p.training_program_id] = p.price; });
            setPrices(map);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    const getProgramName = (program) => {
        if (typeof program.name === "object") return program.name?.tr ?? Object.values(program.name)[0] ?? "";
        return program.name;
    };

    const handleSave = async (programId) => {
        const val = editValues[programId];
        if (val === undefined || val === "") return;
        setSaving(s => ({ ...s, [programId]: true }));
        try {
            await api.post(`/dealers/${user.id}/program-prices`, {
                training_program_id: programId,
                price: parseFloat(val),
            });
            setPrices(p => ({ ...p, [programId]: parseFloat(val) }));
            setEditValues(v => { const nv = { ...v }; delete nv[programId]; return nv; });
        } catch (e) {
            alert(e.response?.data?.message || "Kayıt başarısız.");
        } finally {
            setSaving(s => ({ ...s, [programId]: false }));
        }
    };

    const handleDelete = async (programId) => {
        if (!window.confirm("Bu özel fiyatı kaldırmak istiyor musunuz? Varsayılan fiyat kullanılacak.")) return;
        try {
            await api.delete(`/dealers/${user.id}/program-prices/${programId}`);
            setPrices(p => { const np = { ...p }; delete np[programId]; return np; });
        } catch (e) {
            alert(e.response?.data?.message || "Silme başarısız.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Alt Bayi Fiyatlandırması</h1>
                <p className="text-sm text-muted-foreground">
                    Alt bayileriniz sertifika oluştururken bu fiyatlar uygulanır. Fiyat girilmemiş eğitimlerde sistem varsayılan fiyatı kullanır.
                </p>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Eğitim Programı</TableHead>
                            <TableHead>Varsayılan Fiyat</TableHead>
                            <TableHead>Özel Fiyatınız</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell></TableRow>
                        ) : programs.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Eğitim programı bulunamadı.</TableCell></TableRow>
                        ) : programs.map(program => {
                            const hasCustom = prices[program.id] !== undefined;
                            const customPrice = prices[program.id];
                            const editing = editValues[program.id] !== undefined;

                            return (
                                <TableRow key={program.id}>
                                    <TableCell className="font-medium">{getProgramName(program)}</TableCell>
                                    <TableCell className="text-muted-foreground">{program.default_price} TL</TableCell>
                                    <TableCell>
                                        {hasCustom && !editing ? (
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-600">{customPrice} TL</Badge>
                                                <button
                                                    className="text-xs text-blue-600 underline"
                                                    onClick={() => setEditValues(v => ({ ...v, [program.id]: String(customPrice) }))}
                                                >
                                                    Değiştir
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder={hasCustom ? String(customPrice) : "Fiyat girin"}
                                                    value={editValues[program.id] ?? ""}
                                                    onChange={e => setEditValues(v => ({ ...v, [program.id]: e.target.value }))}
                                                    className="h-8 w-32 text-sm"
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-8"
                                                    disabled={saving[program.id]}
                                                    onClick={() => handleSave(program.id)}
                                                >
                                                    {saving[program.id] ? "..." : "Kaydet"}
                                                </Button>
                                                {editing && (
                                                    <button
                                                        className="text-xs text-muted-foreground underline"
                                                        onClick={() => setEditValues(v => { const nv = { ...v }; delete nv[program.id]; return nv; })}
                                                    >
                                                        İptal
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {hasCustom && (
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(program.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
