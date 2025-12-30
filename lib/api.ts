import axios from "axios";

const API_BASE = "http://localhost:5000";

export const api = {
    // Categories laane ke liye (Agar backend me endpoints hain)
    getCategories: async () => {
        try {
            const res = await axios.get(`${API_BASE}/categories`);
            return res.data;
        } catch (e) {
            console.error("Backend offline? Using fallbacks.");
            return [];
        }
    },

    // Components laane ke liye
    getComponents: async () => {
        try {
            const res = await axios.get(`${API_BASE}/components`);
            // Backend data ko Frontend format me map karna
            return res.data.map(item => ({
                component_id: item.id,
                category: item.category?.name || "Uncategorized",
                brand: item.brand,
                model: item.model,
                variant_name: item.variant || "",
                specs: item.specs || {},
                compatibility: item.compatibility || {},
                offers: item.price ? [{
                    offer_id: `off_${item.id}`,
                    vendor_id: "manual",
                    price_inr: item.price,
                    effective_price_inr: item.price,
                    in_stock: item.inStock,
                    updated_at: item.updatedAt
                }] : [],
                quality: { completeness: 100, needs_review: false }, // Default
                audit: [] // Default
            }));
        } catch (e) {
            console.error("Failed to fetch components", e);
            return [];
        }
    },

    // Naya component save karne ke liye
    addComponent: async (payload: any) => {
        // Frontend structure ko backend format me convert karo
        const backendPayload = {
            categoryId: payload.categoryId, // Frontend must supply this ID
            brand: payload.brand,
            model: payload.model,
            variant: payload.variant,
            specs: payload.specs || {},
            compatibility: payload.compatibility || {},
            price: payload.price || 0,
            image: payload.image || ""
        };
        const res = await axios.post(`${API_BASE}/components`, backendPayload);
        return res.data;
    },

    // Update Component (Agar backend support karta hai)
    updateComponent: async (id, payload) => {
        // Implement update logic based on your backend
        return payload;
    }
};