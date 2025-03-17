// app/(tabs)/data-entry.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function DataEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // Navigate to specific data entry forms
const navigateToForm = (formType: string) => {
    console.log(`Navigate to ${formType} form`);
    
    // Using a switch for more explicit navigation paths
    switch(formType) {
      case 'glucose':
        router.navigate("../data-entry/glucose");
        break;
      case 'insulin':
        router.navigate("../data-entry/insulin");
        break;
      case 'meal':
        router.navigate("../data-entry/meal");
        break;
      case 'activity':
        router.navigate("../data-entry/activity");
        break;
      case 'vitals':
        router.navigate("../data-entry/vitals");
        break;
      default:
        console.error(`Unknown form type: ${formType}`);
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Log Your Data</Text>
      <Text style={[styles.subheader, { color: colors.icon }]}>
        Track your health metrics for better predictions
      </Text>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Glucose Entry Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity onPress={() => navigateToForm('glucose')}>
            <LinearGradient
              colors={['#3182CE', '#2C5282']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="water" size={36} color="white" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Glucose Reading</Text>
                  <Text style={styles.cardDescription}>
                    Log your blood glucose level
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Insulin Entry Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity onPress={() => navigateToForm('insulin')}>
            <LinearGradient
              colors={['#805AD5', '#553C9A']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="medical" size={36} color="white" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Insulin Dose</Text>
                  <Text style={styles.cardDescription}>
                    Record basal or bolus insulin
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Meal Entry Card */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <TouchableOpacity onPress={() => navigateToForm('meal')}>
            <LinearGradient
              colors={['#38A169', '#276749']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="restaurant" size={36} color="white" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Meal / Carbs</Text>
                  <Text style={styles.cardDescription}>
                    Track food and carbohydrate intake
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Activity Entry Card */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity onPress={() => navigateToForm('activity')}>
            <LinearGradient
              colors={['#DD6B20', '#9C4221']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="fitness" size={36} color="white" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Physical Activity</Text>
                  <Text style={styles.cardDescription}>
                    Log exercise and activity levels
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Vital Signs Entry Card */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <TouchableOpacity onPress={() => navigateToForm('vitals')}>
            <LinearGradient
              colors={['#E53E3E', '#9B2C2C']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="heart" size={36} color="white" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Vital Signs</Text>
                  <Text style={styles.cardDescription}>
                    Track heart rate and other vitals
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subheader: {
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});