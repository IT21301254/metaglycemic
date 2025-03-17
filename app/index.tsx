// app/index.tsx
import { Redirect } from 'expo-router';

// Redirect root to the tabs
export default function Root() {
  return <Redirect href="/(tabs)" />;
}