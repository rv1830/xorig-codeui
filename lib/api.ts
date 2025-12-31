// lib/api.ts
import axios from "axios";

// Adjust this to your actual backend URL
const API_BASE = "https://xorig-backadmin.onrender.com/api";

export const api = {
  // 1. Get Master Data (Categories, Rules, Specs)
  getInitData: async () => {
    try {
      const res = await axios.get(`${API_BASE}/master-data`);
      return res.data;
    } catch (error) {
      console.error("API Error - getInitData:", error);
      return null;
    }
  },

  // 2. Get Components (Filter by category string or search)
  getComponents: async (category?: string, search?: string) => {
    try {
      const params: any = {};
      // If category is "All", we don't send it, so backend returns everything
      if (category && category !== "All") params.category = category;
      if (search) params.search = search;

      const res = await axios.get(`${API_BASE}/components`, { params });
      return res.data;
    } catch (error) {
      console.error("API Error - getComponents:", error);
      return [];
    }
  },

  // 3. Create Component (POST)
  addComponent: async (payload: any) => {
    try {
      const res = await axios.post(`${API_BASE}/components`, payload);
      return res.data;
    } catch (error) {
      console.error("API Error - addComponent:", error);
      throw error;
    }
  },

  // 4. Update Component (PATCH)
  updateComponent: async (id: string, payload: any) => {
    try {
      const res = await axios.patch(`${API_BASE}/components/${id}`, payload);
      return res.data;
    } catch (error) {
      console.error("API Error - updateComponent:", error);
      throw error;
    }
  },

  // 5. Add Tracked Link (NEW - For Price Automation)
  addTrackedLink: async (componentId: string, url: string) => {
    try {
      const res = await axios.post(`${API_BASE}/components/track-link`, { componentId, url });
      return res.data;
    } catch (error) {
      console.error("API Error - addTrackedLink:", error);
      throw error;
    }
  },

  // 6. Manual Offer
  addManualOffer: async (payload: any) => {
    try {
      const res = await axios.post(`${API_BASE}/components/manual-offer`, payload);
      return res.data;
    } catch (error) {
      console.error("API Error - addManualOffer:", error);
      throw error;
    }
  },

  // 7. Fetch Specs from URL
  fetchSpecsFromUrl: async (url: string) => {
    try {
      const res = await axios.post(`${API_BASE}/components/scrape-specs`, { url });
      return res.data;
    } catch (error) {
      console.error("API Error - fetchSpecsFromUrl:", error);
      throw error;
    }
  },


};