import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { parseISO, todayISO } from '../utils/date';
import { getDayStatuses, getPrediction, Phase } from '../utils/prediction';
import { PHASE_INFO, pregnancyChance } from '../utils/phaseContent';
import FadeIn from '../components/home/FadeIn';
import CycleRing from '../components/home/CycleRing';
import CycleTimeline from '../components/home/CycleTimeline';
import WeekStrip from '../components/home/WeekStrip';
import Meter from '../components/home/Meter';
import IntimacySection from '../components/home/IntimacySection';
import DidYouKnow from '../components/cards/DidYouKnow';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (iso: string | null) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

function Tile({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
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

export default function HomeScreen() {
  const { loading, periods, settings, startPeriod, updateSettings } = useAppData();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [playKey, setPlayKey] = useState(0);
  const first = useRef(true);

  // replay the animations every time the Home tab is opened
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      setPlayKey((k) => k + 1);
    }, [])
  );

  const today = todayISO();
  const p = useMemo(() => getPrediction(periods, settings, today), [periods, settings, today]);
  const statuses = useMemo(() => getDayStatuses(periods, settings), [periods, settings]);

  if (loading) {
    return <View style={styles.center}><Text style={{ color: colors.muted }}>Loading...</Text></View>;
  }

  const dateText = parseISO(today).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View>
        <Text style={styles.hello}>{greeting()}</Text>
        <Text style={styles.date}>{dateText}</Text>
      </View>
      <TouchableOpacity style={styles.auraBtn} onPress={() => navigation.navigate('Aura')}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={styles.auraText}>Ask Aura</Text>
      </TouchableOpacity>
    </View>
  );

  // ---------- first launch ----------
  if (!p.hasData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {header}
        <FadeIn style={{ marginHorizontal: 16 }}>
          <LinearGradient colors={['#E4576E', '#F4879B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.deco1} />
            <View style={styles.deco2} />
            <Ionicons name="water" size={48} color="#FFFFFF" />
            <Text style={styles.headline}>Let's get started</Text>
            <Text style={styles.heroSub}>
              Tell us when your last period started and we will begin predicting your cycle, fertile window and more.
            </Text>
            <TouchableOpacity style={styles.whiteBtn} onPress={() => startPeriod(today)}>
              <Text style={styles.whiteBtnText}>My period started today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.ghostBtnText}>Pick an earlier date</Text>
            </TouchableOpacity>
          </LinearGradient>
        </FadeIn>
      </ScrollView>
    );
  }

  const phase = p.phase as Phase;
  const info = PHASE_INFO[phase];
  const day = Math.max(1, p.cycleDay as number);
  const days = p.daysUntilNextPeriod as number;
  const chance = pregnancyChance(p, today);
  const tip = info.tips[(day - 1) % info.tips.length];

  let headline: string;
  if (days < 0) headline = `Period is ${-days} day${-days === 1 ? '' : 's'} late`;
  else if (days === 0) headline = 'Period expected today';
  else headline = `Period in ${days} day${days === 1 ? '' : 's'}`;

  const showIntimacy = settings.showIntimacy !== false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {header}
      <View key={playKey}>
        <FadeIn style={{ marginHorizontal: 16 }}>
          <LinearGradient colors={info.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.deco1} />
            <View style={styles.deco2} />
            <CycleRing day={day} total={p.cycleLength} label={info.label} icon={info.icon} />
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.heroSub}>{info.short}</Text>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={120} style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Log')}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Log today</Text>
          </TouchableOpacity>
          {phase !== 'menstrual' && (
            <TouchableOpacity style={styles.outlineBtn} onPress={() => startPeriod(today)}>
              <Ionicons name="water-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineText}>Period started</Text>
            </TouchableOpacity>
          )}
        </FadeIn>

        <FadeIn delay={160} style={{ marginTop: 18 }}>
          <DidYouKnow phase={phase} showLove={showIntimacy} today={today} />
        </FadeIn>

        <FadeIn delay={200} style={styles.card}>
          <Text style={styles.cardTitle}>Your cycle at a glance</Text>
          <Text style={styles.cardSub}>Where you are in your {p.cycleLength}-day cycle</Text>
          <CycleTimeline day={day} cycleLength={p.cycleLength} periodLength={p.periodLength} />
        </FadeIn>

        <FadeIn delay={280} style={styles.card}>
          <Text style={styles.cardTitle}>This week</Text>
          <Text style={styles.cardSub}> </Text>
          <WeekStrip statuses={statuses} today={today} onPress={() => navigation.navigate('Calendar')} />
        </FadeIn>

        <FadeIn delay={360} style={styles.card}>
          <Text style={styles.cardTitle}>Key dates</Text>
          <Text style={styles.cardSub}>Based on your logged history</Text>
          <View style={styles.tileRow}>
            <Tile icon="water" label="Next period" value={fmt(p.nextPeriodStart)} color={colors.period} />
            <Tile icon="flower" label="Ovulation" value={fmt(p.ovulationDate)} color={colors.ovulation} />
          </View>
          <View style={styles.tileRow}>
            <Tile icon="sparkles" label="Fertile window" value={`${fmt(p.fertileStart)} - ${fmt(p.fertileEnd)}`} color={colors.fertile} />
            <Tile icon="sync" label="Average cycle" value={`${p.cycleLength} days`} color={colors.text} />
          </View>
        </FadeIn>

        <FadeIn delay={440} style={styles.card}>
          <Text style={styles.cardTitle}>Your body today</Text>
          <Text style={styles.cardSub}>Typical for this phase. Everyone is different.</Text>
          <Meter label="Energy" value={info.energy} text={info.energyText} color={info.gradient[0]} delay={500} />
          <Meter label="Mood" value={info.mood} text={info.moodText} color={info.gradient[0]} delay={600} />
          <Meter label="Fertility" value={chance.level} text={chance.label} color={info.gradient[0]} delay={700} />
          <Text style={styles.body}>{info.body}</Text>
          <View style={styles.tipRow}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        </FadeIn>

        {showIntimacy ? (
          <FadeIn delay={520}>
            <IntimacySection
              phase={phase}
              chance={chance}
              onHide={() => updateSettings({ showIntimacy: false })}
              onAsk={() => navigation.navigate('Aura')}
            />
          </FadeIn>
        ) : (
          <TouchableOpacity style={styles.showLink} onPress={() => updateSettings({ showIntimacy: true })}>
            <Text style={styles.showLinkText}>Show the Love & intimacy section</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Predictions are estimates based on your logged history, not medical advice. Do not rely on them for contraception.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  date: { color: colors.muted, fontSize: 13, marginTop: 2 },
  auraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
  },
  auraText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  hero: { borderRadius: 28, padding: 20, paddingTop: 24, alignItems: 'center', overflow: 'hidden' },
  deco1: {
    position: 'absolute', top: -50, right: -40, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  deco2: {
    position: 'absolute', bottom: -60, left: -40, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  headline: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: 6, lineHeight: 20, marginHorizontal: 8 },
  whiteBtn: {
    alignSelf: 'stretch', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 14,
    alignItems: 'center', marginTop: 20,
  },
  whiteBtnText: { color: colors.primary, fontWeight: '800' },
  ghostBtn: {
    alignSelf: 'stretch', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },
  ghostBtnText: { color: '#FFFFFF', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, padding: 14, borderRadius: 14,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  outlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card,
  },
  outlineText: { color: colors.primary, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 14 },
  tileRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tile: { flex: 1, backgroundColor: colors.background, borderRadius: 14, padding: 12 },
  tileIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { color: colors.muted, fontSize: 12 },
  tileValue: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  body: { color: colors.text, lineHeight: 21, marginTop: 4 },
  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.primaryLight,
    borderRadius: 14, padding: 12, marginTop: 14,
  },
  tipText: { flex: 1, color: colors.text, lineHeight: 20 },
  showLink: { alignItems: 'center', padding: 16, marginTop: 8 },
  showLinkText: { color: colors.primary, fontWeight: '700' },
  disclaimer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 22, lineHeight: 16, marginHorizontal: 24 },
});

