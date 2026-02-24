import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { languageService } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Type, GripVertical, Settings, Info } from "lucide-react";
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
    const [activeLanguages, setActiveLanguages] = useState([]);
    const [newElementType, setNewElementType] = useState("student_name");

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

        const fetchLanguages = async () => {
            try {
                const data = await languageService.getAll();
                setActiveLanguages(data.filter(l => l.is_active));
            } catch (error) {
                console.error("Diller yüklenemedi", error);
            }
        };

        fetchTemplate();
        fetchLanguages();
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

    const handleAddElement = () => {
        if (!newElementType) return;

        // Find label
        let label = "Yeni Alan";
        if (newElementType === 'student_name') label = "Öğrenci Adı Soyadı";
        else if (newElementType === 'certificate_no') label = "Sertifika No";
        else if (newElementType === 'issue_date') label = "Veriliş Tarihi";
        else if (newElementType === 'qr_code') label = "QR Kod";
        else if (newElementType === 'dealer_logo') label = "Yetkili Logosu";
        else if (newElementType === 'training_name') {
            label = "Eğitim Adı";
        } else if (newElementType === 'certificate_type') {
            label = "Sertifika Türü";
        } else if (newElementType === 'custom_text') {
            label = "Sabit Metin";
        }

        const newEl = {
            type: newElementType,
            label: label,
            x: 50,
            y: 50,
            font_size: 14,
            color: '#000000',
            font_family: 'Arial'
        };

        if (newElementType === 'qr_code' || newElementType === 'dealer_logo') {
            newEl.width = 100;
            newEl.height = 100;
        }

        setConfig(prev => ({
            ...prev,
            elements: [...prev.elements, newEl]
        }));
        setSelectedElementIndex(config.elements.length); // Select newly added element
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
                    <Button variant="ghost" onClick={() => navigate('/dashboard/templates')}>
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

                        <div className="flex gap-2 mb-4">
                            <select
                                className="flex flex-1 h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none"
                                value={newElementType}
                                onChange={e => setNewElementType(e.target.value)}
                            >
                                <option value="student_name">Öğrenci Adı Soyadı</option>
                                <option value="certificate_no">Sertifika No</option>
                                <option value="issue_date">Veriliş Tarihi</option>
                                <option value="qr_code">QR Kod</option>
                                <option value="dealer_logo">Yetkili Logosu</option>
                                <option value="training_name">Eğitim Adı</option>
                                <option value="certificate_type">Sertifika Türü</option>
                                <option value="custom_text">Sabit/Serbest Metin</option>
                            </select>
                            <Button size="sm" onClick={handleAddElement}>Ekle</Button>
                        </div>

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
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="xs" className="h-5 w-5 p-0 text-red-500" onClick={(e) => {
                                                e.stopPropagation();
                                                setConfig(prev => ({
                                                    ...prev,
                                                    elements: prev.elements.filter((_, i) => i !== index)
                                                }));
                                                if (selectedElementIndex === index) setSelectedElementIndex(null);
                                            }}>
                                                &times;
                                            </Button>
                                            <GripVertical size={14} className="text-slate-400" />
                                        </div>
                                    </div>
                                    {selectedElementIndex === index && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            {el.type === 'custom_text' && (
                                                <div className="mb-2">
                                                    <Label className="text-xs">Metin İçeriği</Label>
                                                    <textarea
                                                        value={el.label}
                                                        onChange={e => updateElement(index, 'label', e.target.value)}
                                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] mt-1"
                                                    />
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                        <div className="flex items-center gap-1 mb-1 text-blue-700 font-semibold text-xs">
                                                            <Info size={14} />
                                                            <span>Kullanılabilir Değişkenler</span>
                                                        </div>
                                                        <ul className="text-[10px] text-blue-800 space-y-1 ml-4 list-disc">
                                                            <li><code>{`{dealer_name}`}</code>: Yetkili Bayi Adı</li>
                                                            <li><code>{`{student_name}`}</code>: Öğrenci Adı Soyadı</li>
                                                            <li><code>{`{training_name}`}</code>: Eğitim Adı (Türkçe)</li>
                                                            <li><code>{`{training_name_en}`}</code>: Eğitim Adı (İngilizce vb.)</li>
                                                            <li><code>{`{duration_hours}`}</code>: Eğitim Süresi (Saat)</li>
                                                        </ul>
                                                        <p className="text-[9px] text-blue-600 mt-1 italic">* Değişkenler PDF'de otomatik olarak kalın (bold) yazdırılır.</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs">X</Label><Input type="number" value={el.x} onChange={e => updateElement(index, 'x', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                                <div><Label className="text-xs">Y</Label><Input type="number" value={el.y} onChange={e => updateElement(index, 'y', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs">Font B.</Label><Input type="number" value={el.font_size || 14} onChange={e => updateElement(index, 'font_size', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                                                <div><Label className="text-xs">Renk</Label><Input type="color" value={el.color || '#000000'} onChange={e => updateElement(index, 'color', e.target.value)} className="h-7 w-full p-1" /></div>
                                            </div>
                                            {(el.type === 'qr_code' || el.type === 'dealer_logo') && (
                                                <div className="pt-2">
                                                    <Label className="text-xs">Boyut (px)</Label>
                                                    <Input
                                                        type="number"
                                                        value={el.width || 100}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value);
                                                            setConfig(prev => {
                                                                const newElements = [...prev.elements];
                                                                newElements[index] = {
                                                                    ...newElements[index],
                                                                    width: val,
                                                                    height: val
                                                                };
                                                                return { ...prev, elements: newElements };
                                                            });
                                                        }}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            )}
                                            {el.type !== 'qr_code' && el.type !== 'dealer_logo' && (
                                                <>
                                                    <div className="pt-2">
                                                        <Label className="text-xs">Maks Genişlik (px)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Örn: 200 (Boşsa tek satır)"
                                                            value={el.max_width || ''}
                                                            onChange={e => updateElement(index, 'max_width', e.target.value ? parseInt(e.target.value) : null)}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="pt-2">
                                                        <Label className="text-xs">Hizalama</Label>
                                                        <select
                                                            className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                            value={el.text_align || 'left'}
                                                            onChange={e => updateElement(index, 'text_align', e.target.value)}
                                                        >
                                                            <option value="left">Sola Dayalı</option>
                                                            <option value="center">Ortala</option>
                                                            <option value="right">Sağa Dayalı</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}
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
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <div>
                                                    <Label className="text-xs">Kalınlık</Label>
                                                    <select
                                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                        value={el.font_weight || 'normal'}
                                                        onChange={e => updateElement(index, 'font_weight', e.target.value)}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="bold">Kalın (Bold)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Stil</Label>
                                                    <select
                                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                        value={el.font_style || 'normal'}
                                                        onChange={e => updateElement(index, 'font_style', e.target.value)}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="italic">İtalik</option>
                                                    </select>
                                                </div>
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
                            {config.elements.map((el, index) => {
                                const isImage = el.type === 'qr_code' || el.type === 'dealer_logo';
                                return (
                                    <div
                                        key={index}
                                        className={`absolute select-none cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-300 ${selectedElementIndex === index ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}
                                        style={{
                                            left: `${el.x}px`,
                                            top: `${el.y}px`,
                                            fontSize: `${el.font_size || 14}px`,
                                            color: el.color || '#000000',
                                            fontFamily: el.font_family || 'Arial',
                                            fontWeight: el.font_weight || 'normal',
                                            fontStyle: el.font_style || 'normal',
                                            width: el.max_width ? `${el.max_width}px` : 'auto',
                                            whiteSpace: el.max_width && !isImage ? 'normal' : 'nowrap',
                                            wordWrap: el.max_width && !isImage ? 'break-word' : 'normal',
                                            textAlign: el.text_align || 'left'
                                        }}
                                        onMouseDown={(e) => handleElementMouseDown(e, index)}
                                    >
                                        {(el.type === 'qr_code' || el.type === 'dealer_logo') ? (
                                            <div
                                                className={`border border-dashed border-black inline-flex items-center justify-center text-xs bg-white/50 ${el.type === 'dealer_logo' ? 'rounded' : ''}`}
                                                style={{
                                                    width: `${el.width || 100}px`,
                                                    height: `${el.height || 100}px`
                                                }}
                                            >
                                                {el.type === 'qr_code' ? 'QR' : 'LOGO'}
                                            </div>
                                        ) : (
                                            `[${el.label}]`
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
