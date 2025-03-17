// services/predictionService.js
import apiClient from './apiClient';

export const predictionService = {
  // Get predictions based on recent data
  getPredictions: async (data) => {
    try {
      return await apiClient.post('/predict', data);
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  },

  // Prepare data for prediction from recent entries
  prepareDataForPrediction: (recentEntries) => {
    // Transform timeline entries into prediction input format
    const glucose_readings = [];
    const basal = [];
    const bolus = [];
    const carbs = [];
    const heart_rate = [];
    const gsr = [];
    const activity = [];

    // Process entries to build arrays
    // This is a simplified example - you'll need to adapt based on your data structure
    recentEntries.forEach(entry => {
      if (entry.type === 'glucose') {
        glucose_readings.push(entry.value);
      } else if (entry.type === 'insulin' && entry.insulin_type === 'basal') {
        basal.push(entry.value);
      } else if (entry.type === 'insulin' && entry.insulin_type === 'bolus') {
        bolus.push(entry.value);
      } else if (entry.type === 'meal') {
        carbs.push(entry.value);
      }
      // Add other types as needed
    });

    // Ensure arrays have at least 12 elements by filling with defaults
    const ensureLength = (arr, defaultValue = 0) => {
      while (arr.length < 12) {
        arr.push(defaultValue);
      }
      return arr.slice(-12); // Get the last 12 entries
    };

    return {
      glucose_readings: ensureLength(glucose_readings),
      insulin: {
        basal: ensureLength(basal),
        bolus: ensureLength(bolus)
      },
      carbs: ensureLength(carbs),
      activity: ensureLength(activity),
      heart_rate: ensureLength(heart_rate, 70),
      gsr: ensureLength(gsr, 1)
    };
  }
};