// components/ingestion/DetailsDrawer.tsx
import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { SPEC_DEFS, CATEGORY_COMP_KEYS, DIMENSIONS } from "@/lib/constants";
import { fmtINR, toTitle, sourceName, vendorName, trustScore, bestOffer } from "@/lib/utils";

export default function DetailsDrawer({ open, onOpenChange, component, onSave }: any) {
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState<any>(null);

    React.useEffect(() => {
        if (!component) {
            setDraft(null);
            setEditMode(false);
            return;
        }
        setDraft(structuredClone(component));
        setEditMode(false);
    }, [component?.component_id]);

    const specDefs = useMemo(() => (component ? (SPEC_DEFS as any)[component.category] || [] : []), [component?.category]);
    const compatKeys = useMemo(() => (component ? (CATEGORY_COMP_KEYS as any)[component.category] || [] : []), [component?.category]);

    if (!component) return null;
    if (!draft) return null;

    const bo = bestOffer(component.offers);

    function setField(path: any, value: any) {
        setDraft((prev: any) => {
            const next = structuredClone(prev);
            setByPath(next, path, value);
            return next;
        });
    }

    function commitSave() {
        const next = structuredClone(draft);
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
        onSave(next);
        setEditMode(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* FIX: Added 'sm:max-w-7xl' to override the default 'sm:max-w-lg' from shadcn dialog */}
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl font-semibold">
                                {component.brand} {component.model} {component.variant_name}
                            </span>
                            <Badge variant="outline" className="rounded-2xl">{component.category}</Badge>
                            {component.quality?.needs_review && (
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
                                        <Save className="mr-2 h-4 w-4" /> Save
                                    </Button>
                                    <Button variant="secondary" className="rounded-2xl" onClick={() => setEditMode(false)}>
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Component ID: <span className="font-mono">{component.component_id}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left */}
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
                                    <LinkOut url={draft.product_page_url} />
                                </Field>

                                <Field label="Datasheet">
                                    <LinkOut url={draft.datasheet_url} />
                                </Field>
                            </div>

                            <Separator className="my-4" />

                            <SectionTitle icon={<Tag className="h-4 w-4" />} title="Compatibility Keys" />
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {compatKeys.length === 0 && <div className="text-sm text-muted-foreground">No compatibility keys for this category.</div>}

                                {compatKeys.map((k: any) => (
                                    <Field key={k} label={toTitle(k.replaceAll("_", " "))}>
                                        {editMode ? (
                                            <CompatPicker category={component.category} keyName={k} value={draft.compatibility?.[k] || ""} onChange={(v: any) => setField(`compatibility.${k}`, v)} />
                                        ) : (
                                            <Badge variant="outline" className="rounded-2xl">{draft.compatibility?.[k] || "—"}</Badge>
                                        )}
                                    </Field>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            <SectionTitle icon={<Database className="h-4 w-4" />} title="Dynamic Specs (Columns)" />
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {specDefs.map((sd: any) => {
                                    const sv = draft.specs?.[sd.id];
                                    const display = sv?.v ?? "";
                                    return (
                                        <Field key={sd.id} label={sd.unit ? `${sd.label} (${sd.unit})` : sd.label} hint={sv ? `Source: ${sourceName(sv.source_id)} · Conf: ${Math.round((sv.confidence || 0) * 100)}%` : ""}>
                                            {editMode ? (
                                                <Input
                                                    className="rounded-2xl"
                                                    value={String(display)}
                                                    onChange={(e) => {
                                                        const v = coerceValue(e.target.value);
                                                        setField(`specs.${sd.id}`, { v, source_id: "manual", confidence: 0.8, updated_at: new Date().toISOString() });
                                                    }}
                                                    placeholder={`Enter ${sd.label}`}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">{String(display || "—")}</span>
                                                    <span className="text-xs text-muted-foreground">{sv?.updated_at ? new Date(sv.updated_at).toLocaleString() : ""}</span>
                                                </div>
                                            )}
                                        </Field>
                                    );
                                })}
                            </div>

                            <Separator className="my-4" />

                            <SectionTitle icon={<Link2 className="h-4 w-4" />} title="External IDs / Mapping" />
                            <div className="mt-3 space-y-2">
                                {draft.external_ids?.length ? (
                                    draft.external_ids.map((x: any, idx: any) => (
                                        <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-2xl border p-3">
                                            <div className="text-sm">
                                                <div className="font-medium">{sourceName(x.source_id)}</div>
                                                <div className="text-muted-foreground">{x.external_id}</div>
                                                <div className="text-muted-foreground">Match: {x.match_method} · {Math.round((x.match_confidence || 0) * 100)}%</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="rounded-2xl"
                                                    onClick={() => navigator.clipboard?.writeText(x.external_id)}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" /> Copy
                                                </Button>
                                                <Button asChild className="rounded-2xl">
                                                    <a href={x.external_url} target="_blank" rel="noreferrer">
                                                        Open <ExternalLink className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No external IDs mapped yet.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right */}
                    <div className="space-y-4">
                        <Card className="rounded-lg shadow-sm">
                            <CardContent className="p-4">
                                <SectionTitle icon={<Clock className="h-4 w-4" />} title="Best Offer Snapshot" />
                                <div className="mt-3">
                                    {bo ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">Effective</div>
                                                <div className="text-lg font-semibold">{fmtINR(bo.effective_price_inr)}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">Vendor</div>
                                                <div className="text-sm font-medium">{vendorName(bo.vendor_id)} <span className="text-muted-foreground">(Trust {trustScore(bo.vendor_id)})</span></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">Stock</div>
                                                {bo.in_stock ? <Badge className="rounded-2xl">In stock · {bo.quantity}</Badge> : <Badge variant="secondary" className="rounded-2xl">Out of stock</Badge>}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">Updated</div>
                                                <div className="text-sm">{new Date(bo.updated_at).toLocaleString()}</div>
                                            </div>
                                            <Button asChild className="mt-2 w-full rounded-2xl">
                                                <a href={bo.vendor_url} target="_blank" rel="noreferrer">
                                                    Open Listing <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No offers for this component.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg shadow-sm">
                            <CardContent className="p-4">
                                <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Offers / Prices" />
                                <div className="mt-3 space-y-2">
                                    {component.offers?.length ? (
                                        component.offers
                                            .slice()
                                            .sort((a: any, b: any) => (a.effective_price_inr ?? 1e18) - (b.effective_price_inr ?? 1e18))
                                            .map((o: any) => (
                                                <div key={o.offer_id} className="rounded-2xl border p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-medium">{vendorName(o.vendor_id)}</div>
                                                        <Badge variant="outline" className="rounded-2xl">{sourceName(o.source_id)}</Badge>
                                                    </div>
                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                                        <div className="text-muted-foreground">Price</div>
                                                        <div className="font-medium">{fmtINR(o.price_inr)}</div>
                                                        <div className="text-muted-foreground">Shipping</div>
                                                        <div>{fmtINR(o.shipping_inr)}</div>
                                                        <div className="text-muted-foreground">Effective</div>
                                                        <div className="font-medium">{fmtINR(o.effective_price_inr)}</div>
                                                        <div className="text-muted-foreground">Stock</div>
                                                        <div>{o.in_stock ? `Yes (${o.quantity})` : "No"}</div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="text-xs text-muted-foreground">Updated: {new Date(o.updated_at).toLocaleString()}</div>
                                                        <Button asChild size="sm" variant="secondary" className="rounded-2xl">
                                                            <a href={o.vendor_url} target="_blank" rel="noreferrer">Open</a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No offers yet.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg shadow-sm">
                            <CardContent className="p-4">
                                <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="Quality & Review" />
                                <div className="mt-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">Completeness</div>
                                        <Badge className="rounded-2xl" variant={component.quality?.completeness >= 85 ? "outline" : "secondary"}>
                                            {component.quality?.completeness ?? 0}%
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">Review status</div>
                                        <Badge className="rounded-2xl" variant={component.quality?.review_status === "approved" ? "outline" : "secondary"}>
                                            {component.quality?.review_status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">Needs review</div>
                                        <Badge className="rounded-2xl" variant={component.quality?.needs_review ? "secondary" : "outline"}>
                                            {component.quality?.needs_review ? "Yes" : "No"}
                                        </Badge>
                                    </div>

                                    {editMode && (
                                        <div className="rounded-2xl border p-3">
                                            <div className="text-sm font-medium">Reviewer notes</div>
                                            <Textarea
                                                className="mt-2 rounded-2xl"
                                                value={draft.quality?.review_notes || ""}
                                                onChange={(e) => setField("quality.review_notes", e.target.value)}
                                                placeholder="What needs fixing? e.g., VRM phases uncertain; verify from OEM datasheet."
                                            />
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">Mark as needs review</div>
                                                <Switch
                                                    checked={!!draft.quality?.needs_review}
                                                    onCheckedChange={(v) => setField("quality.needs_review", v)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg shadow-sm">
                            <CardContent className="p-4">
                                <SectionTitle icon={<Clock className="h-4 w-4" />} title="Audit Log" />
                                <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-2">
                                    {(component.audit || []).length ? (
                                        (component.audit || []).map((a: any, idx: any) => (
                                            <div key={idx} className="rounded-2xl border p-3 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">{a.action.toUpperCase()}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div>
                                                </div>
                                                <div className="text-muted-foreground">{a.actor}</div>
                                                <div className="mt-1"><span className="font-medium">{a.field}</span></div>
                                                <div className="mt-1 text-muted-foreground">{String(a.before)} → {String(a.after)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No changes recorded.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                    This is a UI demo: in the real system, Specs are driven by SpecDefinition + SpecValue, Offers by vendor feeds/scrapers, and all edits write to AuditLog.
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ... Small components (SectionTitle, Field, etc.) remain exactly the same ...
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

function CompatPicker({ keyName, value, onChange }: any) {
    // Map compat key to dimension list
    let items: any = [];
    if (keyName === "socket") items = DIMENSIONS.sockets;
    if (keyName === "memory_type") items = DIMENSIONS.memoryTypes;
    if (keyName === "form_factor") items = DIMENSIONS.formFactors;
    if (keyName === "chipset") items = DIMENSIONS.chipsets;
    if (keyName === "pcie_generation") items = DIMENSIONS.pcie;

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
        const p = parts[i];
        cur[p] = cur[p] ?? {};
        cur = cur[p];
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