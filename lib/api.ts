import axios from "axios";

// ✅ Make sure Backend is running on Port 5000
const API_BASE = "http://localhost:5000/api";

export const api = {
  // 1. Get Master Data (Categories, Rules)
  getInitData: async () => {
    try {
      const res = await axios.get(`${API_BASE}/master-data`);
      return res.data;
    } catch (error) {
      console.error("API Error - getInitData:", error);
      return null;
    }
  },

  // 2. Get Components (Mapped category -> type)
  getComponents: async (category?: string, search?: string) => {
    try {
      const params: any = {};
      if (category && category !== "All") params.type = category; 
      if (search) params.search = search;

      const res = await axios.get(`${API_BASE}/components`, { params });
      return res.data;
    } catch (error) {
      console.error("API Error - getComponents:", error);
      return [];
    }
  },

  // ✅ NEW: Get Single Component by ID
  getComponentById: async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/components/${id}`);
      return res.data;
    } catch (error) {
      console.error("API Error - getComponentById:", error);
      throw error;
    }
  },

  // 3. Create Component
  addComponent: async (payload: any) => {
    try {
      const res = await axios.post(`${API_BASE}/components`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Update Component
  updateComponent: async (id: string, payload: any) => {
    try {
      const res = await axios.patch(`${API_BASE}/components/${id}`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 5. Add Tracked Link
  addTrackedLink: async (componentId: string, url: string) => {
    try {
        const res = await axios.post(`${API_BASE}/components/track-link`, { componentId, url });
        return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 6. Manual Offer
  addManualOffer: async (payload: any) => {
    try {
      const res = await axios.post(`${API_BASE}/components/manual-offer`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 7. Fetch Specs from URL
  fetchSpecsFromUrl: async (url: string) => {
    try {
      const res = await axios.post(`${API_BASE}/components/fetch-specs`, { url });
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};