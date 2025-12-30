"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Database,
  Tag,
  Link2,
  ShieldAlert,
  ClipboardList,
  Clock,
  Settings2,
  ChevronRight,
  Copy,
  Save,
  X,
} from "lucide-react";

/**
 * XO Rig – Data Ingestion Admin UI (Sample)
 * Single-file demo: Airtable-like grid + details drawer + dynamic specs + offers/prices + lineage + audit log.
 */

// ---------------------------
// Dummy Master Data
// ---------------------------
const DIMENSIONS = {
  sockets: [
    { id: "AM4", label: "AM4" },
    { id: "AM5", label: "AM5" },
    { id: "LGA1700", label: "LGA1700" },
  ],
  memoryTypes: [
    { id: "DDR4", label: "DDR4" },
    { id: "DDR5", label: "DDR5" },
  ],
  formFactors: [
    { id: "ATX", label: "ATX" },
    { id: "mATX", label: "mATX" },
    { id: "ITX", label: "ITX" },
  ],
  chipsets: [
    { id: "B650", label: "B650" },
    { id: "X670E", label: "X670E" },
    { id: "Z790", label: "Z790" },
  ],
  pcie: [
    { id: "3", label: "PCIe 3.0" },
    { id: "4", label: "PCIe 4.0" },
    { id: "5", label: "PCIe 5.0" },
  ],
};

const SOURCES = [
  { id: "pcpt", name: "PCPriceTracker", type: "aggregator", baseUrl: "https://pcpricetracker.in" },
  { id: "md", name: "MDComputers", type: "vendor", baseUrl: "https://mdcomputers.in" },
  { id: "prime", name: "PrimeABGB", type: "vendor", baseUrl: "https://primeabgb.com" },
  { id: "manual", name: "XO Rig Manual", type: "manual", baseUrl: "" },
];

const VENDORS = [
  { id: "md", name: "MDComputers", trust: 86 },
  { id: "prime", name: "PrimeABGB", trust: 82 },
  { id: "ved", name: "Vedant Computers", trust: 78 },
];

// Spec definitions are the "dynamic columns" per category.
const SPEC_DEFS: any = {
  CPU: [
    { id: "core_count", label: "Cores", type: "int", unit: "" },
    { id: "thread_count", label: "Threads", type: "int", unit: "" },
    { id: "base_clock", label: "Base Clock", type: "float", unit: "GHz" },
    { id: "boost_clock", label: "Boost Clock", type: "float", unit: "GHz" },
    { id: "tdp", label: "TDP", type: "int", unit: "W" },
    { id: "igpu", label: "iGPU", type: "bool", unit: "" },
  ],
  Motherboard: [
    { id: "vrm_phases", label: "VRM Phases", type: "string", unit: "" },
    { id: "m2_slots", label: "M.2 Slots", type: "int", unit: "" },
    { id: "wifi", label: "Wi‑Fi", type: "bool", unit: "" },
    { id: "usb_c_header", label: "USB‑C Header", type: "bool", unit: "" },
  ],
  GPU: [
    { id: "vram", label: "VRAM", type: "int", unit: "GB" },
    { id: "boost_mhz", label: "Boost", type: "int", unit: "MHz" },
    { id: "tbp", label: "TBP", type: "int", unit: "W" },
    { id: "slots", label: "Slot Thickness", type: "float", unit: "slots" },
    { id: "length_mm", label: "Length", type: "int", unit: "mm" },
  ],
  RAM: [
    { id: "capacity_gb", label: "Capacity", type: "int", unit: "GB" },
    { id: "sticks", label: "Sticks", type: "int", unit: "" },
    { id: "speed_mhz", label: "Speed", type: "int", unit: "MHz" },
    { id: "cl", label: "CAS Latency", type: "int", unit: "CL" },
  ],
  PSU: [
    { id: "wattage", label: "Wattage", type: "int", unit: "W" },
    { id: "rating", label: "80+ Rating", type: "enum", unit: "", enum: ["Bronze", "Gold", "Platinum"] },
    { id: "atx_version", label: "ATX Spec", type: "enum", unit: "", enum: ["ATX 2.52", "ATX 3.0"] },
    { id: "pcie_12vhpwr", label: "12VHPWR/12V-2x6", type: "bool", unit: "" },
  ],
  Case: [
    { id: "max_gpu_mm", label: "Max GPU Length", type: "int", unit: "mm" },
    { id: "max_cooler_mm", label: "Max CPU Cooler", type: "int", unit: "mm" },
    { id: "radiator_support", label: "Radiator Support", type: "string", unit: "" },
  ],
};

const CATEGORY_COMP_KEYS: any = {
  CPU: ["socket"],
  Motherboard: ["socket", "chipset", "memory_type", "form_factor"],
  GPU: ["pcie_generation"],
  RAM: ["memory_type"],
  PSU: ["form_factor"],
  Case: ["form_factor"],
};

const mkNowMinus = (mins: any) => new Date(Date.now() - mins * 60 * 1000).toISOString();

const DUMMY_COMPONENTS = [
  {
    component_id: "cmp_cpu_7800x3d",
    category: "CPU",
    brand: "AMD",
    model: "Ryzen 7 7800X3D",
    variant_name: "Tray",
    release_date: "2023-04-06",
    warranty_years: 3,
    ean: "0730143314924",
    active_status: "active",
    images: ["https://images.example.com/7800x3d.png"],
    datasheet_url: "https://example.com/ds/7800x3d",
    product_page_url: "https://example.com/p/7800x3d",
    quality: { completeness: 92, needs_review: false, review_status: "approved" },
    compatibility: { socket: "AM5" },
    specs: {
      core_count: { v: 8, source_id: "manual", confidence: 0.98, updated_at: mkNowMinus(3500) },
      thread_count: { v: 16, source_id: "manual", confidence: 0.98, updated_at: mkNowMinus(3500) },
      base_clock: { v: 4.2, source_id: "manual", confidence: 0.95, updated_at: mkNowMinus(3500) },
      boost_clock: { v: 5.0, source_id: "manual", confidence: 0.95, updated_at: mkNowMinus(3500) },
      tdp: { v: 120, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(3500) },
      igpu: { v: true, source_id: "manual", confidence: 0.85, updated_at: mkNowMinus(3500) },
    },
    offers: [
      {
        offer_id: "off_1",
        vendor_id: "md",
        in_stock: true,
        quantity: 7,
        price_inr: 34999,
        shipping_inr: 199,
        effective_price_inr: 35198,
        updated_at: mkNowMinus(40),
        vendor_url: "https://mdcomputers.in/ryzen-7-7800x3d.html",
        source_id: "pcpt",
      },
      {
        offer_id: "off_2",
        vendor_id: "prime",
        in_stock: true,
        quantity: 3,
        price_inr: 35999,
        shipping_inr: 0,
        effective_price_inr: 35999,
        updated_at: mkNowMinus(70),
        vendor_url: "https://primeabgb.com/ryzen-7-7800x3d",
        source_id: "pcpt",
      },
    ],
    external_ids: [
      {
        source_id: "pcpt",
        external_id: "pcpt:cpu:7800x3d",
        external_url: "https://pcpricetracker.in/cpu/7800x3d",
        match_method: "manual",
        match_confidence: 1.0,
      },
    ],
    audit: [
      {
        at: mkNowMinus(1200),
        actor: "admin@xor",
        action: "update",
        field: "specs.tdp",
        before: "105",
        after: "120",
      },
    ],
  },
  {
    component_id: "cmp_mobo_b650m_pro_rs",
    category: "Motherboard",
    brand: "ASRock",
    model: "B650M Pro RS",
    variant_name: "WiFi",
    release_date: "2022-10-10",
    warranty_years: 3,
    ean: "4710483941062",
    active_status: "active",
    images: ["https://images.example.com/b650m.png"],
    datasheet_url: "https://example.com/ds/b650m-pro-rs",
    product_page_url: "https://example.com/p/b650m-pro-rs",
    quality: { completeness: 84, needs_review: true, review_status: "unreviewed" },
    compatibility: { socket: "AM5", chipset: "B650", memory_type: "DDR5", form_factor: "mATX" },
    specs: {
      vrm_phases: { v: "8+2+1", source_id: "pcpt", confidence: 0.7, updated_at: mkNowMinus(800) },
      m2_slots: { v: 2, source_id: "pcpt", confidence: 0.8, updated_at: mkNowMinus(800) },
      wifi: { v: true, source_id: "manual", confidence: 0.95, updated_at: mkNowMinus(2000) },
      usb_c_header: { v: true, source_id: "pcpt", confidence: 0.65, updated_at: mkNowMinus(800) },
    },
    offers: [
      {
        offer_id: "off_3",
        vendor_id: "md",
        in_stock: true,
        quantity: 5,
        price_inr: 14999,
        shipping_inr: 199,
        effective_price_inr: 15198,
        updated_at: mkNowMinus(55),
        vendor_url: "https://mdcomputers.in/asrock-b650m-pro-rs-wifi.html",
        source_id: "pcpt",
      },
    ],
    external_ids: [
      {
        source_id: "pcpt",
        external_id: "pcpt:mobo:b650m-pro-rs-wifi",
        external_url: "https://pcpricetracker.in/mobo/b650m-pro-rs",
        match_method: "fuzzy",
        match_confidence: 0.88,
      },
    ],
    audit: [
      {
        at: mkNowMinus(300),
        actor: "system",
        action: "ingest",
        field: "offers[0].price_inr",
        before: "15499",
        after: "14999",
      },
    ],
  },
  {
    component_id: "cmp_gpu_4070s_dual_oc",
    category: "GPU",
    brand: "ASUS",
    model: "GeForce RTX 4070 Super",
    variant_name: "DUAL OC",
    release_date: "2024-01-17",
    warranty_years: 3,
    ean: "4711387422222",
    active_status: "active",
    images: ["https://images.example.com/4070s.png"],
    datasheet_url: "https://example.com/ds/4070s-dual-oc",
    product_page_url: "https://example.com/p/4070s-dual-oc",
    quality: { completeness: 88, needs_review: false, review_status: "approved" },
    compatibility: { pcie_generation: "4" },
    specs: {
      vram: { v: 12, source_id: "manual", confidence: 0.95, updated_at: mkNowMinus(1500) },
      boost_mhz: { v: 2550, source_id: "pcpt", confidence: 0.75, updated_at: mkNowMinus(900) },
      tbp: { v: 220, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(1500) },
      slots: { v: 2.56, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(1500) },
      length_mm: { v: 267, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(1500) },
    },
    offers: [
      {
        offer_id: "off_4",
        vendor_id: "prime",
        in_stock: false,
        quantity: 0,
        price_inr: 62999,
        shipping_inr: 0,
        effective_price_inr: 62999,
        updated_at: mkNowMinus(25),
        vendor_url: "https://primeabgb.com/asus-4070-super-dual-oc",
        source_id: "pcpt",
      },
      {
        offer_id: "off_5",
        vendor_id: "ved",
        in_stock: true,
        quantity: 2,
        price_inr: 63999,
        shipping_inr: 150,
        effective_price_inr: 64149,
        updated_at: mkNowMinus(31),
        vendor_url: "https://vedantcomputers.com/asus-4070-super-dual-oc",
        source_id: "pcpt",
      },
    ],
    external_ids: [
      {
        source_id: "pcpt",
        external_id: "pcpt:gpu:asus-4070s-dual-oc",
        external_url: "https://pcpricetracker.in/gpu/4070s-dual-oc",
        match_method: "ean",
        match_confidence: 0.97,
      },
    ],
    audit: [
      {
        at: mkNowMinus(20),
        actor: "system",
        action: "ingest",
        field: "offers[1].in_stock",
        before: "false",
        after: "true",
      },
    ],
  },
  {
    component_id: "cmp_ram_32_ddr5_6000",
    category: "RAM",
    brand: "G.Skill",
    model: "Trident Z5 Neo",
    variant_name: "32GB (2x16) 6000 CL30",
    release_date: "2022-09-01",
    warranty_years: 10,
    ean: "4713294233333",
    active_status: "active",
    images: ["https://images.example.com/z5neo.png"],
    datasheet_url: "https://example.com/ds/z5neo",
    product_page_url: "https://example.com/p/z5neo",
    quality: { completeness: 90, needs_review: false, review_status: "approved" },
    compatibility: { memory_type: "DDR5" },
    specs: {
      capacity_gb: { v: 32, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(1900) },
      sticks: { v: 2, source_id: "manual", confidence: 0.9, updated_at: mkNowMinus(1900) },
      speed_mhz: { v: 6000, source_id: "pcpt", confidence: 0.8, updated_at: mkNowMinus(1000) },
      cl: { v: 30, source_id: "pcpt", confidence: 0.7, updated_at: mkNowMinus(1000) },
    },
    offers: [
      {
        offer_id: "off_6",
        vendor_id: "md",
        in_stock: true,
        quantity: 9,
        price_inr: 11999,
        shipping_inr: 0,
        effective_price_inr: 11999,
        updated_at: mkNowMinus(80),
        vendor_url: "https://mdcomputers.in/gskill-z5neo-32-6000.html",
        source_id: "pcpt",
      },
    ],
    external_ids: [],
    audit: [],
  },
];

const DUMMY_RULES = [
  {
    rule_id: "r1",
    name: "CPU socket must match motherboard socket",
    severity: "error",
    applies: "CPU + Motherboard",
    expr: { op: "eq", left: "cpu.socket", right: "mobo.socket" },
    message: "CPU socket and Motherboard socket must match.",
    enabled: true,
  },
  {
    rule_id: "r2",
    name: "RAM memory type must match motherboard memory type",
    severity: "error",
    applies: "RAM + Motherboard",
    expr: { op: "eq", left: "ram.memory_type", right: "mobo.memory_type" },
    message: "RAM type (DDR4/DDR5) must match the motherboard.",
    enabled: true,
  },
  {
    rule_id: "r3",
    name: "GPU length must fit case max GPU length",
    severity: "warn",
    applies: "GPU + Case",
    expr: { op: "lte", left: "gpu.length_mm", right: "case.max_gpu_mm" },
    message: "GPU length may not fit the selected case.",
    enabled: true,
  },
];

// ---------------------------
// Small Utilities
// ---------------------------
const fmtINR = (n: any) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const toTitle = (s: any) => (s || "").replace(/\b\w/g, (c: any) => c.toUpperCase());

const severityBadge = (s: any) => {
  if (s === "error") return <Badge variant="destructive">Error</Badge>;
  if (s === "warn") return <Badge variant="secondary">Warn</Badge>;
  return <Badge variant="outline">Info</Badge>;
};

function sourceName(source_id: any) {
  return SOURCES.find((x) => x.id === source_id)?.name || source_id;
}

function vendorName(vendor_id: any) {
  return VENDORS.find((x) => x.id === vendor_id)?.name || vendor_id;
}

function trustScore(vendor_id: any) {
  return VENDORS.find((x) => x.id === vendor_id)?.trust ?? 0;
}

function bestOffer(offers: any) {
  if (!offers?.length) return null;
  const inStock = offers.filter((o: any) => o.in_stock);
  const list = inStock.length ? inStock : offers;
  return [...list].sort((a: any, b: any) => (a.effective_price_inr ?? 1e18) - (b.effective_price_inr ?? 1e18))[0];
}

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
    return SPEC_DEFS[category] || [];
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
    const compatKeys = (CATEGORY_COMP_KEYS[category] || []).map((k: any) => ({
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

// ---------------------------
// Header
// ---------------------------
function Header() {
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

// ---------------------------
// Toolbar
// ---------------------------
function Toolbar({ categories, category, setCategory, q, setQ, sortKey, setSortKey, sortDir, setSortDir }: any) {
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

// ---------------------------
// Grid Table
// ---------------------------
function GridTable({ columns, rows, category, onRowClick, onQuickEdit }: any) {
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

function applyPatch(component: any, patch: any) {
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

// ---------------------------
// Details Drawer
// ---------------------------
function DetailsDrawer({ open, onOpenChange, component, onSave }: any) {
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

  const specDefs = useMemo(() => (component ? SPEC_DEFS[component.category] || [] : []), [component?.category]);
  const compatKeys = useMemo(() => (component ? CATEGORY_COMP_KEYS[component.category] || [] : []), [component?.category]);

  if (!component) return null;
  // --- Fix for Cannot read properties of null (reading 'brand') ---
  // Ensure draft is loaded before rendering
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
      <DialogContent className="max-w-4xl rounded-3xl">
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
          <Card className="rounded-3xl shadow-sm lg:col-span-2">
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
            <Card className="rounded-3xl shadow-sm">
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

            <Card className="rounded-3xl shadow-sm">
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

            <Card className="rounded-3xl shadow-sm">
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

            <Card className="rounded-3xl shadow-sm">
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

// ---------------------------
// Rules Panel
// ---------------------------
function RulesPanel({ rules, setRules }: any) {
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

// ---------------------------
// Sources Panel
// ---------------------------
function SourcesPanel() {
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
                  <Badge variant="outline" className="rounded-2xl">{s.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{s.baseUrl || "—"}</div>
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