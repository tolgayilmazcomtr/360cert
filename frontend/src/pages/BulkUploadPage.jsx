import { useState } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BulkUploadPage() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setResult(null);
        try {
            const response = await api.post("/students/import", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setResult({ success: true, message: `İşlem başarılı! Toplam ${response.data.count || 'N/A'} kayıt eklendi.` });
        } catch (error) {
            console.error("Import hatası", error);
            setResult({ success: false, message: error.response?.data?.message || "Dosya yüklenirken hata oluştu." });
        } finally {
            setLoading(false);
        }
    };

    const downloadSample = () => {
        // Create a dummy CSV for download
        const csvContent = "data:text/csv;charset=utf-8,tc_no,ad,soyad,email,telefon,sehir\n11111111111,Ahmet,Yılmaz,ahmet@email.com,5555555555,İstanbul";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ornek_ogrenci_listesi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Toplu Sertifika Ekle</h2>
                <p className="text-muted-foreground">Excel/CSV dosyası ile toplu öğrenci yükleyin ve sertifika oluşturun.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Instructions Card */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">1. Adım: Örnek Dosyayı İndirin</CardTitle>
                            <CardDescription>
                                Yükleme yapmadan önce örnek şablonu indirip verilerinizi bu formata göre hazırlayın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={downloadSample}>
                                <Download size={16} />
                                Örnek Excel Dosyasını İndir
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Yükleme Kuralları</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                <p><strong>TC Kimlik No:</strong> 11 haneli ve benzersiz olmalıdır.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                <p><strong>Zorunlu Alanlar:</strong> Ad, Soyad, TC No.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                <p><strong>Dosya Formatı:</strong> Sadece .csv veya .xlsx dosyaları kabul edilir.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upload Card */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-lg">2. Adım: Dosya Yükleme</CardTitle>
                        <CardDescription>Hazırladığınız dosyayı buraya sürükleyin veya seçin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative bg-slate-50/50">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                <div className="w-16 h-16 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-4">
                                    <FileSpreadsheet size={32} />
                                </div>
                                {file ? (
                                    <div>
                                        <p className="font-semibold text-primary">{file.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium text-foreground">Dosyayı buraya bırakın</p>
                                        <p className="text-sm text-muted-foreground mt-1">veya seçmek için tıklayın</p>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" disabled={!file || loading} className="w-full h-12 text-base">
                                {loading ? "Yükleniyor..." : "Yüklemeyi Başlat"}
                            </Button>

                            {result && (
                                <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "border-green-200 bg-green-50 text-green-800" : ""}>
                                    {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <AlertTitle>{result.success ? "Başarılı" : "Hata"}</AlertTitle>
                                    <AlertDescription>{result.message}</AlertDescription>
                                </Alert>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
