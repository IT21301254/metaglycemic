// constants/Colors.ts
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f5f5f5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Card and surface colors
    card: '#ffffff',
    cardBorder: '#E6E8EB',
    
    // Glucose level indicators
    glucoseLow: '#E53E3E',     // Red for hypoglycemia
    glucoseNormal: '#38A169',  // Green for normal range
    glucoseHigh: '#DD6B20',    // Orange for hyperglycemia
    glucoseVeryHigh: '#9C4221', // Dark orange for very high
  },
  dark: {
    text: '#9c0b9c',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Card and surface colors
    card: '#1E2021',
    cardBorder: '#2A2F33',
    
    // Glucose level indicators
    glucoseLow: '#FC8181',     // Lighter red for dark mode
    glucoseNormal: '#68D391',  // Lighter green for dark mode
    glucoseHigh: '#F6AD55',    // Lighter orange for dark mode
    glucoseVeryHigh: '#ED8936', // Light orange for dark mode
  },
  common: {
    // Data category colors (consistent across light/dark)
    glucose: '#3182CE',  // Blue
    insulin: '#805AD5',  // Purple
    meal: '#38A169',     // Green
    activity: '#DD6B20', // Orange
    
    // Status colors
    success: '#38A169',  // Green
    error: '#E53E3E',    // Red
    warning: '#DD6B20',  // Orange
    info: '#3182CE',     // Blue
    white:'fafafa'
  }
};