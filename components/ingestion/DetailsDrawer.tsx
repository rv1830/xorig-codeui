import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Save, Plus, Trash2, Wand2, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { fmtINR } from "@/lib/utils";

// --- STRICT FIELD DEFINITIONS (Mapped to Prisma Tables) ---
const STRICT_FIELDS: any = {
    CPU: [
        { key: "socket", label: "Socket", type: "text", ph: "AM5, LGA1700" },
        { key: "cores", label: "Cores", type: "number" },
        { key: "threads", label: "Threads", type: "number" },
        { key: "base_clock", label: "Base Clock (GHz)", type: "number" },
        { key: "boost_clock", label: "Boost Clock (GHz)", type: "number" },
        { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
        { key: "integrated_gpu", label: "iGPU (true/false)", type: "text" },
        { key: "includes_cooler", label: "Cooler Included", type: "text" },
    ],
    GPU: [
        { key: "chipset", label: "Chipset", type: "text", ph: "RTX 4060" },
        { key: "vram_gb", label: "VRAM (GB)", type: "number" },
        { key: "length_mm", label: "Length (mm)", type: "number" },
        { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
        { key: "recommended_psu", label: "Rec. PSU (Watts)", type: "number" },
    ],
    MOTHERBOARD: [
        { key: "socket", label: "Socket", type: "text" },
        { key: "form_factor", label: "Form Factor", type: "text", ph: "ATX, mATX" },
        { key: "memory_type", label: "RAM Type", type: "text", ph: "DDR4, DDR5" },
        { key: "memory_slots", label: "RAM Slots", type: "number" },
        { key: "max_memory_gb", label: "Max RAM (GB)", type: "number" },
        { key: "m2_slots", label: "M.2 Slots", type: "number" },
        { key: "wifi", label: "WiFi (true/false)", type: "text" },
    ],
    RAM: [
        { key: "memory_type", label: "Type", type: "text", ph: "DDR4, DDR5" },
        { key: "capacity_gb", label: "Total Capacity (GB)", type: "number" },
        { key: "modules", label: "Modules (Sticks)", type: "number" },
        { key: "speed_mhz", label: "Speed (MHz)", type: "number" },
        { key: "cas_latency", label: "CL", type: "number" },
    ],
    PSU: [
        { key: "wattage", label: "Wattage", type: "number" },
        { key: "efficiency", label: "Efficiency", type: "text", ph: "80+ Gold" },
        { key: "modular", label: "Modular", type: "text", ph: "Full, Semi" },
    ],
    CABINET: [
        { key: "max_gpu_len_mm", label: "Max GPU Length (mm)", type: "number" },
        { key: "max_cpu_height", label: "Max CPU Cooler (mm)", type: "number" },
    ],
    STORAGE: [
        { key: "type", label: "Type", type: "text", ph: "SSD, NVMe" },
        { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
        { key: "gen", label: "Gen", type: "text", ph: "Gen4" },
    ],
    COOLER: [
        { key: "type", label: "Type", type: "text", ph: "Air, AIO" },
        { key: "height_mm", label: "Height (mm)", type: "number" },
        { key: "radiator_size", label: "Radiator (mm)", type: "number" },
    ]
};

export default function DetailsDrawer({ open, onOpenChange, component, onSave, isCreating }: any) {
    const { toast } = useToast();
    const [editMode, setEditMode] = useState(false);

    // --- STATE MANAGEMENT ---
    const [coreData, setCoreData] = useState<any>({}); // Brand, Model, Type
    const [compatSpecs, setCompatSpecs] = useState<any>({}); // Strict fields (CPU/GPU table)
    const [customSpecs, setCustomSpecs] = useState<{ key: string, value: string }[]>([]); // Dynamic JSON

    // Tools State
    const [manualPrice, setManualPrice] = useState("");
    const [fetchingSpecs, setFetchingSpecs] = useState(false);

    useEffect(() => {
        if (!component) return;

        // 1. Populate Core Data
        setCoreData({
            id: component.id,
            type: component.type || "CPU",
            brand: component.brand || "",
            model: component.model || "",
            variant: component.variant || "",
            image_url: component.image_url || "",
            product_page: component.product_page || "",
            price_current: component.price_current || 0,
            offers: component.offers || []
        });

        // 2. Populate Strict Compatibility Data
        // Backend usually sends data in lowercase key like { cpu: {...} } or { gpu: {...} }
        const typeKey = (component.type || "CPU").toLowerCase();
        setCompatSpecs(component[typeKey] || {});

        // 3. Populate Dynamic JSON Specs
        const jsonSpecs = component.specs || {};
        const jsonArray = Object.entries(jsonSpecs).map(([k, v]) => ({ key: k, value: String(v) }));
        setCustomSpecs(jsonArray);

        setEditMode(!!isCreating);
        setManualPrice("");
    }, [component, isCreating, open]);

    // --- HANDLERS ---

    function handleSave() {
        // Convert Array back to JSON object for 'specs' column
        const specsJson: any = {};
        customSpecs.forEach(item => {
            if (item.key.trim()) specsJson[item.key.trim()] = item.value;
        });

        onSave({
            ...coreData,
            price: Number(coreData.price_current), // Ensure number
            specs: specsJson,         // Dynamic JSON
            compat_specs: compatSpecs // Strict Data
        });
    }

    // Dynamic Spec Rows
    function addSpecRow() { setCustomSpecs([...customSpecs, { key: "", value: "" }]); }
    function removeSpecRow(idx: number) { setCustomSpecs(customSpecs.filter((_, i) => i !== idx)); }
    function updateSpecRow(idx: number, field: 'key' | 'value', val: string) {
        const copy = [...customSpecs];
        copy[idx][field] = val;
        setCustomSpecs(copy);
    }

    // Auto Scraper Tool
    async function handleAutoSpecs() {
        if (!coreData.product_page) return toast({ title: "Error", description: "Product URL required" });
        setFetchingSpecs(true);
        try {
            const scraped = await api.fetchSpecsFromUrl(coreData.product_page);
            // Merge into Dynamic Specs
            const newSpecs = [...customSpecs];
            Object.entries(scraped).forEach(([k, v]) => {
                // Avoid duplicates if key exists
                if (!newSpecs.find(s => s.key === k)) newSpecs.push({ key: k, value: String(v) });
            });
            setCustomSpecs(newSpecs);
            toast({ title: "Specs Fetched", description: "Review fields and save changes." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Scraping failed." });
        } finally {
            setFetchingSpecs(false);
        }
    }

    // Manual Offer Tool
    async function handleManualPrice() {
        if (!manualPrice) return;
        try {
            await api.addManualOffer({
                componentId: coreData.id,
                price: manualPrice,
                vendorName: "Manual Entry"
            });
            toast({ title: "Price Added", description: "Manual offer created." });
            setManualPrice("");
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed." });
        }
    }

    if (!coreData.type) return null;

    const strictFields = STRICT_FIELDS[coreData.type] || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{isCreating ? "Create Component" : `${coreData.brand} ${coreData.model}`}</span>
                        <div className="flex gap-2">
                            {isCreating && (
                                <Select value={coreData.type} onValueChange={(v) => {
                                    setCoreData({ ...coreData, type: v });
                                    setCompatSpecs({}); // Clear strict data on type change
                                }}>
                                    <SelectTrigger className="w-[140px] h-8 rounded-lg"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(STRICT_FIELDS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button size="sm" onClick={() => editMode ? handleSave() : setEditMode(true)} className="rounded-lg h-8">
                                {editMode ? <><Save className="w-4 h-4 mr-1" /> Save</> : <><Pencil className="w-4 h-4 mr-1" /> Edit</>}
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>ID: {coreData.id || "New Entry"}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

                    {/* --- LEFT COL: BASIC INFO --- */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Core Identity</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <DetailInput label="Brand" disabled={!editMode} value={coreData.brand} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, brand: e.target.value })} className="h-9" />
                                    <DetailInput label="Model" disabled={!editMode} value={coreData.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, model: e.target.value })} className="h-9" />
                                    <DetailInput label="Variant" disabled={!editMode} value={coreData.variant} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, variant: e.target.value })} className="h-9" />
                                    <DetailInput label="Image URL" disabled={!editMode} value={coreData.image_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, image_url: e.target.value })} className="h-9" />

                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Product Page URL</label>
                                        <div className="flex gap-1">
                                            <DetailInput disabled={!editMode} value={coreData.product_page} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, product_page: e.target.value })} className="h-9" />
                                            {editMode && (
                                                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={handleAutoSpecs} disabled={fetchingSpecs}>
                                                    {fetchingSpecs ? "..." : <Wand2 className="w-4 h-4 text-purple-600" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <DetailInput label="Current Price (₹)" type="number" disabled={!editMode} value={coreData.price_current} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreData({ ...coreData, price_current: e.target.value })} className="h-9" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Offers / Tools */}
                        {!isCreating && (
                            <Card className="bg-muted/20">
                                <CardContent className="p-4 space-y-3">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <IndianRupee className="w-3 h-3" /> Offers
                                    </h3>

                                    {/* Manual Price Tool */}
                                    <div className="flex gap-2">
                                        <DetailInput placeholder="Price" className="h-8 bg-white" value={manualPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualPrice(e.target.value)} type="number" />
                                        <Button size="sm" className="h-8" onClick={handleManualPrice}>Add</Button>
                                    </div>

                                    <div className="space-y-2 max-h-[150px] overflow-auto">
                                        {coreData.offers?.length > 0 ? coreData.offers.map((o: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs border p-2 rounded bg-white">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{o.vendor}</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(o.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                                <span className="font-bold text-green-700">{fmtINR(o.price)}</span>
                                            </div>
                                        )) : <div className="text-xs text-muted-foreground">No offers yet.</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* --- MIDDLE COL: STRICT COMPATIBILITY --- */}
                    <div className="space-y-4">
                        <Card className="h-full">
                            <CardContent className="p-4 space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                                    🛡️ Strict Compatibility ({coreData.type})
                                </h3>

                                {strictFields.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {strictFields.map((field: any) => (
                                            <div key={field.key}>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">{field.label}</label>
                                                <DetailInput
                                                    disabled={!editMode}
                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                    placeholder={field.ph}
                                                    value={compatSpecs[field.key] || ""}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompatSpecs({ ...compatSpecs, [field.key]: e.target.value })}
                                                    className="h-9"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground py-10 text-center">
                                        No strict compatibility rules defined for this category.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- RIGHT COL: DYNAMIC JSON SPECS --- */}
                    <div className="space-y-4">
                        <Card className="h-full border-dashed border-2">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-2">
                                        ✨ Extra Specs (JSON)
                                    </h3>
                                    {editMode && (
                                        <Button size="sm" variant="ghost" onClick={addSpecRow} className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50">
                                            <Plus className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
                                    {customSpecs.map((spec, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <DetailInput
                                                disabled={!editMode}
                                                placeholder="Key"
                                                className="h-8 text-xs font-medium bg-muted/30 w-1/3"
                                                value={spec.key}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSpecRow(idx, 'key', e.target.value)}
                                            />
                                            <DetailInput
                                                disabled={!editMode}
                                                placeholder="Value"
                                                className="h-8 text-xs w-2/3"
                                                value={spec.value}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSpecRow(idx, 'value', e.target.value)}
                                            />
                                            {editMode && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => removeSpecRow(idx)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {customSpecs.length === 0 && (
                                        <div className="text-xs text-center text-muted-foreground py-10">
                                            Add extra details like Colors, Warranty, RGB type, etc.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper Input wrapper for label rendering
function DetailInput({ label, className, ...props }: any) {
    return (
        <div>
            {label && <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">{label}</label>}
            <Input
                className={className}
                {...props}
            />
        </div>
    )
}