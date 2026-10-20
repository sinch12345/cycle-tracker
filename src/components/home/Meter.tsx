import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type Props = { label: string; value: number; text: string; color: string; delay?: number };

export default function Meter({ label, value, text, color, delay = 0 }: Props) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: Math.min(Math.max(value, 0), 5) / 5,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const width = v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.text, { color }]}>{text}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: colors.text, fontWeight: '600', fontSize: 14 },
  text: { fontWeight: '700', fontSize: 13 },
  track: { height: 10, borderRadius: 5, backgroundColor: '#F3EAEA', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
