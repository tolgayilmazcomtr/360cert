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
    ArrowUpRight,
    Activity,
    Wallet,
    Package,
    History,
    UploadCloud,
    Settings,
    Building,
    GraduationCap,
    Crown
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
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

    const gradientMap = {
        blue: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-glow-primary",
        purple: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-glow-purple",
        emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-glow-success",
        orange: "bg-gradient-to-br from-orange-400 to-orange-500 shadow-glow-warning",
        rose: "bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20",
        indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20",
    };

    const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:-translate-y-1 ${gradientMap[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-90">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
                    {subtext && <p className="mt-1 text-xs opacity-80 font-medium">{subtext}</p>}
                </div>
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <Icon size={24} className="text-white" />
                </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-bl-full pointer-events-none" />
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, to, color, badge }) => (
        <Link to={to} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-between">
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20 bg-${color}-500`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={28} />
                    </div>
                    {badge && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-rose-500 rounded-full shadow-sm">{badge}</span>
                    )}
                </div>

                <div>
                    <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-${color}-600 transition-colors`}>{title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
            </div>

            <div className={`mt-6 flex items-center text-sm font-bold text-${color}-600 opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}>
                İşleme Git <ArrowUpRight className="ml-1 h-4 w-4" />
            </div>
        </Link>
    );

    const dealerActions = [
        { title: "Sertifika Oluştur", desc: "Tekil sertifika oluşturun.", icon: FileText, to: "/certificates/new", color: "blue" },
        { title: "Toplu Yükleme", desc: "Excel ile çoklu sertifika.", icon: UploadCloud, to: "/certificates/bulk", color: "indigo", badge: "Hızlı" },
        { title: "Bakiye Yükle", desc: "Kredi kartı ile ödeme.", icon: CreditCard, to: "/balance", color: "emerald" },
        { title: "Paket Satın Al", desc: "Avantajlı sertifika paketleri.", icon: Package, to: "/packages", color: "orange", badge: "Fırsat" },
        { title: "Öğrenci Listesi", desc: "Kayıtlı öğrencilerinizi yönetin.", icon: Users, to: "/students", color: "purple" },
        { title: "Ödeme Geçmişi", desc: "Faturalar ve ödemeler.", icon: History, to: "/payment-history", color: "rose" },
    ];

    const adminActions = [
        { title: "Bayi Yönetimi", desc: "Bayileri ve bakiyeleri yönetin.", icon: Building, to: "/dealers", color: "blue" },
        { title: "Sertifika Şablonları", desc: "Yeni tasarım oluşturun.", icon: Settings, to: "/templates", color: "purple" },
        { title: "Eğitim Programları", desc: "Program ve fiyatları düzenleyin.", icon: GraduationCap, to: "/programs", color: "emerald" },
        { title: "Finansal Raporlar", desc: "Sistem gelirlerini inceleyin.", icon: Activity, to: "/finance", color: "orange" },
    ];

    const actions = user?.role === 'admin' ? adminActions : dealerActions;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Ana Sayfa</h2>
                    <p className="text-slate-500 dark:text-slate-400">Hoş geldiniz, {user?.name} 👋</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="shadow-sm border-slate-200 dark:border-slate-800">
                        <Link to={user.role === 'admin' ? "/finance" : "/payment-history"}>
                            <History className="mr-2 h-4 w-4" /> Geçmiş
                        </Link>
                    </Button>
                    <Button asChild className="shadow-glow-primary bg-primary hover:bg-primary/90">
                        <Link to="/certificates/new">
                            <FileText className="mr-2 h-4 w-4" /> Sertifika Oluştur
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Toplam Sertifika"
                    value={metrics.total_certificates}
                    icon={FileText}
                    color="blue"
                />
                <StatCard
                    title={user.role === 'admin' ? "Toplam Öğrenci" : "Öğrencilerim"}
                    value={metrics.total_students}
                    subtext={user.role !== 'admin' ? `Kota: ${metrics.quota - metrics.total_students} Kalan` : null}
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title={user.role === 'admin' ? "Toplam Hasılat" : "Toplam Harcama"}
                    value={formatCurrency(metrics.total_volume)}
                    icon={TrendingUp}
                    color="emerald"
                />
                <StatCard
                    title="Güncel Bakiye"
                    value={formatCurrency(metrics.balance)}
                    subtext="Bakiyeniz güvende"
                    icon={Wallet}
                    color="orange"
                />
            </div>

            {/* Quick Actions Grid (Dynamic based on Role) */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 px-1">
                    Hızlı İşlemler
                </h3>
                <div className={`grid gap-6 sm:grid-cols-2 ${user.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                    {actions.map((action, index) => (
                        <QuickActionCard key={index} {...action} />
                    ))}
                </div>
            </div>

            {/* Main Content Grid (Charts & Activity) */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-1 lg:col-span-4 border-none shadow-soft dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Sertifika Trendi
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Son 6 aylık sertifika üretim istatistikleri</p>
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
                <Card className="col-span-1 lg:col-span-3 border-none shadow-soft flex flex-col dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <History className="h-5 w-5 text-purple-500" />
                            Son İşlemler
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Son oluşturulan 5 sertifika</p>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {recent_activity.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-10">Henüz işlem yok.</p>
                            ) : (
                                recent_activity.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.student?.first_name} {item.student?.last_name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {typeof item.training_program?.name === 'object'
                                                        ? (item.training_program.name[item.certificate_language] || item.training_program.name.tr || Object.values(item.training_program.name)[0])
                                                        : item.training_program?.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.cost)}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
