import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  sub: { marginTop: 8, color: colors.muted },
});
