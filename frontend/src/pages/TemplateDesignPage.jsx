import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Type, GripVertical, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getStorageUrl } from "@/lib/utils";

const FONTS = [
    "Arial",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Playfair Display",
    "Merriweather",
    "Poppins",
    "Oswald"
];

export default function TemplateDesignPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ elements: [] });
    const [selectedElementIndex, setSelectedElementIndex] = useState(null);

    // Zoom state
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null); // Ref for the scrollable container

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 });

    // Load Google Fonts
    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:ital,wght@0,400;0,700;1,400&family=Open+Sans:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,400;0,700;1,400&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get("/certificate-templates");
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

    // Handle global mouse move/up for dragging
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (!isDragging || selectedElementIndex === null) return;

            e.preventDefault();
            // Adjust delta by scale to ensure 1:1 movement relative to cursor
            const deltaX = (e.clientX - dragStart.x) / scale;
            const deltaY = (e.clientY - dragStart.y) / scale;

            setConfig(prev => {
                const newElements = [...prev.elements];
                newElements[selectedElementIndex] = {
                    ...newElements[selectedElementIndex],
                    x: Math.round(dragStart.elX + deltaX),
                    y: Math.round(dragStart.elY + deltaY)
                };
                return { ...prev, elements: newElements };
            });
        };

        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart, selectedElementIndex, scale]);

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
        setConfig(prev => {
            const newElements = [...prev.elements];
            newElements[index] = { ...newElements[index], [field]: value };
            return { ...prev, elements: newElements };
        });
    };

    const handleElementMouseDown = (e, index) => {
        e.stopPropagation();
        setSelectedElementIndex(index);
        setIsDragging(true);
        const el = config.elements[index];
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            elX: el.x,
            elY: el.y
        });
    };

    const handleImageLoad = (e) => {
        const natW = e.target.naturalWidth;
        const natH = e.target.naturalHeight;

        if (natW && natH) {
            console.log("Image loaded, resizing canvas to:", natW, natH);
            setConfig(prev => {
                // Only update if dimensions differ significantly to avoid loops
                if (prev.canvasWidth !== natW || prev.canvasHeight !== natH) {
                    return { ...prev, canvasWidth: natW, canvasHeight: natH };
                }
                return prev;
            });
            // Auto fit after resize
            setTimeout(fitToScreen, 100);
        }
    };

    const fitToScreen = () => {
        if (!containerRef.current || !config.canvasWidth || !config.canvasHeight) return;
        const containerW = containerRef.current.clientWidth - 64; // padding
        const containerH = containerRef.current.clientHeight - 64;

        const scaleW = containerW / config.canvasWidth;
        const scaleH = containerH / config.canvasHeight;

        // Use the smaller scale to fit both dimensions
        const newScale = Math.min(scaleW, scaleH, 1); // Don't zoom in more than 100% by default
        setScale(newScale);
    };

    // Additional effect to fit on load if dimensions are already known
    useEffect(() => {
        if (!loading && template && config.canvasWidth) {
            fitToScreen();
        }
    }, [loading, template]);

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
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 rounded-md px-2 py-1 text-xs border flex items-center gap-2">
                        <Button variant="ghost" size="xs" onClick={() => setScale(Math.max(0.1, scale - 0.1))}>-</Button>
                        <span>{Math.round(scale * 100)}%</span>
                        <Button variant="ghost" size="xs" onClick={() => setScale(Math.min(3, scale + 0.1))}>+</Button>
                        <Button variant="ghost" size="xs" onClick={fitToScreen} className="text-blue-600">Sığdır</Button>
                    </div>
                    <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Save size={16} />
                        Kaydet
                    </Button>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-80 overflow-y-auto pr-2 space-y-4 shrink-0">
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

                            <div className="flex gap-2 mt-4">
                                <Button size="xs" variant="outline" className="flex-1 text-xs" onClick={() => setConfig({ ...config, canvasWidth: 1123, canvasHeight: 794 })}>
                                    A4 Yatay
                                </Button>
                                <Button size="xs" variant="outline" className="flex-1 text-xs" onClick={() => setConfig({ ...config, canvasWidth: 794, canvasHeight: 1123 })}>
                                    A4 Dikey
                                </Button>
                            </div>
                            <Separator className="my-4" />
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
                        {/* Elements List */}
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
                                                <div><Label className="text-xs">X</Label><Input type="number" value={el.x} onChange={e => updateElement(index, 'x', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                                <div><Label className="text-xs">Y</Label><Input type="number" value={el.y} onChange={e => updateElement(index, 'y', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs">Font B.</Label><Input type="number" value={el.font_size || 14} onChange={e => updateElement(index, 'font_size', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                                <div><Label className="text-xs">Renk</Label><Input type="color" value={el.color || '#000000'} onChange={e => updateElement(index, 'color', e.target.value)} className="h-7 w-full p-1" /></div>
                                            </div>
                                            <div className="pt-2">
                                                <Label className="text-xs">Yazı Tipi</Label>
                                                <select
                                                    className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                    value={el.font_family || 'Arial'}
                                                    onChange={e => updateElement(index, 'font_family', e.target.value)}
                                                >
                                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 bg-slate-200/50 rounded-lg overflow-auto flex items-center justify-center p-8 border relative">
                    {/* Canvas Wrapper for Centering */}
                    <div style={{
                        width: `${(config.canvasWidth || 800) * scale}px`,
                        height: `${(config.canvasHeight || 600) * scale}px`,
                        transition: 'width 0.2s, height 0.2s',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        <div
                            className="shadow-2xl bg-white origin-top-left transition-transform duration-200"
                            style={{
                                width: `${config.canvasWidth || 800}px`,
                                height: `${config.canvasHeight || 600}px`,
                                transform: `scale(${scale})`,
                            }}
                        >
                            {/* Background Image Layer */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <img
                                    src={getStorageUrl(template.background_path)}
                                    alt="Background"
                                    className="w-full h-full"
                                    style={{
                                        objectFit: config.backgroundMode === 'contain' ? 'contain' : (config.backgroundMode === 'cover' ? 'cover' : 'fill')
                                    }}
                                    onLoad={handleImageLoad}
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
                                        fontFamily: el.font_family || 'Arial',
                                    }}
                                    onMouseDown={(e) => handleElementMouseDown(e, index)}
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
        </div>
    );
}
