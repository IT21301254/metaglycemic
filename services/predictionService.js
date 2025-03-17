// services/predictionService.js
import apiClient from './apiClient';

const PredictionService = {
  // Helper method to generate 12 data points
  generate12Points(entries, defaultValue = 120) {
    // If no entries or empty array, generate 12 default points
    if (!entries || entries.length === 0) {
      return Array(12).fill(defaultValue);
    }

    // Extract values, handling different entry structures
    const values = entries.map(entry => 
      typeof entry === 'object' ? entry.value : entry
    );

    // If fewer than 12 entries, pad with the last value
    const paddedValues = [...values];
    while (paddedValues.length < 12) {
      paddedValues.push(paddedValues[paddedValues.length - 1]);
    }

    // Return exactly 12 points, taking the last 12 if more exist
    return paddedValues.slice(-12);
  },

  // Get predictions based on recent data
  async getPredictions(data) {
    try {
      const response = await apiClient.post('/predict', data);
      // If response is already the data (due to apiClient interceptor), return it
      // Otherwise, return response.data
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error getting predictions:', error);
      // Return fallback prediction if API call fails
      return this.getFallbackPrediction();
    }
  },
  
  // Get enhanced recommendation based on prediction ID
  async getEnhancedRecommendation(predictionId) {
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

  // Prepare data for prediction
  prepareDataForPrediction(recentEntries = []) {
    return {
      glucose_readings: this.generate12Points(
        recentEntries.filter(entry => entry.type === 'glucose')
      ),
      insulin: {
        basal: this.generate12Points(
          recentEntries.filter(entry => entry.type === 'insulin' && entry.insulinType === 'basal'),
          0
        ),
        bolus: this.generate12Points(
          recentEntries.filter(entry => entry.type === 'insulin' && entry.insulinType === 'bolus'),
          0
        )
      },
      carbs: this.generate12Points(
        recentEntries.filter(entry => entry.type === 'meal'),
        0
      ),
      activity: this.generate12Points(
        recentEntries.filter(entry => entry.type === 'activity'),
        0
      ),
      heart_rate: this.generate12Points([], 70),  // Default heart rate
      gsr: this.generate12Points([], 1)           // Default GSR
    };
  },
  
  // Format risk level based on probability
  getRiskLevel(probability) {
    if (probability < 0.3) return 'low';
    if (probability < 0.7) return 'medium';
    return 'high';
  },
  
  // Create a fallback prediction response if the API fails
  getFallbackPrediction(currentGlucose = 120) {
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

// Export the service object directly
export const predictionService = PredictionService;