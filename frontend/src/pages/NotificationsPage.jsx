import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Bell, Send, CheckCheck, Trash2, AlertCircle,
    CheckCircle2, XCircle, FileText, Megaphone, Info, RefreshCw
} from "lucide-react";

const TYPE_CONFIG = {
    announcement: { icon: Megaphone, color: "text-blue-600 bg-blue-50", label: "Duyuru" },
    announcement_sent: { icon: Send, color: "text-slate-500 bg-slate-50", label: "Gönderildi" },
    certificate_approved: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", label: "Onaylandı" },
    certificate_rejected: { icon: XCircle, color: "text-rose-600 bg-rose-50", label: "Reddedildi" },
    certificate_submitted: { icon: FileText, color: "text-indigo-600 bg-indigo-50", label: "Yeni Talep" },
    update_request: { icon: AlertCircle, color: "text-amber-600 bg-amber-50", label: "Güncelleme Talebi" },
    general: { icon: Info, color: "text-slate-600 bg-slate-50", label: "Genel" },
};

function getTypeConfig(type) {
    return TYPE_CONFIG[type] || TYPE_CONFIG['general'];
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff} saniye önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const isAdmin = user?.role === 'admin';

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'announcements', 'cert_events'

    // Announce form (admin only)
    const [announceForm, setAnnounceForm] = useState({ title: "", body: "", target: "all" });
    const [sending, setSending] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch {
            toast({ title: "Hata", description: "Bildirimler yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            const now = new Date().toISOString();
            setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
            toast({ title: "Tümü okundu olarak işaretlendi." });
        } catch { }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch { }
    };

    const handleAnnounce = async (e) => {
        e.preventDefault();
        if (!announceForm.title || !announceForm.body) {
            toast({ title: "Hata", description: "Başlık ve mesaj alanları zorunludur.", variant: "destructive" });
            return;
        }
        setSending(true);
        try {
            await api.post('/notifications/announce', announceForm);
            toast({ title: "Duyuru Gönderildi ✅", description: "Tüm hedef bayilere bildirim gönderildi." });
            setAnnounceForm({ title: "", body: "", target: "all" });
            fetchNotifications(); // refresh to see the sent entry
        } catch (err) {
            toast({ title: "Hata", description: err.response?.data?.message || "Gönderilemedi.", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read_at;
        if (filter === 'announcements') return n.type === 'announcement' || n.type === 'announcement_sent';
        if (filter === 'cert_events') return ['certificate_approved', 'certificate_rejected', 'certificate_submitted'].includes(n.type);
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg relative">
                        <Bell size={24} className="text-blue-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Bildirimler</h2>
                        <p className="text-sm text-slate-500">
                            {unreadCount > 0 ? `${unreadCount} okunmamış bildiriminiz var` : 'Tüm bildirimler okundu'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-1">
                        <RefreshCw size={14} /> Yenile
                    </Button>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <CheckCheck size={14} /> Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Notification List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                        {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'unread', label: `Okunmamış${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
                            { key: 'cert_events', label: 'Sertifika' },
                            { key: 'announcements', label: 'Duyurular' },
                        ].map(f => (
                            <button
                                key={f.key}
                                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${filter === f.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 mr-3" />
                            Yükleniyor...
                        </div>
                    ) : filtered.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center text-slate-400">
                                <Bell size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Bu kategoride bildirim yok.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(n => {
                                const cfg = getTypeConfig(n.type);
                                const Icon = cfg.icon;
                                const isUnread = !n.read_at;
                                return (
                                    <div
                                        key={n.id}
                                        className={`flex gap-3 p-4 rounded-lg border transition-all cursor-default ${isUnread ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100'}`}
                                        onClick={() => isUnread && handleMarkRead(n.id)}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 h-fit ${cfg.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    {n.title}
                                                    {isUnread && <span className="ml-2 inline-flex w-2 h-2 bg-blue-500 rounded-full" />}
                                                </p>
                                                <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.created_at)}</span>
                                            </div>
                                            {n.body && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.body}</p>}
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                <div className="flex gap-1">
                                                    {isUnread && (
                                                        <button
                                                            className="text-xs text-blue-500 hover:text-blue-700 px-1"
                                                            onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                                                        >
                                                            Okundu
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-rose-400 hover:text-rose-600 p-1"
                                                        onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="space-y-4">
                    {/* Admin: Send Announcement */}
                    {isAdmin && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Megaphone size={18} className="text-blue-600" />
                                    Duyuru Gönder
                                </CardTitle>
                                <CardDescription>Seçilen bayilere bildirim olarak iletilir</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleAnnounce}>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-xs">Başlık *</Label>
                                        <Input
                                            id="title"
                                            value={announceForm.title}
                                            onChange={e => setAnnounceForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="Duyuru başlığı"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="body" className="text-xs">Mesaj *</Label>
                                        <Textarea
                                            id="body"
                                            value={announceForm.body}
                                            onChange={e => setAnnounceForm(p => ({ ...p, body: e.target.value }))}
                                            placeholder="Bayilere gidecek mesajınız..."
                                            rows={4}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Hedef Kitle</Label>
                                        <Select value={announceForm.target} onValueChange={v => setAnnounceForm(p => ({ ...p, target: v }))}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tüm Onaylı Bayiler</SelectItem>
                                                <SelectItem value="active">Aktif + Onaylı Bayiler</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={sending} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Send size={14} />
                                        {sending ? "Gönderiliyor..." : "Duyuruyu Gönder"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    )}

                    {/* Stats */}
                    <Card className="bg-slate-50 border-slate-100">
                        <CardContent className="pt-4 space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">İstatistikler</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Toplam</span>
                                    <span className="font-bold">{notifications.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Okunmamış</span>
                                    <span className="font-bold text-blue-600">{unreadCount}</span>
                                </div>
                                {isAdmin && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Gönderilen Duyurular</span>
                                        <span className="font-bold">{notifications.filter(n => n.type === 'announcement_sent').length}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
