import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppDataProvider } from './src/context/AppDataContext';
import { LockProvider } from './src/context/LockContext';
import ReminderSync from './src/components/ReminderSync';
import LockGate from './src/components/LockGate';

export default function App() {
  return (
    <SafeAreaProvider>
      <LockProvider>
        <AppDataProvider>
          <ReminderSync />
          <LockGate>
            <RootNavigator />
          </LockGate>
          <StatusBar style="dark" />
        </AppDataProvider>
      </LockProvider>
    </SafeAreaProvider>
  );
}
