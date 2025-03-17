// components/home/DailyOverviewChart.tsx
import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

type GlucoseDataPoint = {
  time: string;
  value: number;
};

type DailyOverviewChartProps = {
  glucoseData: GlucoseDataPoint[];
  lowThreshold: number;
  highThreshold: number;
};

export default function DailyOverviewChart({
  glucoseData,
  lowThreshold,
  highThreshold,
}: DailyOverviewChartProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding
  
  const chartData = {
    labels: glucoseData.map(point => point.time),
    datasets: [{
      data: glucoseData.map(point => point.value),
      color: () => Colors.common.glucose,
      strokeWidth: 2,
    }],
    legend: ['Glucose']
  };
  
  const chartConfig = {
    backgroundGradientFrom: colors.card || '#ffffff',
    backgroundGradientTo: colors.card || '#ffffff',
    decimalPlaces: 0,
    color: () => colors.text,
    labelColor: () => colors.icon,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.common.glucose,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
    },
    useShadowColorFromDataset: false,
  };
  
  // Calculate time in range
  const inRangeCount = glucoseData.filter(
    point => point.value >= lowThreshold && point.value <= highThreshold
  ).length;
  
  const timeInRange = glucoseData.length > 0 
    ? Math.round((inRangeCount / glucoseData.length) * 100) 
    : 0;
  
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Today's Overview</Text>
        
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={180}
            chartConfig={chartConfig}
            bezier
            withInnerLines={true}
            withOuterLines={true}
            withDots={true}
            withShadow={false}
            style={styles.chart}
          />
          
          {/* Thresholds */}
          <View style={[styles.thresholdLine, { 
            top: 180 * (1 - (lowThreshold - 40) / 200),
            borderColor: colors.glucoseLow,
          }]} />
          <View style={[styles.thresholdLine, { 
            top: 180 * (1 - (highThreshold - 40) / 200),
            borderColor: colors.glucoseHigh,
          }]} />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{glucoseData.length}</Text>
            <Text style={styles.statLabel}>Readings</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {Math.round(glucoseData.reduce((sum, point) => sum + point.value, 0) / glucoseData.length)}
            </Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={[
              styles.statValue, 
              { color: timeInRange > 70 ? colors.glucoseNormal : colors.glucoseHigh }
            ]}>
              {timeInRange}%
            </Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
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
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});