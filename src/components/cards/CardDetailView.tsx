import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Card, CATS } from '../../content/cards';

export default function CardDetailView({
  card, onBack, backLabel,
}: { card: Card; onBack: () => void; backLabel?: string }) {
  const insets = useSafeAreaInsets();
  const cat = CATS[card.cat];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient
          colors={cat.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.deco1} />
          <View style={styles.deco2} />
          <Text style={styles.bgEmoji}>{card.e}</Text>

          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={styles.backText}>{backLabel ?? 'Back'}</Text>
          </TouchableOpacity>

          <View style={styles.bubble}>
            <Text style={styles.emoji}>{card.e}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{cat.label}</Text>
          </View>
          <Text style={styles.title}>{card.t}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The details</Text>
            <Text style={styles.text}>{card.m}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Good to know</Text>
            {card.p.map((point) => (
              <View key={point} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: cat.grad[0] }]} />
                <Text style={styles.text}>{point}</Text>
              </View>
            ))}
          </View>

          {card.d ? (
            <View style={styles.doctor}>
              <Ionicons name="medkit-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorTitle}>See a doctor if</Text>
                <Text style={styles.text}>{card.d}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.note}>General information, not medical advice.</Text>

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: cat.grad[0] }]} onPress={onBack}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 28, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  deco1: {
    position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  deco2: {
    position: 'absolute', bottom: -70, left: -50, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bgEmoji: { position: 'absolute', right: 6, bottom: 10, fontSize: 130, opacity: 0.14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: -4, marginBottom: 14 },
  backText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  bubble: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 46 },
  chip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 14, marginTop: 16,
  },
  chipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  title: { color: '#FFFFFF', fontSize: 23, lineHeight: 30, fontWeight: '800', marginTop: 12 },
  body: { padding: 16 },
  section: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 },
  text: { color: colors.text, lineHeight: 22, fontSize: 15, flex: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  doctor: {
    flexDirection: 'row', gap: 12, backgroundColor: colors.primaryLight, borderRadius: 18,
    padding: 16, marginBottom: 12,
  },
  doctorTitle: { color: colors.primary, fontWeight: '800', marginBottom: 4 },
  note: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  doneBtn: { padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  doneText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
