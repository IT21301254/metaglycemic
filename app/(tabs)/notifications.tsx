// app/(tabs)/notifications.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { dataService } from '../../services';
import { predictionService } from '../../services';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  // State for recommendations
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recommendation
  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent data
      const recentData = await dataService.getRecentData();
      const timeline = recentData.timeline || [];

      // Always prepare prediction data, even with empty timeline
      const predictionData = predictionService.prepareDataForPrediction(timeline);

      try {
        // Try to get predictions
        const predictionResult = await predictionService.getPredictions(predictionData);

        // Set recommendation with multiple fallback levels
        setRecommendation(
          predictionResult.recommendation || 
          predictionResult.recommendation || 
          'No specific recommendation available at this time.'
        );
      } catch (predictionError) {
        // If prediction fails, use fallback
        const fallbackPrediction = predictionService.getFallbackPrediction();
        setRecommendation(fallbackPrediction.recommendation);
        console.error('Prediction error:', predictionError);
      }
    } catch (err) {
      console.error('Error fetching recommendation:', err);
      
      // Use completely generic fallback
      const fallbackPrediction = predictionService.getFallbackPrediction();
      setError('Failed to fetch recommendation');
      setRecommendation(fallbackPrediction.recommendation);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchRecommendation();
  }, []);

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendation();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.tint]}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Recommendations</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              Generating personalized recommendation...
            </Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={24} color={Colors.common.error} />
                <Text style={[styles.errorText, { color: Colors.common.error }]}>
                  {error}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.recommendationCard}>
            <Card.Content>
              <View style={styles.recommendationHeader}>
                <Ionicons 
                  name="information-circle" 
                  size={24} 
                  color={Colors.common.info} 
                />
                <Text style={[styles.recommendationTitle, { color: colors.text }]}>
                  Your Personalized Advice
                </Text>
              </View>
              <Text style={[styles.recommendationText, { color: colors.text }]}>
                {recommendation}
              </Text>
            </Card.Content>
          </Card>
        )}
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
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    marginTop: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 16,
  },
  recommendationCard: {
    marginTop: 16,
    borderRadius: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
  },
});