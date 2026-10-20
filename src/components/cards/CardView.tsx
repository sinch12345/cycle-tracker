import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, CATS } from '../../content/cards';

export default function CardView({ card, width, onMore }: { card: Card; width: number; onMore: () => void }) {
  const cat = CATS[card.cat];
  return (
    <LinearGradient colors={cat.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { width }]}>
      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <Text style={styles.bgEmoji}>{card.e}</Text>

      <View style={styles.topRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{cat.label}</Text>
        </View>
        <View style={styles.bubble}>
          <Text style={styles.emoji}>{card.e}</Text>
        </View>
      </View>

      <Text style={styles.fact} numberOfLines={6}>{card.t}</Text>

      <TouchableOpacity style={styles.more} onPress={onMore} activeOpacity={0.85}>
        <Text style={[styles.moreText, { color: cat.grad[0] }]}>Know more</Text>
        <Ionicons name="arrow-forward" size={16} color={cat.grad[0]} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { height: 320, borderRadius: 26, padding: 18, overflow: 'hidden', justifyContent: 'space-between' },
  deco1: {
    position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  deco2: {
    position: 'absolute', bottom: -60, left: -50, width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bgEmoji: { position: 'absolute', right: -6, bottom: 30, fontSize: 120, opacity: 0.16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  chipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  bubble: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  fact: { color: '#FFFFFF', fontSize: 19, lineHeight: 25, fontWeight: '800' },
  more: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  moreText: { fontWeight: '800', fontSize: 14 },
});
