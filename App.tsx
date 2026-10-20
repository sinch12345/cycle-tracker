import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppDataProvider } from './src/context/AppDataContext';
import { LockProvider } from './src/context/LockContext';
import { AuraProvider } from './src/context/AuraContext';
import ReminderSync from './src/components/ReminderSync';
import ShareSync from './src/components/ShareSync';
import LockGate from './src/components/LockGate';

export default function App() {
  return (
    <SafeAreaProvider>
      <LockProvider>
        <AppDataProvider>
          <ReminderSync />
          <ShareSync />
          <LockGate>
            <AuraProvider>
              <RootNavigator />
            </AuraProvider>
          </LockGate>
          <StatusBar style="dark" />
        </AppDataProvider>
      </LockProvider>
    </SafeAreaProvider>
  );
}
