import { ScrollView } from 'react-native';
import { colors } from '../../theme/colors';

export default function Page({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: padded ? 16 : 0, paddingTop: 12, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
