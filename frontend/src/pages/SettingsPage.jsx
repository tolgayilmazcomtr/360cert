import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { languageService } from "@/services/languageService";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const [languages, setLanguages] = useState([]);
    const [loadingLanguages, setLoadingLanguages] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoadingLanguages(true);
            const data = await languageService.getAll();
            setLanguages(data);
        } catch (error) {
            console.error("Diller yüklenirken hata oluştu:", error);
        } finally {
            setLoadingLanguages(false);
        }
    };

    const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
    const [newLanguage, setNewLanguage] = useState({ name: "", code: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddLanguage = async () => {
        if (!newLanguage.name || !newLanguage.code) {
            toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
            return;
        }

        try {
            setIsSubmitting(true);
            const added = await languageService.create({
                name: newLanguage.name,
                code: newLanguage.code.toLowerCase(),
                is_active: true
            });
            setLanguages([...languages, added]);
            setIsAddLanguageOpen(false);
            setNewLanguage({ name: "", code: "" });
            toast({ title: "Başarılı", description: "Yeni dil eklendi." });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Dil eklenirken bir hata oluştu. Kodun benzersiz olduğundan emin olun.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLanguage = async (id) => {
        if (!window.confirm("Bu dili silmek istediğinizden emin misiniz?")) return;

        try {
            await languageService.delete(id);
            setLanguages(languages.filter(l => l.id !== id));
            toast({ title: "Başarılı", description: "Dil silindi." });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Şu anda bu dili silerken bir hata oluştu. Muhtemelen kullanımda olabilir.",
                variant: "destructive",
            });
        }
    };

    const handleLanguageToggle = async (id, currentValue) => {
        try {
            const updated = await languageService.updateStatus(id, !currentValue);
            setLanguages(languages.map(lang => lang.id === id ? updated : lang));
            toast({
                title: "Başarılı",
                description: "Dil durumu güncellendi.",
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Dil durumu güncellenirken bir hata oluştu.",
                variant: "destructive",
            });
        }
    };
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Genel Ayarlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Site Başlığı</Label>
                            <Input defaultValue="360Cert Sertifika Sistemi" />
                        </div>
                        <div className="space-y-2">
                            <Label>Destek E-posta</Label>
                            <Input defaultValue="destek@360cert.com" />
                        </div>
                        <Button>Kaydet</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>E-posta Sunucu (SMTP) Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <Input placeholder="smtp.example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input placeholder="587" />
                        </div>
                        <Button variant="outline">Bağlantıyı Test Et</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Sistem Dilleri</CardTitle>
                            <CardDescription>Sertifika eğitim adları için kullanılacak diller.</CardDescription>
                        </div>
                        <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-1">
                                    <Plus className="h-4 w-4" /> Yeni Dil
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Yeni Dil Ekle</DialogTitle>
                                    <DialogDescription>
                                        Sisteme yeni bir dil ekleyin. Örn: Almanca, Kod: de
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Dil Adı (Örn: Almanca)</Label>
                                        <Input
                                            value={newLanguage.name}
                                            onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                                            placeholder="Almanca"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dil Kodu (Örn: de)</Label>
                                        <Input
                                            value={newLanguage.code}
                                            onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
                                            placeholder="de"
                                            maxLength={5}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddLanguageOpen(false)}>İptal</Button>
                                    <Button onClick={handleAddLanguage} disabled={isSubmitting}>
                                        {isSubmitting ? "Ekleniyor..." : "Ekle"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {loadingLanguages ? (
                            <p className="text-sm text-gray-500">Diller yükleniyor...</p>
                        ) : (
                            <div className="space-y-4">
                                {languages.map((lang) => (
                                    <div key={lang.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">{lang.name}</Label>
                                            <p className="text-sm text-gray-500">Kodu: {lang.code.toUpperCase()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">{lang.is_active ? 'Aktif' : 'Pasif'}</Label>
                                                <Switch
                                                    checked={lang.is_active}
                                                    onCheckedChange={() => handleLanguageToggle(lang.id, lang.is_active)}
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteLanguage(lang.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                            Sertifikalar oluşturulurken seçilebilecek dilleri buradan aktif edebilir veya silebilirsiniz. Bir dil önceden alınmış sertifikalarla veya mevcut eğitim isimleriyle ilişkiliyse silinmeyebilir.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
