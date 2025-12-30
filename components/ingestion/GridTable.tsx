// components/ingestion/GridTable.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Pencil, Save, X } from "lucide-react";
import { fmtINR } from "@/lib/utils";

export default function GridTable({ columns, rows, category, onRowClick, onQuickEdit }: any) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((c: any) => (
              <th key={c.key} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.component_id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick(r)}>
              {columns.map((c: any) => (
                <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                  <Cell value={readCell(r, c.key)} columnKey={c.key} row={r} category={category} onQuickEdit={onQuickEdit} />
                </td>
              ))}
              <td className="px-3 py-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                <div className="inline-flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="rounded-2xl" onClick={() => onRowClick(r)}>
                    Open <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function readCell(row: any, key: any) {
  if (key === "completeness") return row.quality?.completeness ?? 0;
  if (key === "best_price") return row._best_price;
  if (key === "in_stock") return row._in_stock;
  if (key === "updated_at") return row._updated_at;
  if (key.startsWith("spec:")) {
    const id = key.split(":")[1];
    return row.specs?.[id]?.v ?? "";
  }
  if (key.startsWith("compat:")) {
    const k = key.split(":")[1];
    return row.compatibility?.[k] ?? "";
  }
  return row[key];
}

function Cell({ value, columnKey, row, onQuickEdit }: any) {
  // Inline edit: allow editing brand/model/variant/status and numeric spec fields.
  const editableBase = ["brand", "model", "variant_name", "active_status"];
  const editable = editableBase.includes(columnKey) || columnKey.startsWith("spec:");

  if (columnKey === "best_price") return value ? <span className="font-medium">{fmtINR(value)}</span> : <span className="text-muted-foreground">—</span>;
  if (columnKey === "in_stock") return value ? <Badge className="rounded-2xl">In stock</Badge> : <Badge variant="secondary" className="rounded-2xl">OOS</Badge>;
  if (columnKey === "updated_at") return value ? <span className="text-muted-foreground">{new Date(value).toLocaleString()}</span> : <span className="text-muted-foreground">—</span>;
  if (columnKey === "completeness") {
    const v = Number(value) || 0;
    const variant = v >= 85 ? "outline" : v >= 70 ? "secondary" : "destructive";
    return <Badge variant={variant} className="rounded-2xl">{v}%</Badge>;
  }

  if (!editable) return <span>{String(value ?? "") || <span className="text-muted-foreground">—</span>}</span>;

  // Stop propagation to avoid row open on click.
  return (
    <InlineEdit
      value={value}
      onCommit={(next: any) => {
        const field = columnKey;
        const before = String(value ?? "");
        const after = String(next ?? "");
        onQuickEdit(row.component_id, { _field: field, _before: before, _after: after, field, value: next });
      }}
    />
  );
}

function InlineEdit({ value, onCommit }: any) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function start() {
    setDraft(value ?? "");
    setEditing(true);
  }
  function cancel() {
    setEditing(false);
    setDraft(value ?? "");
  }
  function save() {
    setEditing(false);
    onCommit(draft);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="group inline-flex items-center gap-2 hover:underline underline-offset-4"
        onClick={(e) => {
          e.stopPropagation();
          start();
        }}
      >
        <span>{String(value ?? "") || <span className="text-muted-foreground">—</span>}</span>
        <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Input className="h-8 rounded-2xl" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <Button size="sm" className="h-8 rounded-2xl" onClick={save}>
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="secondary" className="h-8 rounded-2xl" onClick={cancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function applyPatch(component: any, patch: any) {
  const next = structuredClone(component);
  if (patch.field?.startsWith("spec:")) {
    const id = patch.field.split(":")[1];
    next.specs = next.specs || {};
    next.specs[id] = next.specs[id] || { v: "", source_id: "manual", confidence: 0.6, updated_at: new Date().toISOString() };
    next.specs[id].v = coerceValue(patch.value);
    next.specs[id].source_id = "manual";
    next.specs[id].confidence = 0.8;
    next.specs[id].updated_at = new Date().toISOString();
    return next;
  }
  if (["brand", "model", "variant_name", "active_status"].includes(patch.field)) {
    next[patch.field] = patch.value;
    return next;
  }
  return next;
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