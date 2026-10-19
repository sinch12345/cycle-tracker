import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { diffDays, parseISO } from '../utils/date';
import { averageCycleLength, averagePeriodLength } from '../utils/prediction';

type Cycle = { start: string; length: number };

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function countTop(items: string[], limit: number) {
  const counts: Record<string, number> = {};
  items.forEach((i) => (counts[i] = (counts[i] ?? 0) + 1));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function BarList({ data }: { data: [string, number][] }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <View>
      {data.map(([name, n]) => (
        <View key={name} style={styles.hRow}>
          <Text style={styles.hLabel}>{name}</Text>
          <View style={styles.hTrack}>
            <View style={[styles.hFill, { width: `${(n / max) * 100}%` }]} />
          </View>
          <Text style={styles.hCount}>{n}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const { loading, periods, logs, settings } = useAppData();

  const cycles: Cycle[] = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const out: Cycle[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const len = diffDays(sorted[i].startDate, sorted[i - 1].startDate);
      if (len >= 15 && len <= 60) out.push({ start: sorted[i - 1].startDate, length: len });
    }
    return out;
  }, [periods]);

  const symptomCounts = useMemo(
    () => countTop(Object.values(logs).flatMap((l) => l.symptoms), 6),
    [logs]
  );
  const moodCounts = useMemo(
    () => countTop(Object.values(logs).map((l) => l.mood).filter(Boolean) as string[], 4),
    [logs]
  );

  if (loading) return <View style={styles.center}><Text style={{ color: colors.muted }}>Loading...</Text></View>;

  const avgCycle = averageCycleLength(periods, settings);
  const avgPeriod = averagePeriodLength(periods, settings);

  const recent = cycles.slice(-6);
  const lengths = recent.map((c) => c.length);
  const range = lengths.length >= 2 ? Math.max(...lengths) - Math.min(...lengths) : null;
  const chartMax = Math.max(35, ...lengths);
  const daysLogged = Object.keys(logs).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.grid}>
        <StatCard label="Average cycle" value={`${avgCycle} days`} sub={cycles.length ? `from ${cycles.length} cycle${cycles.length === 1 ? '' : 's'}` : 'default value'} />
        <StatCard label="Average period" value={`${avgPeriod} days`} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Periods logged" value={String(periods.length)} />
        <StatCard
          label="Variation"
          value={range === null ? '-' : `${range} days`}
          sub={range === null ? 'needs 2+ cycles' : 'longest minus shortest'}
        />
      </View>

      <Text style={styles.section}>Recent cycle lengths</Text>
      <View style={styles.card}>
        {recent.length === 0 ? (
          <Text style={styles.empty}>Log at least 2 periods to see your cycle history here.</Text>
        ) : (
          <View style={styles.chart}>
            {recent.map((c) => (
              <View key={c.start} style={styles.barCol}>
                <Text style={styles.barValue}>{c.length}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${(c.length / chartMax) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>
                  {parseISO(c.start).toLocaleDateString(undefined, { month: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.note}>Bars show the number of days from one period start to the next.</Text>
      </View>

      <Text style={styles.section}>Most logged symptoms</Text>
      <View style={styles.card}>
        {symptomCounts.length === 0 ? (
          <Text style={styles.empty}>Log symptoms on the Log tab and your most common ones will appear here.</Text>
        ) : (
          <BarList data={symptomCounts} />
        )}
      </View>

      <Text style={styles.section}>Moods</Text>
      <View style={styles.card}>
        {moodCounts.length === 0 ? (
          <Text style={styles.empty}>No moods logged yet.</Text>
        ) : (
          <BarList data={moodCounts} />
        )}
        <Text style={styles.note}>{daysLogged} day{daysLogged === 1 ? '' : 's'} with a daily log.</Text>
      </View>

      <Text style={styles.disclaimer}>
        These insights come only from what you log and are not medical advice. If your cycles change a lot or you are worried, talk to a doctor.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  statSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  empty: { color: colors.muted, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 11, marginTop: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barValue: { color: colors.text, fontWeight: '700', fontSize: 12, marginBottom: 4 },
  barTrack: { width: 22, flex: 1, justifyContent: 'flex-end', maxHeight: 110 },
  bar: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { color: colors.muted, fontSize: 11, marginTop: 6 },
  hRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hLabel: { width: 110, color: colors.text, fontSize: 13 },
  hTrack: { flex: 1, height: 10, backgroundColor: colors.primaryLight, borderRadius: 5, overflow: 'hidden' },
  hFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  hCount: { width: 28, textAlign: 'right', color: colors.muted, fontSize: 12 },
  disclaimer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 22, lineHeight: 16 },
});
