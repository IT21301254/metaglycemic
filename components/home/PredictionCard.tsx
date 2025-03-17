// components/home/PredictionCard.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type PredictionCardProps = {
  hypoPrediction: {
    probability: number;
    timeToEvent: number | null;
    riskLevel: 'low' | 'medium' | 'high';
  };
  hyperPrediction: {
    probability: number;
    timeToEvent: number | null;
    riskLevel: 'low' | 'medium' | 'high';
  };
  recommendation: string;
};

export default function PredictionCard({
  hypoPrediction,
  hyperPrediction,
  recommendation,
}: PredictionCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return Colors.common.success;
      case 'medium':
        return Colors.common.warning;
      case 'high':
        return Colors.common.error;
      default:
        return Colors.common.info;
    }
  };
  
  const formatTimeToEvent = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) {
      return 'N/A';
    }
    
    if (minutes === 0) {
      return 'Now';
    }
    
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Glucose Predictions</Text>
        
        <View style={styles.predictionsContainer}>
          {/* Hypoglycemia Prediction */}
          <View style={styles.predictionBox}>
            <Text style={styles.predictionTitle}>Low Glucose Risk</Text>
            
            <View style={styles.probabilityContainer}>
              <Text 
                style={[
                  styles.riskLevel, 
                  { color: getRiskColor(hypoPrediction.riskLevel) }
                ]}
              >
                {hypoPrediction.riskLevel.toUpperCase()}
              </Text>
              <ProgressBar 
                progress={hypoPrediction.probability} 
                color={getRiskColor(hypoPrediction.riskLevel)}
                style={styles.progressBar}
              />
              <Text style={styles.probabilityText}>
                {Math.round(hypoPrediction.probability * 100)}%
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              {hypoPrediction.probability > 0.3 && hypoPrediction.timeToEvent !== null ? (
                <>
                  <Ionicons name="time-outline" size={16} color={colors.icon} />
                  <Text style={styles.timeText}>
                    In {formatTimeToEvent(hypoPrediction.timeToEvent)}
                  </Text>
                </>
              ) : (
                <Text style={styles.timeText}>No event predicted</Text>
              )}
            </View>
          </View>
          
          {/* Hyperglycemia Prediction */}
          <View style={styles.predictionBox}>
            <Text style={styles.predictionTitle}>High Glucose Risk</Text>
            
            <View style={styles.probabilityContainer}>
              <Text 
                style={[
                  styles.riskLevel, 
                  { color: getRiskColor(hyperPrediction.riskLevel) }
                ]}
              >
                {hyperPrediction.riskLevel.toUpperCase()}
              </Text>
              <ProgressBar 
                progress={hyperPrediction.probability} 
                color={getRiskColor(hyperPrediction.riskLevel)}
                style={styles.progressBar}
              />
              <Text style={styles.probabilityText}>
                {Math.round(hyperPrediction.probability * 100)}%
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              {hyperPrediction.probability > 0.3 && hyperPrediction.timeToEvent !== null ? (
                <>
                  <Ionicons name="time-outline" size={16} color={colors.icon} />
                  <Text style={styles.timeText}>
                    In {formatTimeToEvent(hyperPrediction.timeToEvent)}
                  </Text>
                </>
              ) : (
                <Text style={styles.timeText}>No event predicted</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Recommendation */}
        <View style={styles.recommendationContainer}>
          <Ionicons name="information-circle" size={20} color={Colors.common.info} />
          <Text style={styles.recommendationText}>{recommendation || 'No recommendation available.'}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  predictionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  predictionBox: {
    flex: 1,
    padding: 8,
  },
  predictionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  probabilityContainer: {
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  probabilityText: {
    fontSize: 12,
    textAlign: 'right',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  recommendationContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(49, 130, 206, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  recommendationText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
});