// services/glucoseService.js
import apiClient from './apiClient';

export const glucoseService = {
  // Get recent glucose readings
  getRecentReadings: async () => {
    try {
      return await apiClient.get('/glucose');
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
      throw error;
    }
  },

  // Save new glucose reading
  saveReading: async (glucoseData) => {
    try {
      return await apiClient.post('/glucose', glucoseData);
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      throw error;
    }
  }
};