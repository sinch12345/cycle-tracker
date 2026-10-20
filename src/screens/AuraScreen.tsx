import { useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAura } from '../context/AuraContext';
import { DISCLAIMER } from '../aura/knowledge';

export default function AuraScreen() {
  const insets = useSafeAreaInsets();
  const { messages, typing, useData, incognito, send, setUseData, setIncognito, clearConversation } = useAura();
  const [input, setInput] = useState('');
  const scroll = useRef<ScrollView>(null);

  const last = messages[messages.length - 1];

  const submit = () => {
    if (!input.trim() || typing) return;
    send(input);
    setInput('');
  };

  const confirmClear = () =>
    Alert.alert('Clear conversation?', 'This deletes the chat from your phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearConversation },
    ]);

  const toggleIncognito = () =>
    Alert.alert(
      incognito ? 'Leave incognito?' : 'Start incognito chat?',
      incognito
        ? 'This starts a fresh conversation that will be saved normally.'
        : 'This starts a fresh conversation that is never saved. It disappears when you close the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: incognito ? 'Leave' : 'Start', onPress: () => setIncognito(!incognito) },
      ]
    );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior="padding"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={22} color={colors.primary} />
          <Text style={styles.title}>Aura</Text>
          {incognito && (
            <View style={styles.badge}>
              <Ionicons name="eye-off" size={12} color={colors.ovulation} />
              <Text style={styles.badgeText}>Incognito</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={toggleIncognito} hitSlop={10}>
            <Ionicons name={incognito ? 'eye-off' : 'eye-off-outline'} size={22} color={incognito ? colors.ovulation : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmClear} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Use my cycle data</Text>
        <Switch
          value={useData}
          onValueChange={setUseData}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
      </View>

      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.auraBubble]}>
            <Text style={m.role === 'user' ? styles.userText : styles.auraText}>{m.text}</Text>
          </View>
        ))}

        {typing && (
          <View style={[styles.bubble, styles.auraBubble]}>
            <Text style={[styles.auraText, { color: colors.muted }]}>Aura is typing...</Text>
          </View>
        )}

        {!typing && last?.role === 'aura' && last.suggestions && (
          <View style={styles.chips}>
            {last.suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Aura anything about your cycle..."
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.4 }]}
          onPress={submit}
          disabled={!input.trim() || typing}
        >
          <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFE9F8',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  badgeText: { color: colors.ovulation, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 18 },
  dataRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: colors.card, borderRadius: 12,
  },
  dataLabel: { color: colors.text, fontWeight: '600' },
  disclaimer: { flexDirection: 'row', gap: 6, marginHorizontal: 18, marginTop: 8, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 15 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '86%', padding: 12, borderRadius: 18, marginBottom: 10 },
  auraBubble: { alignSelf: 'flex-start', backgroundColor: colors.card, borderTopLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderTopRightRadius: 4 },
  auraText: { color: colors.text, lineHeight: 21, fontSize: 15 },
  userText: { color: '#FFFFFF', lineHeight: 21, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2, marginBottom: 8 },
  chip: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: 18,
    paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.primaryLight,
  },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, color: colors.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
