// components/home/RecentEntriesTimeline.tsx
import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Card } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define the icon names type to match MaterialCommunityIcons
type IconName = 'water' | 'medical-bag' | 'food-apple' | 'run' | 'help-circle';

type Entry = {
  id: string;
  type: 'glucose' | 'insulin' | 'meal' | 'activity';
  value: number;
  time: string;
  insulinType?: string;
  mealType?: string;
  activityType?: string;
};

type RecentEntriesTimelineProps = {
  entries: Entry[];
};

export default function RecentEntriesTimeline({
  entries,
}: RecentEntriesTimelineProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getEntryIcon = (entryType: string): { name: IconName; color: string } => {
    switch (entryType) {
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
  
  const getEntryDetails = (entry: Entry) => {
    switch (entry.type) {
      case 'glucose':
        return `${entry.value} mg/dL`;
      case 'insulin':
        return `${entry.value} units ${entry.insulinType || ''}`;
      case 'meal':
        return `${entry.value}g carbs ${entry.mealType ? `(${entry.mealType})` : ''}`;
      case 'activity':
        return `${entry.value} min ${entry.activityType || ''}`;
      default:
        return '';
    }
  };
  
  const renderTimelineItem = ({ item }: { item: Entry }) => {
    const icon = getEntryIcon(item.type);
    
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLine} />
        
        <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
          <MaterialCommunityIcons name={icon.name} size={20} color="white" />
        </View>
        
        <View style={styles.entryContainer}>
          <Text style={styles.entryTime}>{item.time}</Text>
          <Text style={styles.entryDetails}>{getEntryDetails(item)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Recent Entries</Text>
        
        <FlatList
          data={entries}
          renderItem={renderTimelineItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
        />
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
  listContainer: {
    paddingBottom: 8,
  },
  timelineItem: {
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
  entryContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  entryTime: {
    fontSize: 14,
    color: '#666',
  },
  entryDetails: {
    fontSize: 16,
    marginTop: 4,
  },
});