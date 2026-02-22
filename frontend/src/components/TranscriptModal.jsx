import { useState, useEffect } from "react";
import api from "../api/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export default function TranscriptModal({ isOpen, onClose, certificate }) {
    const [loading, setLoading] = useState(false);

    // Default Data Structure
    const defaultData = {
        module_info: {
            course_total_hours: "",
            course_total_grade: "",
            course_total_score: "",
            competency_total_hours: "",
            competency_total_grade: "",
            competency_total_score: "",
            grand_total_hours: "",
            grand_total_grade: "",
            grand_total_score: ""
        },
        course_modules: [],
        competency_modules: []
    };

    const [data, setData] = useState(defaultData);

    useEffect(() => {
        if (isOpen && certificate) {
            if (certificate.transcript_data) {
                // Merge with default to ensure all keys exist
                setData({
                    module_info: { ...defaultData.module_info, ...(certificate.transcript_data.module_info || {}) },
                    course_modules: certificate.transcript_data.course_modules || [],
                    competency_modules: certificate.transcript_data.competency_modules || []
                });
            } else {
                setData(defaultData);
            }
        }
    }, [isOpen, certificate]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/certificates/${certificate.id}/transcript`, { transcript_data: data });
            alert("Transkript kaydedildi!");
            onClose(true); // pass true to indicate a refresh might be needed
        } catch (error) {
            console.error(error);
            alert("Kaydedilirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const updateModuleInfo = (key, value) => {
        setData(prev => ({
            ...prev,
            module_info: { ...prev.module_info, [key]: value }
        }));
    };

    const addCourseModule = () => {
        setData(prev => ({
            ...prev,
            course_modules: [...prev.course_modules, { name_tr: "", name_en: "", hours: "", grade: "", score: "" }]
        }));
    };

    const updateCourseModule = (index, key, value) => {
        const newModules = [...data.course_modules];
        newModules[index][key] = value;
        setData(prev => ({ ...prev, course_modules: newModules }));
    };

    const removeCourseModule = (index) => {
        setData(prev => ({
            ...prev,
            course_modules: prev.course_modules.filter((_, i) => i !== index)
        }));
    };

    // Duplicate logic for Competency
    const addCompetencyModule = () => {
        setData(prev => ({
            ...prev,
            competency_modules: [...prev.competency_modules, { name_tr: "", name_en: "", hours: "", grade: "", score: "" }]
        }));
    };

    const updateCompetencyModule = (index, key, value) => {
        const newModules = [...data.competency_modules];
        newModules[index][key] = value;
        setData(prev => ({ ...prev, competency_modules: newModules }));
    };

    const removeCompetencyModule = (index) => {
        setData(prev => ({
            ...prev,
            competency_modules: prev.competency_modules.filter((_, i) => i !== index)
        }));
    };

    if (!certificate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose(false)}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Transkript Ekle / Düzenle</DialogTitle>
                    <DialogDescription>
                        Öğrencinin transkript bilgilerini girerek PDF üretebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                {/* Header Info Banner like the image */}
                <div className="bg-slate-50 border rounded-lg p-4 flex gap-6 mt-2 shrink-0">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Öğrenci Ad & Soyad:</p>
                        <p className="font-semibold text-lg">{certificate.student?.first_name} {certificate.student?.last_name}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Bayi Adı:</p>
                        <p className="font-semibold text-lg">{certificate.student?.user?.name || '-'}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Kurs Adı:</p>
                        <p className="font-semibold text-lg uppercase">
                            {typeof certificate.training_program?.name === 'string'
                                ? certificate.training_program.name
                                : (certificate.training_program?.name?.tr || '-')}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 mt-4 custom-scrollbar">
                    <Tabs defaultValue="module_info" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger value="module_info" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-3">Modül Bilgileri</TabsTrigger>
                            <TabsTrigger value="courses" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-3">Ders Modülleri</TabsTrigger>
                            <TabsTrigger value="competency" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-3">Yeterlilik Ders Modülleri</TabsTrigger>
                        </TabsList>

                        <TabsContent value="module_info" className="mt-6 space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                {/* Course Modules Totals */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-2">Ders Modülü Toplamları</h4>
                                    <div>
                                        <Label className="text-xs">Toplam Süre <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.course_total_hours} onChange={e => updateModuleInfo('course_total_hours', e.target.value)} placeholder="Örn: 2224" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Toplam Harf Notu <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.course_total_grade} onChange={e => updateModuleInfo('course_total_grade', e.target.value)} placeholder="Örn: A" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Toplam Puan <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.course_total_score} onChange={e => updateModuleInfo('course_total_score', e.target.value)} placeholder="Örn: 92.4" />
                                    </div>
                                </div>

                                {/* Competency Totals */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-2">Yeterlilik Modülü Toplamları</h4>
                                    <div>
                                        <Label className="text-xs">Toplam Süre</Label>
                                        <Input value={data.module_info.competency_total_hours} onChange={e => updateModuleInfo('competency_total_hours', e.target.value)} placeholder="-" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Toplam Harf Notu</Label>
                                        <Input value={data.module_info.competency_total_grade} onChange={e => updateModuleInfo('competency_total_grade', e.target.value)} placeholder="-" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Toplam Puan</Label>
                                        <Input value={data.module_info.competency_total_score} onChange={e => updateModuleInfo('competency_total_score', e.target.value)} placeholder="-" />
                                    </div>
                                </div>

                                {/* Grand Totals */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-2">Genel Toplam</h4>
                                    <div>
                                        <Label className="text-xs">Genel Toplam Süre <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.grand_total_hours} onChange={e => updateModuleInfo('grand_total_hours', e.target.value)} placeholder="Örn: 2224" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Genel Toplam Not <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.grand_total_grade} onChange={e => updateModuleInfo('grand_total_grade', e.target.value)} placeholder="Örn: A" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Genel Toplam Puan <span className="text-red-500">*</span></Label>
                                        <Input value={data.module_info.grand_total_score} onChange={e => updateModuleInfo('grand_total_score', e.target.value)} placeholder="Örn: 92.4" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="courses" className="mt-6">
                            <div className="flex justify-end mb-4">
                                <Button size="sm" onClick={addCourseModule} className="gap-1 bg-blue-500 hover:bg-blue-600">
                                    <Plus size={16} /> Ekle
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {data.course_modules.map((mod, idx) => (
                                    <div key={idx} className="flex gap-3 items-end bg-slate-50 p-3 rounded-md border border-slate-100">
                                        <div className="w-8 shrink-0 text-center text-sm font-semibold text-slate-400 pb-2">
                                            {idx + 1}.
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Ders Adı Türkçe <span className="text-red-500">*</span></Label>
                                            <Input value={mod.name_tr} onChange={e => updateCourseModule(idx, 'name_tr', e.target.value)} placeholder="Örn: Un Tanımı" />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Ders Adı İngilizce <span className="text-red-500">*</span></Label>
                                            <Input value={mod.name_en} onChange={e => updateCourseModule(idx, 'name_en', e.target.value)} placeholder="Eg: Definition of Flour" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Süre <span className="text-red-500">*</span></Label>
                                            <Input value={mod.hours} onChange={e => updateCourseModule(idx, 'hours', e.target.value)} placeholder="140" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Harf Notu <span className="text-red-500">*</span></Label>
                                            <Input value={mod.grade} onChange={e => updateCourseModule(idx, 'grade', e.target.value)} placeholder="A" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Puan <span className="text-red-500">*</span></Label>
                                            <Input value={mod.score} onChange={e => updateCourseModule(idx, 'score', e.target.value)} placeholder="90" />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeCourseModule(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Sil">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {data.course_modules.length === 0 && (
                                    <div className="text-center py-10 text-slate-500 border border-dashed rounded-lg">
                                        Henüz ders modülü eklenmedi.
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="competency" className="mt-6">
                            <div className="flex justify-end mb-4">
                                <Button size="sm" onClick={addCompetencyModule} className="gap-1 bg-blue-500 hover:bg-blue-600">
                                    <Plus size={16} /> Ekle
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {data.competency_modules.map((mod, idx) => (
                                    <div key={idx} className="flex gap-3 items-end bg-slate-50 p-3 rounded-md border border-slate-100">
                                        <div className="w-8 shrink-0 text-center text-sm font-semibold text-slate-400 pb-2">
                                            Y{idx + 1}.
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Y. Ders Adı Türkçe <span className="text-red-500">*</span></Label>
                                            <Input value={mod.name_tr} onChange={e => updateCompetencyModule(idx, 'name_tr', e.target.value)} placeholder="Yeterlilik Ders Adı" />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Y. Ders Adı İngilizce <span className="text-red-500">*</span></Label>
                                            <Input value={mod.name_en} onChange={e => updateCompetencyModule(idx, 'name_en', e.target.value)} placeholder="Competency Course" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Süre <span className="text-red-500">*</span></Label>
                                            <Input value={mod.hours} onChange={e => updateCompetencyModule(idx, 'hours', e.target.value)} placeholder="140" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Harf Notu <span className="text-red-500">*</span></Label>
                                            <Input value={mod.grade} onChange={e => updateCompetencyModule(idx, 'grade', e.target.value)} placeholder="A" />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Puan <span className="text-red-500">*</span></Label>
                                            <Input value={mod.score} onChange={e => updateCompetencyModule(idx, 'score', e.target.value)} placeholder="90" />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeCompetencyModule(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Sil">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {data.competency_modules.length === 0 && (
                                    <div className="text-center py-10 text-slate-500 border border-dashed rounded-lg">
                                        İsteğe bağlı. Henüz yeterlilik ders modülü eklenmedi.
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="mt-6 shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => onClose(false)}>İptal</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
