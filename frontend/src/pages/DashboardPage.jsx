import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    FileText,
    Users,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Wallet,
    Download
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setStats(res.data);
        } catch (error) {
            console.error("Dashboard verileri yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Yükleniyor...</div>;
    }

    const { metrics, chart_data, recent_activity } = stats || {
        metrics: { total_certificates: 0, total_students: 0, total_volume: 0, balance: 0, quota: 0 },
        chart_data: [],
        recent_activity: []
    };

    if (!stats) return <div className="p-10 text-center">Veriler yüklenemedi. Lütfen backend servisini kontrol edin.</div>;

    const GradientCard = ({ title, value, subtext, icon: Icon, gradient, shadowClass }) => (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-soft transition-transform hover:-translate-y-1 ${gradient} ${shadowClass}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-90">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold">{value}</h3>
                    {subtext && <p className="mt-1 text-xs opacity-80">{subtext}</p>}
                </div>
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <Icon size={24} className="text-white" />
                </div>
            </div>
            {/* Background decoration */}
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Ana Sayfa</h2>
                    <p className="text-slate-500">Hoş geldiniz, {user?.name} 👋</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="shadow-sm">
                        <Link to="/reports">Raporlar</Link>
                    </Button>
                    <Button asChild className="shadow-glow-primary bg-primary hover:bg-primary/90">
                        <Link to="/certificates">Sertifikalar</Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <GradientCard
                    title="Toplam Sertifika"
                    value={metrics.total_certificates}
                    icon={FileText}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                    shadowClass="shadow-glow-primary"
                />
                <GradientCard
                    title={user.role === 'admin' ? "Toplam Öğrenci" : "Öğrencilerim"}
                    value={metrics.total_students}
                    subtext={user.role !== 'admin' ? `Kota: ${metrics.quota - metrics.total_students} Kalan` : null}
                    icon={Users}
                    gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                    shadowClass="shadow-glow-purple"
                />
                <GradientCard
                    title={user.role === 'admin' ? "Toplam Hasılat" : "Toplam Harcama"}
                    value={formatCurrency(metrics.total_volume)}
                    icon={TrendingUp}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    shadowClass="shadow-glow-success"
                />
                <GradientCard
                    title="Güncel Bakiye"
                    value={formatCurrency(metrics.balance)}
                    subtext="Bakiyeniz güvende"
                    icon={Wallet}
                    gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                    shadowClass="shadow-glow-warning"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-1 lg:col-span-4 border-none shadow-soft">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Sertifika Trendi</CardTitle>
                        <p className="text-sm text-slate-500">Son 6 aylık sertifika üretim istatistikleri</p>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity / Side Panel */}
                <Card className="col-span-1 lg:col-span-3 border-none shadow-soft flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Son İşlemler</CardTitle>
                        <p className="text-sm text-slate-500">Son oluşturulan 5 sertifika</p>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {recent_activity.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-10">Henüz işlem yok.</p>
                            ) : (
                                recent_activity.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{item.student?.first_name} {item.student?.last_name}</p>
                                                <p className="text-xs text-slate-500">{item.training_program?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800">{formatCurrency(item.cost)}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Pending Tasks */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-1 md:col-span-2 border-none shadow-soft bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Hızlı Sertifika Oluştur</h3>
                            <p className="text-slate-300 mb-6 max-w-md">
                                Hemen yeni bir sertifika oluşturarak öğrencilerinize teslim edin.
                                Şablon seçin, bilgileri girin ve anında PDF alın.
                            </p>
                            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 border-none">
                                <Link to="/certificates">Sertifika Oluştur <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                        <div className="opacity-80 hidden md:block">
                            <FileText size={120} strokeWidth={0.5} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-none shadow-soft">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Sistem Durumu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Sunucu Durumu</span>
                                <span className="flex items-center text-xs font-medium text-green-600">
                                    <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                                    Aktif
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">API Yanıt Süresi</span>
                                <span className="text-xs font-medium text-slate-800">45ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Sertifika Kuyruğu</span>
                                <span className="text-xs font-medium text-slate-800">Boş</span>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Button variant="outline" className="w-full text-xs h-8">Sistem Raporunu İndir</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
