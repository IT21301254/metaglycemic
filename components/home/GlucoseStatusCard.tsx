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
    if (value > 250) return colors.glucoseVeryHigh;
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
        return 'Unknown';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown time';
    
    // Try to format it nicely if it's recent
    try {
      const readingTime = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - readingTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      
      // For older readings, show the full date/time
      return readingTime.toLocaleString();
    } catch (err) {
      // If parsing fails, just return the original string
      return timestamp;
    }
  };
  
  const getGlucoseStatus = (value: number | null) => {
    if (value === null) return '';
    if (value < 70) return 'Low';
    if (value > 250) return 'Very High';
    if (value > 180) return 'High';
    return 'In Range';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Current Glucose</Text>
          <TouchableOpacity onPress={onLogGlucose} style={styles.addButton}>
            <Ionicons name="add-circle" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>
        
        {currentGlucose ? (
          <>
            <View style={styles.glucoseContainer}>
              <Text style={[styles.glucoseValue, { color: getGlucoseColor(currentGlucose) }]}>
                {Math.round(currentGlucose)}
              </Text>
              <Text style={styles.unit}>mg/dL</Text>
              
              <View style={[styles.statusBadge, { backgroundColor: getGlucoseColor(currentGlucose) }]}>
                <Text style={styles.statusText}>{getGlucoseStatus(currentGlucose)}</Text>
              </View>
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
                <Text style={styles.timestamp}>{formatTimestamp(lastReadingTime)}</Text>
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
  addButton: {
    padding: 4,
  },
  glucoseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 12,
    position: 'relative',
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
  statusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
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