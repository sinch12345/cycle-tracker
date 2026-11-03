import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useCycleInfo } from '../../hooks/useCycleInfo';
import Page from '../../components/home/Page';
import Meter from '../../components/home/Meter';

export default function BodyPage() {
  const { p, info, day, chance } = useCycleInfo();
  if (!p.hasData || !info) return <Page><Text style={styles.sub}>Log a period to see this.</Text></Page>;

  const tip = info.tips[(day - 1) % info.tips.length];

  return (
    <Page>
      <View style={styles.card}>
        <Text style={styles.title}>Your body today</Text>
        <Text style={styles.sub}>Typical for the {info.label.toLowerCase()}. Everyone is different.</Text>
        <Meter label="Energy" value={info.energy} text={info.energyText} color={info.gradient[0]} delay={200} />
        <Meter label="Mood" value={info.mood} text={info.moodText} color={info.gradient[0]} delay={300} />
        <Meter label="Fertility" value={chance.level} text={chance.label} color={info.gradient[0]} delay={400} />
        <Text style={styles.body}>{info.body}</Text>
        <View style={styles.tipRow}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>More ideas for this phase</Text>
        <Text style={styles.sub}> </Text>
        {info.tips.map((t) => (
          <View key={t} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{t}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 14 },
  body: { color: colors.text, lineHeight: 21, marginTop: 4 },
  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.primaryLight,
    borderRadius: 14, padding: 12, marginTop: 14,
  },
  tipText: { flex: 1, color: colors.text, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', marginBottom: 8 },
  bulletDot: { color: colors.primary, width: 16, fontWeight: '800' },
  bulletText: { flex: 1, color: colors.text, lineHeight: 20 },
});
