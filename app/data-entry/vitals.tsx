// app/data-entry/vitals.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { dataService } from '../../services';

interface VitalsData {
  timestamp: string; // This should be a string type, not a direct calculation
  heart_rate?: number;
  gsr?: number;
  stress_level?: string;
  notes?: string;
}

export default function VitalsEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [heartRate, setHeartRate] = useState('');
  const [gsrValue, setGsrValue] = useState('');
  const [stressLevel, setStressLevel] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Add loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleSave = async () => {
    // Validate input - at least one vital sign should be present
    if (!heartRate && !gsrValue && !stressLevel) {
      setError('Please enter at least one vital sign measurement');
      setShowSnackbar(true);
      return;
    }
    
    // Validate heart rate if entered
    if (heartRate && (isNaN(parseInt(heartRate)) || parseInt(heartRate) <= 0)) {
      setError('Please enter a valid heart rate');
      setShowSnackbar(true);
      return;
    }
    
    // Validate GSR if entered
    if (gsrValue && (isNaN(parseFloat(gsrValue)) || parseFloat(gsrValue) <= 0)) {
      setError('Please enter a valid GSR value');
      setShowSnackbar(true);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Prepare data for API
      const vitalsData: VitalsData = {
        timestamp: date.toISOString().split('.')[0], // Remove milliseconds and Z
        notes: notes || undefined
      };
      
      // Only add fields that have values
      if (heartRate) {
        vitalsData.heart_rate = parseInt(heartRate);
      }
      
      if (gsrValue) {
        vitalsData.gsr = parseFloat(gsrValue);
      }
      
      if (stressLevel) {
        vitalsData.stress_level = stressLevel;
      }
      
      // Call API
      const result = await dataService.saveVitals(vitalsData);
      
      // Show success message
      setSnackbarMessage('Vital signs saved successfully');
      setShowSnackbar(true);
      
      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving vital signs:', err);
      setError('Failed to save vital signs. Please try again.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Log Vital Signs</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Heart Rate */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Heart Rate (bpm)</Text>
          <TextInput
            style={styles.vitalInput}
            value={heartRate}
            onChangeText={setHeartRate}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Enter heart rate"
            outlineStyle={{ borderRadius: 12 }}
            right={<TextInput.Affix text="BPM" />}
            error={error.includes('heart rate')}
          />
          
          <View style={styles.vitalRangeContainer}>
            <View style={[styles.vitalRange, { backgroundColor: '#E53E3E' }]}>
              <Text style={styles.vitalRangeText}>High</Text>
              <Text style={styles.vitalRangeValue}>&gt;100</Text>
            </View>
            <View style={[styles.vitalRange, { backgroundColor: '#38A169' }]}>
              <Text style={styles.vitalRangeText}>Normal</Text>
              <Text style={styles.vitalRangeValue}>60-100</Text>
            </View>
            <View style={[styles.vitalRange, { backgroundColor: '#DD6B20' }]}>
              <Text style={styles.vitalRangeText}>Low</Text>
              <Text style={styles.vitalRangeValue}>&lt;60</Text>
            </View>
          </View>
        </View>
        
        {/* GSR (Galvanic Skin Response) */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>GSR Value</Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.common.info} />
            <Text style={styles.infoText}>
              Galvanic Skin Response measures perspiration and can indicate stress or physical response
            </Text>
          </View>
          <TextInput
            style={styles.vitalInput}
            value={gsrValue}
            onChangeText={setGsrValue}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Enter GSR value if available"
            outlineStyle={{ borderRadius: 12 }}
            error={error.includes('GSR value')}
          />
        </View>
        
        {/* Stress Level */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Stress Level</Text>
          <SegmentedButtons
            value={stressLevel}
            onValueChange={setStressLevel}
            buttons={[
              { value: 'low', label: 'Low', icon: 'emoticon-outline' },
              { value: 'medium', label: 'Medium', icon: 'emoticon-neutral-outline' },
              { value: 'high', label: 'High', icon: 'emoticon-sad-outline' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        
        {/* Date and Time Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>When were vitals measured?</Text>
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
        
        {/* Notes */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
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
          buttonColor="#E53E3E"  // Red color for vitals
          disabled={isLoading}
          loading={isLoading}
        >
          Save Vital Signs
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
  vitalInput: {
    fontSize: 18,
  },
  vitalRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  vitalRange: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    alignItems: 'center',
  },
  vitalRangeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  vitalRangeValue: {
    color: 'white',
    opacity: 0.9,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(49, 130, 206, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  segmentedButtons: {
    marginBottom: 8,
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
  notesInput: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginVertical: 24,
    borderRadius: 12,
  },
  errorText: {
    color: '#f44336',
    marginTop: 4,
    fontSize: 14,
  },
  snackbar: {
    marginBottom: 20,
  },
});