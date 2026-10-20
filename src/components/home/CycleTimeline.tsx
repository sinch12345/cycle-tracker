import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type Props = { day: number; cycleLength: number; periodLength: number };

export default function CycleTimeline({ day, cycleLength, periodLength }: Props) {
  const ovDay = Math.max(periodLength + 1, cycleLength - 14);
  const pos = useRef(new Animated.Value(0)).current;
  const target = Math.min(Math.max((Math.min(day, cycleLength) - 0.5) / cycleLength, 0), 1);

  useEffect(() => {
    Animated.timing(pos, {
      toValue: target,
      duration: 1100,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const left = pos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const cells = [];
  for (let d = 1; d <= cycleLength; d++) {
    let bg = '#EFE7E7';
    if (d <= periodLength) bg = colors.period;
    else if (d === ovDay) bg = colors.ovulation;
    else if (d >= ovDay - 5 && d <= ovDay + 1) bg = colors.fertile;
    cells.push(<View key={d} style={[styles.cell, { backgroundColor: bg }]} />);
  }

  return (
    <View>
      <View style={styles.lane}>
        <Animated.View style={[styles.marker, { left }]}>
          <View style={styles.markerPill}>
            <Text style={styles.markerText}>You</Text>
          </View>
          <View style={styles.markerTip} />
        </Animated.View>
      </View>
      <View style={styles.bar}>{cells}</View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>Day 1</Text>
        <Text style={styles.axisText}>Day {cycleLength}</Text>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.period }]} /><Text style={styles.legendText}>Period</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.fertile }]} /><Text style={styles.legendText}>Fertile window</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.ovulation }]} /><Text style={styles.legendText}>Ovulation</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: { height: 34, position: 'relative' },
  marker: { position: 'absolute', bottom: 2, width: 40, marginLeft: -20, alignItems: 'center' },
  markerPill: { backgroundColor: colors.text, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  markerText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  markerTip: {
    width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.text,
  },
  bar: { flexDirection: 'row', gap: 1.5, height: 16, borderRadius: 8, overflow: 'hidden' },
  cell: { flex: 1 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { color: colors.muted, fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: colors.muted, fontSize: 12 },
});
