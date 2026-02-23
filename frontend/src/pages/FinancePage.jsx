import { useState, useEffect } from "react";
import api from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Legend } from "recharts";

const packageData = [
    { name: "Standart Paket", count: 400 },
    { name: "Pro Paket", count: 300 },
    { name: "Kurumsal", count: 300 },
    { name: "Öğrenci Ind.", count: 200 },
];

export default function FinancePage() {
    const [financeData, setFinanceData] = useState({
        metrics: { total_income: 0, pending_amount: 0, pending_count: 0, active_dealer_balance: 0, trend: "+0%" },
        chart_data: [],
        package_data: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinanceData = async () => {
            try {
                const response = await api.get('/finance/stats');
                setFinanceData(response.data);
            } catch (error) {
                console.error("Finans verileri yüklenemedi", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;

    const { metrics, chart_data, package_data } = financeData;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Finansal Raporlar</h2>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺{Number(metrics.total_income).toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground">{metrics.trend} geçen döneme göre</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺{Number(metrics.pending_amount).toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground">{metrics.pending_count} adet onay bekleyen</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Bayi Bakiyesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺{Number(metrics.active_dealer_balance).toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground">Sistemdeki hazır bakiye</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Gelir Gider Akışı</CardTitle>
                        <CardDescription>
                            Son 6 aydaki finansal hareketlerin özeti
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} tickFormatter={(value) => `₺${value}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#333' }}
                                        formatter={(value) => [`₺${value}`, undefined]}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area type="monotone" name="Gelir" dataKey="income" stroke="#8884d8" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" name="Gider" dataKey="expense" stroke="#82ca9d" fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Paket Satışları</CardTitle>
                        <CardDescription>
                            Bu ay satılan veya yüklenen paket türleri
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={package_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Satış Adedi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
