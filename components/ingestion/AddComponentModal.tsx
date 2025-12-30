// components/ingestion/AddComponentModal.tsx
import React, { useState, useEffect } from "react";
import { Button, Input, Modal } from "../ui/primitives";
import { Save, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

export default function AddComponentModal({ isOpen, onClose, categories, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  
  // Basic Fields
  const [baseData, setBaseData] = useState({
    brand: "",
    model: "",
    variant: "",
    price: "",
    vendorLink: "",
    image: ""
  });

  // Dynamic Specs
  const [specs, setSpecs] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setCategoryId("");
      setBaseData({ brand: "", model: "", variant: "", price: "", vendorLink: "", image: "" });
      setSpecs({});
    }
  }, [isOpen]);

  // Find currently selected category object to get specKeys
  const activeCategory = categories.find((c: any) => c.id === categoryId);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!categoryId) return alert("Please select a category");

    setLoading(true);
    try {
      const payload = {
        categoryId,
        ...baseData,
        specs: specs, 
        compatibility: specs, // For now, mapping compatibility same as specs
      };

      await api.addComponent(payload);
      onSuccess(); // Refresh parent list
      onClose();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Component">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-black outline-none"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSpecs({});
            }}
            required
          >
            <option value="">-- Select Hardware Type --</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Base Details */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Brand" placeholder="Intel" value={baseData.brand} onChange={(e:any) => setBaseData({...baseData, brand: e.target.value})} required />
          <Input label="Model" placeholder="Core i5-13600K" value={baseData.model} onChange={(e:any) => setBaseData({...baseData, model: e.target.value})} required />
          <Input label="Variant" placeholder="Box / Tray" value={baseData.variant} onChange={(e:any) => setBaseData({...baseData, variant: e.target.value})} />
          <Input label="Image URL" placeholder="https://..." value={baseData.image} onChange={(e:any) => setBaseData({...baseData, image: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (INR)" type="number" placeholder="25000" value={baseData.price} onChange={(e:any) => setBaseData({...baseData, price: e.target.value})} />
          <Input label="Vendor Link" placeholder="https://mdcomputers..." value={baseData.vendorLink} onChange={(e:any) => setBaseData({...baseData, vendorLink: e.target.value})} />
        </div>

        {/* 🔥 DYNAMIC SPEC FIELDS (Magic happens here) */}
        {activeCategory && (
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-bold mb-4 text-gray-900 flex items-center gap-2">
              ⚡ Technical Specs for {activeCategory.name}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {activeCategory.specKeys.map((key: string) => (
                <Input
                  key={key}
                  label={key.replace(/_/g, " ")} 
                  placeholder={`Enter ${key}`}
                  value={specs[key] || ""}
                  onChange={(e:any) => setSpecs({ ...specs, [key]: e.target.value })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Component
          </Button>
        </div>
      </form>
    </Modal>
  );
}