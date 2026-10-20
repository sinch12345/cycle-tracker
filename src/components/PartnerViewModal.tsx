import { useCallback, useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { parseISO } from '../utils/date';
import { Phase } from '../utils/prediction';
import {
  PartnerView, Snapshot,
  fetchPartnerView, getViewerLink, joinWithCode, leaveShare, predictionFromSnapshot,
} from '../services/sharing';

const SIZE = 200;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const phaseInfo: Record<Phase, { label: string; tip: string; color: string }> = {
  menstrual: { label: 'Period', tip: 'They may have cramps or low energy. Warmth, rest and a little extra help can mean a lot.', color: colors.period },
  follicular: { label: 'Follicular phase', tip: 'Energy is often rising. A good time for plans together.', color: colors.fertile },
  ovulation: { label: 'Ovulation day', tip: 'Peak fertility is likely around now.', color: colors.ovulation },
  luteal: { label: 'Luteal phase', tip: 'They may feel more tired or moody before the period. Patience and kindness help.', color: colors.ovulation },
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

// the data came from another phone, so check it before using it
function clean(s: Snapshot): Snapshot {
  const dateOk = typeof s.lastPeriodStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.lastPeriodStart);
  return {
    ...s,
    name: typeof s.name === 'string' ? s.name.slice(0, 30) : '',
    lastPeriodStart: dateOk ? s.lastPeriodStart : null,
    cycleLength: clamp(Number(s.cycleLength) || 28, 15, 60),
    periodLength: clamp(Number(s.periodLength) || 5, 1, 14),
  };
}

const fmt = (iso: string | null) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const friendly = (e: any) => {
  const m = String(e?.message ?? e);
  if (/network request failed|aborted|failed to fetch/i.test(m)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return m;
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PartnerViewModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [ready, setReady] = useState(false);
  const [linked, setLinked] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<PartnerView | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setReady(false);
    setError('');
    setView(null);
    getViewerLink().then((l) => {
      if (!alive) return;
      setLinked(!!l);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  const load = useCallback(async () => {
    try {
      const v = await fetchPartnerView();
      setView(v);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || !linked) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [visible, linked, load]);

  const connect = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setError('');
    try {
      await joinWithCode(input);
      setInput('');
      setLinked(true);
    } catch (e: any) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const doDisconnect = async () => {
    try {
      await leaveShare();
    } catch (e: any) {
      Alert.alert('Could not disconnect', friendly(e));
      return;
    }
    setLinked(false);
    setView(null);
  };

  const confirmDisconnect = () =>
    Alert.alert(
      'Disconnect?',
      'You will stop seeing their cycle. To connect again they would need to send you a new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: doDisconnect },
      ]
    );

  const renderOk = (raw: Snapshot, updatedAt: number) => {
    const s = clean(raw);
    const who = s.name || 'Your partner';
    const p = predictionFromSnapshot(s);

    if (!p.hasData) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{who} has not logged a period yet</Text>
          <Text style={styles.body}>Their cycle will show here as soon as they do.</Text>
        </View>
      );
    }

    const phase = p.phase as Phase;
    const info = phaseInfo[phase];
    const day = Math.max(1, p.cycleDay as number);
    const days = p.daysUntilNextPeriod as number;
    const progress = clamp(day / p.cycleLength, 0, 1);

    let headline: string;
    if (days < 0) headline = `Period is ${-days} day${-days === 1 ? '' : 's'} late`;
    else if (days === 0) headline = 'Period expected today';
    else headline = `Period in ${days} day${days === 1 ? '' : 's'}`;

    const today = s.level === 'detailed' ? s.today : undefined;
    const symptoms = (today?.symptoms ?? []).filter((x) => typeof x === 'string').slice(0, 12);
    const hasToday = !!(today && (today.flow || today.mood || symptoms.length));

    return (
      <>
        <Text style={styles.who}>{who}'s cycle</Text>

        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              stroke={info.color} strokeWidth={STROKE} fill="none" strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={CIRC * (1 - progress)}
              rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.dayLabel}>Cycle day</Text>
            <Text style={styles.dayNumber}>{day}</Text>
            <Text style={[styles.phase, { color: info.color }]}>{info.label}</Text>
          </View>
        </View>

        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.tip}>{info.tip}</Text>

        <View style={styles.row}>
          <InfoCard label="Next period" value={fmt(p.nextPeriodStart)} />
          <InfoCard label="Ovulation" value={fmt(p.ovulationDate)} />
        </View>
        <View style={styles.row}>
          <InfoCard label="Fertile window" value={`${fmt(p.fertileStart)} - ${fmt(p.fertileEnd)}`} />
          <InfoCard label="Avg cycle" value={`${p.cycleLength} days`} />
        </View>

        {s.level === 'detailed' && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Today</Text>
            {hasToday ? (
              <>
                {today?.flow ? <Text style={styles.body}>Flow: {cap(String(today.flow))}</Text> : null}
                {today?.mood ? <Text style={styles.body}>Mood: {String(today.mood)}</Text> : null}
                {symptoms.length > 0 && (
                  <View style={styles.chips}>
                    {symptoms.map((x) => (
                      <View key={x} style={styles.chip}><Text style={styles.chipText}>{x}</Text></View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.body}>Nothing logged today yet.</Text>
            )}
          </View>
        )}

        <Text style={styles.updated}>
          Last updated {ago(updatedAt)}{offline ? '  (offline, showing saved view)' : ''}
        </Text>
        <Text style={styles.disclaimer}>
          Predictions are estimates and are not medical advice. Do not rely on them for contraception.
        </Text>
      </>
    );
  };

  const renderLinked = () => {
    if (!view) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          {offline && <Text style={[styles.body, { marginTop: 12, textAlign: 'center' }]}>Could not reach the server. Retrying...</Text>}
        </View>
      );
    }
    if (view.status === 'gone') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sharing has stopped</Text>
          <Text style={styles.body}>
            Your partner ended sharing or created a new code. Ask them to send a new one if you would like to reconnect.
          </Text>
        </View>
      );
    }
    if (view.status === 'locked') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cannot unlock the data</Text>
          <Text style={styles.body}>The shared data could not be decrypted. Disconnect, then ask for a new code.</Text>
        </View>
      );
    }
    return renderOk(view.snapshot, view.updatedAt);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Partner's cycle</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        {!ready ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
            {!linked ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Connect with a code</Text>
                  <Text style={styles.body}>
                    Ask your partner to open Settings, then Partner sharing, then Share my cycle, and send you their code. Paste it below. You can paste the whole message.
                  </Text>
                  <Text style={styles.small}>
                    You will see only what they chose to share. They can stop at any time, and you can disconnect at any time. No account is needed.
                  </Text>
                </View>

                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={(t) => {
                    setInput(t);
                    setError('');
                  }}
                  placeholder="Paste the pairing code here"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  multiline
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, (busy || !input.trim()) && { opacity: 0.5 }]}
                  onPress={connect}
                  disabled={busy || !input.trim()}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Connect</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {renderLinked()}
                <TouchableOpacity style={styles.outlineBtn} onPress={confirmDisconnect}>
                  <Text style={styles.outlineText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  close: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  body: { color: colors.text, lineHeight: 21 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text,
    minHeight: 80, textAlignVertical: 'top', marginTop: 8,
  },
  error: { color: colors.primary, marginTop: 10, lineHeight: 19 },
  primaryBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24,
    borderWidth: 1, borderColor: colors.primary,
  },
  outlineText: { color: colors.primary, fontWeight: '700' },
  who: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  dayLabel: { color: colors.muted, fontSize: 13 },
  dayNumber: { fontSize: 50, fontWeight: '800', color: colors.text, lineHeight: 56 },
  phase: { fontSize: 14, fontWeight: '700' },
  headline: { textAlign: 'center', fontSize: 19, fontWeight: '700', color: colors.text, marginTop: 14 },
  tip: { textAlign: 'center', color: colors.muted, marginTop: 6, marginHorizontal: 12, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  infoCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { backgroundColor: colors.primaryLight, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 11 },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  updated: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 18 },
  disclaimer: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 10, lineHeight: 16 },
});
