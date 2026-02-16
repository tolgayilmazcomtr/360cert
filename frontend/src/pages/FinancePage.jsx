import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Finansal Raporlar</h2>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺45,231.89</div>
                        <p className="text-xs text-muted-foreground">+20.1% geçen aydan beri</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺2,350.00</div>
                        <p className="text-xs text-muted-foreground">3 adet onay bekleyen</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Bayi Bakiyesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺12,000.00</div>
                    </CardContent>
                </Card>
            </div>

            <div className="h-[400px] border rounded-lg flex items-center justify-center bg-slate-50 text-muted-foreground p-8 text-center">
                <p>Detaylı gelir/gider grafikleri hazırlanıyor...</p>
            </div>
        </div>
    );
}
