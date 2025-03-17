// services/predictionService.ts
import { GlucoseReading } from '../hooks/useGlucoseData';
import { GlycemicPrediction } from '../hooks/usePredictions';

// Calculate risk level based on probability
function calculateRiskLevel(probability: number): 'low' | 'medium' | 'high' {
  if (probability < 0.3) return 'low';
  if (probability < 0.7) return 'medium';
  return 'high';
}

// Generate recommendation based on predictions
function generateRecommendation(
  currentGlucose: number | null,
  hypoPrediction: { probability: number; timeToEvent: number },
  hyperPrediction: { probability: number; timeToEvent: number }
): string {
  if (!currentGlucose) return 'Please log your glucose level for personalized recommendations.';
  
  if (currentGlucose < 70) {
    return 'URGENT: Your glucose is low. Consume 15-20g of fast-acting carbohydrates immediately.';
  }
  
  if (currentGlucose > 180) {
    return 'Your glucose is currently high. Check for missed insulin doses or recent high-carb meals.';
  }
  
  if (hypoPrediction.probability > 0.7 && hypoPrediction.timeToEvent < 30) {
    return `WARNING: High risk of low glucose in ${Math.round(hypoPrediction.timeToEvent)} minutes. Consider consuming 15g of carbs.`;
  }
  
  if (hyperPrediction.probability > 0.7 && hyperPrediction.timeToEvent < 30) {
    return `ALERT: High risk of high glucose in ${Math.round(hyperPrediction.timeToEvent)} minutes. Check recent carb intake and insulin.`;
  }
  
  if (hypoPrediction.probability > 0.3) {
    return `Moderate risk of low glucose. Monitor levels over the next ${Math.round(hypoPrediction.timeToEvent)} minutes.`;
  }
  
  if (hyperPrediction.probability > 0.3) {
    return `Moderate risk of high glucose. Be mindful of carb intake and insulin timing.`;
  }
  
  return 'Your glucose levels appear stable. Continue with regular monitoring.';
}

// Main prediction function
export async function calculatePredictions(readings: GlucoseReading[]): Promise<GlycemicPrediction> {
  // In a real implementation, this would call your ML model
  // For now, we'll use a simple rule-based approach for demonstration
  
  // Get the most recent reading
  const sortedReadings = [...readings].sort((a, b) => b.timestamp - a.timestamp);
  const latestReading = sortedReadings[0];
  
  // Simple rules for demonstration:
  // 1. If latest glucose is trending down and below 100, higher risk of hypo
  // 2. If latest glucose is trending up and above 150, higher risk of hyper
  
  let hypoProb = 0.1;  // Base probability
  let hyperProb = 0.1; // Base probability
  
  // We need at least 3 readings for trend analysis
  if (sortedReadings.length >= 3) {
    const latest = sortedReadings[0].value;
    const previous = sortedReadings[1].value;
    const older = sortedReadings[2].value;
    
    // Trending down
    if (latest < previous && previous < older) {
      const rate = (older - latest) / 2; // Approximate rate of decline
      hypoProb += (rate / 10) * (1 - (latest / 100));
      hyperProb *= 0.8; // Reduce hyper probability
    }
    
    // Trending up
    if (latest > previous && previous > older) {
      const rate = (latest - older) / 2; // Approximate rate of increase
      hyperProb += (rate / 10) * (latest / 180);
      hypoProb *= 0.8; // Reduce hypo probability
    }
  }
  
  // Adjust based on current value
  if (latestReading.value < 90) {
    hypoProb += (90 - latestReading.value) / 30;
  }
  
  if (latestReading.value > 140) {
    hyperProb += (latestReading.value - 140) / 60;
  }
  
  // Ensure probabilities are within [0, 1]
  hypoProb = Math.max(0, Math.min(1, hypoProb));
  hyperProb = Math.max(0, Math.min(1, hyperProb));
  
  // Calculate estimated time to events (simplified)
  const hypoTimeToEvent = 30 + (latestReading.value - 70) * 3;
  const hyperTimeToEvent = 30 + (180 - latestReading.value) * 2;
  
  // Generate the prediction object
  const prediction: GlycemicPrediction = {
    hypoglycemia: {
      probability: hypoProb,
      timeToEvent: hypoTimeToEvent,
      riskLevel: calculateRiskLevel(hypoProb)
    },
    hyperglycemia: {
      probability: hyperProb,
      timeToEvent: hyperTimeToEvent,
      riskLevel: calculateRiskLevel(hyperProb)
    },
    recommendation: generateRecommendation(
      latestReading.value,
      { probability: hypoProb, timeToEvent: hypoTimeToEvent },
      { probability: hyperProb, timeToEvent: hyperTimeToEvent }
    )
  };
  
  return prediction;
}