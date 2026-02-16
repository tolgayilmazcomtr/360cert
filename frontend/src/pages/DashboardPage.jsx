import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    FileText,
    Clock,
    Calendar,
    Plus,
    Upload,
    Package,
    History,
    Wallet
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCertificates: 0,
        pendingCertificates: 0,
        monthlyCertificates: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetching for now or real if endpoints exist
        // api.get("/stats").then...

        // Simulating data fetch
        setTimeout(() => {
            setStats({
                totalCertificates: 120,
                pendingCertificates: 5,
                monthlyCertificates: 12
            });
            setLoading(false);
        }, 500);
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
        <Card className="border-none shadow-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-full ${bgClass} ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </CardContent>
        </Card>
    );

    const ActionCard = ({ title, icon: Icon, path, colorClass = "text-primary", bgClass = "bg-blue-50" }) => (
        <Link to={path} className="block group">
            <Card className="border-none shadow-card hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center py-8 cursor-pointer group-hover:-translate-y-1">
                <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${bgClass} group-hover:bg-primary group-hover:text-white ${colorClass}`}>
                    <Icon size={32} />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
            </Card>
        </Link>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Ana Sayfa</h2>
                <p className="text-muted-foreground">Hoş geldiniz, {user?.name}</p>
            </div>

            {/* Financial Stats Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-card bg-white relative overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Toplam Bakiye</p>
                            <h3 className="text-3xl font-bold text-foreground">{user?.balance || 0} TL</h3>
                        </div>
                        <div className="p-4 rounded-full bg-blue-50 text-primary">
                            <Wallet size={32} />
                        </div>
                    </CardContent>
                    {/* Decorative Circle */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 z-0"></div>
                </Card>

                <Card className="border-none shadow-card bg-white relative overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Toplam Borç</p>
                            <h3 className="text-3xl font-bold text-red-500">0.00 TL</h3>
                        </div>
                        <div className="p-4 rounded-full bg-red-50 text-red-500">
                            <CreditCard size={32} />
                        </div>
                    </CardContent>
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full opacity-50 z-0"></div>
                </Card>
            </div>

            {/* Certificate Stats Row */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    title="Toplam Sertifika"
                    value={stats.totalCertificates}
                    icon={FileText}
                    colorClass="text-emerald-500"
                    bgClass="bg-emerald-50"
                />
                <StatCard
                    title="Onay Bekleyen"
                    value={stats.pendingCertificates}
                    icon={Clock}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-50"
                />
                <StatCard
                    title="Bu Ay Eklenen"
                    value={stats.monthlyCertificates}
                    icon={Calendar}
                    colorClass="text-purple-500"
                    bgClass="bg-purple-50"
                />
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Hızlı İşlemler</h3>
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <ActionCard title="Tüm Sertifikalar" icon={FileText} path="/certificates" />
                    <ActionCard title="Sertifika Ekle" icon={Plus} path="/certificates/new" bgClass="bg-primary/10" />
                    <ActionCard title="Toplu Yükleme" icon={Upload} path="/certificates/bulk" colorClass="text-orange-500" bgClass="bg-orange-50" />
                    <ActionCard title="Paketler" icon={Package} path="/packages" colorClass="text-indigo-500" bgClass="bg-indigo-50" />
                    <ActionCard title="Bakiye İşlemleri" icon={Wallet} path="/balance" colorClass="text-green-500" bgClass="bg-green-50" />
                    <ActionCard title="Ödeme Geçmişi" icon={History} path="/payment-history" colorClass="text-slate-500" bgClass="bg-slate-50" />
                </div>
            </div>

            {/* Bottom Info Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-card">
                    <CardContent className="p-6 text-center py-12">
                        <h4 className="font-semibold text-muted-foreground">Onay Bekleyen Transkript Talepleri</h4>
                        <p className="text-xs text-muted-foreground mt-2">Bulunmamaktadır.</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-card">
                    <CardContent className="p-6 text-center py-12">
                        <h4 className="font-semibold text-muted-foreground">Onay Bekleyen Profil Kart Talepleri</h4>
                        <p className="text-xs text-muted-foreground mt-2">Bulunmamaktadır.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
