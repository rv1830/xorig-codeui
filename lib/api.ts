// lib/api.ts
import axios from "axios";

// Adjust this to your actual backend URL
const API_BASE = "http://localhost:5000/api";

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
  // Payload matches Prisma: brand, model, variant, category (name or id), specs (json), compatibility (json)
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
  // Handles partial updates or full object saves
  updateComponent: async (id: string, payload: any) => {
    try {
      const res = await axios.patch(`${API_BASE}/components/${id}`, payload);
      return res.data;
    } catch (error) {
      console.error("API Error - updateComponent:", error);
      throw error;
    }
  }
};