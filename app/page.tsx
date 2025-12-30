"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Database, Filter, Settings2 } from "lucide-react";

import { DUMMY_COMPONENTS, DUMMY_RULES, SPEC_DEFS, CATEGORY_COMP_KEYS } from "@/lib/constants";
import { bestOffer, toTitle } from "@/lib/utils";

import Header from "@/components/ingestion/Header";
import Toolbar from "@/components/ingestion/Toolbar";
import GridTable, { applyPatch } from "@/components/ingestion/GridTable";
import DetailsDrawer from "@/components/ingestion/DetailsDrawer";
import RulesPanel from "@/components/ingestion/RulesPanel";
import SourcesPanel from "@/components/ingestion/SourcesPanel";

/**
 * XO Rig – Data Ingestion Admin UI (Sample)
 * Single-file demo: Airtable-like grid + details drawer + dynamic specs + offers/prices + lineage + audit log.
 */

// ---------------------------
// Main Component
// ---------------------------
export default function XORigIngestionAdminDemo() {
  // --- Fix for Hydration Failed Error ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [tab, setTab] = useState("components");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("effective_price_inr");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [components, setComponents] = useState(DUMMY_COMPONENTS);
  const [rules, setRules] = useState(DUMMY_RULES);

  const categories = useMemo(() => {
    const set = new Set(components.map((c) => c.category));
    return ["All", ...Array.from(set).sort()];
  }, [components]);

  const specDefsForCategory = useMemo(() => {
    if (category === "All") return [];
    return (SPEC_DEFS as any)[category] || [];
  }, [category]);

  const tableColumns = useMemo(() => {
    const base = [
      { key: "category", label: "Category" },
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
      { key: "variant_name", label: "Variant" },
      { key: "active_status", label: "Status" },
      { key: "completeness", label: "Completeness" },
      { key: "best_price", label: "Best Price" },
      { key: "in_stock", label: "Stock" },
      { key: "updated_at", label: "Price Updated" },
    ];

    // Dynamic “spec columns” show only when a single category is selected.
    const dynamic = specDefsForCategory.map((sd: any) => ({
      key: `spec:${sd.id}`,
      label: sd.unit ? `${sd.label} (${sd.unit})` : sd.label,
    }));

    // Compatibility key columns (only for selected category)
    const compatKeys = ((CATEGORY_COMP_KEYS as any)[category] || []).map((k: any) => ({
      key: `compat:${k}`,
      label: toTitle(k.replaceAll("_", " ")),
    }));

    return category === "All" ? base : [...base.slice(0, 2), ...compatKeys, ...base.slice(2, 5), ...dynamic, ...base.slice(5)];
  }, [category, specDefsForCategory]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return components
      .filter((c) => (category === "All" ? true : c.category === category))
      .filter((c) => {
        if (!needle) return true;
        const hay = `${c.category} ${c.brand} ${c.model} ${c.variant_name} ${c.component_id}`.toLowerCase();
        return hay.includes(needle);
      })
      .map((c) => {
        const bo = bestOffer(c.offers);
        return {
          ...c,
          _best: bo,
          _best_price: bo?.effective_price_inr ?? null,
          _in_stock: bo?.in_stock ?? false,
          _updated_at: bo?.updated_at ?? null,
        };
      })
      .sort((a: any, b: any) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "effective_price_inr") {
          return dir * ((a._best_price ?? 1e18) - (b._best_price ?? 1e18));
        }
        if (sortKey === "completeness") {
          return dir * ((a.quality?.completeness ?? 0) - (b.quality?.completeness ?? 0));
        }
        const av = (a[sortKey] ?? "").toString().toLowerCase();
        const bv = (b[sortKey] ?? "").toString().toLowerCase();
        return dir * av.localeCompare(bv);
      });
  }, [components, category, q, sortKey, sortDir]);

  const selected = useMemo(() => components.find((c) => c.component_id === selectedId) || null, [components, selectedId]);

  function openDrawer(id: any) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function upsertComponent(partial: any) {
    setComponents((prev) => {
      const idx = prev.findIndex((c) => c.component_id === partial.component_id);
      if (idx === -1) return [partial, ...prev];
      const next = [...prev];
      next[idx] = partial;
      return next;
    });
  }

  function addNewComponent() {
    const id = `cmp_${Math.random().toString(16).slice(2, 10)}`;
    const base = {
      component_id: id,
      category: category === "All" ? "CPU" : category,
      brand: "",
      model: "",
      variant_name: "",
      release_date: "",
      warranty_years: 0,
      ean: "",
      active_status: "active",
      images: [],
      datasheet_url: "",
      product_page_url: "",
      quality: { completeness: 10, needs_review: true, review_status: "unreviewed" },
      compatibility: {},
      specs: {},
      offers: [],
      external_ids: [],
      audit: [
        {
          at: new Date().toISOString(),
          actor: "admin@xor",
          action: "create",
          field: "component",
          before: "—",
          after: "created",
        },
      ],
    };
    setComponents((p: any) => [base, ...p]);
    openDrawer(id);
  }

  function addSpecColumnForSelectedCategory() {
    // This simulates creating a SpecDefinition; in real app you'd save to DB.
    // Here we just show a UI pattern by adding a virtual column via SPEC_DEFS mutation is avoided.
    alert(
      "In the real system, this button would create a new SpecDefinition (dynamic column) for the selected category and it instantly shows in the grid.\n\nExample: key='xmp_profile' label='XMP/EXPO' type='enum'."
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <Header />

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="rounded-2xl">
              <TabsTrigger value="components" className="rounded-xl">Components</TabsTrigger>
              <TabsTrigger value="rules" className="rounded-xl">Compatibility Rules</TabsTrigger>
              <TabsTrigger value="sources" className="rounded-xl">Sources & Runs</TabsTrigger>
            </TabsList>

            {tab === "components" && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="rounded-2xl" onClick={addSpecColumnForSelectedCategory}>
                  <Settings2 className="mr-2 h-4 w-4" /> Add Spec Column
                </Button>
                <Button className="rounded-2xl" onClick={addNewComponent}>
                  <Plus className="mr-2 h-4 w-4" /> New Component
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="components" className="mt-4">
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="p-4 md:p-6">
                <Toolbar
                  categories={categories}
                  category={category}
                  setCategory={setCategory}
                  q={q}
                  setQ={setQ}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                  sortDir={sortDir}
                  setSortDir={setSortDir}
                />

                <div className="mt-4 rounded-2xl border overflow-hidden">
                  <GridTable
                    columns={tableColumns}
                    rows={filtered}
                    category={category}
                    onRowClick={(row: any) => openDrawer(row.component_id)}
                    onQuickEdit={(id: any, patch: any) => {
                      const cur = components.find((c) => c.component_id === id);
                      if (!cur) return;
                      const next = applyPatch(cur, patch);
                      // add audit line
                      next.audit = [
                        {
                          at: new Date().toISOString(),
                          actor: "admin@xor",
                          action: "update",
                          field: patch._field || "inline-edit",
                          before: patch._before ?? "",
                          after: patch._after ?? "",
                        },
                        ...(next.audit || []),
                      ];
                      upsertComponent(next);
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Showing <span className="font-medium text-foreground">{filtered.length}</span> components
                    {category !== "All" && (
                      <span>
                        in <span className="font-medium text-foreground">{category}</span> with dynamic spec columns
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Tip: switch category to see spec columns change.
                  </div>
                </div>
              </CardContent>
            </Card>

            <DetailsDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              component={selected}
              onSave={(updated: any) => upsertComponent(updated)}
            />
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <RulesPanel rules={rules} setRules={setRules} />
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <SourcesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}