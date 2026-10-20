import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { day: number; total: number; label: string; icon: string; size?: number };

export default function CycleRing({ day, total, label, icon, size = 230 }: Props) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = Math.min(day / total, 1);

  const p = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(1);

  // ring fills and the number counts up
  useEffect(() => {
    p.setValue(0);
    const id = p.addListener(({ value }) => setShown(Math.max(1, Math.round(value * day))));
    Animated.timing(p, {
      toValue: 1,
      duration: 1400,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => p.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, frac]);

  // soft breathing glow
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offset = p.interpolate({ inputRange: [0, 1], outputRange: [circ, circ * (1 - frac)] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.08] });
  const glow = size - 30;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: glow, height: glow, borderRadius: glow / 2,
          backgroundColor: '#FFFFFF', opacity: glowOpacity, transform: [{ scale: glowScale }],
        }}
      />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FFFFFF"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset as any}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.dayLabel}>Cycle day</Text>
        <Text style={styles.dayNumber}>{shown}</Text>
        <View style={styles.pill}>
          <Ionicons name={icon as any} size={14} color="#FFFFFF" />
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  dayLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  dayNumber: { color: '#FFFFFF', fontSize: 64, fontWeight: '800', lineHeight: 72 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
  },
  pillText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
