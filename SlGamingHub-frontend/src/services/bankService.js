import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// Define the API base URL from config
const API_BASE_URL = API_CONFIG.BASE_URL;
const BANKS_ENDPOINT = API_CONFIG.ENDPOINTS.BANKS;

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Bank API service
const bankService = {
  // Get all banks
  getAllBanks: async () => {
    // If forcing fallback for development/testing, throw error to trigger fallback
    if (API_CONFIG.FORCE_FALLBACK) {
      throw new Error('Forced fallback mode is enabled');
    }
    
    try {
      const response = await apiClient.get(BANKS_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching banks:', error);
      throw error;
    }
  },

  // Get a single bank by ID
  getBank: async (id) => {
    if (API_CONFIG.FORCE_FALLBACK) {
      throw new Error('Forced fallback mode is enabled');
    }
    
    try {
      const response = await apiClient.get(`${BANKS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bank with id ${id}:`, error);
      throw error;
    }
  },

  // Create a new bank
  createBank: async (bankData) => {
    if (API_CONFIG.FORCE_FALLBACK) {
      throw new Error('Forced fallback mode is enabled');
    }
    
    try {
      const response = await apiClient.post(BANKS_ENDPOINT, bankData);
      return response.data;
    } catch (error) {
      console.error('Error creating bank:', error);
      throw error;
    }
  },

  // Update an existing bank
  updateBank: async (id, bankData) => {
    if (API_CONFIG.FORCE_FALLBACK) {
      throw new Error('Forced fallback mode is enabled');
    }
    
    try {
      const response = await apiClient.put(`${BANKS_ENDPOINT}/${id}`, bankData);
      return response.data;
    } catch (error) {
      console.error(`Error updating bank with id ${id}:`, error);
      throw error;
    }
  },

  // Delete a bank
  deleteBank: async (id) => {
    if (API_CONFIG.FORCE_FALLBACK) {
      throw new Error('Forced fallback mode is enabled');
    }
    
    try {
      const response = await apiClient.delete(`${BANKS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting bank with id ${id}:`, error);
      throw error;
    }
  },

  // Fallback to localStorage if API is unavailable
  fallbackToLocalStorage: () => {
    console.warn('Falling back to localStorage due to API unavailability');
    return {
      getAllBanks: () => {
        const banks = localStorage.getItem('bankData');
        return banks ? JSON.parse(banks) : [];
      },
      createBank: (bankData) => {
        const banks = localStorage.getItem('bankData') ? JSON.parse(localStorage.getItem('bankData')) : [];
        const newBank = { ...bankData, _id: Date.now().toString(), createdAt: new Date().toISOString() };
        banks.push(newBank);
        localStorage.setItem('bankData', JSON.stringify(banks));
        return newBank;
      },
      updateBank: (id, bankData) => {
        const banks = localStorage.getItem('bankData') ? JSON.parse(localStorage.getItem('bankData')) : [];
        const index = banks.findIndex(bank => bank._id === id);
        if (index === -1) throw new Error('Bank not found');
        banks[index] = { ...banks[index], ...bankData, updatedAt: new Date().toISOString() };
        localStorage.setItem('bankData', JSON.stringify(banks));
        return banks[index];
      },
      deleteBank: (id) => {
        const banks = localStorage.getItem('bankData') ? JSON.parse(localStorage.getItem('bankData')) : [];
        const filteredBanks = banks.filter(bank => bank._id !== id);
        if (filteredBanks.length === banks.length) throw new Error('Bank not found');
        localStorage.setItem('bankData', JSON.stringify(filteredBanks));
        return { success: true };
      }
    };
  }
};

export default bankService;
