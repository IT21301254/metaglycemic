// components/home/GlucoseStatusCard.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type GlucoseStatusCardProps = {
  currentGlucose: number | null;
  lastReadingTime: string;
  trend: 'rising' | 'falling' | 'stable' | null;
  onLogGlucose: () => void;
};

export default function GlucoseStatusCard({
  currentGlucose,
  lastReadingTime,
  trend,
  onLogGlucose,
}: GlucoseStatusCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getGlucoseColor = (value: number | null) => {
    if (value === null) return colors.text;
    if (value < 70) return colors.glucoseLow;
    if (value > 180) return colors.glucoseHigh;
    return colors.glucoseNormal;
  };
  
  const getTrendArrow = () => {
    switch (trend) {
      case 'rising':
        return '↑';
      case 'falling':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'rising':
        return 'Rising';
      case 'falling':
        return 'Falling';
      case 'stable':
        return 'Stable';
      default:
        return '';
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Current Glucose</Text>
          <TouchableOpacity onPress={onLogGlucose} style={styles.refreshButton}>
            <Ionicons name="add-circle" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>
        
        {currentGlucose ? (
          <>
            <View style={styles.glucoseContainer}>
              <Text style={[styles.glucoseValue, { color: getGlucoseColor(currentGlucose) }]}>
                {currentGlucose}
              </Text>
              <Text style={styles.unit}>mg/dL</Text>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.trendContainer}>
                <Text style={[styles.trendArrow, { color: getGlucoseColor(currentGlucose) }]}>
                  {getTrendArrow()}
                </Text>
                <Text style={styles.trendLabel}>{getTrendLabel()}</Text>
              </View>
              
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={16} color={colors.icon} style={styles.timeIcon} />
                <Text style={styles.timestamp}>{lastReadingTime}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No recent glucose data</Text>
            <Button 
              mode="contained" 
              style={styles.logButton}
              onPress={onLogGlucose}
            >
              Log Glucose
            </Button>
          </View>
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 4,
  },
  glucoseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 12,
  },
  glucoseValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendArrow: {
    fontSize: 28,
    marginRight: 4,
  },
  trendLabel: {
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  logButton: {
    marginTop: 8,
  },
});