// services/dataService.js
import apiClient from './apiClient';

export const dataService = {
  // Get all recent data for home screen
  getRecentData: async () => {
    try {
      return await apiClient.get('/data/recent');
    } catch (error) {
      console.error('Error fetching recent data:', error);
      throw error;
    }
  },

  // Save insulin dose
  saveInsulin: async (insulinData) => {
    try {
      return await apiClient.post('/insulin', insulinData);
    } catch (error) {
      console.error('Error saving insulin data:', error);
      throw error;
    }
  },

  // Save meal entry
  saveMeal: async (mealData) => {
    try {
      return await apiClient.post('/meal', mealData);
    } catch (error) {
      console.error('Error saving meal data:', error);
      throw error;
    }
  },

  // Save activity entry
  saveActivity: async (activityData) => {
    try {
      return await apiClient.post('/activity', activityData);
    } catch (error) {
      console.error('Error saving activity data:', error);
      throw error;
    }
  },

  // Save vitals entry
  saveVitals: async (vitalsData) => {
    try {
      return await apiClient.post('/vitals', vitalsData);
    } catch (error) {
      console.error('Error saving vitals data:', error);
      throw error;
    }
  }
};