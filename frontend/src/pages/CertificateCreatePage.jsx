import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ArrowRight, FileText, UploadCloud, ChevronLeft } from "lucide-react";
import { getStorageUrl } from "@/lib/utils";

export default function CertificateCreatePage() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        student_id: "",
        training_program_id: "",
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: "",
        transcript: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tplRes, stdRes, prgRes] = await Promise.all([
                api.get("/certificate-templates"),
                api.get("/students?per_page=100"),
                api.get("/training-programs")
            ]);
            setTemplates(tplRes.data);
            setStudents(stdRes.data.data || stdRes.data);
            setPrograms(prgRes.data);
        } catch (error) {
            console.error("Veri yükleme hatası", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!selectedTemplate || !selectedTemplate.id) {
                alert("Şablon seçimi hatalı veya ID bulunamadı.");
                setLoading(false);
                return;
            }

            const data = new FormData();
            data.append('student_id', formData.student_id);
            data.append('training_program_id', formData.training_program_id);
            data.append('certificate_template_id', selectedTemplate.id);
            data.append('issue_date', formData.issue_date);
            if (formData.expiry_date) {
                data.append('expiry_date', formData.expiry_date);
            }
            if (formData.transcript) {
                data.append('transcript', formData.transcript);
            }

            await api.post("/certificates", data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Sertifika başarıyla oluşturuldu!");
            navigate("/certificates");
        } catch (error) {
            console.error("Oluşturma hatası", error);
            alert("Hata oluştu: " + (error.response?.data?.message || "Bilinmeyen hata"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            <div>
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Sertifika Oluşturucu</h2>
                <p className="text-muted-foreground">Adım adım sertifika oluşturma sihirbazı.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${step === 1 ? 'bg-primary text-white border-primary' : 'bg-white'}`}>1</div>
                    <span className="font-medium">Şablon Seçimi</span>
                </div>
                <div className="h-px bg-border flex-1"></div>
                <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${step === 2 ? 'bg-primary text-white border-primary' : 'bg-white'}`}>2</div>
                    <span className="font-medium">Detaylar & Onay</span>
                </div>
            </div>

            {step === 1 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className={`cursor-pointer transition-all duration-300 overflow-hidden border-2 group relative ${selectedTemplate?.id === template.id ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className="aspect-[1.414/1] bg-slate-100 relative">
                                {template.background_path ? (
                                    <img
                                        src={getStorageUrl(template.background_path)}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <FileText size={48} />
                                    </div>
                                )}
                                {selectedTemplate?.id === template.id && (
                                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary text-white rounded-full p-2 animate-in zoom-in">
                                            <CheckCircle size={32} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-950">
                                <h3 className="font-semibold text-lg">{template.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{template.type} Boyut</p>
                            </div>
                        </Card>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Henüz tanımlı şablon yok. <Button variant="link" onClick={() => navigate('/templates')}>Şablon Ekle</Button>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <Card className="max-w-2xl mx-auto shadow-lg border-0 dark:bg-slate-900">
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Öğrenci Seçimi</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, student_id: v })} value={formData.student_id}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Öğrenci Ara..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.first_name} {s.last_name} ({s.tc_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Eğitim Programı</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, training_program_id: v })} value={formData.training_program_id}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Eğitim Programı Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Veriliş Tarihi</Label>
                                    <Input
                                        type="date"
                                        className="h-11"
                                        value={formData.issue_date}
                                        onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bitiş Tarihi (Opsiyonel)</Label>
                                    <Input
                                        type="date"
                                        className="h-11"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Öğrenci Transkripti (Zorunlu Değil)</Label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                                    <Input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setFormData({ ...formData, transcript: e.target.files[0] })}
                                    />
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                                        <UploadCloud size={24} />
                                    </div>
                                    {formData.transcript ? (
                                        <div>
                                            <p className="font-medium text-blue-600">{formData.transcript.name}</p>
                                            <p className="text-xs text-muted-foreground">{(formData.transcript.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Dosya yüklemek için tıklayın</p>
                                            <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 10MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                {step === 2 && (
                    <Button variant="outline" size="lg" onClick={() => setStep(1)}>Geri</Button>
                )}
                {step === 1 ? (
                    <Button
                        size="lg"
                        onClick={() => setStep(2)}
                        disabled={!selectedTemplate}
                        className="gap-2"
                    >
                        Devam Et <ArrowRight size={16} />
                    </Button>
                ) : (
                    <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                        {loading ? "Sertifika Oluşturuluyor..." : "Onayla ve Oluştur"}
                    </Button>
                )}
            </div>
        </div>
    );
}
