import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useLock } from '../context/LockContext';
import PinPad from './PinPad';

export default function SetPinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { setPin } = useLock();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState('');

  const close = () => {
    setFirst(null);
    setError('');
    onClose();
  };

  const onComplete = async (pin: string) => {
    if (first === null) {
      setFirst(pin);
      setError('');
      return;
    }
    if (pin === first) {
      await setPin(pin);
      close();
    } else {
      setFirst(null);
      setError("PINs didn't match. Start again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.cancel} onPress={close}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.inner}>
          <PinPad
            title={first === null ? 'Choose a PIN' : 'Confirm your PIN'}
            subtitle={first === null ? '4 digits. Do not forget it: it cannot be recovered.' : 'Enter the same PIN again'}
            error={error}
            onComplete={onComplete}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cancel: { padding: 16, alignSelf: 'flex-start' },
  cancelText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
});
