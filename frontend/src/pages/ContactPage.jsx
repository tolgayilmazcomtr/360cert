import { useOutletContext } from "react-router-dom";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
    const { settings } = useOutletContext();

    return (
        <div className="flex-1 bg-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto space-y-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">İletişim</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Bizimle iletişime geçmek için aşağıdaki formu doldurabilir veya iletişim bilgilerimizden bize ulaşabilirsiniz.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">

                {/* Contact Info */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Bize Ulaşın</h2>
                        <p className="text-slate-600 mb-8 leading-relaxed">
                            Sertifikasyon süreçleri, bayi başvuruları veya teknik destek talepleriniz için uzman ekibimiz size yardımcı olmaya hazır.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {settings.contact_email && settings.contact_email !== '#' && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">E-Posta</h3>
                                    <p className="text-slate-500 mt-1">{settings.contact_email}</p>
                                </div>
                            </div>
                        )}

                        {settings.contact_phone && settings.contact_phone !== '#' && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="bg-green-100 text-green-600 p-3 rounded-full">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Telefon</h3>
                                    <p className="text-slate-500 mt-1">{settings.contact_phone}</p>
                                </div>
                            </div>
                        )}

                        {settings.contact_address && settings.contact_address !== '#' && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Merkez Ofis</h3>
                                    <p className="text-slate-500 mt-1">{settings.contact_address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Mesaj Gönderin</h3>
                    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Mesajınız alındı, en kısa sürede dönüş yapılacaktır."); }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Adınız Soyadınız</label>
                                <Input placeholder="Ad Soyad" required className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Telefon Numaranız</label>
                                <Input placeholder="05XX XXX XX XX" className="bg-slate-50 border-slate-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">E-Posta Adresiniz</label>
                            <Input type="email" placeholder="ornek@email.com" required className="bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Mesajınız</label>
                            <Textarea placeholder="Nasıl yardımcı olabiliriz?" required rows={5} className="bg-slate-50 border-slate-200 resize-none" />
                        </div>
                        <Button type="submit" className="w-full h-12 text-base gap-2 group">
                            Gönder
                            <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
