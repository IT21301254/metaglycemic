// hooks/useGlucoseData.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GlucoseReading = {
  id: string;
  value: number;
  timestamp: number;
  mealContext?: 'before_meal' | 'after_meal' | 'fasting' | 'bedtime';
  notes?: string;
};

export function useGlucoseData() {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load glucose readings from storage
  const loadReadings = async () => {
    try {
      setLoading(true);
      const storedReadings = await AsyncStorage.getItem('glucose_readings');
      if (storedReadings) {
        setReadings(JSON.parse(storedReadings));
      }
      setError(null);
    } catch (err) {
      setError('Failed to load glucose readings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new glucose reading
  const addReading = async (reading: Omit<GlucoseReading, 'id'>) => {
    try {
      const newReading: GlucoseReading = {
        ...reading,
        id: Date.now().toString(),
      };
      
      const updatedReadings = [...readings, newReading];
      
      // Sort by timestamp (newest first)
      updatedReadings.sort((a, b) => b.timestamp - a.timestamp);
      
      setReadings(updatedReadings);
      await AsyncStorage.setItem('glucose_readings', JSON.stringify(updatedReadings));
      return newReading;
    } catch (err) {
      setError('Failed to add glucose reading');
      console.error(err);
      throw err;
    }
  };
  
  // Delete a glucose reading
  const deleteReading = async (id: string) => {
    try {
      const updatedReadings = readings.filter(r => r.id !== id);
      setReadings(updatedReadings);
      await AsyncStorage.setItem('glucose_readings', JSON.stringify(updatedReadings));
    } catch (err) {
      setError('Failed to delete glucose reading');
      console.error(err);
      throw err;
    }
  };
  
  // Get the most recent reading
  const getLatestReading = () => {
    if (readings.length === 0) return null;
    return readings[0]; // Readings are sorted newest first
  };
  
  // Get readings from today
  const getTodaysReadings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    return readings.filter(r => r.timestamp >= todayTimestamp);
  };
  
  // Load readings on mount
  useEffect(() => {
    loadReadings();
  }, []);
  
  return {
    readings,
    loading,
    error,
    loadReadings,
    addReading,
    deleteReading,
    getLatestReading,
    getTodaysReadings,
  };
}