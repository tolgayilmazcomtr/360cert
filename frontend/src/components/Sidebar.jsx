import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "../api/axios";
import {
    Users,
    CreditCard,
    FileText,
    Home,
    Settings,
    LogOut,
    GraduationCap,
    Building,
    QrCode,
    Bell,
    ChevronRight,
    ChevronDown,
    Shield,
    UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const adminMenu = [
        { name: "Genel Bakış", icon: Home, path: "/dashboard" },
        { name: "Bayi Yönetimi", icon: Building, path: "/dashboard/dealers" },
        {
            name: "Sertifikasyon",
            icon: FileText,
            subItems: [
                { name: "Sertifika Veritabanı", path: "/dashboard/certificates" },
                { name: "Şablon Tasarımları", path: "/dashboard/templates" },
                { name: "Sertifika Türleri", path: "/dashboard/certificate-types" },
                { name: "Eğitim Programları", path: "/dashboard/programs" },
            ]
        },
        { name: "Öğrenciler", icon: Users, path: "/dashboard/students" },
        { name: "Finansal Raporlar", icon: CreditCard, path: "/dashboard/finance" },
        { name: "Duyurular", icon: Bell, path: "/dashboard/notifications" },
        { name: "Sistem Ayarı", icon: Settings, path: "/dashboard/settings" },
        { name: "Yönetici Profilim", icon: UserCog, path: "/dashboard/admin/profile" },
        { name: "Yönetici Hesapları", icon: Shield, path: "/dashboard/admin/users" },
    ];

    const dealerMenu = [
        { name: "Genel Bakış", icon: Home, path: "/dashboard" },
        { name: "Öğrenciler", icon: Users, path: "/dashboard/students" },
        { name: "Sertifikalar", icon: FileText, path: "/dashboard/certificates" },
        { name: "Bildirimler", icon: Bell, path: "/dashboard/notifications" },
        { name: "Bakiye & Ödeme", icon: CreditCard, path: "/dashboard/balance" },
        { name: "Paketler", icon: CreditCard, path: "/dashboard/packages" },
        { name: "Ödeme Geçmişi", icon: CreditCard, path: "/dashboard/payment-history" },
        { name: "Profilim", icon: Settings, path: "/dashboard/profile" },
    ];

    const menu = user?.role === 'admin' ? adminMenu : dealerMenu;

    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingUpdatesCount, setPendingUpdatesCount] = useState(0);
    const [openMenus, setOpenMenus] = useState({});
    const [siteLogo, setSiteLogo] = useState(null);
    const [siteTitle, setSiteTitle] = useState("IAC");

    const toggleMenu = (name) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.get('/notifications/unread-count');
                setUnreadCount(res.data.count || 0);
            } catch { }

            if (user?.role === 'admin') {
                try {
                    const res = await api.get('/dealers/update-requests/pending-count');
                    setPendingUpdatesCount(res.data.count || 0);
                } catch { }
            }
        };

        const fetchPublicSettings = async () => {
            try {
                const res = await api.get('/public/settings');
                if (res.data) {
                    if (res.data.site_logo) setSiteLogo(res.data.site_logo);
                    if (res.data.site_title) setSiteTitle(res.data.site_title);
                }
            } catch (err) { }
        };

        fetchCounts();
        fetchPublicSettings();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [user?.role]);

    return (
        <div className="flex flex-col h-full bg-white border-r border-border w-[280px] shrink-0 transition-all relative">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                {siteLogo ? (
                    <img src={siteLogo} alt="Logo" className="w-auto h-10 object-contain" />
                ) : (
                    <>
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {siteTitle.charAt(0) || '3'}
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{siteTitle}</h1>
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase truncate">v1.0.0</p>
                        </div>
                    </>
                )}
            </div>

            {/* Menu Section */}
            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Menü</p>
                {menu.map((item) => {
                    if (item.subItems) {
                        const isAnyChildActive = item.subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
                        const isOpen = openMenus[item.name] !== undefined ? openMenus[item.name] : isAnyChildActive;

                        return (
                            <div key={item.name} className="mb-1">
                                <Button
                                    variant="ghost"
                                    onClick={() => toggleMenu(item.name)}
                                    className={cn(
                                        "w-full justify-start gap-3 px-4 py-6 rounded-lg transition-all duration-200 group relative",
                                        isAnyChildActive ? "text-[#1890ff] font-medium" : "text-muted-foreground hover:text-primary hover:bg-blue-50/50"
                                    )}
                                >
                                    <item.icon size={18} className={cn(
                                        "transition-colors",
                                        isAnyChildActive ? "text-[#1890ff]" : "text-muted-foreground group-hover:text-[#1890ff]"
                                    )} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <div className="ml-auto">
                                        {isOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                                    </div>
                                </Button>
                                {isOpen && (
                                    <div className="ml-[22px] mt-1 pl-4 border-l border-slate-200 space-y-1 py-1">
                                        {item.subItems.map(subItem => {
                                            const isActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                                            return (
                                                <Link key={subItem.path} to={subItem.path}>
                                                    <Button
                                                        variant="ghost"
                                                        className={cn(
                                                            "w-full justify-start gap-3 px-3 py-1.5 h-auto min-h-[32px] rounded-md transition-all duration-200 my-0.5",
                                                            isActive ? "bg-[#e6f7ff] text-[#1890ff] font-medium" : "text-muted-foreground hover:text-primary hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className="text-[13px]">{subItem.name}</span>
                                                    </Button>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                    const isNotifLink = item.path === '/notifications';
                    const isDealerLink = item.path === '/dealers';
                    return (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 mb-1 px-4 py-6 rounded-lg transition-all duration-200 group relative",
                                    !isActive && "text-muted-foreground hover:text-primary hover:bg-blue-50/50",
                                    isActive && "bg-[#e6f7ff] text-[#1890ff] font-medium shadow-sm border-r-2 border-[#1890ff] rounded-r-none"
                                )}
                            >
                                <item.icon size={18} className={cn(
                                    "transition-colors",
                                    isActive ? "text-[#1890ff]" : "text-muted-foreground group-hover:text-[#1890ff]"
                                )} />
                                <span className="text-sm">{item.name}</span>
                                {isNotifLink && unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                                {isDealerLink && pendingUpdatesCount > 0 && user?.role === 'admin' && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {pendingUpdatesCount > 9 ? '9+' : pendingUpdatesCount}
                                    </span>
                                )}
                                {isActive && !isNotifLink && !isDealerLink && (
                                    <ChevronRight size={14} className="ml-auto opacity-50" />
                                )}
                            </Button>
                        </Link>
                    );
                })}
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-border mx-2 mb-2 bg-gray-50/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role === 'admin' ? 'Yönetici' : 'Bayi'}</p>
                    </div>
                </div>

                {user?.role !== 'admin' && (
                    <div className="mb-3 px-2 py-1.5 bg-green-50 rounded border border-green-100 flex items-center justify-between">
                        <span className="text-[10px] text-green-700 font-medium">Bakiye</span>
                        <span className="text-xs font-bold text-green-700">{user?.balance || 0} TL</span>
                    </div>
                )}

                <Button
                    variant="outline"
                    className="w-full h-8 text-xs gap-2 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                    onClick={logout}
                >
                    <LogOut size={12} />
                    Çıkış Yap
                </Button>
            </div>
        </div>
    );
}
