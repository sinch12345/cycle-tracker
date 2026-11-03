import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useCycleInfo } from '../../hooks/useCycleInfo';
import Page from '../../components/home/Page';
import MoodStreakCard from '../../components/home/MoodStreakCard';

export default function MoodPage() {
  const { phase, today } = useCycleInfo();
  return (
    <Page>
      <View style={styles.card}>
        <MoodStreakCard phase={phase} today={today} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16 },
});
