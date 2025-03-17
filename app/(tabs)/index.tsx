// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import Animated, { FadeIn } from 'react-native-reanimated';

// Import components
import GlucoseStatusCard from '../../components/home/GlucoseStatusCard';
import PredictionCard from '../../components/home/PredictionCard';
import DailyOverviewChart from '../../components/home/DailyOverviewChart';
import RecentEntriesTimeline from '../../components/home/RecentEntriesTimeline';
import QuickActionsBar from '../../components/home/QuickActionsBar';

// Import services
import { dataService } from '../../services';
import { predictionService } from '../../services/predictionService';

// Define type for TimelineEntry to match the one in RecentEntriesTimeline
type Entry = {
  id: string;
  type: 'glucose' | 'insulin' | 'meal' | 'activity';
  value: number;
  time: string;
  insulinType?: string;
  mealType?: string;
  activityType?: string;
};

// Define type for API data which may include timestamp
interface ApiTimelineEntry {
  id: string;
  type: string;
  value: number;
  time?: string;
  timestamp?: string;
  insulinType?: string;
  mealType?: string;
  activityType?: string;
}

interface GlucoseDataPoint {
  time: string;
  value: number;
}

interface ApiResponse {
  timeline?: ApiTimelineEntry[];
  glucose_data?: GlucoseDataPoint[];
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // State for fetched data
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use the Entry type that matches the component's requirements
  const [timelineEntries, setTimelineEntries] = useState<Entry[]>([]);
  const [glucoseData, setGlucoseData] = useState<GlucoseDataPoint[]>([]);
  
  // State for glucose data
  const [currentGlucose, setCurrentGlucose] = useState<number | null>(null);
  const [lastReadingTime, setLastReadingTime] = useState('');
  const [trend, setTrend] = useState<'rising' | 'falling' | 'stable' | null>(null);
  
  // State for prediction data
  const [hypoPrediction, setHypoPrediction] = useState({
    probability: 0,
    timeToEvent: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });
  
  const [hyperPrediction, setHyperPrediction] = useState({
    probability: 0,
    timeToEvent: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });
  
  const [recommendation, setRecommendation] = useState('');
  
  // Function to load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch recent data from API
      const recentData: ApiResponse = await dataService.getRecentData();
      
      // Convert API timeline entries to the format expected by the RecentEntriesTimeline component
      const formattedEntries: Entry[] = (recentData.timeline || [])
        .filter(apiEntry => 
          apiEntry.type === 'glucose' || 
          apiEntry.type === 'insulin' || 
          apiEntry.type === 'meal' || 
          apiEntry.type === 'activity'
        )
        .map(apiEntry => ({
          id: apiEntry.id,
          type: apiEntry.type as 'glucose' | 'insulin' | 'meal' | 'activity',
          value: apiEntry.value,
          // Ensure time is always a string (never undefined)
          time: apiEntry.time || (apiEntry.timestamp ? new Date(apiEntry.timestamp).toLocaleString() : 'Unknown time'),
          insulinType: apiEntry.insulinType,
          mealType: apiEntry.mealType,
          activityType: apiEntry.activityType
        }));

      // Update timeline entries with properly formatted data
      setTimelineEntries(formattedEntries);
      
      // Update glucose chart data
      setGlucoseData(recentData.glucose_data || []);
      
      // Get current glucose from most recent reading
      if (recentData.timeline && recentData.timeline.length > 0) {
        const glucoseEntries = recentData.timeline.filter(
          (apiEntry: ApiTimelineEntry) => apiEntry.type === 'glucose'
        );
        
        if (glucoseEntries.length > 0) {
          const latestGlucose = glucoseEntries[0];
          setCurrentGlucose(latestGlucose.value);
          setLastReadingTime(
            latestGlucose.timestamp 
              ? new Date(latestGlucose.timestamp).toLocaleString() 
              : latestGlucose.time || 'Unknown time'
          );
          
          // Determine trend if we have multiple readings
          if (glucoseEntries.length > 1) {
            const prevGlucose = glucoseEntries[1];
            const diff = latestGlucose.value - prevGlucose.value;
            if (diff > 5) setTrend('rising');
            else if (diff < -5) setTrend('falling');
            else setTrend('stable');
          }
        }
      }
      
      // Get predictions based on timeline data
      if (recentData.timeline && recentData.timeline.length > 0) {
        try {
          // Prepare data for prediction API
          const predictionData = predictionService.prepareDataForPrediction(recentData.timeline);
          
          // Call prediction API
          const predictionResult = await predictionService.getPredictions(predictionData);
          
          // Update prediction state - handling possible null values for time_to_hypo_minutes
          setHypoPrediction({
            probability: predictionResult.hypo_probability || 0,
            timeToEvent: predictionResult.time_to_hypo_minutes !== null ? predictionResult.time_to_hypo_minutes : 0,
            riskLevel: (predictionResult.hypo_risk?.toLowerCase() as 'low' | 'medium' | 'high') || 'low'
          });
          
          // Update hyper prediction - handling possible null values for time_to_hyper_minutes
          setHyperPrediction({
            probability: predictionResult.hyper_probability || 0,
            timeToEvent: predictionResult.time_to_hyper_minutes !== null ? predictionResult.time_to_hyper_minutes : 0,
            riskLevel: (predictionResult.hyper_risk?.toLowerCase() as 'low' | 'medium' | 'high') || 'low'
          });
          
          // Update recommendation from prediction
          setRecommendation(predictionResult.recommendation || 'No recommendation available.');
          
          // If we received a current_glucose from prediction, use it as it might be more up-to-date
          if (predictionResult.current_glucose && !currentGlucose) {
            setCurrentGlucose(predictionResult.current_glucose);
          }
        } catch (predictionError) {
          console.error('Error getting predictions:', predictionError);
          // Don't override main error state as this is a secondary operation
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
      
      // Fallback to sample data if API fails
      // This helps during development and transition
      setTimelineEntries([
        { type: 'glucose', value: 120, time: 'Today, 10:30 AM', id: '1' },
        { type: 'insulin', value: 5, time: 'Today, 8:15 AM', insulinType: 'bolus', id: '2' },
        { type: 'meal', value: 45, time: 'Today, 8:00 AM', mealType: 'Breakfast', id: '3' },
        { type: 'activity', value: 30, time: 'Yesterday, 5:30 PM', activityType: 'Walking', id: '4' },
      ]);
      
      setGlucoseData([
        { time: '00:00', value: 110 },
        { time: '02:00', value: 100 },
        { time: '04:00', value: 92 },
        { time: '06:00', value: 98 },
        { time: '08:00', value: 130 },
        { time: '10:00', value: 120 },
        { time: '12:00', value: 145 },
        { time: '14:00', value: 135 },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  // Handle navigation to data entry screens
  const handleLogGlucose = () => {
    router.navigate("../data-entry/glucose");
  };
  
  const handleLogInsulin = () => {
    router.navigate("../data-entry/insulin");
  };
  
  const handleLogMeal = () => {
    router.navigate("../data-entry/meal");
  };
  
  const handleLogActivity = () => {
    router.navigate("../data-entry/activity");
  };
  
  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Optional: Set up periodic refresh (e.g., every 5 minutes)
    const refreshInterval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.greeting, { color: colors.text }]}>
          Good morning!
        </Text>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Glucose Status Card */}
        <Animated.View entering={FadeIn.delay(100).duration(600)}>
          <GlucoseStatusCard
            currentGlucose={currentGlucose}
            lastReadingTime={lastReadingTime}
            trend={trend}
            onLogGlucose={handleLogGlucose}
          />
        </Animated.View>
        
        {/* Predictions Card */}
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <PredictionCard
            hypoPrediction={hypoPrediction}
            hyperPrediction={hyperPrediction}
            recommendation={recommendation}
          />
        </Animated.View>
        
        {/* Quick Actions Bar */}
        <Animated.View entering={FadeIn.delay(300).duration(600)}>
          <QuickActionsBar
            onLogGlucose={handleLogGlucose}
            onLogInsulin={handleLogInsulin}
            onLogMeal={handleLogMeal}
            onLogActivity={handleLogActivity}
          />
        </Animated.View>
        
        {/* Daily Overview Chart */}
        <Animated.View entering={FadeIn.delay(400).duration(600)}>
          <DailyOverviewChart
            glucoseData={glucoseData}
            lowThreshold={70}
            highThreshold={180}
          />
        </Animated.View>
        
        {/* Recent Entries Timeline */}
        <Animated.View entering={FadeIn.delay(500).duration(600)}>
          <RecentEntriesTimeline entries={timelineEntries} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
  }
});