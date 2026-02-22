import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { languageService } from "@/services/languageService";
import { useToast } from "@/hooks/use-toast";

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
                    <CardHeader>
                        <CardTitle>Sistem Dilleri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingLanguages ? (
                            <p className="text-sm text-gray-500">Diller yükleniyor...</p>
                        ) : (
                            <div className="space-y-4">
                                {languages.map((lang) => (
                                    <div key={lang.id} className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">{lang.name}</Label>
                                            <p className="text-sm text-gray-500">Dil Kodu: {lang.code.toUpperCase()}</p>
                                        </div>
                                        <Switch
                                            checked={lang.is_active}
                                            onCheckedChange={() => handleLanguageToggle(lang.id, lang.is_active)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-4">
                            Sertifikalar ve eğitim programları için kullanılacak dilleri buradan aktif edebilir veya kapatabilirsiniz.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
