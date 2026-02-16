import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
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
            </div>
        </div>
    );
}
