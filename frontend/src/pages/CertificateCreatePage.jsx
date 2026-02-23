import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { languageService } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ArrowRight, FileText, UploadCloud, ChevronLeft } from "lucide-react";
import { getStorageUrl } from "@/lib/utils";

export default function CertificateCreatePage() {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [activeLanguages, setActiveLanguages] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        tc_number: "",
        birth_year: "",
        training_program_id: "",
        certificate_language: "tr",
        duration_hours: "",
        start_date: "",
        end_date: "",
        issue_date: new Date().toISOString().split('T')[0],
        photo: null // Öğrenci Resmi
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tplRes, prgRes, langRes] = await Promise.all([
                api.get("/certificate-templates"),
                api.get("/training-programs"),
                languageService.getAll()
            ]);
            setTemplates(tplRes.data);
            setPrograms(prgRes.data);
            setActiveLanguages(langRes.filter(l => l.is_active));
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
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('tc_number', formData.tc_number);
            data.append('birth_year', formData.birth_year);

            data.append('training_program_id', formData.training_program_id);
            data.append('certificate_template_id', selectedTemplate.id);
            data.append('certificate_language', formData.certificate_language);

            data.append('duration_hours', formData.duration_hours);
            data.append('start_date', formData.start_date);
            data.append('end_date', formData.end_date);
            data.append('issue_date', formData.issue_date); // Also serves as issue date internally

            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            await api.post("/certificates", data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshUser(); // Update balance in frontend
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
                <Card className="max-w-4xl mx-auto shadow-lg border-0 dark:bg-slate-900">
                    <div className="p-8 space-y-8">
                        {/* Row 1: İsim & Soyisim */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">İsim <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-11"
                                    placeholder="Tam İsim Giriniz"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Soyisim <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-11"
                                    placeholder="Soyisim Giriniz"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Row 2: TC/Pasaport & Doğum Yılı */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">TC Kimlik No / Pasaport No <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-11"
                                    placeholder="TC Kimlik No / Pasaport No Giriniz"
                                    value={formData.tc_number}
                                    onChange={e => setFormData({ ...formData, tc_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Doğum Yılı <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-11"
                                    placeholder="Doğum Yılı Giriniz"
                                    type="number"
                                    min="1900"
                                    max="2099"
                                    value={formData.birth_year}
                                    onChange={e => setFormData({ ...formData, birth_year: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Row 3: Eğitim & Sertifika Dil */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Eğitim <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, training_program_id: v })} value={formData.training_program_id}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Eğitim Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {typeof p.name === 'object' ? (p.name.tr || Object.values(p.name)[0] || 'İsimsiz Eğitim') : (p.name || 'İsimsiz Eğitim')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Sertifika Dil <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, certificate_language: v })} value={formData.certificate_language}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Sertifika Dil Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeLanguages.map(l => (
                                            <SelectItem key={l.code} value={l.code}>
                                                {l.name} ({l.code.toUpperCase()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 4: Eğitim Süresi, Başlangıç Tarihi, Bitiş Tarihi */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Eğitim Süresi (Saat) <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-11"
                                    placeholder="Eğitim Süresi Giriniz"
                                    type="number"
                                    value={formData.duration_hours}
                                    onChange={e => setFormData({ ...formData, duration_hours: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Eğitim Başlangıç Tarihi <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    className="h-11 justify-between flex"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Eğitim Bitiş Tarihi <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    className="h-11 justify-between flex"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Row 5: Öğrenci Resmi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 pt-2">
                                <Label className="text-base font-semibold">Öğrenci Resmi</Label>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-md p-1 pl-3 h-11 flex items-center bg-white dark:bg-slate-950">
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        className="hidden"
                                        id="student-photo-upload"
                                        onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                    />
                                    <Label htmlFor="student-photo-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded text-sm font-medium mr-3">
                                        Dosya Seç
                                    </Label>
                                    <span className="text-slate-500 text-sm truncate">
                                        {formData.photo ? formData.photo.name : "Dosya seçilmedi"}
                                    </span>
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
