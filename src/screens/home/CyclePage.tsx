import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { parseISO } from '../../utils/date';
import { useCycleInfo } from '../../hooks/useCycleInfo';
import Page from '../../components/home/Page';
import CycleTimeline from '../../components/home/CycleTimeline';
import WeekStrip from '../../components/home/WeekStrip';

const fmt = (iso: string | null) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

function KeyTile({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

export default function CyclePage() {
  const { p, day, today, statuses } = useCycleInfo();
  const navigation = useNavigation<any>();

  if (!p.hasData) return <Page><Text style={styles.sub}>Log a period to see your cycle.</Text></Page>;

  return (
    <Page>
      <View style={styles.card}>
        <Text style={styles.title}>Your cycle at a glance</Text>
        <Text style={styles.sub}>Where you are in your {p.cycleLength}-day cycle</Text>
        <CycleTimeline day={day} cycleLength={p.cycleLength} periodLength={p.periodLength} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.sub}> </Text>
        <WeekStrip statuses={statuses} today={today} onPress={() => navigation.navigate('Calendar')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Key dates</Text>
        <Text style={styles.sub}>Based on your logged history</Text>
        <View style={styles.row}>
          <KeyTile icon="water" label="Next period" value={fmt(p.nextPeriodStart)} color={colors.period} />
          <KeyTile icon="flower" label="Ovulation" value={fmt(p.ovulationDate)} color={colors.ovulation} />
        </View>
        <View style={styles.row}>
          <KeyTile icon="sparkles" label="Fertile window" value={`${fmt(p.fertileStart)} - ${fmt(p.fertileEnd)}`} color={colors.fertile} />
          <KeyTile icon="sync" label="Average cycle" value={`${p.cycleLength} days`} color={colors.text} />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tile: { flex: 1, backgroundColor: colors.background, borderRadius: 14, padding: 12 },
  tileIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { color: colors.muted, fontSize: 12 },
  tileValue: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
});
