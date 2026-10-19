import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { addDays, parseISO, todayISO } from '../utils/date';
import { FlowLevel } from '../types';

const FLOWS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];
const SYMPTOMS = [
  'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Back pain',
  'Breast tenderness', 'Acne', 'Nausea', 'Cravings', 'Insomnia',
];
const MOODS = ['Happy', 'Calm', 'Energetic', 'Sad', 'Anxious', 'Irritable', 'Tired'];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LogScreen() {
  const { loading, logs, saveLog } = useAppData();
  const today = todayISO();

  const [date, setDate] = useState(today);
  const [flow, setFlow] = useState<FlowLevel | undefined>();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // load the saved log whenever the date changes (or data finishes loading)
  useEffect(() => {
    const existing = logs[date];
    setFlow(existing?.flow);
    setSymptoms(existing?.symptoms ?? []);
    setMood(existing?.mood);
    setNotes(existing?.notes ?? '');
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, loading]);

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const onSave = () => {
    saveLog({ date, flow, symptoms, mood, notes: notes.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  const isToday = date === today;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setDate(addDays(date, -1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dateText}>{isToday ? 'Today' : parseISO(date).toDateString()}</Text>
          {isToday && <Text style={styles.dateSub}>{parseISO(date).toDateString()}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => !isToday && setDate(addDays(date, 1))}
          hitSlop={12}
          disabled={isToday}
        >
          <Ionicons
            name="chevron-forward"
            size={26}
            color={isToday ? colors.muted : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Flow</Text>
      <View style={styles.wrap}>
        {FLOWS.map((f) => (
          <Chip
            key={f}
            label={cap(f)}
            active={flow === f}
            onPress={() => setFlow(flow === f ? undefined : f)}
          />
        ))}
      </View>

      <Text style={styles.section}>Symptoms</Text>
      <View style={styles.wrap}>
        {SYMPTOMS.map((s) => (
          <Chip key={s} label={s} active={symptoms.includes(s)} onPress={() => toggleSymptom(s)} />
        ))}
      </View>

      <Text style={styles.section}>Mood</Text>
      <View style={styles.wrap}>
        {MOODS.map((m) => (
          <Chip
            key={m}
            label={m}
            active={mood === m}
            onPress={() => setMood(mood === m ? undefined : m)}
          />
        ))}
      </View>

      <Text style={styles.section}>Notes</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything else you want to remember..."
        placeholderTextColor={colors.muted}
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveText}>{saved ? 'Saved!' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, padding: 14, borderRadius: 16,
  },
  dateText: { fontSize: 18, fontWeight: '700', color: colors.text },
  dateSub: { color: colors.muted, marginTop: 2, fontSize: 12 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 22, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12,
    minHeight: 90, textAlignVertical: 'top', color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary, padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 24,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

