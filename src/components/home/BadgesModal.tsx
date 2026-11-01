import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Badge, StreakInfo } from '../../utils/streaks';

type Props = { visible: boolean; onClose: () => void; badges: Badge[]; streak: StreakInfo };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function BadgesModal({ visible, onClose, badges, streak }: Props) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Streaks & badges</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <View style={styles.statRow}>
            <Stat label="Current streak" value={`${streak.current}`} />
            <Stat label="Best streak" value={`${streak.best}`} />
            <Stat label="Days logged" value={`${streak.total}`} />
          </View>

          <Text style={styles.section}>Earned ({earned.length})</Text>
          {earned.length === 0 ? (
            <Text style={styles.empty}>Log your first day to earn your first badge.</Text>
          ) : (
            <View style={styles.grid}>
              {earned.map((b) => (
                <View key={b.id} style={styles.tile}>
                  <View style={styles.bubble}><Text style={styles.emoji}>{b.emoji}</Text></View>
                  <Text style={styles.title}>{b.title}</Text>
                  <Text style={styles.desc}>{b.desc}</Text>
                </View>
              ))}
            </View>
          )}

          {locked.length > 0 && <Text style={styles.section}>Still to unlock</Text>}
          {locked.map((b) => (
            <View key={b.id} style={styles.lockedRow}>
              <View style={[styles.bubble, styles.bubbleLocked]}>
                <Text style={[styles.emoji, { opacity: 0.35 }]}>{b.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{b.title}</Text>
                <Text style={styles.desc}>{b.desc}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(100, (b.value / b.target) * 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.progress}>{Math.min(b.value, b.target)}/{b.target}</Text>
            </View>
          ))}

          <Text style={styles.note}>
            Missing a day never erases your badges or your best streak. Badges are based on what you have logged, so deleting your data resets them.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  close: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  empty: { color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center' },
  bubble: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  bubbleLocked: { backgroundColor: '#F1ECEC', marginBottom: 0 },
  emoji: { fontSize: 28 },
  title: { color: colors.text, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2, textAlign: 'center' },
  lockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 16, padding: 12, marginBottom: 8,
  },
  track: { height: 6, borderRadius: 3, backgroundColor: '#F1ECEC', marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progress: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 20 },
});
