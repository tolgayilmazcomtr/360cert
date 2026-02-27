import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { LogIn, Building, Menu, Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LayoutDashboard } from "lucide-react";
import FloatingWhatsApp from "./FloatingWhatsApp";
import FloatingSearchButton from "./FloatingSearchButton";

export default function PublicLayout() {
    const { user, isLoading } = useAuth();
    const [settings, setSettings] = useState({
        site_title: "360Cert",
        site_logo: null,
        contact_email: "",
        contact_phone: "",
        contact_address: "",
        social_facebook: "",
        social_instagram: "",
        social_linkedin: "",
        social_twitter: "",
        social_youtube: "",
        whatsapp_number: "",
        whatsapp_message: ""
    });
    const [pages, setPages] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/public/settings');
                if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
            } catch (err) { }
        };

        const fetchPages = async () => {
            try {
                const res = await api.get('/public/pages');
                if (res.data) setPages(res.data);
            } catch (err) { }
        };

        fetchSettings();
        fetchPages();
    }, []);

    const headerPages = pages.filter(p => p.show_in_header).sort((a, b) => a.order - b.order);
    const footerPages = pages.filter(p => p.show_in_footer).sort((a, b) => a.order - b.order);

    const renderMenuLink = (page) => {
        if (page.is_external) {
            return (
                <a key={page.id} href={page.external_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                    {page.title}
                </a>
            );
        }
        return (
            <Link key={page.id} to={`/${page.slug}`} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                {page.title}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* Floating Actions */}
            <FloatingWhatsApp number={settings.whatsapp_number} message={settings.whatsapp_message} />
            <FloatingSearchButton />

            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-3">
                        {settings.site_logo ? (
                            <img src={settings.site_logo} alt="Logo" className="h-10 w-auto object-contain" />
                        ) : (
                            <div className="flex items-center justify-center bg-primary text-white font-bold h-10 w-10 flex-shrink-0 rounded-lg text-xl">
                                {settings.site_title.charAt(0)}
                            </div>
                        )}
                    </Link>

                    {/* Dynamic Header Menu */}
                    <nav className="hidden md:flex items-center gap-6 ml-6">
                        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Ana Sayfa</Link>
                        {headerPages.map(renderMenuLink)}
                        <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">İletişim</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {isLoading ? null : user ? (
                        <Link to="/dashboard">
                            <Button variant="ghost" className="hidden sm:flex items-center gap-2">
                                <LayoutDashboard size={18} />
                                <span className="font-semibold text-primary">{user.name}</span>
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button variant="ghost" className="hidden sm:flex items-center gap-2">
                                <LogIn size={18} />
                                <span>Giriş Yap</span>
                            </Button>
                        </Link>
                    )}
                    {!user && (
                        <Link to="/apply-dealer" className="hidden sm:block">
                            <Button className="flex items-center gap-2">
                                <Building size={18} />
                                <span>Bayi Başvurusu</span>
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Navigation Toggle */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
                            <SheetDescription className="sr-only">Mobil navigasyon bağlantıları</SheetDescription>

                            <div className="flex flex-col gap-8 h-full">
                                <div className="flex items-center gap-3 pt-6">
                                    {settings.site_logo ? (
                                        <img src={settings.site_logo} alt="Logo" className="h-8 w-auto object-contain" />
                                    ) : (
                                        <div className="flex items-center justify-center bg-primary text-white font-bold h-8 w-8 flex-shrink-0 rounded-lg text-lg">
                                            {settings.site_title.charAt(0)}
                                        </div>
                                    )}
                                    <h1 className="text-lg font-bold text-slate-800">{settings.site_title}</h1>
                                </div>

                                <nav className="flex flex-col gap-4">
                                    <Link to="/" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">Ana Sayfa</Link>
                                    {headerPages.map(renderMenuLink)}
                                    <Link to="/contact" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">İletişim</Link>
                                </nav>

                                {!user && (
                                    <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-3">
                                        <Button asChild className="w-full flex justify-start items-center gap-2">
                                            <Link to="/apply-dealer">
                                                <Building size={18} />
                                                Bayi Başvurusu
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                <Outlet context={{ settings }} />
            </main>

            {/* Dynamic Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {settings.site_logo ? (
                                <img src={settings.site_logo} alt="Logo" className="h-10 w-auto object-contain bg-white p-1 rounded" />
                            ) : (
                                <div className="flex items-center justify-center bg-primary text-white font-bold h-10 w-10 flex-shrink-0 rounded-lg text-xl border border-slate-700">
                                    {settings.site_title.charAt(0)}
                                </div>
                            )}
                            <h2 className="text-xl font-bold text-white">{settings.site_title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Resmi onaylı ve güvenilir altyapı ile sertifikasyon yönetiminde lider çözüm ortağınız.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            {settings.social_facebook && settings.social_facebook !== '#' && (
                                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Facebook size={20} /></a>
                            )}
                            {settings.social_twitter && settings.social_twitter !== '#' && (
                                <a href={settings.social_twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                            )}
                            {settings.social_instagram && settings.social_instagram !== '#' && (
                                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                            )}
                            {settings.social_linkedin && settings.social_linkedin !== '#' && (
                                <a href={settings.social_linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
                            )}
                            {settings.social_youtube && settings.social_youtube !== '#' && (
                                <a href={settings.social_youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Youtube size={20} /></a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold">Hızlı Bağlantılar</h3>
                        <nav className="flex flex-col gap-2">
                            <Link to="/" className="text-slate-400 hover:text-white text-sm">Ana Sayfa</Link>
                            <Link to="/apply-dealer" className="text-slate-400 hover:text-white text-sm">Bayi Başvurusu</Link>
                            <Link to="/login" className="text-slate-400 hover:text-white text-sm">Sisteme Giriş</Link>
                        </nav>
                    </div>

                    {/* Dynamic Pages */}
                    {footerPages.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold">Kurumsal</h3>
                            <nav className="flex flex-col gap-2">
                                {footerPages.map(page => (
                                    page.is_external ? (
                                        <a key={page.id} href={page.external_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm">
                                            {page.title}
                                        </a>
                                    ) : (
                                        <Link key={page.id} to={`/${page.slug}`} className="text-slate-400 hover:text-white text-sm">
                                            {page.title}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold">İletişim</h3>
                        <div className="flex flex-col gap-3">
                            {(settings.contact_email && settings.contact_email !== '#') && (
                                <div className="flex items-center gap-3 text-slate-400 text-sm">
                                    <Mail size={16} className="text-slate-500" />
                                    <span>{settings.contact_email}</span>
                                </div>
                            )}
                            {(settings.contact_phone && settings.contact_phone !== '#') && (
                                <div className="flex items-center gap-3 text-slate-400 text-sm">
                                    <Phone size={16} className="text-slate-500" />
                                    <span>{settings.contact_phone}</span>
                                </div>
                            )}
                            {(settings.contact_address && settings.contact_address !== '#') && (
                                <div className="flex gap-3 text-slate-400 text-sm">
                                    <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                    <span>{settings.contact_address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                    <p>
                        &copy; {new Date().getFullYear()} {settings.site_title}. Tüm hakları saklıdır. | Yazılım: <a href="https://www.urartisdijital.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Urartis Dijital</a>
                    </p>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} /> Resmi Onaylı Altyapı
                    </div>
                </div>
            </footer>
        </div>
    );
}
