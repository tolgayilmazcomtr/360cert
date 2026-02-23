import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VerificationPage() {
    const { hash } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLang, setSelectedLang] = useState('tr');
    const [availableLangs, setAvailableLangs] = useState(['tr']);
    const [isDownloading, setIsDownloading] = useState(false);

    // Safe base URL for downloads
    const apiBaseUrl = (() => {
        const raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
        return raw.replace(/\/$/, ""); // Remove trailing slash if any
    })();

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await api.get(`/certificates/verify/${hash}`);
                const cert = response.data;
                setCertificate(cert);

                // Determine available languages from training_program.name
                if (cert.training_program && typeof cert.training_program.name === 'object') {
                    const langs = Object.keys(cert.training_program.name);
                    if (langs.length > 0) {
                        setAvailableLangs(langs);
                        // Default to the language it was created in if available, else first lang
                        if (langs.includes(cert.certificate_language)) {
                            setSelectedLang(cert.certificate_language);
                        } else {
                            setSelectedLang(langs[0]);
                        }
                    }
                } else if (cert.certificate_language) {
                    setSelectedLang(cert.certificate_language);
                }
            } catch (err) {
                setError("Sertifika bulunamadı veya geçersiz.");
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [hash]);

    const handleDownload = () => {
        setIsDownloading(true);
        // We use window.open to directly trigger the browser download
        const url = `${apiBaseUrl}/certificates/verify/${hash}/download?lang=${selectedLang}`;
        window.open(url, '_blank');
        setTimeout(() => setIsDownloading(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {loading ? (
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        ) : error ? (
                            <XCircle className="text-red-500" size={64} />
                        ) : (
                            <CheckCircle className="text-green-500" size={64} />
                        )}
                    </div>
                    <CardTitle className="text-2xl">Sertifika Doğrulama</CardTitle>
                    <CardDescription>
                        360Cert Doğrulama Sistemi
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-center text-muted-foreground">Sorgulanıyor...</p>
                    ) : error ? (
                        <div className="text-center">
                            <p className="text-red-600 font-medium text-lg">Geçersiz Sertifika</p>
                            <p className="text-sm text-muted-foreground mt-2">{error}</p>
                        </div>
                    ) : (certificate && certificate.student) ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 text-green-700 p-3 rounded-md text-center font-medium border border-green-200">
                                Bu sertifika geçerlidir.
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Öğrenci</p>
                                    <p className="font-medium text-lg">{certificate.student?.first_name} {certificate.student?.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">TC No</p>
                                    <p className="font-medium text-lg">*** ** {certificate.student?.tc_number ? certificate.student.tc_number.slice(-3) : '***'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Eğitim Programı</p>
                                    <p className="font-medium text-lg">
                                        {typeof certificate.training_program?.name === 'object'
                                            ? (certificate.training_program.name[certificate.certificate_language] || certificate.training_program.name.tr || Object.values(certificate.training_program.name)[0])
                                            : certificate.training_program?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Sertifika No</p>
                                    <p className="font-medium">{certificate.certificate_no}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Veriliş Tarihi</p>
                                    <p className="font-medium">{certificate.issue_date ? new Date(certificate.issue_date).toLocaleDateString('tr-TR') : '-'}</p>
                                </div>
                            </div>


                            <div className="pt-4 border-t text-center">
                                <Badge variant="outline" className="text-xs mb-4">
                                    Hash: {certificate.qr_code_hash}
                                </Badge>

                                <div className="p-4 bg-slate-100/50 rounded-xl space-y-4 border border-slate-200">
                                    <h4 className="text-sm font-semibold text-slate-700">Sertifikayı İndir</h4>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                            <Globe size={16} className="text-slate-500" />
                                            <Select value={selectedLang} onValueChange={setSelectedLang}>
                                                <SelectTrigger className="w-[120px] h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0">
                                                    <SelectValue placeholder="Dil Seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableLangs.map(lang => (
                                                        <SelectItem key={lang} value={lang} className="uppercase font-medium">
                                                            {lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : lang}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {isDownloading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                            {isDownloading ? 'Hazırlanıyor...' : 'PDF İndir'}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">İstediğiniz dili seçerek sertifikanızın orijinal PDF formatını indirebilirsiniz.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-red-600">Veri hatası</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
