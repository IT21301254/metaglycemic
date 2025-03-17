// hooks/usePredictions.ts
import { useState, useEffect } from 'react';
import { calculatePredictions } from '../services/predictionService';
import { useGlucoseData } from './useGlucoseData';

export type GlycemicPrediction = {
  hypoglycemia: {
    probability: number;
    timeToEvent: number; // in minutes
    riskLevel: 'low' | 'medium' | 'high';
  };
  hyperglycemia: {
    probability: number;
    timeToEvent: number; // in minutes
    riskLevel: 'low' | 'medium' | 'high';
  };
  recommendation: string;
};

export function usePredictions() {
  const { readings, loading: loadingGlucose } = useGlucoseData();
  const [prediction, setPrediction] = useState<GlycemicPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update predictions when readings change
  useEffect(() => {
    if (loadingGlucose) return;
    
    const updatePredictions = async () => {
      try {
        setLoading(true);
        
        if (readings.length === 0) {
          setPrediction(null);
          return;
        }
        
        // Get the prediction from the service
        const newPrediction = await calculatePredictions(readings);
        setPrediction(newPrediction);
        setError(null);
      } catch (err) {
        setError('Failed to update predictions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    updatePredictions();
  }, [readings, loadingGlucose]);
  
  return {
    prediction,
    loading,
    error,
  };
}