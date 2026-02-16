import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Duyurular ve Bildirimler</h2>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send size={20} />
                            Yeni Duyuru Gönder
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Başlık</Label>
                            <Input placeholder="Duyuru Başlığı" />
                        </div>
                        <div className="space-y-2">
                            <Label>Mesaj</Label>
                            <Textarea placeholder="Tüm bayilere gidecek mesajınız..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Hedef Kitle</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option>Tüm Bayiler</option>
                                <option>Aktif Bayiler</option>
                            </select>
                        </div>
                        <Button className="w-full">Gönder</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell size={20} />
                            Gönderim Geçmişi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="border-b pb-4">
                                <h4 className="font-semibold">Sistem Bakım Çalışması</h4>
                                <p className="text-sm text-muted-foreground">Tüm Bayiler • 2 gün önce</p>
                            </div>
                            <div className="border-b pb-4">
                                <h4 className="font-semibold">Yeni Sertifika Şablonları Yayında</h4>
                                <p className="text-sm text-muted-foreground">Tüm Bayiler • 1 hafta önce</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Ödeme Sistemi Güncellemesi</h4>
                                <p className="text-sm text-muted-foreground">Tüm Bayiler • 2 hafta önce</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Label({ children }) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}
