import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Phase } from '../../utils/prediction';
import { Chance, INTIMACY, PHASE_INFO } from '../../utils/phaseContent';
import Meter from './Meter';

const chanceColor = (label: string) =>
  label === 'High' ? colors.primary
  : label === 'Medium' ? '#EE7B4A'
  : label === 'Unclear' || label === 'Unknown' ? colors.muted
  : colors.fertile;

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t) => (
        <View key={t} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Collapse({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.collapse}>
      <TouchableOpacity style={styles.collapseHead} onPress={() => setOpen((o) => !o)} activeOpacity={0.7}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
        <Text style={styles.collapseTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
      {open && <View style={styles.collapseBody}>{children}</View>}
    </View>
  );
}

type Props = { phase: Phase; chance: Chance; onHide: () => void; onAsk: () => void };

export default function IntimacySection({ phase, chance, onHide, onAsk }: Props) {
  const info = PHASE_INFO[phase];
  const content = INTIMACY[phase];
  const cColor = chanceColor(chance.label);

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.headLeft}>
          <Ionicons name="heart-circle" size={26} color={colors.primary} />
          <Text style={styles.title}>Love & intimacy</Text>
        </View>
        <TouchableOpacity onPress={onHide} hitSlop={10} style={styles.hideBtn}>
          <Ionicons name="eye-off-outline" size={16} color={colors.muted} />
          <Text style={styles.hideText}>Hide</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>Private, judgement-free information for where you are in your cycle.</Text>

      <View style={styles.chanceBox}>
        <View style={styles.chanceTop}>
          <Text style={styles.chanceLabel}>Chance of pregnancy today</Text>
          <View style={[styles.badge, { backgroundColor: cColor }]}>
            <Text style={styles.badgeText}>{chance.label}</Text>
          </View>
        </View>
        <Text style={styles.chanceNote}>{chance.note}</Text>
      </View>

      <Meter label="Desire (typical for this phase)" value={info.desire} text={info.desireText} color={colors.primary} delay={200} />
      <Text style={styles.small}>
        These are typical tendencies. Your own pattern may be different, and that is normal.
      </Text>

      <Text style={styles.blockTitle}>{content.title}</Text>
      <Bullets items={content.points} />

      <View style={{ height: 8 }} />
      <Collapse title="Staying safe" icon="shield-checkmark-outline">
        <Bullets
          items={[
            'Condoms are the main method that also protects against most sexually transmitted infections.',
            'The fertile window in this app is an estimate and is not birth control. Cycles vary, and stress or illness can shift ovulation.',
            'After unprotected sex or if a method fails (like a condom breaking), emergency contraception works best the sooner it is taken. Some types work for up to 3 to 5 days. A pharmacist or doctor can advise.',
            'Passing urine after sex can help lower the risk of urinary infections.',
          ]}
        />
      </Collapse>
      <Collapse title="Trying for a baby" icon="flower-outline">
        <Bullets
          items={[
            'Sex every day or two across your fertile window gives the best chance.',
            'The two days before ovulation and the day of ovulation are the most fertile.',
            'Many doctors suggest folic acid before conceiving. Ask yours what is right for you.',
            'If you have been trying for 12 months (6 months if you are 35 or older), see a doctor.',
          ]}
        />
      </Collapse>
      <Collapse title="When to see a doctor" icon="medkit-outline">
        <Bullets
          items={[
            'Pain during sex that keeps happening',
            'Bleeding after sex or between periods',
            'Unusual discharge, itching, burning or a strong smell',
            'Dryness that does not improve with lubricant',
            'A lasting drop in desire that worries you',
          ]}
        />
      </Collapse>

      <TouchableOpacity style={styles.askBtn} onPress={onAsk}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={styles.askText}>Ask Aura about intimacy</Text>
      </TouchableOpacity>

      <Text style={styles.small}>
        There is no right amount of desire, and you never owe anyone sex. Consent matters every time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  hideBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hideText: { color: colors.muted, fontSize: 12 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 14, lineHeight: 17 },
  chanceBox: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginBottom: 16 },
  chanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chanceLabel: { color: colors.text, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  chanceNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
  small: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 4 },
  blockTitle: { color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 12, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bulletDot: { color: colors.primary, width: 16, fontWeight: '800' },
  bulletText: { flex: 1, color: colors.text, lineHeight: 20, fontSize: 13 },
  collapse: { borderTopWidth: 1, borderTopColor: colors.border },
  collapseHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  collapseTitle: { flex: 1, color: colors.text, fontWeight: '700' },
  collapseBody: { paddingBottom: 12 },
  askBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 13, borderRadius: 14, marginTop: 8, marginBottom: 10,
    backgroundColor: colors.primaryLight,
  },
  askText: { color: colors.primary, fontWeight: '700' },
});
