// components/common/GlucoseChart.tsx
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

type GlucoseDataPoint = {
  time: string;
  value: number;
};

type GlucoseChartProps = {
  data: GlucoseDataPoint[];
  width?: number;
  height?: number;
  lowThreshold: number;
  highThreshold: number;
  showThresholds?: boolean;
};

export default function GlucoseChart({
  data,
  width = Dimensions.get('window').width - 40,
  height = 180,
  lowThreshold = 70,
  highThreshold = 180,
  showThresholds = true,
}: GlucoseChartProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const chartData = {
    labels: data.map(point => point.time),
    datasets: [{
      data: data.map(point => point.value),
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

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        withInnerLines={true}
        withOuterLines={true}
        withDots={true}
        withShadow={false}
        style={styles.chart}
      />
      
      {showThresholds && (
        <>
          <View style={[styles.thresholdLine, { 
            top: height * (1 - (lowThreshold - 40) / 200),
            borderColor: colors.glucoseLow,
          }]} />
          <View style={[styles.thresholdLine, { 
            top: height * (1 - (highThreshold - 40) / 200),
            borderColor: colors.glucoseHigh,
          }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
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
});