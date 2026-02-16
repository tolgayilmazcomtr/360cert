import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerificationPage() {
    const { hash } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await api.get(`/certificates/verify/${hash}`);
                setCertificate(response.data);
            } catch (err) {
                setError("Sertifika bulunamadı veya geçersiz.");
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [hash]);

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
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 text-green-700 p-3 rounded-md text-center font-medium border border-green-200">
                                Bu sertifika geçerlidir.
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Öğrenci</p>
                                    <p className="font-medium text-lg">{certificate.student.first_name} {certificate.student.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">TC No</p>
                                    <p className="font-medium text-lg">*** ** {certificate.student.tc_number.slice(-3)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Eğitim Programı</p>
                                    <p className="font-medium text-lg">{certificate.training_program.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Sertifika No</p>
                                    <p className="font-medium">{certificate.certificate_no}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Veriliş Tarihi</p>
                                    <p className="font-medium">{new Date(certificate.issue_date).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t text-center">
                                <Badge variant="outline" className="text-xs">
                                    Hash: {certificate.qr_code_hash}
                                </Badge>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
