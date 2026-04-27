import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw } from "lucide-react";

// ─── CSV helpers ────────────────────────────────────────────────────────────
const CSV_COLUMNS = [
    { key: "first_name",              label: "ad",                  required: true  },
    { key: "last_name",               label: "soyad",               required: true  },
    { key: "tc_number",               label: "tc_no",               required: true  },
    { key: "birth_date",              label: "dogum_tarihi",        required: true,  hint: "GG.AA.YYYY" },
    { key: "training_program_id",     label: "egitim_programi_id",  required: true  },
    { key: "certificate_template_id", label: "sablon_id",           required: true  },
    { key: "certificate_language",    label: "dil",                 required: false },
    { key: "duration_hours",          label: "egitim_suresi_saat",  required: false },
    { key: "start_date",              label: "baslangic_tarihi",    required: false, hint: "GG.AA.YYYY" },
    { key: "end_date",                label: "bitis_tarihi",        required: false, hint: "GG.AA.YYYY" },
    { key: "issue_date",              label: "verilis_tarihi",      required: false, hint: "GG.AA.YYYY" },
];

const TABLE_HEADERS = [
    { key: "first_name",              label: "Ad",               width: "w-24"  },
    { key: "last_name",               label: "Soyad",            width: "w-24"  },
    { key: "tc_number",               label: "TC / Pasaport",    width: "w-32"  },
    { key: "birth_date",              label: "Doğum",            width: "w-28", type: "date" },
    { key: "training_program_id",     label: "Program ID",       width: "w-24", type: "number" },
    { key: "certificate_template_id", label: "Şablon ID",        width: "w-24", type: "number" },
    { key: "certificate_language",    label: "Dil",              width: "w-16"  },
    { key: "duration_hours",          label: "Süre (s)",         width: "w-20", type: "number" },
    { key: "start_date",              label: "Başlangıç",        width: "w-28", type: "date" },
    { key: "end_date",                label: "Bitiş",            width: "w-28", type: "date" },
    { key: "issue_date",              label: "Veriliş",          width: "w-28", type: "date" },
];

const toISO = (val) => {
    if (!val) return "";
    val = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const m = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    return val;
};

const parseCSV = (text) => {
    text = text.replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: ["Dosya boş veya başlık satırı eksik."] };

    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, "").replace(/\s*\(.*?\)/, "").trim());

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
        ["birth_date", "start_date", "end_date", "issue_date"].forEach(k => {
            if (row[k]) row[k] = toISO(row[k]);
        });
        if (!row.certificate_language) row.certificate_language = "tr";
        rows.push(row);
    }
    return { rows, errors: [] };
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BulkUploadPage() {
    useAuth();
    const fileRef = useRef();

    const [templates, setTemplates] = useState([]);
    const [programs, setPrograms]   = useState([]);

    const [rows, setRows]           = useState([]);
    const [parseErrors, setParseErrors] = useState([]);
    const [step, setStep]           = useState(1);
    const [creating, setCreating]   = useState(false);
    const [progress, setProgress]   = useState({ done: 0, total: 0 });
    const [results, setResults]     = useState([]);

    useEffect(() => {
        Promise.all([
            api.get("/certificate-templates"),
            api.get("/training-programs"),
        ]).then(([t, p]) => {
            setTemplates(t.data);
            setPrograms(p.data);
        });
    }, []);

    const getProgramName = (p) => {
        if (!p) return "";
        return typeof p.name === "object" ? (p.name.tr ?? Object.values(p.name)[0] ?? "") : p.name;
    };

    // ── download main CSV template ────────────────────────────────────────
    const downloadTemplate = () => {
        const BOM = "﻿";
        const headers = CSV_COLUMNS.map(c => c.label + (c.hint ? ` (${c.hint})` : "")).join(";");
        const example = [
            "Ahmet", "Yilmaz", "11111111111", "15.06.1990",
            "1", "1", "tr", "16",
            "01.03.2025", "15.03.2025", "15.03.2025",
        ].join(";");
        const content = BOM + headers + "\n" + example;
        triggerDownload(content, "sertifika_toplu_yukleme_sablonu.csv");
    };

    // ── download programs reference ───────────────────────────────────────
    const downloadPrograms = () => {
        const BOM = "﻿";
        const header = "id;egitim_adi";
        const rows = programs.map(p => `${p.id};${getProgramName(p)}`).join("\n");
        triggerDownload(BOM + header + "\n" + rows, "egitim_programlari.csv");
    };

    // ── download templates reference ──────────────────────────────────────
    const downloadTemplates = () => {
        const BOM = "﻿";
        const header = "id;sablon_adi;sertifika_turu";
        const rows = templates.map(t => `${t.id};${t.name};${t.certificate_type?.name ?? ""}`).join("\n");
        triggerDownload(BOM + header + "\n" + rows, "sablonlar.csv");
    };

    const triggerDownload = (content, filename) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = filename;
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
                setRows(parsed);
                setStep(2);
            }
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = "";
    };

    const updateCell = (id, key, value) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: value, _status: "pending", _error: "" } : r));
    };

    const deleteRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

    // ── bulk create ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setCreating(true);
        setProgress({ done: 0, total: rows.length });
        const res = [];
        const today = new Date().toISOString().split("T")[0];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.training_program_id || !row.certificate_template_id) {
                res.push({ ...row, _status: "error", _error: "egitim_programi_id ve sablon_id zorunludur." });
                setProgress({ done: i + 1, total: rows.length });
                continue;
            }
            try {
                const fd = new FormData();
                fd.append("first_name",              row.first_name);
                fd.append("last_name",               row.last_name);
                fd.append("tc_number",               row.tc_number);
                fd.append("birth_date",              row.birth_date);
                fd.append("training_program_id",     row.training_program_id);
                fd.append("certificate_template_id", row.certificate_template_id);
                fd.append("certificate_language",    row.certificate_language || "tr");
                fd.append("duration_hours",          row.duration_hours || "1");
                fd.append("start_date",              row.start_date  || today);
                fd.append("end_date",                row.end_date    || today);
                fd.append("issue_date",              row.issue_date  || today);

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

            {/* ── Step 1: Referans İndirme + Yükleme ── */}
            {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        {/* Referans listeleri */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">1. Referans Listelerini İndirin</CardTitle>
                                <CardDescription>
                                    CSV'ye ekleyeceğiniz <strong>egitim_programi_id</strong> ve <strong>sablon_id</strong> değerlerini bu listelerden bulun.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full gap-2" onClick={downloadPrograms}>
                                    <Download size={16} /> Eğitim Programları Listesi (.csv)
                                </Button>
                                <Button variant="outline" className="w-full gap-2" onClick={downloadTemplates}>
                                    <Download size={16} /> Şablonlar Listesi (.csv)
                                </Button>
                            </CardContent>
                        </Card>

                        {/* CSV şablonu */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">2. CSV Şablonunu İndirin</CardTitle>
                                <CardDescription>Verilerinizi bu formata göre hazırlayın. Her satır ayrı eğitim/şablon içerebilir.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
                                    <Download size={16} /> Şablonu İndir (.csv)
                                </Button>
                                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                    {CSV_COLUMNS.map(c => (
                                        <div key={c.key} className="flex gap-2">
                                            <span className="font-mono text-slate-500 w-44 shrink-0">{c.label}{c.hint ? ` (${c.hint})` : ""}</span>
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
                            disabled={creating || rows.length === 0}
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
