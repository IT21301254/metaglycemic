// components/home/QuickActionsBar.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type QuickActionsBarProps = {
  onLogGlucose: () => void;
  onLogInsulin: () => void;
  onLogMeal: () => void;
  onLogActivity: () => void;
};

export default function QuickActionsBar({
  onLogGlucose,
  onLogInsulin,
  onLogMeal,
  onLogActivity,
}: QuickActionsBarProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLogGlucose}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.common.glucose }]}>
              <MaterialCommunityIcons name="water" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Glucose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLogInsulin}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.common.insulin }]}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Insulin</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLogMeal}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.common.meal }]}>
              <MaterialCommunityIcons name="food-apple" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Meal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLogActivity}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.common.activity }]}>
              <MaterialCommunityIcons name="run" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Activity</Text>
          </TouchableOpacity>
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
  },
});