import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

type Props = {
  title: string;
  subtitle?: string;
  error?: string;
  onComplete: (pin: string) => void;
  onBiometric?: () => void;
};

export default function PinPad({ title, subtitle, error, onComplete, onBiometric }: Props) {
  const [pin, setPin] = useState('');

  const press = (d: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onComplete(next);
        setPin('');
      }, 120);
    }
  };

  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.error}>{error || ' '}</Text>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <TouchableOpacity key={k} style={styles.key} onPress={() => press(k)}>
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.key}>
          {onBiometric ? (
            <TouchableOpacity onPress={onBiometric} hitSlop={10}>
              <Ionicons name="finger-print" size={30} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.key} onPress={() => press('0')}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={back}>
          <Ionicons name="backspace-outline" size={28} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 6, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginTop: 28 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.primary },
  dotFilled: { backgroundColor: colors.primary },
  error: { color: colors.primary, marginTop: 12, height: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 270, marginTop: 12, justifyContent: 'center' },
  key: { width: 90, height: 76, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 28, fontWeight: '600', color: colors.text },
});
