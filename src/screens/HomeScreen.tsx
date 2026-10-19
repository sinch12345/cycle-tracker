import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { parseISO, todayISO } from '../utils/date';
import { getPrediction, Phase } from '../utils/prediction';

const SIZE = 230;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const phaseInfo: Record<Phase, { label: string; tip: string; color: string }> = {
  menstrual: { label: 'Period', tip: 'Rest up, stay warm and hydrated.', color: colors.period },
  follicular: { label: 'Follicular phase', tip: 'Energy is usually rising. Good time to start new things.', color: colors.fertile },
  ovulation: { label: 'Ovulation day', tip: 'Peak fertility is likely around now.', color: colors.ovulation },
  luteal: { label: 'Luteal phase', tip: 'You may feel more tired or moody. Be kind to yourself.', color: colors.ovulation },
};

const fmt = (iso: string | null) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { loading, periods, settings, startPeriod } = useAppData();
  const navigation = useNavigation<any>();

  if (loading) return <View style={styles.center}><Text style={{ color: colors.muted }}>Loading...</Text></View>;

  const p = getPrediction(periods, settings);

  // ---------- empty state ----------
  if (!p.hasData) {
    return (
      <View style={styles.center}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeText}>
          Log the start of your last period and we'll begin predicting your cycle.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => startPeriod(todayISO())}>
          <Text style={styles.btnText}>My period started today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate('Calendar')}>
          <Text style={[styles.btnText, { color: colors.primary }]}>Pick an earlier date</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const phase = p.phase as Phase;
  const info = phaseInfo[phase];
  const cycleDay = p.cycleDay as number;
  const days = p.daysUntilNextPeriod as number;
  const progress = Math.min(cycleDay / p.cycleLength, 1);

  let headline: string;
  if (days < 0) headline = `Period is ${-days} day${-days === 1 ? '' : 's'} late`;
  else if (days === 0) headline = 'Period expected today';
  else headline = `Period in ${days} day${days === 1 ? '' : 's'}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={info.color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - progress)}
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.dayLabel}>Cycle day</Text>
          <Text style={styles.dayNumber}>{cycleDay}</Text>
          <Text style={[styles.phase, { color: info.color }]}>{info.label}</Text>
        </View>
      </View>

      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.tip}>{info.tip}</Text>

      <View style={styles.row}>
        <InfoCard label="Next period" value={fmt(p.nextPeriodStart)} />
        <InfoCard label="Ovulation" value={fmt(p.ovulationDate)} />
      </View>
      <View style={styles.row}>
        <InfoCard label="Fertile window" value={`${fmt(p.fertileStart)} - ${fmt(p.fertileEnd)}`} />
        <InfoCard label="Avg cycle" value={`${p.cycleLength} days`} />
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Log')}>
        <Text style={styles.btnText}>Log today's symptoms</Text>
      </TouchableOpacity>
      {phase !== 'menstrual' && (
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => startPeriod(todayISO())}>
          <Text style={[styles.btnText, { color: colors.primary }]}>My period started today</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>
        Predictions are estimates based on your logged history, not medical advice. Don't rely on them for contraception.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  welcomeText: { color: colors.muted, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 21 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  dayLabel: { color: colors.muted, fontSize: 13 },
  dayNumber: { fontSize: 56, fontWeight: '800', color: colors.text, lineHeight: 62 },
  phase: { fontSize: 15, fontWeight: '700' },
  headline: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 18 },
  tip: { textAlign: 'center', color: colors.muted, marginTop: 6, marginHorizontal: 16, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  infoCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  btn: { backgroundColor: colors.primary, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 14, alignSelf: 'stretch' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
  disclaimer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 22, lineHeight: 16 },
});
