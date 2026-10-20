import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { BY_ID, Card } from '../../content/cards';
import { getTodayDeck, peekDeck } from '../../utils/cardDeck';
import { Phase } from '../../utils/prediction';
import CardView from './CardView';
import CardDetailModal from './CardDetailModal';
import CardLibraryModal from './CardLibraryModal';

type Item = { kind: 'card'; card: Card } | { kind: 'end' };
type Props = { phase: Phase; showLove: boolean; today: string };

export default function DidYouKnow({ phase, showLove, today }: Props) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 64, 340);
  const step = cardW + 12;

  const [ids, setIds] = useState<string[] | null>(() => peekDeck(today));
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<Card | null>(null);
  const [library, setLibrary] = useState(false);

  useEffect(() => {
    let alive = true;
    getTodayDeck(phase, showLove, today).then((r) => {
      if (alive) setIds(r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, today]);

  const cards = useMemo(
    () => (ids ?? []).map((id) => BY_ID[id]).filter((c) => !!c && (showLove || c.cat !== 'love')),
    [ids, showLove]
  );

  const items: Item[] = useMemo(
    () => [...cards.map((card) => ({ kind: 'card', card }) as Item), { kind: 'end' } as Item],
    [cards]
  );

  if (!ids || cards.length === 0) return null;

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    setIndex(Math.min(Math.max(i, 0), items.length - 1));
  };

  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Did you know?</Text>
          <Text style={styles.sub}>Today's {cards.length} cards, picked for you</Text>
        </View>
        <TouchableOpacity onPress={() => setLibrary(true)} hitSlop={10}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        horizontal
        keyExtractor={(it, i) => (it.kind === 'card' ? it.card.id : 'end-' + i)}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={items.map((_, i) => i * step)}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item }) =>
          item.kind === 'card' ? (
            <CardView card={item.card} width={cardW} onMore={() => setOpen(item.card)} />
          ) : (
            <LinearGradient
              colors={['#2E2240', '#5B4A7A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.endCard, { width: cardW }]}
            >
              <Text style={styles.endEmoji}>{String.fromCodePoint(0x1F389)}</Text>
              <Text style={styles.endTitle}>That's today's {cards.length}!</Text>
              <Text style={styles.endSub}>New cards arrive tomorrow, or explore the whole collection now.</Text>
              <TouchableOpacity style={styles.endBtn} onPress={() => setLibrary(true)}>
                <Text style={styles.endBtnText}>Explore all cards</Text>
              </TouchableOpacity>
            </LinearGradient>
          )
        }
      />

      <View style={styles.dots}>
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <CardDetailModal card={open} onClose={() => setOpen(null)} />
      <CardLibraryModal visible={library} onClose={() => setLibrary(false)} showLove={showLove} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  seeAll: { color: colors.primary, fontWeight: '800' },
  endCard: { height: 320, borderRadius: 26, padding: 22, alignItems: 'center', justifyContent: 'center' },
  endEmoji: { fontSize: 54 },
  endTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 10 },
  endSub: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, marginTop: 8 },
  endBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, marginTop: 20 },
  endBtnText: { color: '#2E2240', fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5D8D8' },
  dotActive: { width: 18, backgroundColor: colors.primary },
});
