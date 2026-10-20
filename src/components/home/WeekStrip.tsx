import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { addDays, parseISO } from '../../utils/date';
import { DayStatus } from '../../utils/prediction';

type Props = { statuses: Record<string, DayStatus>; today: string; onPress: () => void };

export default function WeekStrip({ statuses, today, onPress }: Props) {
  const days = [-3, -2, -1, 0, 1, 2, 3].map((n) => addDays(today, n));

  return (
    <View>
      <View style={styles.row}>
        {days.map((d) => {
          const s = statuses[d];
          const isToday = d === today;
          const dotStyle =
            s === 'period' ? { backgroundColor: colors.period }
            : s === 'predictedPeriod' ? { borderWidth: 1.5, borderColor: colors.period }
            : s === 'ovulation' ? { backgroundColor: colors.ovulation }
            : s === 'fertile' ? { backgroundColor: colors.fertile }
            : null;
          return (
            <TouchableOpacity key={d} style={styles.item} onPress={onPress} activeOpacity={0.7}>
              <Text style={styles.dow}>{parseISO(d).toLocaleDateString(undefined, { weekday: 'short' })}</Text>
              <View style={[styles.num, isToday && styles.numToday]}>
                <Text style={[styles.numText, isToday && styles.numTextToday]}>{parseISO(d).getDate()}</Text>
              </View>
              <View style={[styles.dot, dotStyle]} />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Tap to open your calendar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', flex: 1 },
  dow: { color: colors.muted, fontSize: 11, marginBottom: 6 },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numToday: { backgroundColor: colors.text },
  numText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  numTextToday: { color: '#FFFFFF' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  hint: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
