import { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { CARDS, CATS, Card, Cat } from '../../content/cards';
import CardDetailView from './CardDetailView';

type Props = { visible: boolean; onClose: () => void; showLove: boolean };

export default function CardLibraryModal({ visible, onClose, showLove }: Props) {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [selected, setSelected] = useState<Card | null>(null);

  const cats = (Object.keys(CATS) as Cat[]).filter((c) => showLove || c !== 'love');
  const list = useMemo(
    () => CARDS.filter((c) => (showLove || c.cat !== 'love') && (cat === 'all' || c.cat === cat)),
    [cat, showLove]
  );

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => (selected ? setSelected(null) : close())}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
          <View>
            <Text style={styles.heading}>All cards</Text>
            <Text style={styles.count}>{list.length} cards</Text>
          </View>
          <TouchableOpacity onPress={close} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <TouchableOpacity
              style={[styles.chip, cat === 'all' && { backgroundColor: colors.text, borderColor: colors.text }]}
              onPress={() => setCat('all')}
            >
              <Text style={[styles.chipText, cat === 'all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
            {cats.map((c) => {
              const active = cat === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && { backgroundColor: CATS[c].grad[0], borderColor: CATS[c].grad[0] }]}
                  onPress={() => setCat(c)}
                >
                  <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{CATS[c].label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.8}>
              <LinearGradient colors={CATS[item.cat].grad} style={styles.rowIcon}>
                <Text style={styles.rowEmoji}>{item.e}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowCat, { color: CATS[item.cat].grad[0] }]}>{CATS[item.cat].label}</Text>
                <Text style={styles.rowTitle} numberOfLines={3}>{item.t}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        />

        {selected && (
          <View style={StyleSheet.absoluteFill}>
            <CardDetailView card={selected} onBack={() => setSelected(null)} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  count: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 18, padding: 12,
  },
  rowIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 28 },
  rowCat: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 3 },
  rowTitle: { color: colors.text, fontWeight: '600', lineHeight: 20, fontSize: 14 },
});
