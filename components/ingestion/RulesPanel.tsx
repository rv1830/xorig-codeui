// components/ingestion/RulesPanel.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const severityBadge = (s: any) => {
  if (s === "error") return <Badge variant="destructive">Error</Badge>;
  if (s === "warn") return <Badge variant="secondary">Warn</Badge>;
  return <Badge variant="outline">Info</Badge>;
};

function Field({ label, hint, children }: any) {
    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{children}</div>
        {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
      </div>
    );
  }

export default function RulesPanel({ rules, setRules }: any) {
  const [selected, setSelected] = useState(rules[0]?.rule_id || null);

  const sel = useMemo(() => rules.find((r: any) => r.rule_id === selected) || null, [rules, selected]);

  function toggleEnabled(rule_id: any) {
    setRules((prev: any) => prev.map((r: any) => (r.rule_id === rule_id ? { ...r, enabled: !r.enabled } : r)));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Rules</div>
            <Button
              className="rounded-2xl"
              onClick={() =>
                setRules((p: any) => [
                  {
                    rule_id: `r_${Math.random().toString(16).slice(2, 8)}`,
                    name: "New rule",
                    severity: "warn",
                    applies: "",
                    expr: { op: "eq", left: "", right: "" },
                    message: "",
                    enabled: true,
                  },
                  ...p,
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {rules.map((r: any) => (
              <button
                key={r.rule_id}
                className={`w-full rounded-2xl border p-3 text-left hover:bg-muted/30 ${selected === r.rule_id ? "bg-muted/40" : ""}`}
                onClick={() => setSelected(r.rule_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.name}</div>
                  <div className="flex items-center gap-2">
                    {severityBadge(r.severity)}
                    <Badge variant={r.enabled ? "outline" : "secondary"} className="rounded-2xl">
                      {r.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{r.applies}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Rule Details</div>
            {sel && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="rounded-2xl" onClick={() => toggleEnabled(sel.rule_id)}>
                  {sel.enabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => setRules((p: any) => p.filter((x: any) => x.rule_id !== sel.rule_id))}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </div>

          {sel ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <Input
                  className="rounded-2xl"
                  value={sel.name}
                  onChange={(e) => setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, name: e.target.value } : r)))}
                />
              </Field>
              <Field label="Severity">
                <Select
                  value={sel.severity}
                  onValueChange={(v) => setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, severity: v } : r)))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">error</SelectItem>
                    <SelectItem value="warn">warn</SelectItem>
                    <SelectItem value="info">info</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Applies To">
                <Input
                  className="rounded-2xl"
                  value={sel.applies}
                  onChange={(e) => setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, applies: e.target.value } : r)))}
                />
              </Field>
              <Field label="Message">
                <Input
                  className="rounded-2xl"
                  value={sel.message}
                  onChange={(e) => setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, message: e.target.value } : r)))}
                />
              </Field>

              <div className="md:col-span-2 rounded-2xl border p-4">
                <div className="font-medium">Expression (simple JSON-logic)</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field label="Operator">
                    <Select
                      value={sel.expr.op}
                      onValueChange={(v) =>
                        setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, expr: { ...r.expr, op: v } } : r)))
                      }
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">eq</SelectItem>
                        <SelectItem value="lte">lte</SelectItem>
                        <SelectItem value="gte">gte</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Left">
                    <Input
                      className="rounded-2xl"
                      value={sel.expr.left}
                      onChange={(e) =>
                        setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, expr: { ...r.expr, left: e.target.value } } : r)))
                      }
                      placeholder="cpu.socket"
                    />
                  </Field>
                  <Field label="Right">
                    <Input
                      className="rounded-2xl"
                      value={sel.expr.right}
                      onChange={(e) =>
                        setRules((p: any) => p.map((r: any) => (r.rule_id === sel.rule_id ? { ...r, expr: { ...r.expr, right: e.target.value } } : r)))
                      }
                      placeholder="mobo.socket"
                    />
                  </Field>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Example: CPU + Motherboard → <span className="font-mono">eq(cpu.socket, mobo.socket)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-sm text-muted-foreground">Select a rule from the left.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}