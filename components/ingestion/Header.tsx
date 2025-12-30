// components/ingestion/Header.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl md:text-3xl font-semibold tracking-tight">XO Rig – Data Ingestion Admin</div>
          <div className="text-sm md:text-base text-muted-foreground">
            View & search components in a grid, open a detailed view, edit fields, and manage dynamic specs + offers + lineage.
          </div>
        </div>
        <Badge variant="outline" className="rounded-2xl">Demo UI</Badge>
      </div>
      <Separator />
    </div>
  );
}