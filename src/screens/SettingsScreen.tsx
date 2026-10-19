import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Share } from 'react-native';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { useLock } from '../context/LockContext';
import { ensurePermission } from '../utils/notifications';
import SetPinModal from '../components/SetPinModal';

function Stepper({
  label, hint, value, min, max, onChange,
}: {
  label: string; hint?: string; value: number; min: number; max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => value > min && onChange(value - 1)}>
          <Text style={styles.stepText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => value < max && onChange(value + 1)}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { periods, logs, settings, updateSettings, resetAll } = useAppData();
  const lock = useLock();
  const [pinModal, setPinModal] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    lock.isBiometricAvailable().then(setBioAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleReminders = async (on: boolean) => {
    if (!on) {
      updateSettings({ remindersEnabled: false });
      return;
    }
    const ok = await ensurePermission();
    if (!ok) {
      Alert.alert('Notifications are off', 'Allow notifications for this app in your phone settings to get reminders.');
      return;
    }
    updateSettings({ remindersEnabled: true });
  };

  const toggleLock = (on: boolean) => {
    if (on) {
      setPinModal(true);
    } else {
      Alert.alert('Turn off app lock?', 'Your data will no longer be protected by a PIN.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn off', style: 'destructive', onPress: () => lock.removePin() },
      ]);
    }
  };

  const toggleBiometric = async (on: boolean) => {
    const ok = await lock.setBiometric(on);
    if (!ok) Alert.alert('Not enabled', 'Biometric check failed or was cancelled.');
  };

  const exportData = async () => {
    try {
      const payload = {
        app: 'cycle-tracker',
        exportedAt: new Date().toISOString(),
        periods,
        logs,
        settings,
      };
      await lock.runWithoutLock(() =>
        Share.share({ title: 'Cycle data export', message: JSON.stringify(payload, null, 2) })
      );
    } catch (e) {
      Alert.alert('Export failed', 'Something went wrong while exporting your data.');
    }
  };

  const confirmReset = () =>
    Alert.alert(
      'Delete all data?',
      'This removes all periods, logs and settings from this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: resetAll },
      ]
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.section}>Cycle defaults</Text>
      <View style={styles.card}>
        <Stepper
          label="Cycle length"
          hint="Used until there is enough history to calculate your average"
          value={settings.cycleLength}
          min={21}
          max={45}
          onChange={(n) => updateSettings({ cycleLength: n })}
        />
        <View style={styles.divider} />
        <Stepper
          label="Period length"
          hint="Days of bleeding, used until you log period end dates"
          value={settings.periodLength}
          min={2}
          max={10}
          onChange={(n) => updateSettings({ periodLength: n })}
        />
      </View>

      <Text style={styles.section}>Reminders</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.label}>Period reminders</Text>
            <Text style={styles.hint}>A notification at 9:00 two days before and on the expected day</Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>

      <Text style={styles.section}>Privacy and security</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.label}>App lock</Text>
            <Text style={styles.hint}>Ask for a PIN every time the app is opened</Text>
          </View>
          <Switch
            value={lock.pinSet}
            onValueChange={toggleLock}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        {lock.pinSet && (
          <>
            {bioAvailable && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.label}>Biometric unlock</Text>
                    <Text style={styles.hint}>Use fingerprint or face instead of typing the PIN</Text>
                  </View>
                  <Switch
                    value={lock.biometricEnabled}
                    onValueChange={toggleBiometric}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                </View>
              </>
            )}
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setPinModal(true)}>
              <Text style={styles.link}>Change PIN</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.hint}>
          All your data is stored only on this device. Nothing is sent to any server.
        </Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={exportData}>
          <Text style={styles.outlineText}>Export my data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={confirmReset}>
          <Text style={styles.outlineText}>Delete all my data</Text>
        </TouchableOpacity>
      </View>

      <SetPinModal visible={pinModal} onClose={() => setPinModal(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 22 },
  value: { minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  outlineBtn: {
    marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary,
  },
  outlineText: { color: colors.primary, fontWeight: '700' },
});
