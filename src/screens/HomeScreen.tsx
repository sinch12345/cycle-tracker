import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { parseISO } from '../utils/date';
import { useCycleInfo } from '../hooks/useCycleInfo';
import { computeStreaks } from '../utils/streaks';
import FadeIn from '../components/home/FadeIn';
import CycleRing from '../components/home/CycleRing';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (iso: string | null) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

function HomeTile({
  icon, color, title, preview, onPress,
}: { icon: string; color: string; title: string; preview: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.tileIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} style={styles.tileArrow} />
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tilePreview} numberOfLines={2}>{preview}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { loading, logs, startPeriod, updateSettings } = useAppData();
  const { today, p, info, chance, day, showIntimacy } = useCycleInfo();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [playKey, setPlayKey] = useState(0);
  const first = useRef(true);

  // replay the animations every time the Home tab is shown again
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      setPlayKey((k) => k + 1);
    }, [])
  );

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
  if (!p.hasData || !info) {
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

  const days = p.daysUntilNextPeriod as number;
  const streak = computeStreaks(logs, today).current;
  const mood = logs[today]?.mood;

  let headline: string;
  if (days < 0) headline = `Period is ${-days} day${-days === 1 ? '' : 's'} late`;
  else if (days === 0) headline = 'Period expected today';
  else headline = `Period in ${days} day${days === 1 ? '' : 's'}`;

  const moodPreview = [
    mood ? `Feeling ${mood.toLowerCase()}` : 'How are you feeling?',
    streak > 0 ? `${streak}-day streak` : null,
  ].filter(Boolean).join(' · ');

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
          {p.phase !== 'menstrual' && (
            <TouchableOpacity style={styles.outlineBtn} onPress={() => startPeriod(today)}>
              <Ionicons name="water-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineText}>Period started</Text>
            </TouchableOpacity>
          )}
        </FadeIn>

        <FadeIn delay={220} style={styles.grid}>
          <HomeTile
            icon="happy-outline" color="#EE7B4A" title="Mood & streak"
            preview={moodPreview} onPress={() => navigation.navigate('MoodPage')}
          />
          <HomeTile
            icon="bulb-outline" color="#5B6CC7" title="Did you know?"
            preview="10 new cards today" onPress={() => navigation.navigate('CardsPage')}
          />
          <HomeTile
            icon="sync-outline" color={colors.period} title="Your cycle"
            preview={`Next period ${fmt(p.nextPeriodStart)}`} onPress={() => navigation.navigate('CyclePage')}
          />
          <HomeTile
            icon="body-outline" color={colors.fertile} title="Your body today"
            preview={`Energy: ${info.energyText.toLowerCase()}`} onPress={() => navigation.navigate('BodyPage')}
          />
          {showIntimacy && (
            <HomeTile
              icon="heart-circle-outline" color="#C2255C" title="Love & intimacy"
              preview={`Chance today: ${chance.label.toLowerCase()}`} onPress={() => navigation.navigate('LovePage')}
            />
          )}
        </FadeIn>

        {!showIntimacy && (
          <TouchableOpacity style={styles.showLink} onPress={() => updateSettings({ showIntimacy: true })}>
            <Text style={styles.showLinkText}>Show Love & intimacy</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 16, marginTop: 16 },
  tile: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 20, padding: 14,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileArrow: { position: 'absolute', top: 14, right: 12 },
  tileTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  tilePreview: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  showLink: { alignItems: 'center', padding: 16, marginTop: 4 },
  showLinkText: { color: colors.primary, fontWeight: '700' },
  disclaimer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 16, marginHorizontal: 24 },
});
