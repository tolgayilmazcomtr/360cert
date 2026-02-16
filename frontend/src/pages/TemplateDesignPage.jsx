import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Type, GripVertical, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TemplateDesignPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ elements: [] });
    const [selectedElementIndex, setSelectedElementIndex] = useState(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get("/certificate-templates"); // We might need a single get endpoint, but list search is fine for now
                const found = response.data.find(t => t.id.toString() === id);
                if (found) {
                    setTemplate(found);
                    let parsedConfig = found.layout_config;
                    if (typeof parsedConfig === 'string') {
                        try {
                            parsedConfig = JSON.parse(parsedConfig);
                        } catch (e) {
                            parsedConfig = { elements: [] };
                        }
                    }
                    // Defaults
                    if (!parsedConfig.canvasWidth) parsedConfig.canvasWidth = 800;
                    if (!parsedConfig.canvasHeight) parsedConfig.canvasHeight = 600;

                    setConfig(parsedConfig);
                } else {
                    alert("Şablon bulunamadı (ID hatalı olabilir)");
                }
            } catch (error) {
                console.error("Şablon yüklenemedi", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id]);

    const handleSave = async () => {
        try {
            await api.put(`/certificate-templates/${id}`, {
                layout_config: config
            });
            alert("Tasarım kaydedildi.");
        } catch (error) {
            console.error("Kaydetme hatası", error);
            alert("Hata oluştu.");
        }
    };

    const updateElement = (index, field, value) => {
        const newElements = [...config.elements];
        newElements[index] = { ...newElements[index], [field]: value };
        setConfig({ ...config, elements: newElements });
    };

    const handleImageClick = (e) => {
        if (selectedElementIndex === null) return;

        // Use nativeEvent.offsetX/Y which gives coordinates relative to the target element (image)
        // This is much more reliable than calculating client rects manually if the image is the target.
        const x = Math.round(e.nativeEvent.offsetX);
        const y = Math.round(e.nativeEvent.offsetY);

        updateElement(selectedElementIndex, 'x', x);
        updateElement(selectedElementIndex, 'y', y);
    };

    if (loading) return <div>Yükleniyor...</div>;
    if (!template) return <div>Şablon bulunamadı.</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate('/templates')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <h2 className="text-2xl font-bold">{template.name} Tasarımı</h2>
                </div>
                <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Save size={16} />
                    Kaydet
                </Button>
            </div>

            <div className="flex gap-6 h-full">
                {/* Sidebar Controls */}
                <div className="w-80 overflow-y-auto pr-2 space-y-4">
                    {/* Page Settings */}
                    <Card className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Settings size={16} />
                            Sayfa Ayarları
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Genişlik (px)</Label>
                                    <Input
                                        type="number"
                                        value={config.canvasWidth || 800}
                                        onChange={(e) => setConfig({ ...config, canvasWidth: parseInt(e.target.value) })}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Yükseklik (px)</Label>
                                    <Input
                                        type="number"
                                        value={config.canvasHeight || 600}
                                        onChange={(e) => setConfig({ ...config, canvasHeight: parseInt(e.target.value) })}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="xs" variant="outline" className="flex-1 text-xs" onClick={() => setConfig({ ...config, canvasWidth: 1123, canvasHeight: 794 })}>
                                    A4 Yatay
                                </Button>
                                <Button size="xs" variant="outline" className="flex-1 text-xs" onClick={() => setConfig({ ...config, canvasWidth: 794, canvasHeight: 1123 })}>
                                    A4 Dikey
                                </Button>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-xs">Arkaplan Yerleşimi</Label>
                                <select
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={config.backgroundMode || 'stretch'}
                                    onChange={(e) => setConfig({ ...config, backgroundMode: e.target.value })}
                                >
                                    <option value="stretch">Sayfaya Yay (Tam Sığdır)</option>
                                    <option value="contain">Orantılı Sığdır (Boşluk Kalabilir)</option>
                                    <option value="cover">Orantılı Doldur (Taşabilir)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Type size={16} />
                            Metin Alanları
                        </h3>
                        <div className="space-y-4">
                            {config.elements.map((el, index) => (
                                <div
                                    key={index}
                                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedElementIndex === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedElementIndex(index)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">{el.label}</span>
                                        <GripVertical size={14} className="text-slate-400" />
                                    </div>

                                    {selectedElementIndex === index && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">X</Label>
                                                    <Input
                                                        type="number"
                                                        value={el.x}
                                                        onChange={e => updateElement(index, 'x', parseInt(e.target.value))}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Y</Label>
                                                    <Input
                                                        type="number"
                                                        value={el.y}
                                                        onChange={e => updateElement(index, 'y', parseInt(e.target.value))}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">Font (px)</Label>
                                                    <Input
                                                        type="number"
                                                        value={el.font_size || 14}
                                                        onChange={e => updateElement(index, 'font_size', parseInt(e.target.value))}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Renk</Label>
                                                    <Input
                                                        type="color"
                                                        value={el.color || '#000000'}
                                                        onChange={e => updateElement(index, 'color', e.target.value)}
                                                        className="h-7 w-full p-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            İpucu: Bir alanı seçin ve sağdaki görsel üzerinde istediğiniz yere tıklayın.
                        </p>
                    </Card>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-slate-200/50 rounded-lg overflow-auto flex items-center justify-center p-8 border">
                    <div
                        className="relative shadow-2xl bg-white transition-all duration-300"
                        style={{
                            width: `${config.canvasWidth || 800}px`,
                            height: `${config.canvasHeight || 600}px`
                        }}
                    >
                        {/* Background Image Layer */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <img
                                src={`http://127.0.0.1:8000/storage/${template.background_path}`}
                                alt="Background"
                                className="w-full h-full pointer-events-auto"
                                style={{
                                    objectFit: config.backgroundMode === 'contain' ? 'contain' : (config.backgroundMode === 'cover' ? 'cover' : 'fill')
                                }}
                                onClick={handleImageClick}
                            />
                        </div>

                        {/* Elements Layer */}
                        {config.elements.map((el, index) => (
                            <div
                                key={index}
                                className={`absolute whitespace-nowrap select-none cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-300 ${selectedElementIndex === index ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}
                                style={{
                                    left: `${el.x}px`,
                                    top: `${el.y}px`,
                                    fontSize: `${el.font_size || 14}px`,
                                    color: el.color || '#000000',
                                    fontFamily: el.font_family || 'sans-serif',
                                    transform: 'translateY(-50%)'
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation(); // Stop clicking image
                                    setSelectedElementIndex(index);
                                }}
                            >
                                {el.type === 'qr_code' ? (
                                    <div className="border border-dashed border-black w-[100px] h-[100px] flex items-center justify-center text-xs bg-white/50">
                                        QR Alanı
                                    </div>
                                ) : (
                                    `[${el.label}]`
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
