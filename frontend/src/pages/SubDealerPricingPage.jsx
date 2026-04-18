import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function SubDealerPricingPage() {
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [prices, setPrices] = useState({});
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState({});
    const [loading, setLoading] = useState(true);
    const [bulkApplying, setBulkApplying] = useState(false);

    // Toplu güncelleme state
    const [bulkType, setBulkType] = useState("percent"); // "percent" | "amount"
    const [bulkDirection, setBulkDirection] = useState("+");
    const [bulkValue, setBulkValue] = useState("");
    const [bulkScope, setBulkScope] = useState("all"); // "all" | "custom_only"

    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.get("/training-programs"),
            api.get(`/dealers/${user.id}/program-prices`),
        ]).then(([progRes, priceRes]) => {
            setPrograms(progRes.data);
            const map = {};
            priceRes.data.forEach(p => { map[p.training_program_id] = parseFloat(p.price); });
            setPrices(map);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    const getProgramName = (program) => {
        if (typeof program.name === "object") return program.name?.tr ?? Object.values(program.name)[0] ?? "";
        return program.name;
    };

    const computeNewPrice = (basePrice, type, direction, value) => {
        const v = parseFloat(value);
        if (isNaN(v) || v < 0) return null;
        let result;
        if (type === "percent") {
            result = direction === "+" ? basePrice * (1 + v / 100) : basePrice * (1 - v / 100);
        } else {
            result = direction === "+" ? basePrice + v : basePrice - v;
        }
        return Math.max(0, Math.round(result * 100) / 100);
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

    const handleBulkApply = async () => {
        const v = parseFloat(bulkValue);
        if (isNaN(v) || v < 0) { alert("Geçerli bir değer girin."); return; }

        const targetPrograms = programs.filter(p => {
            if (bulkScope === "custom_only") return prices[p.id] !== undefined;
            return true;
        });

        if (targetPrograms.length === 0) { alert("Güncellenecek program bulunamadı."); return; }

        const preview = targetPrograms.map(p => {
            const base = prices[p.id] !== undefined ? prices[p.id] : parseFloat(p.default_price);
            return { program: p, newPrice: computeNewPrice(base, bulkType, bulkDirection, v) };
        });

        const label = bulkType === "percent"
            ? `%${v} ${bulkDirection === "+" ? "artış" : "indirim"}`
            : `${v} TL ${bulkDirection === "+" ? "artış" : "indirim"}`;
        const scopeLabel = bulkScope === "all" ? "tüm eğitimler" : "mevcut özel fiyatlı eğitimler";

        if (!window.confirm(`${scopeLabel} için ${label} uygulanacak. Onaylıyor musunuz?`)) return;

        setBulkApplying(true);
        try {
            await Promise.all(preview.map(({ program, newPrice }) =>
                api.post(`/dealers/${user.id}/program-prices`, {
                    training_program_id: program.id,
                    price: newPrice,
                })
            ));
            const newPrices = { ...prices };
            preview.forEach(({ program, newPrice }) => { newPrices[program.id] = newPrice; });
            setPrices(newPrices);
            setBulkValue("");
        } catch (e) {
            alert("Toplu güncelleme sırasında hata oluştu.");
        } finally {
            setBulkApplying(false);
        }
    };

    const bulkPreview = () => {
        const v = parseFloat(bulkValue);
        if (isNaN(v) || v <= 0) return null;
        const targets = programs.filter(p => bulkScope === "all" || prices[p.id] !== undefined);
        return targets.length;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Alt Bayi Fiyatlandırması</h1>
                <p className="text-sm text-muted-foreground">
                    Alt bayileriniz sertifika oluştururken bu fiyatlar uygulanır. Fiyat girilmemiş eğitimlerde sistem varsayılan fiyatı kullanır.
                </p>
            </div>

            {/* Toplu Güncelleme Kartı */}
            <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Toplu Fiyat Güncelleme</h2>
                <div className="flex flex-wrap items-end gap-3">
                    {/* Kapsam */}
                    <div className="space-y-1">
                        <Label className="text-xs">Kapsam</Label>
                        <div className="flex rounded-md border overflow-hidden text-sm">
                            <button
                                className={`px-3 py-1.5 ${bulkScope === "all" ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                onClick={() => setBulkScope("all")}
                            >Tüm Eğitimler</button>
                            <button
                                className={`px-3 py-1.5 border-l ${bulkScope === "custom_only" ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                onClick={() => setBulkScope("custom_only")}
                            >Sadece Özel Fiyatlılar</button>
                        </div>
                    </div>

                    {/* Tür */}
                    <div className="space-y-1">
                        <Label className="text-xs">Tür</Label>
                        <div className="flex rounded-md border overflow-hidden text-sm">
                            <button
                                className={`px-3 py-1.5 ${bulkType === "percent" ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                onClick={() => setBulkType("percent")}
                            >Yüzde (%)</button>
                            <button
                                className={`px-3 py-1.5 border-l ${bulkType === "amount" ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                onClick={() => setBulkType("amount")}
                            >Tutar (TL)</button>
                        </div>
                    </div>

                    {/* Yön */}
                    <div className="space-y-1">
                        <Label className="text-xs">Yön</Label>
                        <div className="flex rounded-md border overflow-hidden text-sm">
                            <button
                                className={`px-3 py-1.5 font-bold ${bulkDirection === "+" ? "bg-green-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-green-50"}`}
                                onClick={() => setBulkDirection("+")}
                            >+ Artır</button>
                            <button
                                className={`px-3 py-1.5 font-bold border-l ${bulkDirection === "-" ? "bg-red-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50"}`}
                                onClick={() => setBulkDirection("-")}
                            >− İndir</button>
                        </div>
                    </div>

                    {/* Değer */}
                    <div className="space-y-1">
                        <Label className="text-xs">Değer {bulkType === "percent" ? "(%)" : "(TL)"}</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={bulkType === "percent" ? "Örn: 10" : "Örn: 50"}
                            value={bulkValue}
                            onChange={e => setBulkValue(e.target.value)}
                            className="h-9 w-32 text-sm"
                        />
                    </div>

                    {/* Uygula */}
                    <Button
                        onClick={handleBulkApply}
                        disabled={!bulkValue || bulkApplying}
                        className={bulkDirection === "+" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        {bulkApplying
                            ? "Uygulanıyor..."
                            : bulkPreview()
                                ? `${bulkPreview()} programa uygula`
                                : "Uygula"}
                    </Button>
                </div>
                {bulkValue && parseFloat(bulkValue) > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {bulkScope === "all" ? "Tüm eğitimler" : "Özel fiyatlı eğitimler"} için mevcut {bulkType === "percent" ? "fiyatların" : "fiyatların üzerine"}{" "}
                        <span className={`font-semibold ${bulkDirection === "+" ? "text-green-600" : "text-red-600"}`}>
                            {bulkDirection}{bulkValue}{bulkType === "percent" ? "%" : " TL"}
                        </span>{" "}
                        {bulkDirection === "+" ? "eklenecek" : "düşülecek"}.
                        {bulkScope === "all" && " Özel fiyatı olmayanlarda varsayılan fiyat baz alınır."}
                    </p>
                )}
            </div>

            {/* Fiyat Tablosu */}
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
