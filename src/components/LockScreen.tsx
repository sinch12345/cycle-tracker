import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useLock } from '../context/LockContext';
import PinPad from './PinPad';

export default function LockScreen() {
  const { biometricEnabled, verifyPin, unlockWithBiometric } = useLock();
  const [error, setError] = useState('');

  useEffect(() => {
    if (biometricEnabled) unlockWithBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (!ok) setError('Wrong PIN, try again');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <PinPad
          title="Enter your PIN"
          subtitle="Your data is locked"
          error={error}
          onComplete={onComplete}
          onBiometric={biometricEnabled ? unlockWithBiometric : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center' },
});
