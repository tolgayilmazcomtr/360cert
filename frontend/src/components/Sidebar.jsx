import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
    Shield,
    UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const adminMenu = [
        { name: "Genel Bakış", icon: Home, path: "/" },
        { name: "Bayi Yönetimi", icon: Building, path: "/dealers" },
        { name: "Sertifikalar", icon: FileText, path: "/certificates" },
        { name: "Şablon Tasarımı", icon: Settings, path: "/templates" },
        { name: "Eğitim Programları", icon: GraduationCap, path: "/programs" },
        { name: "Öğrenciler", icon: Users, path: "/students" },
        { name: "Finansal Raporlar", icon: CreditCard, path: "/finance" },
        { name: "Duyurular", icon: Bell, path: "/notifications" },
        { name: "Sistem Ayarı", icon: Settings, path: "/settings" },
        { name: "Yönetici Profilim", icon: UserCog, path: "/admin/profile" },
        { name: "Yönetici Hesapları", icon: Shield, path: "/admin/users" },
    ];

    const dealerMenu = [
        { name: "Genel Bakış", icon: Home, path: "/" },
        { name: "Öğrenciler", icon: Users, path: "/students" },
        { name: "Sertifikalar", icon: FileText, path: "/certificates" },
        { name: "Bakiye & Ödeme", icon: CreditCard, path: "/balance" },
        { name: "Paketler", icon: CreditCard, path: "/packages" },
        { name: "Ödeme Geçmişi", icon: CreditCard, path: "/payment-history" },
        { name: "Profilim", icon: Settings, path: "/profile" },
    ];

    const menu = user?.role === 'admin' ? adminMenu : dealerMenu;

    return (
        <div className="flex flex-col h-full bg-white border-r border-border w-[280px] shrink-0 transition-all relative">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">
                    3
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">IAC</h1>
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">v1.0.0</p>
                </div>
            </div>

            {/* Menu Section */}
            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Menü</p>
                {menu.map((item) => {
                    const isActive = location.pathname === item.path;
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
                                {isActive && (
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
