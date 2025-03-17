// components/common/StatusBadge.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

type StatusLevel = 'low' | 'normal' | 'high' | 'very-high';
type RiskLevel = 'low' | 'medium' | 'high';

type StatusBadgeProps = {
  type: 'glucose' | 'risk';
  level: StatusLevel | RiskLevel;
  value?: string | number;
  showLabel?: boolean;
};

export default function StatusBadge({
  type,
  level,
  value,
  showLabel = true,
}: StatusBadgeProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getColor = () => {
    if (type === 'glucose') {
      switch (level) {
        case 'low':
          return colors.glucoseLow;
        case 'normal':
          return colors.glucoseNormal;
        case 'high':
          return colors.glucoseHigh;
        case 'very-high':
          return colors.glucoseVeryHigh;
        default:
          return colors.icon;
      }
    } else if (type === 'risk') {
      switch (level) {
        case 'low':
          return Colors.common.success;
        case 'medium':
          return Colors.common.warning;
        case 'high':
          return Colors.common.error;
        default:
          return Colors.common.info;
      }
    }
    return colors.icon;
  };
  
  const getLabel = () => {
    if (showLabel) {
      return level.charAt(0).toUpperCase() + level.slice(1);
    }
    return '';
  };

  return (
    <View style={[styles.badge, { backgroundColor: getColor() }]}>
      {value !== undefined && (
        <Text style={styles.value}>{value}</Text>
      )}
      {showLabel && (
        <Text style={styles.label}>{getLabel()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  label: {
    color: 'white',
    fontSize: 14,
  },
});