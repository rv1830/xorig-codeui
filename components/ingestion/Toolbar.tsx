// components/ingestion/Toolbar.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";

export default function Toolbar({ categories, category, setCategory, q, setQ, sortKey, setSortKey, sortDir, setSortDir }: any) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="w-[180px]">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 rounded-2xl"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by brand/model/variant/component_id…"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-[190px]">
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="effective_price_inr">Best Price</SelectItem>
              <SelectItem value="completeness">Completeness</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="model">Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => setSortDir((d: any) => (d === "asc" ? "desc" : "asc"))}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {sortDir === "asc" ? "Asc" : "Desc"}
        </Button>
      </div>
    </div>
  );
}