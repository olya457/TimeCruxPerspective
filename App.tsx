import React, { useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStore, useStore } from './src/storage/AppStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoaderScreen, OnboardingScreen } from './src/screens/WelcomeScreen';
function AppContent() {
  const { state, ready } = useStore();
  const [loaded, setLoaded] = useState(false);
  const complete = useCallback(() => setLoaded(true), []);
  if (!loaded || !ready) {
    return <LoaderScreen onComplete={complete} />;
  }
  return state.onboarded ? <AppNavigator /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b090b" />
      <AppStore>
        <AppContent />
      </AppStore>
    </SafeAreaProvider>
  );
}
