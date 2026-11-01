import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAppData } from '../../context/AppDataContext';
import { Phase } from '../../utils/prediction';
import { parseISO } from '../../utils/date';
import { computeBadges, computeStreaks } from '../../utils/streaks';
import { getSeenBadges, markBadgesSeen } from '../../utils/badgeStore';
import BadgesModal from './BadgesModal';

const E = (...cp: number[]) => String.fromCodePoint(...cp);

const FACES = [
  { key: 'Happy', e: E(0x1F60A) },
  { key: 'Calm', e: E(0x1F60C) },
  { key: 'Energetic', e: E(0x1F929) },
  { key: 'Tired', e: E(0x1F634) },
  { key: 'Sad', e: E(0x1F622) },
];

function moodMessage(mood: string, phase: Phase | null): string {
  switch (mood) {
    case 'Happy':
      return 'Lovely! Notice what is helping so you can repeat it.' +
        (phase === 'follicular' || phase === 'ovulation' ? ' Rising hormones often lift mood at this point.' : '');
    case 'Calm':
      return 'Calm is a gift. A good moment to do something that restores you.';
    case 'Energetic':
      return 'Make the most of that energy!' +
        (phase === 'follicular' || phase === 'ovulation' ? ' It fits where you are in your cycle.' : '');
    case 'Tired':
      return 'Be gentle with yourself today.' +
        (phase === 'menstrual' ? ' Low energy is very common on your period.'
          : phase === 'luteal' ? ' Tiredness is common before your period.'
          : ' A short walk, some water and an earlier night can help.');
    case 'Sad':
      return 'I am sorry it is a heavy day. Feelings like this pass, and talking to someone you trust can help.' +
        (phase === 'luteal' ? ' Mood dips are common in the days before your period.' : '') +
        ' If low mood lasts for weeks, please talk to a doctor.';
    default:
      return 'Thanks for checking in.';
  }
}

function Face({ e, label, selected, dim, onPress }: {
  e: string; label: string; selected: boolean; dim: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.28 : 1,
      friction: 3,
      tension: 140,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <TouchableOpacity style={styles.face} onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.faceBubble,
          selected && styles.faceBubbleOn,
          { opacity: dim ? 0.45 : 1, transform: [{ scale }] },
        ]}
      >
        <Text style={styles.faceEmoji}>{e}</Text>
      </Animated.View>
      <Text style={[styles.faceLabel, selected && { color: colors.primary, fontWeight: '800' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Message({ text }: { text: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <Animated.View
      style={[
        styles.message,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      <Text style={styles.messageText}>{text}</Text>
    </Animated.View>
  );
}

type Props = { phase: Phase | null; today: string };

export default function MoodStreakCard({ phase, today }: Props) {
  const { logs, periods, saveLog } = useAppData();
  const navigation = useNavigation<any>();
  const [modal, setModal] = useState(false);
  const [seen, setSeen] = useState<string[] | null>(null);
  const flame = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getSeenBadges().then(setSeen);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flame, { toValue: 1.14, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flame, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mood = logs[today]?.mood;
  const streak = useMemo(() => computeStreaks(logs, today), [logs, today]);
  const badges = useMemo(() => computeBadges(logs, periods, streak), [logs, periods, streak]);
  const earned = badges.filter((b) => b.earned);
  const fresh = seen ? earned.filter((b) => !seen.includes(b.id)) : [];

  const pick = (key: string) => {
    const existing = logs[today];
    saveLog({
      date: today,
      flow: existing?.flow,
      symptoms: existing?.symptoms ?? [],
      mood: mood === key ? undefined : key,
      notes: existing?.notes,
    });
  };

  const openBadges = () => {
    setModal(true);
    if (seen) {
      const ids = earned.map((b) => b.id);
      setSeen(ids);
      markBadgesSeen(ids);
    }
  };

  const title =
    streak.current > 0 ? `${streak.current}-day streak` : 'Start your streak';
  const sub =
    streak.current === 0 ? 'Check in today to begin'
    : streak.todayDone ? 'You checked in today. Nice!'
    : 'Check in today to keep it going';

  return (
    <View>
      <Text style={styles.cardTitle}>How are you feeling today?</Text>
      <Text style={styles.cardSub}>One tap is enough</Text>

      <View style={styles.faces}>
        {FACES.map((f) => (
          <Face
            key={f.key}
            e={f.e}
            label={f.key}
            selected={mood === f.key}
            dim={!!mood && mood !== f.key}
            onPress={() => pick(f.key)}
          />
        ))}
      </View>

      {mood ? (
        <Message text={moodMessage(mood, phase)} />
      ) : null}

      <TouchableOpacity onPress={() => navigation.navigate('Log')} style={styles.moreLink} hitSlop={8}>
        <Text style={styles.moreText}>More options</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {fresh.length > 0 && (
        <TouchableOpacity style={styles.banner} onPress={openBadges} activeOpacity={0.85}>
          <Text style={styles.bannerEmoji}>{E(0x1F389)}</Text>
          <Text style={styles.bannerText}>
            {fresh.length === 1 ? `New badge: ${fresh[0].title}` : `${fresh.length} new badges!`}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={styles.streakRow}>
        <Animated.Text style={[styles.flame, { transform: [{ scale: flame }] }]}>
          {E(0x1F525)}
        </Animated.Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakTitle}>{title}</Text>
          <Text style={styles.streakSub}>{sub}</Text>
        </View>
        <TouchableOpacity style={styles.badgeBtn} onPress={openBadges}>
          <Text style={styles.badgeBtnText}>Badges {earned.length}/{badges.length}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.week}>
        {streak.last7.map((d) => (
          <View key={d.date} style={styles.dayCol}>
            <View style={[styles.dayDot, d.done && styles.dayDotOn, d.date === today && styles.dayDotToday]}>
              {d.done ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.dayLabel}>
              {parseISO(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
          </View>
        ))}
      </View>

      <BadgesModal visible={modal} onClose={() => setModal(false)} badges={badges} streak={streak} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 14 },
  faces: { flexDirection: 'row', justifyContent: 'space-between' },
  face: { alignItems: 'center', flex: 1 },
  faceBubble: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  faceBubbleOn: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  faceEmoji: { fontSize: 28 },
  faceLabel: { color: colors.muted, fontSize: 11, marginTop: 8 },
  message: { backgroundColor: colors.primaryLight, borderRadius: 14, padding: 12, marginTop: 14 },
  messageText: { color: colors.text, lineHeight: 20, fontSize: 13 },
  moreLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 10 },
  moreText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  bannerEmoji: { fontSize: 18 },
  bannerText: { flex: 1, color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flame: { fontSize: 32 },
  streakTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  streakSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badgeBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  badgeBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  dayCol: { alignItems: 'center', flex: 1 },
  dayDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F1ECEC',
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotOn: { backgroundColor: colors.primary },
  dayDotToday: { borderWidth: 2, borderColor: colors.text },
  dayLabel: { color: colors.muted, fontSize: 10, marginTop: 5 },
});
