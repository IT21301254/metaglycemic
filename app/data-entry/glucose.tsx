// app/data-entry/glucose.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { glucoseService } from '../../services';

export default function GlucoseEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [glucoseValue, setGlucoseValue] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealContext, setMealContext] = useState('');
  const [notes, setNotes] = useState('');
  
  // Add loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleSave = async () => {
    // Validate input
    if (!glucoseValue || isNaN(parseFloat(glucoseValue))) {
      setError('Please enter a valid glucose value');
      setShowSnackbar(true);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Prepare data for API
      const glucoseData = {
        value: parseFloat(glucoseValue),
        timestamp: date.toISOString().split('.')[0],
        meal_context: mealContext || undefined,
        notes: notes || undefined
      };
      
      // Call API
      const result = await glucoseService.saveReading(glucoseData);
      
      // Show success message
      setSnackbarMessage('Glucose reading saved successfully');
      setShowSnackbar(true);
      
      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving glucose reading:', err);
      setError('Failed to save glucose reading. Please try again.');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Log Glucose</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Glucose Reading (mg/dL)</Text>
          <View style={styles.glucoseInputContainer}>
            <TextInput
              style={styles.glucoseInput}
              value={glucoseValue}
              onChangeText={setGlucoseValue}
              keyboardType="numeric"
              mode="outlined"
              placeholder="Enter value"
              outlineStyle={{ borderRadius: 12 }}
              error={!!error && !glucoseValue}
            />
          </View>
          
          {/* Visual slider for quick entry */}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Low</Text>
            <Slider
              style={styles.slider}
              minimumValue={40}
              maximumValue={400}
              minimumTrackTintColor="#E53E3E"
              maximumTrackTintColor="#38A169"
              thumbTintColor={colors.tint}
              value={parseFloat(glucoseValue) || 120}
              onValueChange={(value) => setGlucoseValue(Math.round(value).toString())}
            />
            <Text style={styles.sliderLabel}>High</Text>
          </View>
          
          {/* Color-coded range indicators */}
          <View style={styles.rangeContainer}>
            <View style={[styles.range, { backgroundColor: '#E53E3E' }]}>
              <Text style={styles.rangeText}>Low</Text>
              <Text style={styles.rangeValue}>&lt;70</Text>
            </View>
            <View style={[styles.range, { backgroundColor: '#38A169' }]}>
              <Text style={styles.rangeText}>Normal</Text>
              <Text style={styles.rangeValue}>70-180</Text>
            </View>
            <View style={[styles.range, { backgroundColor: '#DD6B20' }]}>
              <Text style={styles.rangeText}>High</Text>
              <Text style={styles.rangeValue}>&gt;180</Text>
            </View>
          </View>
        </View>
        
        {/* Date and Time Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>When was this reading taken?</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color={colors.tint} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {date.toLocaleString()}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePickerModal
            isVisible={showDatePicker}
            mode="datetime"
            onConfirm={(selectedDate) => {
              setDate(selectedDate);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
            date={date}
          />
          )}
        </View>
        
        {/* Meal Context */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Meal Context</Text>
          <SegmentedButtons
            value={mealContext}
            onValueChange={setMealContext}
            buttons={[
              { value: 'before_meal', label: 'Before Meal' },
              { value: 'after_meal', label: 'After Meal' },
              { value: 'fasting', label: 'Fasting' },
              { value: 'bedtime', label: 'Bedtime' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        
        {/* Notes */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Add any additional notes"
            outlineStyle={{ borderRadius: 12 }}
          />
        </View>
        
        {/* Save Button */}
        <Button
          mode="contained"
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 8 }}
          onPress={handleSave}
          disabled={isLoading}
          loading={isLoading}
        >
          Save Reading
        </Button>
      </ScrollView>
      
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={[
          styles.snackbar, 
          { backgroundColor: error ? '#f44336' : '#4caf50' }
        ]}
      >
        {error || snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  glucoseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glucoseInput: {
    flex: 1,
    fontSize: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  range: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    alignItems: 'center',
  },
  rangeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rangeValue: {
    color: 'white',
    opacity: 0.9,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'transparent',
  },
  snackbar: {
    marginBottom: 20,
  },
  saveButton: {
    marginVertical: 24,
    borderRadius: 12,
  },
});