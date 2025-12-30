// components/ingestion/SourcesPanel.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mkNowMinus, SOURCES } from "@/lib/constants";
import { sourceName } from "@/lib/utils";

export default function SourcesPanel() {
  const runs = [
    { id: "run_101", source_id: "pcpt", status: "success", started_at: mkNowMinus(110), ended_at: mkNowMinus(105), notes: "Fetched 1,482 offers; 41 updated." },
    { id: "run_102", source_id: "md", status: "partial", started_at: mkNowMinus(380), ended_at: mkNowMinus(365), notes: "Rate limited; 12 categories skipped." },
    { id: "run_103", source_id: "prime", status: "failed", started_at: mkNowMinus(900), ended_at: mkNowMinus(895), notes: "HTML layout changed; selector mismatch." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4">
          <div className="font-semibold">Sources</div>
          <div className="mt-3 space-y-2">
            {SOURCES.map((s) => (
              <div key={s.id} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.baseUrl || "—"}</div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="rounded-2xl">{s.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4">
          <div className="font-semibold">Recent Ingestion Runs</div>
          <div className="mt-3 space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.id}</div>
                  <Badge
                    className="rounded-2xl"
                    variant={r.status === "success" ? "outline" : r.status === "partial" ? "secondary" : "destructive"}
                  >
                    {r.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">Source: {sourceName(r.source_id)}</div>
                <div className="mt-1 text-sm">{r.notes}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.started_at).toLocaleString()} → {new Date(r.ended_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}