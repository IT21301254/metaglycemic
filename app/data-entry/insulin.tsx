// app/data-entry/insulin.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { dataService } from '../../services';

// Define precise types for insulin configurations
type InsulinType = 'bolus' | 'basal';

interface InsulinDoseConfig {
  type: InsulinType;
  doses: number[];
  description: string;
}

// Define insulin dose configurations with type safety
const insulinDoseConfigs: Record<InsulinType, InsulinDoseConfig> = {
  bolus: {
    type: 'bolus',
    doses: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10],
    description: 'Bolus insulin is taken with meals or for corrections'
  },
  basal: {
    type: 'basal',
    doses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    description: 'Basal insulin provides background insulin throughout the day'
  }
};


// Define props type for DosePicker
interface DosePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dose: number) => void;
  insulinType: InsulinType;
}

export default function InsulinEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [insulinType, setInsulinType] = useState<InsulinType>('bolus');
  const [insulinDose, setInsulinDose] = useState<number | null>(null);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleSave = async () => {
    // Validate input
    if (insulinDose === null) {
      setError(`Please select a ${insulinType} insulin dose`);
      setShowSnackbar(true);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Prepare data for API
      const insulinData = {
        insulin_type: insulinType,
        dose: insulinDose,
        timestamp: date.toISOString().split('.')[0],
        notes: notes || undefined
      };
      
      // Call API
      const result = await dataService.saveInsulin(insulinData);
      
      // Show success message
      setSnackbarMessage('Insulin dose saved successfully');
      setShowSnackbar(true);
      
      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving insulin dose:', err);
      setError('Failed to save insulin dose. Please try again.');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Dose Picker Component
  const DosePicker: React.FC<DosePickerProps> = ({ 
    visible, 
    onClose, 
    onSelect, 
    insulinType 
  }) => {
    const currentConfig = insulinDoseConfigs[insulinType];
    
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select {insulinType === 'bolus' ? 'Bolus' : 'Basal'} Dose
            </Text>
            
            <FlatList
              data={currentConfig.doses}
              keyExtractor={(item) => item.toString()}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.doseOption,
                    { 
                      backgroundColor: item === insulinDose 
                        ? colors.tint 
                        : colors.background 
                    }
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.doseOptionText,
                    { 
                      color: item === insulinDose 
                        ? 'white' 
                        : colors.text 
                    }
                  ]}>
                    {item} units
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Log Insulin</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Insulin Type Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Insulin Type</Text>
          <SegmentedButtons
            value={insulinType}
            onValueChange={(value: string) => {
              // Type assertion to ensure it's a valid InsulinType
              setInsulinType(value as InsulinType);
              // Reset dose when changing type
              setInsulinDose(null);
            }}
            buttons={[
              { 
                value: 'bolus', 
                label: 'Bolus', 
                icon: 'clock',
                style: insulinType === 'bolus' ? { backgroundColor: colors.tint } : {} 
              },
              { 
                value: 'basal', 
                label: 'Basal', 
                icon: 'repeat',
                style: insulinType === 'basal' ? { backgroundColor: colors.tint } : {} 
              },
            ]}
            style={styles.segmentedButtons}
          />
          
          {/* Insulin Type Info */}
          <View style={[styles.infoBox, { backgroundColor: `${Colors.common.info}10` }]}>
            <Ionicons name="information-circle" size={20} color={Colors.common.info} />
            <Text style={styles.infoText}>
              {insulinDoseConfigs[insulinType].description}
            </Text>
          </View>
        </View>
        
        {/* Insulin Dose Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>
            {`${insulinType === 'bolus' ? 'Bolus' : 'Basal'} Insulin Dose`}
          </Text>
          <TouchableOpacity 
            style={styles.doseSelector}
            onPress={() => setShowDosePicker(true)}
          >
            <Ionicons name="water" size={24} color={colors.tint} />
            <Text style={[styles.doseSelectorText, { color: insulinDose ? colors.text : colors.icon }]}>
              {insulinDose !== null 
                ? `${insulinDose} units` 
                : `Select ${insulinType} insulin dose`}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Date and Time Selector */}
        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>When was insulin taken?</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color={colors.tint} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {date.toLocaleString()}
            </Text>
          </TouchableOpacity>
          
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
            placeholderTextColor={colors.icon}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.tint}
          />
        </View>
        
        {/* Save Button */}
        <Button
          mode="contained"
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 8 }}
          onPress={handleSave}
          buttonColor={Colors.common.insulin}
          disabled={isLoading}
          loading={isLoading}
        >
          Save Insulin Record
        </Button>
      </ScrollView>
      
      {/* Dose Picker Modal */}
      <DosePicker
        visible={showDosePicker}
        onClose={() => setShowDosePicker(false)}
        onSelect={(dose) => setInsulinDose(dose)}
        insulinType={insulinType}
      />
      
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={[
          styles.snackbar, 
          { 
            backgroundColor: error ? Colors.common.error : Colors.common.success,
            borderRadius: 8 
          }
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
  snackbar: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
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
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  doseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  doseSelectorText: {
    marginLeft: 8,
    fontSize: 16,
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
    borderRadius: 12,
  },
  saveButton: {
    marginVertical: 24,
    borderRadius: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 220, 220, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  doseOption: {
    flex: 1,
    padding: 12,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(246, 237, 237, 0.05)'
  },
  doseOptionText: {
    fontSize: 16,
  },
  
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});