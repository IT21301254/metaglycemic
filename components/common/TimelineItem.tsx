// components/common/TimelineItem.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define icon names type for MaterialCommunityIcons
type IconName = 'water' | 'medical-bag' | 'food-apple' | 'run' | 'help-circle';

type TimelineItemProps = {
  type: 'glucose' | 'insulin' | 'meal' | 'activity' | string;
  time: string;
  value: string | number;
  details?: string;
  onPress?: () => void;
};

export default function TimelineItem({
  type,
  time,
  value,
  details,
  onPress,
}: TimelineItemProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getIconInfo = (): { name: IconName; color: string } => {
    switch (type) {
      case 'glucose':
        return { name: 'water', color: Colors.common.glucose };
      case 'insulin':
        return { name: 'medical-bag', color: Colors.common.insulin };
      case 'meal':
        return { name: 'food-apple', color: Colors.common.meal };
      case 'activity':
        return { name: 'run', color: Colors.common.activity };
      default:
        return { name: 'help-circle', color: colors.icon };
    }
  };
  
  const icon = getIconInfo();

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.timelineLine} />
      
      <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
        <MaterialCommunityIcons name={icon.name} size={20} color="white" />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.valueText}>{value}</Text>
        {details && (
          <Text style={styles.detailsText}>{details}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  valueText: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});