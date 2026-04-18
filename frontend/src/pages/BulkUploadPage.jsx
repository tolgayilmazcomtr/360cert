import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw } from "lucide-react";

// ─── CSV helpers ────────────────────────────────────────────────────────────
const CSV_COLUMNS = [
    { key: "first_name",     label: "ad",                  required: true  },
    { key: "last_name",      label: "soyad",               required: true  },
    { key: "tc_number",      label: "tc_no",               required: true  },
    { key: "birth_date",     label: "dogum_tarihi",        required: true,  hint: "GG.AA.YYYY" },
    { key: "duration_hours", label: "egitim_suresi_saat",  required: false },
    { key: "start_date",     label: "baslangic_tarihi",    required: false, hint: "GG.AA.YYYY" },
    { key: "end_date",       label: "bitis_tarihi",        required: false, hint: "GG.AA.YYYY" },
    { key: "issue_date",     label: "verilis_tarihi",      required: false, hint: "GG.AA.YYYY" },
];

const TABLE_HEADERS = [
    { key: "first_name",     label: "Ad",               width: "w-24"  },
    { key: "last_name",      label: "Soyad",            width: "w-28"  },
    { key: "tc_number",      label: "TC / Pasaport No", width: "w-36"  },
    { key: "birth_date",     label: "Doğum Tarihi",     width: "w-32", type: "date" },
    { key: "duration_hours", label: "Süre (Saat)",      width: "w-24", type: "number" },
    { key: "start_date",     label: "Başlangıç",        width: "w-32", type: "date" },
    { key: "end_date",       label: "Bitiş",            width: "w-32", type: "date" },
    { key: "issue_date",     label: "Veriliş",          width: "w-32", type: "date" },
];

/** GG.AA.YYYY → YYYY-MM-DD  (already ISO passthrough) */
const toISO = (val) => {
    if (!val) return "";
    val = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const m = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    return val;
};

/** Parse raw CSV (comma or semicolon separated, UTF-8 BOM stripped) */
const parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: ["Dosya boş veya başlık satırı eksik."] };

    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ""));

    const colMap = {};
    CSV_COLUMNS.forEach(c => {
        const idx = headers.indexOf(c.label);
        if (idx >= 0) colMap[c.key] = idx;
    });

    const missing = CSV_COLUMNS.filter(c => c.required && colMap[c.key] === undefined).map(c => c.label);
    if (missing.length) return { rows: [], errors: [`Zorunlu sütunlar eksik: ${missing.join(", ")}`] };

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
        const row = { _id: i, _status: "pending", _error: "" };
        CSV_COLUMNS.forEach(c => {
            row[c.key] = colMap[c.key] !== undefined ? (cols[colMap[c.key]] || "") : "";
        });
        // Convert date fields
        ["birth_date", "start_date", "end_date", "issue_date"].forEach(k => {
            if (row[k]) row[k] = toISO(row[k]);
        });
        rows.push(row);
    }
    return { rows, errors: [] };
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BulkUploadPage() {
    const { user } = useAuth();
    const fileRef = useRef();

    const [templates, setTemplates] = useState([]);
    const [programs, setPrograms]   = useState([]);
    const [languages, setLanguages] = useState([]);

    const [templateId, setTemplateId]   = useState("");
    const [programId, setProgramId]     = useState("");
    const [language, setLanguage]       = useState("tr");
    const [defaultIssueDate, setDefaultIssueDate] = useState(new Date().toISOString().split("T")[0]);

    const [rows, setRows]       = useState([]);
    const [parseErrors, setParseErrors] = useState([]);
    const [step, setStep]       = useState(1); // 1=ayarlar+yükle  2=önizleme  3=sonuç
    const [creating, setCreating] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults]  = useState([]);

    useEffect(() => {
        Promise.all([
            api.get("/certificate-templates"),
            api.get("/training-programs"),
            api.get("/languages").catch(() => ({ data: [] })),
        ]).then(([t, p, l]) => {
            setTemplates(t.data);
            setPrograms(p.data);
            const langs = l.data.filter?.(x => x.is_active) ?? [];
            setLanguages(langs.length ? langs : [{ code: "tr", name: "Türkçe" }]);
        });
    }, []);

    // ── download template ──────────────────────────────────────────────────
    const downloadTemplate = () => {
        const BOM = "\uFEFF";
        const headers = CSV_COLUMNS.map(c => c.label + (c.hint ? ` (${c.hint})` : "")).join(";");
        const example = [
            "Ahmet",
            "Yilmaz",
            "11111111111",
            "15.06.1990",
            "16",
            "01.03.2025",
            "15.03.2025",
            "15.03.2025",
        ].join(";");
        const content = BOM + headers + "\n" + example;
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = "sertifika_toplu_yukleme_sablonu.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── file upload ────────────────────────────────────────────────────────
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const { rows: parsed, errors } = parseCSV(ev.target.result);
            setParseErrors(errors);
            if (!errors.length) {
                // Fill empty issue_date from defaultIssueDate
                const filled = parsed.map(r => ({
                    ...r,
                    issue_date: r.issue_date || defaultIssueDate,
                }));
                setRows(filled);
                setStep(2);
            }
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = "";
    };

    // ── inline edit ────────────────────────────────────────────────────────
    const updateCell = (id, key, value) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: value, _status: "pending", _error: "" } : r));
    };

    const deleteRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

    // ── bulk create ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!templateId || !programId) { alert("Lütfen şablon ve eğitim programı seçin."); return; }
        setCreating(true);
        setProgress({ done: 0, total: rows.length });
        const res = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const fd = new FormData();
                fd.append("first_name", row.first_name);
                fd.append("last_name",  row.last_name);
                fd.append("tc_number",  row.tc_number);
                fd.append("birth_date", row.birth_date);
                fd.append("training_program_id",      programId);
                fd.append("certificate_template_id",  templateId);
                fd.append("certificate_language",     language);
                fd.append("duration_hours", row.duration_hours || "1");
                fd.append("start_date",  row.start_date  || defaultIssueDate);
                fd.append("end_date",    row.end_date    || defaultIssueDate);
                fd.append("issue_date",  row.issue_date  || defaultIssueDate);

                await api.post("/certificates", fd);
                res.push({ ...row, _status: "success", _error: "" });
            } catch (err) {
                const msg = err.response?.data?.message
                    || Object.values(err.response?.data?.errors ?? {}).flat().join(" ")
                    || "Hata oluştu.";
                res.push({ ...row, _status: "error", _error: msg });
            }
            setProgress({ done: i + 1, total: rows.length });
        }

        setRows(res);
        setResults(res);
        setStep(3);
        setCreating(false);
    };

    const successCount = results.filter(r => r._status === "success").length;
    const errorCount   = results.filter(r => r._status === "error").length;

    const getProgramName = (p) => {
        if (!p) return "";
        return typeof p.name === "object" ? (p.name.tr ?? Object.values(p.name)[0] ?? "") : p.name;
    };

    const reset = () => { setStep(1); setRows([]); setResults([]); setParseErrors([]); };

    return (
        <div className="p-6 space-y-6 max-w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Toplu Sertifika Yükle</h1>
                    <p className="text-sm text-muted-foreground">CSV ile toplu sertifika oluşturun.</p>
                </div>
                {step > 1 && (
                    <Button variant="outline" size="sm" onClick={reset}>
                        <RefreshCw size={14} className="mr-1" /> Baştan Başla
                    </Button>
                )}
            </div>

            {/* ── Step 1: Ayarlar + Yükleme ── */}
            {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Sol: ayarlar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">1. Sertifika Ayarları</CardTitle>
                                <CardDescription>Tüm satırlara uygulanacak ortak ayarlar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Sertifika Şablonu <span className="text-red-500">*</span></Label>
                                    <Select value={templateId} onValueChange={setTemplateId}>
                                        <SelectTrigger><SelectValue placeholder="Şablon Seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Eğitim Programı <span className="text-red-500">*</span></Label>
                                    <Select value={programId} onValueChange={setProgramId}>
                                        <SelectTrigger><SelectValue placeholder="Program Seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{getProgramName(p)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Sertifika Dili</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Varsayılan Veriliş Tarihi</Label>
                                        <Input type="date" value={defaultIssueDate} onChange={e => setDefaultIssueDate(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">2. CSV Şablonunu İndirin</CardTitle>
                                <CardDescription>Verilerinizi bu formata göre hazırlayın. Türkçe karakter için Excel'de UTF-8 ile açın.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
                                    <Download size={16} /> Şablonu İndir (.csv)
                                </Button>
                                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                    {CSV_COLUMNS.map(c => (
                                        <div key={c.key} className="flex gap-2">
                                            <span className="font-mono text-slate-500 w-40 shrink-0">{c.label}{c.hint ? ` (${c.hint})` : ""}</span>
                                            <span>{c.required ? <span className="text-red-500 font-medium">Zorunlu</span> : "Opsiyonel"}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sağ: yükleme */}
                    <div className="space-y-4">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-base">3. Dosyanızı Yükleyin</CardTitle>
                                <CardDescription>Hazırladığınız CSV dosyasını seçin. Önizleme tablosunda düzenleme yapabilirsiniz.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 cursor-pointer hover:bg-slate-50 transition-colors text-center gap-3">
                                    <FileSpreadsheet size={40} className="text-blue-400" />
                                    <div>
                                        <p className="font-medium">CSV dosyasını seçin</p>
                                        <p className="text-sm text-muted-foreground mt-1">veya buraya sürükleyin</p>
                                    </div>
                                    <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
                                </label>
                                {parseErrors.length > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 space-y-1">
                                        {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── Step 2: Önizleme + Düzenleme ── */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-sm">{rows.length} satır yüklendi</Badge>
                            <span className="text-sm text-muted-foreground">Hücreleri tıklayarak düzenleyebilirsiniz.</span>
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={creating || !templateId || !programId || rows.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {creating
                                ? `Oluşturuluyor... (${progress.done}/${progress.total})`
                                : `${rows.length} Sertifika Oluştur`}
                        </Button>
                    </div>

                    {creating && (
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${(progress.done / progress.total) * 100}%` }}
                            />
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                        <table className="text-sm w-full">
                            <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-800">
                                    <th className="px-2 py-2 text-left w-8 text-xs font-semibold text-slate-500">#</th>
                                    {TABLE_HEADERS.map(h => (
                                        <th key={h.key} className={`px-2 py-2 text-left text-xs font-semibold text-slate-500 ${h.width}`}>{h.label}</th>
                                    ))}
                                    <th className="px-2 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row._id} className={`border-b hover:bg-slate-50 ${row._status === "error" ? "bg-red-50" : row._status === "success" ? "bg-green-50" : ""}`}>
                                        <td className="px-2 py-1 text-xs text-slate-400">{idx + 1}</td>
                                        {TABLE_HEADERS.map(h => (
                                            <td key={h.key} className="px-1 py-1">
                                                <Input
                                                    type={h.type || "text"}
                                                    value={row[h.key] || ""}
                                                    onChange={e => updateCell(row._id, h.key, e.target.value)}
                                                    className="h-7 text-xs border-transparent hover:border-slate-300 focus:border-blue-400 px-1.5 bg-transparent"
                                                    disabled={creating}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-1 py-1">
                                            <button
                                                onClick={() => deleteRow(row._id)}
                                                className="text-red-400 hover:text-red-600 p-1"
                                                disabled={creating}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Step 3: Sonuç ── */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                            <CheckCircle className="text-green-600" size={28} />
                            <div>
                                <p className="text-2xl font-bold text-green-700">{successCount}</p>
                                <p className="text-sm text-green-600">Sertifika oluşturuldu</p>
                            </div>
                        </div>
                        {errorCount > 0 && (
                            <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                                <XCircle className="text-red-600" size={28} />
                                <div>
                                    <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                                    <p className="text-sm text-red-600">Hatalı satır</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {errorCount > 0 && (
                        <div className="overflow-x-auto rounded-md border bg-white dark:bg-slate-900 shadow-sm">
                            <div className="px-4 py-2 border-b bg-red-50 text-sm font-semibold text-red-700 flex items-center gap-2">
                                <AlertCircle size={14} /> Hatalı Satırlar
                            </div>
                            <table className="text-sm w-full">
                                <thead>
                                    <tr className="border-b bg-slate-50">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Ad Soyad</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">TC / Pasaport</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Hata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.filter(r => r._status === "error").map((r, i) => (
                                        <tr key={i} className="border-b bg-red-50/50">
                                            <td className="px-3 py-2">{r.first_name} {r.last_name}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{r.tc_number}</td>
                                            <td className="px-3 py-2 text-red-600 text-xs">{r._error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
