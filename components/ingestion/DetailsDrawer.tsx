// components/ingestion/DetailsDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Pencil,
    Save,
    ClipboardList,
    Tag,
    Database,
    Link2,
    Copy,
    ExternalLink,
    Clock,
    ShieldAlert,
    Plus
} from "lucide-react";
// Assuming these exist in your project based on previous code
import { SPEC_DEFS, CATEGORY_COMP_KEYS, DIMENSIONS } from "@/lib/constants";
import { fmtINR, toTitle, sourceName, vendorName, trustScore, bestOffer } from "@/lib/utils";

// List of available categories for the dropdown in Create Mode
const AVAILABLE_CATEGORIES = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"];

export default function DetailsDrawer({ open, onOpenChange, component, onSave, isCreating }: any) {
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState<any>(null);

    // When component opens/changes, initialize draft
    useEffect(() => {
        if (!component) {
            setDraft(null);
            setEditMode(false);
            return;
        }
        setDraft(structuredClone(component));
        // If we are creating a new one, default to Edit Mode = true
        setEditMode(!!isCreating);
    }, [component, isCreating, open]);

    // Dynamic Hooks: Recalculate definitions based on the DRAFT's category
    const currentCategory = draft?.category || "CPU";

    const specDefs = useMemo(() =>
        (SPEC_DEFS as any)[currentCategory] || [],
        [currentCategory]);

    const compatKeys = useMemo(() =>
        (CATEGORY_COMP_KEYS as any)[currentCategory] || [],
        [currentCategory]);

    if (!component || !draft) return null;

    const bo = bestOffer(draft.offers);

    // --- HANDLERS ---

    // 1. Generic Field Setter
    function setField(path: any, value: any) {
        setDraft((prev: any) => {
            const next = structuredClone(prev);
            setByPath(next, path, value);
            return next;
        });
    }

    // 2. Category Change Handler (Fixes Data Mixing)
    function handleCategoryChange(newCategory: string) {
        setDraft((prev: any) => ({
            ...prev,
            category: newCategory,
            // RESET these objects so old data doesn't persist
            specs: {},
            compatibility: {} 
        }));
    }

    // 3. Save Handler
    function commitSave() {
        const next = structuredClone(draft);
        
        // Add local audit log if updating
        if (!isCreating) {
            next.audit = [
                {
                    at: new Date().toISOString(),
                    actor: "admin@xor", 
                    action: "update",
                    field: "drawer-save",
                    before: "—",
                    after: "saved",
                },
                ...(next.audit || []),
            ];
        }

        onSave(next);

        // Keep edit mode on if creating (until parent closes it), otherwise turn off
        if (!isCreating) setEditMode(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl font-semibold">
                                {isCreating ? "Create New Component" : `${draft.brand} ${draft.model} ${draft.variant_name || ""}`}
                            </span>

                            {/* Category Selection Logic */}
                            {isCreating ? (
                                <Select value={draft.category} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="h-8 w-[140px] rounded-2xl">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge variant="outline" className="rounded-2xl">{draft.category}</Badge>
                            )}

                            {draft.quality?.needs_review && !isCreating && (
                                <Badge variant="secondary" className="rounded-2xl">Needs review</Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {!editMode ? (
                                <Button className="rounded-2xl" onClick={() => setEditMode(true)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            ) : (
                                <>
                                    <Button className="rounded-2xl" onClick={commitSave}>
                                        <Save className="mr-2 h-4 w-4" /> {isCreating ? "Create Component" : "Save Changes"}
                                    </Button>
                                    {!isCreating && (
                                        <Button variant="secondary" className="rounded-2xl" onClick={() => setEditMode(false)}>
                                            Cancel
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {isCreating
                            ? "Fill in the details below to create a new master component."
                            : <span>Component ID: <span className="font-mono">{component.id || component.component_id}</span></span>
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column (Details) */}
                    <Card className="rounded-lg shadow-sm lg:col-span-2">
                        <CardContent className="p-4">
                            <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Core Details" />

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="Brand">
                                    <EditOrView edit={editMode} value={draft.brand} onChange={(v: any) => setField("brand", v)} />
                                </Field>
                                <Field label="Model">
                                    <EditOrView edit={editMode} value={draft.model} onChange={(v: any) => setField("model", v)} />
                                </Field>
                                <Field label="Variant">
                                    <EditOrView edit={editMode} value={draft.variant_name} onChange={(v: any) => setField("variant_name", v)} />
                                </Field>
                                <Field label="Status">
                                    {editMode ? (
                                        <Select value={draft.active_status} onValueChange={(v) => setField("active_status", v)}>
                                            <SelectTrigger className="rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">active</SelectItem>
                                                <SelectItem value="discontinued">discontinued</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge className="rounded-2xl" variant={draft.active_status === "active" ? "outline" : "secondary"}>
                                            {draft.active_status}
                                        </Badge>
                                    )}
                                </Field>

                                <Field label="EAN/UPC">
                                    <EditOrView edit={editMode} value={draft.ean} onChange={(v: any) => setField("ean", v)} />
                                </Field>
                                <Field label="Warranty (years)">
                                    <EditOrView edit={editMode} value={draft.warranty_years} onChange={(v: any) => setField("warranty_years", Number(v || 0))} />
                                </Field>

                                <Field label="Release Date">
                                    <EditOrView edit={editMode} value={draft.release_date} onChange={(v: any) => setField("release_date", v)} />
                                </Field>

                                <Field label="Product Page">
                                    {editMode ? (
                                        <Input className="rounded-2xl" value={draft.product_page_url || ""} onChange={(e) => setField("product_page_url", e.target.value)} placeholder="https://..." />
                                    ) : (
                                        <LinkOut url={draft.product_page_url} />
                                    )}
                                </Field>

                                <Field label="Datasheet">
                                    {editMode ? (
                                        <Input className="rounded-2xl" value={draft.datasheet_url || ""} onChange={(e) => setField("datasheet_url", e.target.value)} placeholder="https://..." />
                                    ) : (
                                        <LinkOut url={draft.datasheet_url} />
                                    )}
                                </Field>
                            </div>

                            <Separator className="my-4" />

                            {/* Dynamic Compatibility Keys */}
                            <SectionTitle icon={<Tag className="h-4 w-4" />} title="Compatibility Keys" />
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {compatKeys.length === 0 && <div className="text-sm text-muted-foreground">No compatibility keys for this category.</div>}

                                {compatKeys.map((k: any) => (
                                    <Field key={k} label={toTitle(k.replaceAll("_", " "))}>
                                        {editMode ? (
                                            <CompatPicker category={currentCategory} keyName={k} value={draft.compatibility?.[k] || ""} onChange={(v: any) => setField(`compatibility.${k}`, v)} />
                                        ) : (
                                            <Badge variant="outline" className="rounded-2xl">{draft.compatibility?.[k] || "—"}</Badge>
                                        )}
                                    </Field>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Dynamic Specs */}
                            <SectionTitle icon={<Database className="h-4 w-4" />} title="Technical Specs" />
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {specDefs.length === 0 && <div className="text-sm text-muted-foreground">Select a category to view specs.</div>}

                                {specDefs.map((sd: any) => {
                                    const sv = draft.specs?.[sd.id];
                                    const display = sv?.v ?? "";
                                    return (
                                        <Field key={sd.id} label={sd.unit ? `${sd.label} (${sd.unit})` : sd.label} hint={!isCreating && sv ? `Source: ${sourceName(sv.source_id)}` : ""}>
                                            {editMode ? (
                                                <Input
                                                    className="rounded-2xl"
                                                    value={String(display)}
                                                    onChange={(e) => {
                                                        const v = coerceValue(e.target.value);
                                                        // When editing manually, we set source_id to 'manual'
                                                        setField(`specs.${sd.id}`, { v, source_id: "manual", confidence: 1.0, updated_at: new Date().toISOString() });
                                                    }}
                                                    placeholder={`Enter ${sd.label}`}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">{String(display || "—")}</span>
                                                </div>
                                            )}
                                        </Field>
                                    );
                                })}
                            </div>

                            {/* External IDs (Only show if not creating, usually populates via backend) */}
                            {!isCreating && (
                                <>
                                    <Separator className="my-4" />
                                    <SectionTitle icon={<Link2 className="h-4 w-4" />} title="External IDs / Mapping" />
                                    <div className="mt-3 space-y-2">
                                        {draft.external_ids?.length ? (
                                            draft.external_ids.map((x: any, idx: any) => (
                                                <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-2xl border p-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium">{sourceName(x.source_id)}</div>
                                                        <div className="text-muted-foreground">{x.external_id}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground">No external IDs mapped yet.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column (Meta & Offers - Hide offers if creating) */}
                    <div className="space-y-4">
                        {!isCreating ? (
                            <>
                                <Card className="rounded-lg shadow-sm">
                                    <CardContent className="p-4">
                                        <SectionTitle icon={<Clock className="h-4 w-4" />} title="Best Offer Snapshot" />
                                        <div className="mt-3">
                                            {bo ? (
                                                <div className="space-y-2">
                                                    <div className="text-lg font-semibold">{fmtINR(bo.effective_price_inr)}</div>
                                                    <div className="text-sm text-muted-foreground">{vendorName(bo.vendor_id)}</div>
                                                    {bo.in_stock ? <Badge className="rounded-2xl">In stock</Badge> : <Badge variant="secondary">OOS</Badge>}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">No offers yet.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-lg shadow-sm">
                                    <CardContent className="p-4">
                                        <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="Audit Log" />
                                        <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-2">
                                            {(component.audit || []).map((a: any, idx: any) => (
                                                <div key={idx} className="rounded-2xl border p-3 text-sm">
                                                    <div className="font-medium">{a.action}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div>
                                                    <div className="mt-1 text-muted-foreground">{a.field}: {String(a.before)} → {String(a.after)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="rounded-lg shadow-sm bg-muted/50 border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                                    <h4 className="font-semibold">New Entry</h4>
                                    <p className="text-sm text-muted-foreground mt-2">Offers and audit logs will be available after the component is created.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ... Small components (SectionTitle, Field, etc.)

function SectionTitle({ icon, title }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-muted">{icon}</div>
            <div className="font-semibold">{title}</div>
        </div>
    );
}

function Field({ label, hint, children }: any) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div>{children}</div>
            {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
        </div>
    );
}

function EditOrView({ edit, value, onChange }: any) {
    if (edit) return <Input className="rounded-2xl" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    return <div className="text-sm font-medium">{String(value ?? "—") || "—"}</div>;
}

function LinkOut({ url }: any) {
    if (!url) return <span className="text-sm text-muted-foreground">—</span>;
    return (
        <Button asChild variant="secondary" className="rounded-2xl">
            <a href={url} target="_blank" rel="noreferrer">
                Open <ExternalLink className="ml-2 h-4 w-4" />
            </a>
        </Button>
    );
}

function CompatPicker({ category, keyName, value, onChange }: any) {
    let items: any = [];
    if (keyName === "socket") items = DIMENSIONS.sockets || [];
    if (keyName === "memory_type") items = DIMENSIONS.memoryTypes || [];
    if (keyName === "form_factor") items = DIMENSIONS.formFactors || [];
    if (keyName === "chipset") items = DIMENSIONS.chipsets || [];
    if (keyName === "pcie_generation") items = DIMENSIONS.pcie || [];

    return (
        <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder={`Select ${keyName}`} />
            </SelectTrigger>
            <SelectContent>
                {items.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>
                        {i.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function setByPath(obj: any, path: any, value: any) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        // Fix: Ensure the intermediate key exists
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
}

function coerceValue(v: any) {
    const s = String(v ?? "").trim();
    if (s === "") return "";
    if (s === "true") return true;
    if (s === "false") return false;
    const n = Number(s);
    if (!Number.isNaN(n) && /^(\d+\.?\d*)$/.test(s)) return n;
    return v;
}