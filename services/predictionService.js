// services/predictionService.js
import apiClient from './apiClient';

export const predictionService = {
  // Get predictions based on recent data
  getPredictions: async (data) => {
    try {
      const response = await apiClient.post('/predict', data);
      // If response is already the data (due to apiClient interceptor), return it
      // Otherwise, return response.data
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  },
  
  // Get enhanced recommendation based on prediction ID
  getEnhancedRecommendation: async (predictionId) => {
    try {
      const response = await apiClient.get(`/recommendation/${predictionId}`);
      // If response is already the data (due to apiClient interceptor), return it
      // Otherwise, return response.data
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error getting enhanced recommendation:', error);
      throw error;
    }
  },

  // The rest of your code remains the same
  prepareDataForPrediction: (recentEntries) => {
    // Initialize arrays for different data types
    const glucose_readings = [];
    const basal = [];
    const bolus = [];
    const carbs = [];
    const activity = [];
    const heart_rate = [];
    const gsr = [];

    // Process entries to build arrays
    recentEntries.forEach(entry => {
      if (entry.type === 'glucose') {
        glucose_readings.push(entry.value);
      } else if (entry.type === 'insulin') {
        if (entry.insulinType === 'basal') {
          basal.push(entry.value);
        } else if (entry.insulinType === 'bolus') {
          bolus.push(entry.value);
        }
      } else if (entry.type === 'meal') {
        carbs.push(entry.value);
      } else if (entry.type === 'activity') {
        // Use duration if available, otherwise use value
        activity.push(entry.duration || entry.value);
      }
    });

    // Ensure arrays have enough elements for the prediction model
    const ensureLength = (arr, defaultValue = 0, minLength = 3) => {
      // If array is empty, provide reasonable defaults
      if (arr.length === 0) {
        return Array(minLength).fill(defaultValue);
      }
      
      // If array has fewer elements than minLength, pad with the last value
      // This is better than padding with zeros for time series data
      while (arr.length < minLength) {
        arr.push(arr.length > 0 ? arr[arr.length - 1] : defaultValue);
      }
      
      return arr;
    };

    // Format glucose readings to ensure we have enough data (at least 13 values)
    // If we don't have any glucose readings, use 120 mg/dL as a reasonable default
    let formattedGlucoseReadings = glucose_readings.length > 0 
      ? [...glucose_readings]  // Copy array to avoid mutating original
      : [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120];
    
    // Ensure we have at least 13 glucose readings as expected by backend
    while (formattedGlucoseReadings.length < 13) {
      // If we have some values, repeat the last value
      if (formattedGlucoseReadings.length > 0) {
        formattedGlucoseReadings.push(formattedGlucoseReadings[formattedGlucoseReadings.length - 1]);
      } else {
        // Otherwise use default value
        formattedGlucoseReadings.push(120);
      }
    }

    // Build the prediction request object in the format expected by the backend
    return {
      glucose_readings: formattedGlucoseReadings,
      insulin: {
        basal: ensureLength(basal),
        bolus: ensureLength(bolus)
      },
      carbs: ensureLength(carbs),
      activity: ensureLength(activity),
      heart_rate: ensureLength(heart_rate, 70),
      gsr: ensureLength(gsr, 1)
    };
  },
  
  // Format risk level based on probability
  getRiskLevel: (probability) => {
    if (probability < 0.3) return 'low';
    if (probability < 0.7) return 'medium';
    return 'high';
  },
  
  // Create a fallback prediction response if the API fails
  getFallbackPrediction: (currentGlucose = 120) => {
    const isLow = currentGlucose < 70;
    const isHigh = currentGlucose > 180;
    
    let recommendation = 'Continue monitoring your glucose levels as usual.';
    
    if (isLow) {
      recommendation = 'Your glucose is currently low. Consider consuming 15-20g of fast-acting carbs immediately.';
    } else if (isHigh) {
      recommendation = 'Your glucose is currently high. Check with your healthcare provider about appropriate steps.';
    }
    
    return {
      current_glucose: currentGlucose,
      hypo_probability: isLow ? 0.9 : 0.1,
      hyper_probability: isHigh ? 0.9 : 0.1,
      hypo_risk: isLow ? 'High' : 'Low',
      hyper_risk: isHigh ? 'High' : 'Low',
      time_to_hypo_minutes: isLow ? 0 : null,
      time_to_hyper_minutes: isHigh ? 0 : null,
      recommendation,
      prediction_id: 'fallback-' + Date.now(),
      timestamp: new Date().toISOString(),
      rule_based_prediction: true
    };
  }
};