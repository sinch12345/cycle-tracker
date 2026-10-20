import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Share, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { useLock } from '../context/LockContext';
import {
  OwnerShare, PartnerStatus, ShareLevel,
  getOwnerShare, getPartnerStatus, startSharing, stopSharing, updateShareOptions,
} from '../services/sharing';

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const friendly = (e: any) => {
  const m = String(e?.message ?? e);
  if (/network request failed|aborted|failed to fetch/i.test(m)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return m;
};

function LevelOption({
  title, body, active, onPress,
}: { title: string; body: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      <Ionicons
        name={active ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={active ? colors.primary : colors.muted}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionBody}>{body}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ShareMyCycleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { periods, logs, settings } = useAppData();
  const lock = useLock();

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<OwnerShare | null>(null);
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [level, setLevel] = useState<ShareLevel>('basic');
  const [name, setName] = useState('');

  // load saved share state whenever the screen opens
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setReady(false);
    getOwnerShare().then((s) => {
      if (!alive) return;
      setShare(s);
      setLevel(s?.level ?? 'basic');
      setName(s?.name ?? '');
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  // check whether the partner has connected, every 8 seconds while open
  useEffect(() => {
    if (!visible || !share) {
      setStatus(null);
      return;
    }
    let alive = true;
    const check = async () => {
      try {
        const s = await getPartnerStatus();
        if (alive) setStatus(s);
      } catch {}
    };
    check();
    const t = setInterval(check, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [visible, share]);

  const begin = async () => {
    setBusy(true);
    try {
      const s = await startSharing(level, name.trim(), periods, logs, settings);
      setShare(s);
      setStatus('waiting');
    } catch (e: any) {
      Alert.alert('Could not start sharing', friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmStart = () =>
    Alert.alert(
      'Start sharing?',
      level === 'basic'
        ? 'Your partner will see your cycle day, phase and predicted dates. It is encrypted on your phone, and only someone with your code can read it.'
        : 'Your partner will see your cycle day, phase, predicted dates and today\'s flow, symptoms and mood. Notes are never shared. It is encrypted on your phone, and only someone with your code can read it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start sharing', onPress: begin },
      ]
    );

  const confirmNewCode = () =>
    Alert.alert(
      'Create a new code?',
      'This disconnects your current partner immediately. They will need the new code to connect again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New code', style: 'destructive', onPress: begin },
      ]
    );

  const confirmStop = () =>
    Alert.alert(
      'Stop sharing?',
      'Your partner loses access immediately, and the shared data is deleted from the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop sharing',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await stopSharing();
              setShare(null);
              setStatus(null);
            } catch (e: any) {
              Alert.alert('Could not stop sharing', friendly(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );

  const saveOptions = async () => {
    setBusy(true);
    try {
      await updateShareOptions(level, name.trim(), periods, logs, settings);
      setShare((s) => (s ? { ...s, level, name: name.trim() } : s));
      Alert.alert('Saved', 'Your partner will see the change shortly.');
    } catch (e: any) {
      Alert.alert('Could not save', friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (!share) return;
    const who = name.trim() ? name.trim() + ' wants' : 'I want';
    const message =
      who + ' to share cycle updates with you in the Cycle Tracker app.\n\n' +
      '1. Open the app, go to Settings, then Partner sharing, then "View a partner\'s cycle"\n' +
      '2. Enter this code:\n\n' + share.code + '\n\n' +
      'The data is encrypted, and the code works for one person only.';
    try {
      await lock.runWithoutLock(() => Share.share({ message }));
    } catch {}
  };

  const resetLocal = async () => {
    await SecureStore.deleteItemAsync('ct_share_owner');
    setShare(null);
    setStatus(null);
  };

  const groups = share ? share.code.split('-') : [];
  const line1 = groups.slice(0, 5).join('-');
  const line2 = groups.slice(5).join('-');
  const dirty = !!share && (share.level !== level || share.name !== name.trim());

  const statusInfo = (): { text: string; color: string } => {
    switch (status) {
      case 'waiting': return { text: 'Waiting for your partner to connect', color: colors.ovulation };
      case 'connected': return { text: 'Partner connected', color: colors.fertile };
      case 'left': return { text: 'Your partner has left. Create a new code to share again.', color: colors.muted };
      case 'gone': return { text: 'This share is no longer active on the server.', color: colors.primary };
      default: return { text: 'Checking status...', color: colors.muted };
    }
  };

  const info = statusInfo();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Share my cycle</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        {!ready ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
            {!share ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>How it works</Text>
                  <Text style={styles.line}>- You send a one-time code to your partner</Text>
                  <Text style={styles.line}>- Your data is encrypted on your phone. The server only stores scrambled text it cannot read</Text>
                  <Text style={styles.line}>- Your partner sees updates when they open the app</Text>
                  <Text style={styles.line}>- Your notes are never shared</Text>
                  <Text style={styles.line}>- You can stop at any time, and access ends immediately</Text>
                  <Text style={styles.warn}>Only share with someone you trust. They will see this information on their own phone.</Text>
                </View>

                <Text style={styles.section}>What to share</Text>
                <LevelOption
                  title="Basic"
                  body="Cycle day, phase, next period, ovulation and fertile window"
                  active={level === 'basic'}
                  onPress={() => setLevel('basic')}
                />
                <LevelOption
                  title="Detailed"
                  body="Everything in Basic, plus today's flow, symptoms and mood"
                  active={level === 'detailed'}
                  onPress={() => setLevel('detailed')}
                />

                <Text style={styles.section}>Name your partner will see</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="For example: Sinchana"
                  placeholderTextColor={colors.muted}
                  maxLength={30}
                />

                <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={confirmStart} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Start sharing</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: info.color }]} />
                  <Text style={[styles.statusText, { color: info.color }]}>{info.text}</Text>
                </View>

                {status !== 'gone' && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your pairing code</Text>
                    <Text style={styles.code} selectable>{line1}</Text>
                    <Text style={styles.code} selectable>{line2}</Text>
                    <Text style={styles.warn}>
                      Treat this code like a password. Anyone who has it can connect until your partner uses it.
                    </Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={sendCode}>
                      <Text style={styles.primaryText}>Send code to partner</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {status === 'gone' && (
                  <TouchableOpacity style={styles.outlineBtn} onPress={resetLocal}>
                    <Text style={styles.outlineText}>Reset sharing on this phone</Text>
                  </TouchableOpacity>
                )}

                {status !== 'gone' && (
                  <>
                    <Text style={styles.section}>What is shared</Text>
                    <LevelOption
                      title="Basic"
                      body="Cycle day, phase, next period, ovulation and fertile window"
                      active={level === 'basic'}
                      onPress={() => setLevel('basic')}
                    />
                    <LevelOption
                      title="Detailed"
                      body="Everything in Basic, plus today's flow, symptoms and mood"
                      active={level === 'detailed'}
                      onPress={() => setLevel('detailed')}
                    />
                    <Text style={styles.section}>Name your partner sees</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="For example: Sinchana"
                      placeholderTextColor={colors.muted}
                      maxLength={30}
                    />
                    {dirty && (
                      <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={saveOptions} disabled={busy}>
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save changes</Text>}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.outlineBtn} onPress={confirmNewCode} disabled={busy}>
                      <Text style={styles.outlineText}>Create a new code</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.outlineBtn} onPress={confirmStop} disabled={busy}>
                  <Text style={styles.outlineText}>Stop sharing</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  close: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  line: { color: colors.text, lineHeight: 21, marginBottom: 4 },
  warn: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  option: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.card,
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  optionActive: { borderColor: colors.primary },
  optionTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  optionBody: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text },
  primaryBtn: {
    backgroundColor: colors.primary, padding: 15, borderRadius: 14,
    alignItems: 'center', marginTop: 16,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: colors.primary,
  },
  outlineText: { color: colors.primary, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontWeight: '700', flex: 1 },
  code: { fontFamily: MONO, fontSize: 15, color: colors.text, letterSpacing: 1, marginBottom: 4 },
});
