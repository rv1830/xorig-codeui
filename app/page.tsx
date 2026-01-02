"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Database, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; 

import { fmtINR } from "@/lib/utils";
import { api } from "@/lib/api";

import Header from "@/components/ingestion/Header";
import Toolbar from "@/components/ingestion/Toolbar";
import GridTable from "@/components/ingestion/GridTable";
import DetailsDrawer from "@/components/ingestion/DetailsDrawer";
import RulesPanel from "@/components/ingestion/RulesPanel";
import SourcesPanel from "@/components/ingestion/SourcesPanel";

export default function XORigIngestionAdmin() {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [tab, setTab] = useState("components");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  
  const [rules, setRules] = useState([]); 

  useEffect(() => {
    setMounted(true);
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    const data = await api.getComponents(category, q);
    setComponents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (mounted) fetchComponents();
  }, [category, q, mounted]);

  const categories = ["All", "CPU", "GPU", "MOTHERBOARD", "RAM", "STORAGE", "PSU", "CABINET", "COOLER"];

  const tableColumns = useMemo(() => {
    return [
      { key: "type", label: "Type" },
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
      { key: "variant", label: "Variant" },
      { key: "best_price", label: "Best Price" },
      { key: "vendor", label: "Vendor" },
      { key: "updatedAt", label: "Last Update" },
    ];
  }, []);

  const formattedRows = useMemo(() => {
    return components.map((c) => ({
      ...c,
      // ✅ FIX: Check strictly for undefined/null so 0 or valid numbers show up
      best_price: (c.best_price !== undefined && c.best_price !== null) ? fmtINR(c.best_price) : "—",
      updatedAt: new Date(c.updatedAt).toLocaleDateString(),
    }));
  }, [components]);

  async function openDrawer(row: any) {
    setFetchingDetails(true);
    try {
        const fullData = await api.getComponentById(row.id);
        setSelectedComponent(fullData);
        setIsCreating(false);
        setDrawerOpen(true);
    } catch (error) {
        toast({ 
            variant: "destructive", 
            title: "Error", 
            description: "Failed to fetch component details." 
        });
    } finally {
        setFetchingDetails(false);
    }
  }

  function handleNewComponent() {
    setSelectedComponent({
      type: category === "All" ? "CPU" : category,
      brand: "",
      model: "",
      variant: "",
      price_current: 0,
      specs: {},        
      compat_specs: {}  
    });
    setIsCreating(true);
    setDrawerOpen(true);
  }

  async function handleDrawerSave(data: any) {
    try {
      if (isCreating) {
        await api.addComponent(data);
        toast({ title: "Created", description: "New component added successfully." });
      } else {
        await api.updateComponent(data.id, data);
        toast({ title: "Saved", description: "Component updated successfully." });
      }
      setDrawerOpen(false);
      fetchComponents(); 
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || "Failed to save." });
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-background">
      {fetchingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <Header />

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="rounded-2xl">
              <TabsTrigger value="components" className="rounded-xl">Components</TabsTrigger>
              <TabsTrigger value="rules" className="rounded-xl">Rules</TabsTrigger>
              <TabsTrigger value="sources" className="rounded-xl">Sources</TabsTrigger>
            </TabsList>

            {tab === "components" && (
              <Button className="rounded-2xl" onClick={handleNewComponent}>
                <Plus className="mr-2 h-4 w-4" /> New Component
              </Button>
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
                  sortKey="" setSortKey={()=>{}} sortDir="" setSortDir={()=>{}}
                />

                <div className="mt-4 rounded-2xl border overflow-hidden min-h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <GridTable
                      columns={tableColumns}
                      rows={formattedRows}
                      category={category}
                      onRowClick={openDrawer}
                      onQuickEdit={() => {}}
                    />
                  )}
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <Database className="inline h-4 w-4 mr-2" />
                  Showing {formattedRows.length} results
                </div>
              </CardContent>
            </Card>

            <DetailsDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              component={selectedComponent}
              isCreating={isCreating}
              onSave={handleDrawerSave}
            />
          </TabsContent>

          <TabsContent value="rules">
             <RulesPanel rules={rules} setRules={setRules} />
          </TabsContent>
          <TabsContent value="sources">
             <SourcesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}