// utils/glucoseUtils.ts

// Determine glucose status based on value
export function getGlucoseStatus(value: number) {
    if (value < 70) return 'low';
    if (value > 180) return 'high';
    return 'normal';
  }
  
  // Calculate glucose trend from array of readings
  export function calculateGlucoseTrend(readings: { value: number; timestamp: number }[]) {
    if (readings.length < 2) return null;
    
    // Sort by timestamp (oldest first for trend calculation)
    const sortedReadings = [...readings].sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the last two readings
    const latestReading = sortedReadings[sortedReadings.length - 1];
    const previousReading = sortedReadings[sortedReadings.length - 2];
    
    // Calculate rate of change (mg/dL per minute)
    const timeDiffMinutes = (latestReading.timestamp - previousReading.timestamp) / (1000 * 60);
    const valueDiff = latestReading.value - previousReading.value;
    const rateOfChange = valueDiff / timeDiffMinutes;
    
    // Determine trend based on rate of change
    if (rateOfChange > 2) return 'rising';
    if (rateOfChange < -2) return 'falling';
    return 'stable';
  }
  
  // Calculate time in range
  export function calculateTimeInRange(
    readings: { value: number }[],
    lowThreshold = 70,
    highThreshold = 180
  ) {
    if (readings.length === 0) return 0;
    
    const inRangeCount = readings.filter(
      r => r.value >= lowThreshold && r.value <= highThreshold
    ).length;
    
    return Math.round((inRangeCount / readings.length) * 100);
  }
  
  // Format glucose value for display
  export function formatGlucoseValue(value: number) {
    return `${Math.round(value)} mg/dL`;
  }