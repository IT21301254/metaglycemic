// app/data-entry/meal.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, Chip, Divider, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { dataService } from '../../services';

export default function MealEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [carbAmount, setCarbAmount] = useState('');
  const [mealType, setMealType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  
  // Add loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  
  const handleSave = async () => {
    // Validate input
    if (!carbAmount || isNaN(parseFloat(carbAmount))) {
      setError('Please enter a valid carbohydrate amount');
      setShowSnackbar(true);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Prepare data for API
      const mealData = {
        carbs: parseFloat(carbAmount),
        meal_type: mealType || undefined,
        timestamp: date.toISOString().split('.')[0],
        description: mealDescription || undefined
      };
      
      // Call API
      const result = await dataService.saveMeal(mealData);
      
      // Show success message
      setSnackbarMessage('Meal entry saved successfully');
      setShowSnackbar(true);
      
      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving meal entry:', err);
      setError('Failed to save meal entry. Please try again.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Log Meal/Carbs</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Carbohydrate Amount */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Carbohydrates (grams)</Text>
          <TextInput
            style={styles.carbInput}
            value={carbAmount}
            onChangeText={setCarbAmount}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Enter carb amount"
            outlineStyle={{ borderRadius: 12 }}
            error={!!error && !carbAmount}
          />
          
          {/* Carb visualizer */}
          <View style={styles.carbVisualizerContainer}>
            <Text style={styles.carbVisualizerLabel}>Carb Amount</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              step={1}
              minimumTrackTintColor={Colors.common.meal}
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor={Colors.common.meal}
              value={parseInt(carbAmount) || 0}
              onValueChange={(value) => setCarbAmount(value.toString())}
            />
            <View style={styles.tickMarksContainer}>
              <Text style={styles.tickMark}>0g</Text>
              <Text style={styles.tickMark}>50g</Text>
              <Text style={styles.tickMark}>100g</Text>
              <Text style={styles.tickMark}>150g</Text>
              <Text style={styles.tickMark}>200g</Text>
            </View>
          </View>
          
          {/* Quick carb buttons */}
          <Text style={[styles.subLabel, { color: colors.text }]}>Quick Select:</Text>
          <View style={styles.quickCarbsContainer}>
            {[15, 30, 45, 60, 75, 90].map((value) => (
              <Chip
                key={value}
                mode="outlined"
                selected={parseInt(carbAmount) === value}
                onPress={() => setCarbAmount(value.toString())}
                style={styles.carbChip}
                selectedColor={Colors.common.meal}
              >
                {value}g
              </Chip>
            ))}
          </View>
        </View>
        
        {/* Meal Type */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Meal Type</Text>
          <View style={styles.mealTypeContainer}>
            {mealTypes.map((type) => (
              <Chip
                key={type}
                mode="outlined"
                selected={mealType === type}
                onPress={() => setMealType(type)}
                style={styles.mealTypeChip}
                selectedColor={Colors.common.meal}
                icon={
                  type === 'Breakfast' ? 'coffee' :
                  type === 'Lunch' ? 'food' :
                  type === 'Dinner' ? 'food-variant' : 'fruit-cherries'
                }
              >
                {type}
              </Chip>
            ))}
          </View>
        </View>
        
        {/* Date and Time Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>When did you eat?</Text>
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
        
        {/* Meal Description */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Meal Description</Text>
          <TextInput
            style={styles.mealInput}
            value={mealDescription}
            onChangeText={setMealDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Describe what you ate (optional)"
            outlineStyle={{ borderRadius: 12 }}
          />
        </View>
        
        {/* Save Button */}
        <Button
          mode="contained"
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 8 }}
          onPress={handleSave}
          buttonColor={Colors.common.meal}
          disabled={isLoading}
          loading={isLoading}
        >
          Save Meal Record
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
  subLabel: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  carbInput: {
    fontSize: 18,
  },
  carbVisualizerContainer: {
    marginTop: 16,
  },
  carbVisualizerLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  tickMarksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tickMark: {
    fontSize: 12,
    color: '#888',
  },
  quickCarbsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  carbChip: {
    margin: 4,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  mealTypeChip: {
    margin: 4,
    paddingHorizontal: 4,
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
  mealInput: {
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