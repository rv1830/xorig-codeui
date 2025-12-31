"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Database, Filter, Settings2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming you have shadcn toast

import { SPEC_DEFS, CATEGORY_COMP_KEYS, DUMMY_RULES } from "@/lib/constants";
import { bestOffer, toTitle } from "@/lib/utils";
import { api } from "@/lib/api";

import Header from "@/components/ingestion/Header";
import Toolbar from "@/components/ingestion/Toolbar";
import GridTable from "@/components/ingestion/GridTable";
import DetailsDrawer from "@/components/ingestion/DetailsDrawer";
import RulesPanel from "@/components/ingestion/RulesPanel";
import SourcesPanel from "@/components/ingestion/SourcesPanel";

export default function XORigIngestionAdminDemo() {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [tab, setTab] = useState("components");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("effective_price_inr");
  const [sortDir, setSortDir] = useState("asc");

  // Data State
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Drawer State
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [rules, setRules] = useState(DUMMY_RULES);

  useEffect(() => {
    setMounted(true);
    fetchComponents();
  }, []);

  // Fetch from API
  const fetchComponents = async () => {
    setLoading(true);
    const data = await api.getComponents(category, q);
    setComponents(data || []);
    setLoading(false);
  };

  // Re-fetch when category changes (optional, or rely on client filtering if dataset is small)
  useEffect(() => {
    if (mounted) fetchComponents();
  }, [category, mounted]);

  const categories = useMemo(() => {
    // Hardcoded list or derived from components. 
    // Usually better to have a static list or fetch from API.
    return ["All", "CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"];
  }, []);

  const specDefsForCategory = useMemo(() => {
    if (category === "All") return [];
    return (SPEC_DEFS as any)[category] || [];
  }, [category]);

  // Setup Table Columns
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
      { key: "updated_at", label: "Updated" },
    ];

    const dynamic = specDefsForCategory.map((sd: any) => ({
      key: `spec:${sd.id}`,
      label: sd.unit ? `${sd.label} (${sd.unit})` : sd.label,
    }));

    const compatKeys = ((CATEGORY_COMP_KEYS as any)[category] || []).map((k: any) => ({
      key: `compat:${k}`,
      label: toTitle(k.replaceAll("_", " ")),
    }));

    return category === "All" ? base : [...base.slice(0, 2), ...compatKeys, ...base.slice(2, 5), ...dynamic, ...base.slice(5)];
  }, [category, specDefsForCategory]);

  // Client-side filtering/sorting (if API returns all)
  const filtered = useMemo(() => {
    let res = components;
    // Filter by query string
    if (q.trim()) {
      const needle = q.toLowerCase();
      res = res.filter(c =>
        (c.brand + " " + c.model + " " + c.variant_name).toLowerCase().includes(needle)
      );
    }

    return res.map((c) => {
      const bo = bestOffer(c.offers || []);
      return {
        ...c,
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
        const av = (a[sortKey] ?? "").toString().toLowerCase();
        const bv = (b[sortKey] ?? "").toString().toLowerCase();
        return dir * av.localeCompare(bv);
      });
  }, [components, q, sortKey, sortDir]);

  // --- ACTIONS ---

  // 1. Open Drawer for Editing
  function openDrawer(row: any) {
    setSelectedComponent(row);
    setIsCreating(false);
    setDrawerOpen(true);
  }

  // 2. Open Drawer for Creating (THE FIX)
  function handleNewComponent() {
    // Default to currently selected category, or "CPU" if "All" is selected
    const initialCategory = category === "All" ? "CPU" : category;

    const template = {
      // Temporary ID, won't be sent to backend
      id: "new_temp",
      category: initialCategory,
      brand: "",
      model: "",
      variant_name: "",
      active_status: "active",
      specs: {},
      compatibility: {},
      offers: [],
      audit: [],
      quality: { completeness: 0, needs_review: true }
    };

    setSelectedComponent(template);
    setIsCreating(true);
    setDrawerOpen(true);
  }

  // 3. Handle Save (Create vs Update)
  async function handleDrawerSave(data: any) {
    try {
      if (isCreating) {
        // Remove temp ID before sending
        const { id, ...payload } = data;

        // Call Create API
        const newComp = await api.addComponent(payload);

        toast({ title: "Success", description: "Component created successfully" });

        // Refresh list and close drawer
        await fetchComponents();
        setDrawerOpen(false);
      } else {
        // Call Update API
        const { id, ...payload } = data; // Usually payload is partial, but here full object
        await api.updateComponent(id, payload);

        toast({ title: "Saved", description: "Component updated." });

        // Update local state without refetching for speed (optional)
        setComponents(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
        setDrawerOpen(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save component." });
      console.error(err);
    }
  }

  if (!mounted) return null;

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
                <Button className="rounded-2xl" onClick={handleNewComponent}>
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

                <div className="mt-4 rounded-2xl border overflow-hidden min-h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <GridTable
                      columns={tableColumns}
                      rows={filtered}
                      category={category}
                      onRowClick={openDrawer}
                      onQuickEdit={() => { }} // Implement quick inline edit if needed
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Showing <span className="font-medium text-foreground">{filtered.length}</span> components
                  </div>
                </div>
              </CardContent>
            </Card>

            <DetailsDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              component={selectedComponent}
              isCreating={isCreating} // Pass the mode
              onSave={handleDrawerSave}
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